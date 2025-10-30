const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Shipping options configuration
const SHIPPING_OPTIONS = [
  {
    id: "standard",
    name: "Standard Shipping",
    price: 150,
    estimatedDays: "5-7 business days",
    description: "Regular delivery within Pakistan"
  },
  {
    id: "express",
    name: "Express Shipping", 
    price: 300,
    estimatedDays: "2-3 business days",
    description: "Fast delivery to major cities"
  },
  {
    id: "overnight",
    name: "Overnight Delivery",
    price: 500,
    estimatedDays: "Next business day",
    description: "Available for Karachi, Lahore, and Islamabad"
  }
];

// Promo codes configuration
const PROMO_CODES = {
  "SAVE10": { type: "percentage", value: 0.1, description: "10% off on order" },
  "SAVE15": { type: "percentage", value: 0.15, description: "15% off on order", minAmount: 3000 },
  "FREESHIP": { type: "free_shipping", value: 0, description: "Free shipping", minAmount: 2000 },
  "WELCOME": { type: "fixed", value: 200, description: "Welcome discount Rs. 200", minAmount: 1000 }
};

// Helper function to validate promo code
const validatePromoCode = (promoCode, subtotal, shippingCost) => {
  if (!promoCode || !PROMO_CODES[promoCode.toUpperCase()]) {
    return { valid: false, discount: 0, message: "Invalid promo code" };
  }

  const promo = PROMO_CODES[promoCode.toUpperCase()];
  
  if (promo.minAmount && subtotal < promo.minAmount) {
    return { 
      valid: false, 
      discount: 0, 
      message: `Minimum order amount Rs. ${promo.minAmount} required for this promo code` 
    };
  }

  let discount = 0;
  switch (promo.type) {
    case "percentage":
      discount = Math.round(subtotal * promo.value);
      break;
    case "fixed":
      discount = promo.value;
      break;
    case "free_shipping":
      discount = shippingCost;
      break;
    default:
      discount = 0;
  }

  return { valid: true, discount, message: promo.description };
};

// Get shipping options
exports.getShippingOptions = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: SHIPPING_OPTIONS
    });
  } catch (error) {
    console.error("Error fetching shipping options:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching shipping options"
    });
  }
};

// Calculate order totals (Frontend checkout calculation)
exports.calculateOrderTotal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingMethodId, promoCode } = req.body;

    if (!shippingMethodId) {
      return res.status(400).json({
        success: false,
        message: "Shipping method is required"
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty"
      });
    }

    // Check stock availability
    for (let item of cart.items) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Some products in your cart are no longer available"
        });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${item.product.stock} items available for ${item.product.name}`
        });
      }
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    // Get shipping method
    const shippingMethod = SHIPPING_OPTIONS.find(option => option.id === shippingMethodId);
    if (!shippingMethod) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipping method selected"
      });
    }

    const shippingCost = shippingMethod.price;
    let discount = 0;
    let promoMessage = "";

    // Apply promo code if provided
    if (promoCode && promoCode.trim() !== "") {
      const promoResult = validatePromoCode(promoCode.trim(), subtotal, shippingCost);
      if (promoResult.valid) {
        discount = promoResult.discount;
        promoMessage = promoResult.message;
      } else {
        return res.status(400).json({
          success: false,
          message: promoResult.message
        });
      }
    }

    const tax = 0; // No tax for Pakistan
    const totalAmount = subtotal + shippingCost + tax - discount;

    res.status(200).json({
      success: true,
      data: {
        subtotal: Math.round(subtotal),
        shippingCost: Math.round(shippingCost),
        tax: Math.round(tax),
        discount: Math.round(discount),
        totalAmount: Math.round(totalAmount),
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        shippingMethod: shippingMethod,
        promoCode: promoCode || null,
        promoMessage: promoMessage || null
      }
    });

  } catch (error) {
    console.error("Error calculating order total:", error);
    res.status(500).json({ 
      success: false,
      message: "Error calculating order total"
    });
  }
};

// Place Order (Main order creation from frontend)
exports.placeOrder = async (req, res) => {
  
  try {
    const userId = req.user.id;
    const { shippingInfo, shippingMethodId, paymentMethod, notes, promoCode } = req.body;
    console.log(req.bo,"req.body");

    // Validate shipping info
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'postalCode'];
    for (let field of requiredFields) {
      if (!shippingInfo || !shippingInfo[field] || shippingInfo[field].trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`
        });
      }
    }

    if (!shippingMethodId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Shipping method and payment method are required"
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty"
      });
    }

    // Validate products and stock again
    for (let item of cart.items) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Some products in your cart are no longer available"
        });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}`
        });
      }
    }

    // Get shipping method
    const shippingMethod = SHIPPING_OPTIONS.find(option => option.id === shippingMethodId);
    if (!shippingMethod) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipping method"
      });
    }

    // Prepare order items
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : ""
    }));

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = shippingMethod.price;
    let discount = 0;

    // Apply promo code
    if (promoCode && promoCode.trim() !== "") {
      const promoResult = validatePromoCode(promoCode.trim(), subtotal, shippingCost);
      if (promoResult.valid) {
        discount = promoResult.discount;
      }
    }

    const tax = 0;
    const totalAmount = subtotal + shippingCost + tax - discount;

    // Generate unique order number
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
    const orderNumber = `ORD-${timestamp}-${randomStr}`;

    // Create order
    const newOrder = new Order({
      user: userId,
      orderItems,
      shippingInfo: {
        fullName: shippingInfo.fullName.trim(),
        email: shippingInfo.email.trim().toLowerCase(),
        phone: shippingInfo.phone.trim(),
        address: shippingInfo.address.trim(),
        city: shippingInfo.city.trim(),
        state: shippingInfo.state.trim(),
        postalCode: shippingInfo.postalCode.trim(),
        country: shippingInfo.country || "Pakistan"
      },
      shippingMethod: {
        name: shippingMethod.name,
        price: shippingMethod.price,
        estimatedDays: shippingMethod.estimatedDays
      },
      paymentMethod: {
        type: paymentMethod,
        details: {}
      },
      orderSummary: {
        subtotal: Math.round(subtotal),
        shippingCost: Math.round(shippingCost),
        tax: Math.round(tax),
        discount: Math.round(discount),
        totalAmount: Math.round(totalAmount)
      },
      notes: notes || "",
      trackingNumber: orderNumber,
      promoCode: promoCode || null,
      orderStatus: "pending",
      isPaid: false
    });

    await newOrder.save();

    // Update product stock
    for (let item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear user's cart
    await Cart.findOneAndDelete({ user: userId });

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      data: {
        orderId: newOrder._id,
        orderNumber: newOrder.trackingNumber,
        totalAmount: newOrder.orderSummary.totalAmount,
        status: newOrder.orderStatus,
        estimatedDelivery: newOrder.shippingMethod.estimatedDays
      }
    });

  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to place order. Please try again."
    });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user.id })
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasMore: page < Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching your orders"
    });
  }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
     const order = await Order.findById(req.params.id)
      .populate('orderItems.product', 'name images description')
      .populate('user', 'name email');
      

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if order belongs to user (unless admin)
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this order"
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching order details"
    });
  }
};

// Cancel order (for users)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check ownership
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own orders"
      });
    }

    // Check if order can be cancelled
    if (!["pending", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "This order cannot be cancelled at this stage"
      });
    }

    // Restore product stock
    for (let item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    order.cancelledBy = req.user.id;
    order.cancellationReason = req.body.reason || "Cancelled by customer";
    
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        orderId: order._id,
        status: order.orderStatus
      }
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order"
    });
  }
};

// ============= ADMIN CONTROLLERS =============

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    let query = {};
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { 'shippingInfo.fullName': { $regex: search, $options: 'i' } },
        { 'shippingInfo.email': { $regex: search, $options: 'i' } },
        { 'shippingInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasMore: page < Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching orders"
    });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update order status
    order.orderStatus = status;
    
    // Handle specific status updates
    if (status === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    if (status === "cancelled") {
      order.cancelledAt = new Date();
      order.cancelledBy = req.user.id;
      order.cancellationReason = note || "Cancelled by admin";
      
      // Restore stock
      for (let item of order.orderItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    await order.save();
    
    res.status(200).json({ 
      success: true,
      message: `Order status updated to ${status}`,
      data: {
        orderId: order._id,
        status: order.orderStatus,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating order status"
    });
  }
};

// Get order statistics (Admin only)
exports.getOrderStatistics = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Status-wise count
    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$orderSummary.totalAmount' }
        }
      }
    ]);

    // Monthly revenue
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          orderStatus: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$orderSummary.totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Yearly revenue
    const yearlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear },
          orderStatus: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$orderSummary.totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        statusStats,
        monthlyStats: monthlyRevenue[0] || { totalRevenue: 0, totalOrders: 0 },
        yearlyStats: yearlyRevenue[0] || { totalRevenue: 0, totalOrders: 0 },
        recentOrders
      }
    });
  } catch (error) {
    console.error("Error fetching order statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order statistics"
    });
  }
};