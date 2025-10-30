import React, { useState, useEffect } from 'react';
import { ShoppingCart, Truck, CreditCard, MapPin, Phone, Mail, User, Package, Shield, CheckCircle, Minus, Plus, X, Gift, Star, Clock, AlertCircle } from 'lucide-react';

const CheckoutShipping = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [orderSummary, setOrderSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [errors, setErrors] = useState({});

  // Form data
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan'
  });

  const [selectedShipping, setSelectedShipping] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [notes, setNotes] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // Mock user token - replace with your actual auth system

  // API Base URL
  const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

  // API call helper function
  const apiCall = async (endpoint, options = {}) => {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: { ...defaultOptions.headers, ...options.headers }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  };

  // Fetch cart items from backend
  const fetchCartItems = async () => {
    try {
      const response = await apiCall('/cart');
      console.log('Cart response:', response);
      
      if (  response.items && response.items.length > 0) {
        const formattedItems = response.items.map(item => ({
          id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          originalPrice: item.product.discountedPrice > 0 ? item.product.price : null,
          finalPrice: item.product.discountedPrice > 0 ? item.product.discountedPrice : item.product.price,
          quantity: item.quantity,
          // Handle images array from your schema
          image: item.product.images && item.product.images.length > 0 
            ? item.product.images[0].url 
            : item.product.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop",
          rating: item.product.rating || 0,
          numReviews: item.product.numReviews || 0,
          inStock: item.product.stock > 0,
          stock: item.product.stock
        }));
        setCartItems(formattedItems);
      } 
    } catch (error) {
      console.error('Error fetching cart:', error);
     
    }
  };

  // Fetch shipping options from backend
  const fetchShippingOptions = async () => {
    try {
      const response = await apiCall('/orders/shipping-options');
      console.log('Shipping options response:', response);
      
      if (response.success && response.data) {
        const formattedOptions = response.data.map(option => ({
          ...option,
          icon: option.id === 'standard' ? Package : option.id === 'express' ? Truck : Clock,
          premium: option.id === 'overnight'
        }));
        
        setShippingOptions(formattedOptions);
        if (formattedOptions.length > 0) {
          setSelectedShipping(formattedOptions[0].id);
        }
      } 
     
    } catch (error) {
      console.error('Error fetching shipping options:', error);
      // Fallback to default options
    
    }
  };

  // Calculate order totals from backend
  const calculateOrderTotals = async () => {
    if (!selectedShipping) return;
    
    try {
      const response = await apiCall('/orders/calculate-total', {
        method: 'POST',
        body: JSON.stringify({
          shippingMethodId: selectedShipping,
          promoCode: promoApplied ? promoCode : null
        })
      });
      
      console.log('Calculate total response:', response);
      
      if (response.success && response.data) {
        setOrderSummary({
          subtotal: response.data.subtotal || 0,
          shippingCost: response.data.shippingCost || 0,
          discount: response.data.discount || 0,
          tax: response.data.tax || 0,
          totalAmount: response.data.totalAmount || 0
        });
      }
    } catch (error) {
      console.error('Error calculating totals:', error);
      // Fallback calculation
      const subtotal = cartItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
      const shippingCost = shippingOptions.find(option => option.id === selectedShipping)?.price || 0;
      let discount = 0;
      
      // Apply promo codes matching your backend logic
      if (promoApplied) {
        switch (promoCode) {
          case 'SAVE10':
            discount = Math.round(subtotal * 0.1);
            break;
          case 'SAVE15':
            if (subtotal >= 3000) {
              discount = Math.round(subtotal * 0.15);
            }
            break;
          case 'FREESHIP':
            if (subtotal >= 2000) {
              discount = shippingCost;
            }
            break;
          case 'WELCOME':
            if (subtotal >= 1000) {
              discount = 200;
            }
            break;
          default:
            discount = 0;
        }
      }
      
      setOrderSummary({
        subtotal,
        shippingCost,
        discount,
        totalAmount: subtotal + shippingCost - discount,
        tax: 0
      });
    }
  };

  useEffect(() => {
    fetchCartItems();
    fetchShippingOptions();
  }, []);

  useEffect(() => {
    if (cartItems.length > 0 && selectedShipping) {
      calculateOrderTotals();
    }
  }, [cartItems, selectedShipping, promoCode, promoApplied]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const updateQuantity = async (id, change) => {
    const currentItem = cartItems.find(item => item.id === id);
    if (!currentItem) return;
    
    const newQuantity = currentItem.quantity + change;
    if (newQuantity < 1) return;

    try {
      await apiCall('/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: id,
          quantity: change
        })
      });
      
      setCartItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Update locally if API fails
      setCartItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeItem = async (id) => {
    try {
      await apiCall(`/cart/${id}`, {
        method: 'DELETE'
      });
      
      setCartItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing item:', error);
      // Remove locally if API fails
      setCartItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const applyPromoCode = async () => {
    // Validate against your backend promo codes
    const validCodes = ['SAVE10', 'SAVE15', 'FREESHIP', 'WELCOME'];
    if (validCodes.includes(promoCode.toUpperCase())) {
      setPromoApplied(true);
      setPromoCode(promoCode.toUpperCase());
      // Recalculate totals
      calculateOrderTotals();
    } else {
      alert('Invalid promo code');
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      return cartItems.length > 0;
    }
    
    if (step === 2) {
      const required = {
        fullName: 'Full name is required',
        email: 'Email is required',
        phone: 'Phone number is required',
        address: 'Address is required',
        city: 'City is required',
        state: 'State is required',
        postalCode: 'Postal code is required'
      };
      
      Object.keys(required).forEach(field => {
        if (!shippingInfo[field].trim()) {
          newErrors[field] = required[field];
        }
      });
      
      if (shippingInfo.email && !/\S+@\S+\.\S+/.test(shippingInfo.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      
      if (shippingInfo.phone && !/^03\d{9}$/.test(shippingInfo.phone)) {
        newErrors.phone = 'Please enter a valid Pakistani phone number';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    
    if (step === 3) {
      return selectedShipping !== '';
    }
    
    if (step === 4) {
      if (!agreeToTerms) {
        alert('Please agree to terms and conditions');
        return false;
      }
      return true;
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const placeOrder = async () => {
    if (!validateStep(4)) return;
    
    setLoading(true);
    
    try {
      const orderData = {
        shippingInfo,
        shippingMethodId: selectedShipping,
        paymentMethod: paymentMethod,
        notes,
        promoCode: promoApplied ? promoCode : null
      };

      console.log('Placing order with data:', orderData);

      const response = await apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      
      console.log('Order placement response:', response);
      
      if (response.success) {
        setOrderNumber(response.data?.orderNumber || response.data?.trackingNumber || `ORD-${Date.now()}`);
        setOrderPlaced(true);
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">Thank you for your purchase. Your order has been confirmed and will be processed shortly.</p>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-500 mb-2">Order Number</p>
            <p className="text-xl font-bold text-gray-900 mb-4">{orderNumber}</p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                Confirmation sent
              </div>
              <div className="flex items-center">
                <Package className="w-4 h-4 mr-1" />
                Processing
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/trackmyorder'}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Track Your Order
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <Gift className="w-4 h-4 inline mr-1" />
              Earn 50 reward points with this purchase!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Cart Review", icon: ShoppingCart },
    { number: 2, title: "Shipping Info", icon: MapPin },
    { number: 3, title: "Shipping Method", icon: Truck },
    { number: 4, title: "Payment & Review", icon: CreditCard }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Secure Checkout
            </h1>
            <div className="flex items-center space-x-2 text-green-600">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">SSL Secured</span>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      isCompleted ? 'bg-green-600 border-green-600 text-white shadow-lg' :
                      isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' :
                      'bg-gray-100 border-gray-300 text-gray-400'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm font-semibold ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                        Step {step.number}
                      </p>
                      <p className={`text-xs ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-6 rounded-full transition-colors duration-300 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-8">
              
              {/* Step 1: Cart Review */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">Review Your Cart</h2>
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center space-x-6 p-6 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
                          <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                            {item.numReviews > 0 && (
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(item.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">({item.numReviews} reviews)</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-3 mt-3">
                              <button 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-semibold text-lg px-3">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
                                disabled={item.quantity >= item.stock}
                              >
                                <Plus className="w-4 h-4 text-blue-600" />
                              </button>
                            </div>
                            {!item.inStock && (
                              <p className="text-red-500 text-sm mt-2">Out of stock</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              {item.originalPrice && item.originalPrice > item.finalPrice && (
                                <span className="text-lg text-gray-400 line-through">Rs. {(item.originalPrice * item.quantity).toLocaleString()}</span>
                              )}
                              <span className="text-xl font-bold text-gray-900">Rs. {(item.finalPrice * item.quantity).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Rs. {item.finalPrice.toLocaleString()} each</p>
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="mt-2 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Shipping Information */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">Shipping Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <User className="inline w-4 h-4 mr-2" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={shippingInfo.fullName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.fullName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.fullName}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <Mail className="inline w-4 h-4 mr-2" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={shippingInfo.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your email"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <Phone className="inline w-4 h-4 mr-2" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={shippingInfo.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="03xxxxxxxxx"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">City *</label>
                      <select
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select City</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                        <option value="Faisalabad">Faisalabad</option>
                        <option value="Multan">Multan</option>
                        <option value="Peshawar">Peshawar</option>
                        <option value="Quetta">Quetta</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.city}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Complete Address *</label>
                      <textarea
                        name="address"
                        value={shippingInfo.address}
                        onChange={handleInputChange}
                        rows="4"
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="House/Flat no, Street, Area, Landmarks"
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.address}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">State/Province *</label>
                      <select
                        name="state"
                        value={shippingInfo.state}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.state ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select State</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Sindh">Sindh</option>
                        <option value="KPK">Khyber Pakhtunkhwa</option>
                        <option value="Balochistan">Balochistan</option>
                        <option value="AJK">Azad Jammu & Kashmir</option>
                        <option value="GB">Gilgit-Baltistan</option>
                        <option value="ICT">Islamabad Capital Territory</option>
                      </select>
                      {errors.state && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.state}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={shippingInfo.postalCode}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.postalCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="75500"
                      />
                      {errors.postalCode && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.postalCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Shipping Method */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">Choose Shipping Method</h2>
                  <div className="space-y-4">
                    {shippingOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <label key={option.id} className={`block p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                          selectedShipping === option.id 
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="shipping"
                                value={option.id}
                                checked={selectedShipping === option.id}
                                onChange={(e) => setSelectedShipping(e.target.value)}
                                className="mr-4 w-5 h-5 text-blue-600"
                              />
                              <div>
                                <div className="flex items-center space-x-3">
                                  <Icon className={`w-6 h-6 ${option.premium ? 'text-purple-500' : 'text-blue-500'}`} />
                                  <h3 className="font-bold text-gray-900 text-lg">{option.name}</h3>
                                  {option.premium && (
                                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                      PREMIUM
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 mt-2">{option.description}</p>
                                <p className="text-green-600 font-semibold mt-1 flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {option.estimatedDays}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900">
                                {option.price === 0 ? 'FREE' : `Rs. ${option.price.toLocaleString()}`}
                              </p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 4: Payment & Review */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">Payment & Final Review</h2>
                  
                  {/* Payment Methods */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h3>
                    <div className="space-y-3">
                      <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === 'cash_on_delivery' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="payment"
                              value="cash_on_delivery"
                              checked={paymentMethod === 'cash_on_delivery'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="mr-3"
                            />
                            <div>
                              <p className="font-semibold text-gray-900">Cash on Delivery</p>
                              <p className="text-sm text-gray-600">Pay when your order arrives at your doorstep</p>
                            </div>
                          </div>
                          <div className="bg-green-100 px-3 py-1 rounded-full">
                            <span className="text-green-700 text-xs font-semibold">RECOMMENDED</span>
                          </div>
                        </div>
                      </label>
                      
                      <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === 'credit_card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="payment"
                            value="credit_card"
                            checked={paymentMethod === 'credit_card'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-3"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">Credit/Debit Card</p>
                            <p className="text-sm text-gray-600">Pay securely with Visa, MasterCard, or local cards</p>
                          </div>
                        </div>
                      </label>
                      
                      <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === 'bank_transfer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="payment"
                            value="bank_transfer"
                            checked={paymentMethod === 'bank_transfer'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-3"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">Bank Transfer</p>
                            <p className="text-sm text-gray-600">Direct transfer to our bank account</p>
                          </div>
                        </div>
                      </label>

                      <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === 'jazzcash' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="payment"
                            value="jazzcash"
                            checked={paymentMethod === 'jazzcash'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-3"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">JazzCash</p>
                            <p className="text-sm text-gray-600">Pay through JazzCash mobile wallet</p>
                          </div>
                        </div>
                      </label>

                      <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === 'easypaisa' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="payment"
                            value="easypaisa"
                            checked={paymentMethod === 'easypaisa'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-3"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">Easypaisa</p>
                            <p className="text-sm text-gray-600">Pay through Easypaisa mobile wallet</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                              <div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="font-semibold text-gray-900">Rs. {(item.finalPrice * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Information Summary */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Shipping Details</h3>
                    <div className="bg-blue-50 rounded-xl p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Delivery Address:</p>
                          <p className="font-semibold text-gray-900">{shippingInfo.fullName}</p>
                          <p className="text-gray-700">{shippingInfo.address}</p>
                          <p className="text-gray-700">{shippingInfo.city}, {shippingInfo.state} {shippingInfo.postalCode}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Contact:</p>
                          <p className="text-gray-700">{shippingInfo.email}</p>
                          <p className="text-gray-700">{shippingInfo.phone}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-sm text-gray-600">Shipping Method:</p>
                        <p className="font-semibold text-gray-900">
                          {shippingOptions.find(opt => opt.id === selectedShipping)?.name}
                        </p>
                        <p className="text-green-600 text-sm">
                          Estimated delivery: {shippingOptions.find(opt => opt.id === selectedShipping)?.estimatedDays}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Any special delivery instructions, preferred delivery time, etc..."
                    />
                  </div>

                  {/* Terms and Conditions */}
                  <div className="mb-8">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="text-sm text-gray-700">
                        <p>I agree to the <a href="#" className="text-blue-600 hover:underline font-semibold">Terms & Conditions</a> and <a href="#" className="text-blue-600 hover:underline font-semibold">Privacy Policy</a>. I confirm that all information provided is accurate and I authorize the processing of this order.</p>
                      </div>
                    </label>
                  </div>

                  {/* Order Confirmation Notice */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">Please Review Your Order</p>
                        <p>Once you place this order, changes may not be possible. Make sure all details are correct before proceeding.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-12">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-8 py-4 rounded-xl font-semibold transition-all ${
                    currentStep === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
                  }`}
                >
                  Previous Step
                </button>
                
                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    disabled={cartItems.length === 0}
                    className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                      cartItems.length === 0
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    Continue to Next Step
                  </button>
                ) : (
                  <button
                    onClick={placeOrder}
                    disabled={loading || !agreeToTerms}
                    className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                      loading || !agreeToTerms
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing Order...</span>
                      </div>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 sticky top-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h3>
              
              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Gift className="inline w-4 h-4 mr-2" />
                  Promo Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={promoApplied}
                  />
                  {!promoApplied ? (
                    <button
                      onClick={applyPromoCode}
                      disabled={!promoCode.trim()}
                      className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                        promoCode.trim() 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Apply
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setPromoApplied(false);
                        setPromoCode('');
                      }}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                    >
                      Applied ✓
                    </button>
                  )}
                </div>
                {promoApplied && (
                  <p className="text-green-600 text-sm mt-2 flex items-center">
                    <Gift className="w-4 h-4 mr-1" />
                    Promo code "{promoCode}" applied successfully!
                  </p>
                )}
              </div>

              {/* Cart Items Summary */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Items ({cartItems.length})</h4>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">Rs. {(item.finalPrice * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>Rs. {orderSummary.subtotal?.toLocaleString() || '0'}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {orderSummary.shippingCost === 0 ? (
                      <span className="text-green-600 font-semibold">FREE</span>
                    ) : (
                      `Rs. ${orderSummary.shippingCost?.toLocaleString() || '0'}`
                    )}
                  </span>
                </div>
                
                {orderSummary.tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>Rs. {orderSummary.tax?.toLocaleString()}</span>
                  </div>
                )}
                
                {orderSummary.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo Discount ({promoCode})</span>
                    <span>-Rs. {orderSummary.discount?.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="border-t-2 border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Rs. {orderSummary.totalAmount?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Savings Badge */}
              {orderSummary.discount > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
                  <div className="flex items-center space-x-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">You're saving Rs. {orderSummary.discount?.toLocaleString()}!</span>
                  </div>
                </div>
              )}

              {/* Security Badge */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-2 text-green-700">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-semibold">Your payment is secured with 256-bit SSL encryption</span>
                </div>
              </div>

              {/* Available Promo Codes */}
              {!promoApplied && (
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                    <Gift className="w-4 h-4 mr-2" />
                    Available Offers:
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-yellow-700 p-2 bg-yellow-100 rounded-lg">
                      <span className="font-semibold">SAVE10</span>
                      <span>10% off your order</span>
                    </div>
                    <div className="flex justify-between text-yellow-700 p-2 bg-yellow-100 rounded-lg">
                      <span className="font-semibold">SAVE15</span>
                      <span>15% off on Rs. 3000+</span>
                    </div>
                    <div className="flex justify-between text-yellow-700 p-2 bg-yellow-100 rounded-lg">
                      <span className="font-semibold">FREESHIP</span>
                      <span>Free shipping on Rs. 2000+</span>
                    </div>
                    <div className="flex justify-between text-yellow-700 p-2 bg-yellow-100 rounded-lg">
                      <span className="font-semibold">WELCOME</span>
                      <span>Rs. 200 off on Rs. 1000+</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Help & Support */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-2">Need help with your order?</p>
                <div className="flex justify-center space-x-4">
                  <a href="tel:+923001234567" className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                    <Phone className="w-4 h-4 mr-1" />
                    Call Support
                  </a>
                  <a href="mailto:support@example.com" className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                    <Mail className="w-4 h-4 mr-1" />
                    Email Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Your Order</h3>
            <p className="text-gray-600">Please wait while we confirm your order...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutShipping;