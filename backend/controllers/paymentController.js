const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');
const { emailTemplates, sendEmail } = require('../services/emailService');
const logger = require('../utils/logger');

// @desc    Create Stripe payment intent
// @route   POST /api/payment/create-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Order ID is required'
    });
  }

  // Get order
  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if order belongs to user
  if (order.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this order'
    });
  }

  // Check if order is already paid
  if (order.isPaid) {
    return res.status(400).json({
      success: false,
      message: 'Order is already paid'
    });
  }

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.orderSummary.totalAmount * 100), // Convert to cents
      currency: 'usd', // Change to 'pkr' for Pakistani Rupees if needed
      metadata: {
        orderId: order._id.toString(),
        userId: req.user.id,
        orderNumber: order.trackingNumber
      },
      description: `SHOPIX Order ${order.trackingNumber}`,
      receipt_email: order.shippingInfo.email
    });

    logger.info(`Payment intent created for order ${order.trackingNumber}: ${paymentIntent.id}`);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: order.orderSummary.totalAmount
    });
  } catch (error) {
    logger.error(`Stripe payment intent error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

// @desc    Confirm payment and update order
// @route   POST /api/payment/confirm
// @access  Private
const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, orderId } = req.body;

  if (!paymentIntentId || !orderId) {
    return res.status(400).json({
      success: false,
      message: 'Payment Intent ID and Order ID are required'
    });
  }

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        status: paymentIntent.status
      });
    }

    // Get order
    const order = await Order.findById(orderId).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    // Update order payment status
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentMethod.type = 'stripe';
    order.paymentMethod.details = {
      paymentIntentId: paymentIntent.id,
      paymentMethod: paymentIntent.payment_method,
      status: paymentIntent.status
    };
    order.orderStatus = 'confirmed'; // Update order status to confirmed

    await order.save();

    logger.info(`Payment confirmed for order ${order.trackingNumber}`);

    // Send payment confirmation email
    try {
      const paymentConfirmationEmail = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Successful</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 10px;
            }
            .content { 
              padding: 40px 30px;
            }
            .success-box {
              background-color: #d1fae5;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box {
              background-color: #FFF3E0;
              border-left: 4px solid #FF6B35;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer { 
              text-align: center; 
              padding: 30px;
              background-color: #f8f9fa;
              color: #6c757d;
              font-size: 14px;
            }
            .footer a {
              color: #FF6B35;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SHOPIX</div>
              <h1>✅ Payment Successful!</h1>
            </div>
            <div class="content">
              <h2>Hello ${order.user.name},</h2>
              <p>Your payment has been processed successfully!</p>
              
              <div class="success-box">
                <strong>✅ Payment Confirmed</strong><br>
                Amount Paid: Rs. ${order.orderSummary.totalAmount}<br>
                Payment Date: ${new Date().toLocaleDateString()}<br>
                Payment Method: Credit/Debit Card
              </div>
              
              <div class="info-box">
                <strong>Order Details:</strong><br>
                Order Number: ${order.trackingNumber}<br>
                Order Status: Confirmed<br>
                Total Items: ${order.orderItems.length}
              </div>
              
              <p>Your order is now being processed and will be shipped soon. We'll send you another email when your order ships.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/trackmyorder" class="button">Track Your Order</a>
              </div>
              
              <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
                Thank you for shopping with SHOPIX!
              </p>
            </div>
            <div class="footer">
              <p><strong>SHOPIX</strong> - Shop. Click. Done.</p>
              <p>Need help? Contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.SMTP_EMAIL}">${process.env.SUPPORT_EMAIL || process.env.SMTP_EMAIL}</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail(
        order.user.email,
        `Payment Successful - ${order.trackingNumber}`,
        paymentConfirmationEmail
      );
      logger.info(`Payment confirmation email sent to ${order.user.email}`);
    } catch (emailError) {
      logger.error(`Failed to send payment confirmation email: ${emailError.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      order: {
        orderId: order._id,
        orderNumber: order.trackingNumber,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        orderStatus: order.orderStatus
      }
    });
  } catch (error) {
    logger.error(`Payment confirmation error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

// @desc    Get payment status
// @route   GET /api/payment/status/:orderId
// @access  Private
const getPaymentStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if order belongs to user
  if (order.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this order'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      orderId: order._id,
      orderNumber: order.trackingNumber,
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      paymentMethod: order.paymentMethod,
      totalAmount: order.orderSummary.totalAmount,
      orderStatus: order.orderStatus
    }
  });
});

// @desc    Stripe webhook handler
// @route   POST /api/payment/webhook
// @access  Public (Stripe webhook)
const handleStripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      logger.info(`Payment succeeded: ${paymentIntent.id}`);
      
      // Update order status
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = new Date();
          order.orderStatus = 'confirmed';
          await order.save();
          logger.info(`Order ${order.trackingNumber} marked as paid via webhook`);
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      logger.warn(`Payment failed: ${failedPayment.id}`);
      break;

    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  handleStripeWebhook
};
