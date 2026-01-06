import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Truck, CreditCard, MapPin, Phone, Mail, User, Package, 
  Shield, CheckCircle, Minus, Plus, X, Gift, Star, Clock, AlertCircle,
  ArrowLeft, Edit2, Trash2, ChevronDown, ChevronUp, Info, Check,
  TrendingUp, Award, Zap, Heart, Tag, DollarSign, Home, Building,
  Loader2, RefreshCw, MessageSquare, Bell, Settings, HelpCircle
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

// Professional Toast Component
const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400',
    error: 'bg-gradient-to-r from-red-500 to-red-600 border-red-400',
    info: 'bg-gradient-to-r from-orange-500 to-orange-600 border-orange-400',
    warning: 'bg-gradient-to-r from-amber-500 to-yellow-600 border-amber-400'
  };

  const icons = {
    success: <CheckCircle size={20} className="animate-bounce-once" />,
    error: <AlertCircle size={20} className="animate-shake" />,
    info: <Info size={20} />,
    warning: <AlertCircle size={20} className="animate-pulse" />
  };

  return (
    <div className={`fixed top-6 right-6 z-[9999] ${styles[type]} text-white px-6 py-4 rounded-2xl shadow-2xl border-2 flex items-center space-x-3 max-w-md animate-toast-slide transform hover:scale-105 transition-transform`}>
      <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
        {icons[type]}
      </div>
      <p className="font-semibold text-sm flex-1">{message}</p>
      <button 
        onClick={onClose} 
        className="flex-shrink-0 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const CheckoutShipping = () => {
  const navigate = useNavigate();
  const { formatPrice, currency } = useCurrency();
  const [currentStep, setCurrentStep] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [errors, setErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    orderSummary: true,
    shippingDetails: true,
    paymentInfo: true
  });

  // Form data
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    addressType: 'home'
  });

  const [selectedShipping, setSelectedShipping] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);

  const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

  // Toast functions
  const showToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token}`
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

  // Fetch cart items
  const fetchCartItems = async () => {
    try {
      const response = await apiCall('/cart');
      
      if (response.items && response.items.length > 0) {
        const formattedItems = response.items.map(item => ({
          id: item.product._id,
          name: item.product.name,
          price: item.product.discountedPrice > 0 ? item.product.discountedPrice : item.product.price, // USD
          originalPrice: item.product.discountedPrice > 0 ? item.product.price : null, // USD
          quantity: item.quantity,
          image: item.product.images?.[0]?.url || item.product.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100",
          rating: item.product.rating || 0,
          numReviews: item.product.numReviews || 0,
          inStock: item.product.stock > 0,
          stock: item.product.stock,
          brand: item.product.brand,
          category: item.product.category
        }));
        setCartItems(formattedItems);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      showToast('error', 'Failed to load cart items');
      setCartItems([]);
    }
  };

  // Fetch shipping options
  const fetchShippingOptions = async () => {
    try {
      const response = await apiCall('/orders/shipping-options');
      
      if (response.success && response.data) {
        const formattedOptions = response.data.map(option => ({
          ...option,
          price: option.price, // USD price from backend
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
      // Fallback shipping options - USD prices
      const fallbackOptions = [
        {
          id: 'standard',
          name: 'Standard Shipping',
          description: 'Regular delivery within Pakistan',
          estimatedDays: '5-7 business days',
          price: 1.08, // ~300 PKR in USD
          icon: Package,
          premium: false
        },
        {
          id: 'express',
          name: 'Express Shipping',
          description: 'Fast delivery in 2-3 business days',
          estimatedDays: '2-3 business days',
          price: 2.51, // ~700 PKR in USD
          icon: Truck,
          premium: false
        },
        {
          id: 'overnight',
          name: 'Overnight Shipping',
          description: 'Next day delivery',
          estimatedDays: 'Next business day',
          price: 7.18, // ~2000 PKR in USD
          icon: Clock,
          premium: true
        }
      ];
      setShippingOptions(fallbackOptions);
      setSelectedShipping(fallbackOptions[0].id);
    }
  };

  // Calculate order summary (all in USD)
  const calculateOrderSummary = useCallback(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = shippingOptions.find(opt => opt.id === selectedShipping)?.price || 0;
    
    let discount = 0;
    if (promoApplied && promoCode) {
      switch (promoCode.toUpperCase()) {
        case 'SAVE10':
          discount = subtotal * 0.1;
          break;
        case 'SAVE15':
          if (subtotal >= 10) {
            discount = subtotal * 0.15;
          }
          break;
        case 'FREESHIP':
          if (subtotal >= 7) {
            discount = shippingCost;
          }
          break;
        case 'WELCOME':
          if (subtotal >= 3.5) {
            discount = 0.72; // ~200 PKR in USD
          }
          break;
        default:
          discount = 0;
      }
    }
    
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + shippingCost + tax - discount;

    return {
      subtotal,
      shipping: shippingCost,
      discount,
      tax,
      total,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [cartItems, selectedShipping, shippingOptions, promoApplied, promoCode]);

  const orderSummary = calculateOrderSummary();

  useEffect(() => {
    fetchCartItems();
    fetchShippingOptions();
  }, []);

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const updateQuantity = async (id, change) => {
    const currentItem = cartItems.find(item => item.id === id);
    if (!currentItem) return;
    
    const newQuantity = currentItem.quantity + change;
    if (newQuantity < 1 || newQuantity > currentItem.stock) {
      showToast('warning', `Cannot ${change > 0 ? 'add more' : 'reduce'} quantity`);
      return;
    }

    try {
      await apiCall('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: id, quantity: change })
      });
      
      setCartItems(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
      showToast('success', 'Cart updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      setCartItems(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItem = async (id) => {
    try {
      await apiCall(`/cart/${id}`, { method: 'DELETE' });
      setCartItems(prev => prev.filter(item => item.id !== id));
      showToast('success', 'Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      setCartItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const applyPromoCode = () => {
    const validCodes = ['SAVE10', 'SAVE15', 'FREESHIP', 'WELCOME'];
    const code = promoCode.toUpperCase();
    
    if (!code.trim()) {
      showToast('warning', 'Please enter a promo code');
      return;
    }

    if (validCodes.includes(code)) {
      setPromoApplied(true);
      setPromoCode(code);
      showToast('success', `Promo code "${code}" applied successfully!`);
    } else {
      showToast('error', 'Invalid promo code');
      setPromoApplied(false);
    }
  };

  const removePromoCode = () => {
    setPromoApplied(false);
    setPromoCode('');
    setPromoDiscount(0);
    showToast('info', 'Promo code removed');
  };

  // Validation
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (cartItems.length === 0) {
        showToast('error', 'Your cart is empty');
        return false;
      }
      return true;
    }
    
    if (step === 2) {
      const required = {
        fullName: 'Full name is required',
        email: 'Email is required',
        phone: 'Phone number is required',
        address: 'Address is required',
        city: 'City is required',
        state: 'State/Province is required',
        postalCode: 'Postal code is required'
      };
      
      Object.keys(required).forEach(field => {
        if (!shippingInfo[field]?.trim()) {
          newErrors[field] = required[field];
        }
      });
      
      if (shippingInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      if (shippingInfo.phone && !/^03\d{9}$/.test(shippingInfo.phone.replace(/\s+/g, ''))) {
        newErrors.phone = 'Please enter a valid Pakistani phone number (03XXXXXXXXX)';
      }
      
      setErrors(newErrors);
      
      if (Object.keys(newErrors).length > 0) {
        showToast('error', 'Please fill all required fields correctly');
        return false;
      }
      return true;
    }
    
    if (step === 3) {
      if (!selectedShipping) {
        showToast('error', 'Please select a shipping method');
        return false;
      }
      return true;
    }
    
    if (step === 4) {
      if (!agreeToTerms) {
        showToast('error', 'Please agree to terms and conditions');
        return false;
      }
      return true;
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        promoCode: promoApplied ? promoCode : null,
        saveAddress
      };

      const response = await apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      
      if (response.success) {
        const orderId = response.data?.orderId || response.data?._id;
        const orderNum = response.data?.orderNumber || response.data?.trackingNumber || `ORD-${Date.now()}`;
        const totalAmount = response.data?.totalAmount || orderSummary.total;
        
        setOrderNumber(orderNum);
        
        // If payment method is stripe, redirect to payment page
        if (paymentMethod === 'stripe') {
          navigate('/payment', {
            state: {
              orderId: orderId,
              amount: totalAmount,
              orderNumber: orderNum
            }
          });
        } else {
          // For COD and other methods, show success
          setOrderPlaced(true);
          showToast('success', 'Order placed successfully!');
          
          // Clear cart
          setCartItems([]);
        }
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showToast('error', error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Order Success Screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 flex items-center justify-center p-3 sm:p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 text-center animate-scale-in">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse-slow shadow-xl">
            <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Order Placed Successfully!</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">Thank you for your purchase. Your order has been confirmed and will be processed shortly.</p>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-blue-100">
            <p className="text-xs sm:text-sm text-gray-500 mb-2">Order Number</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 break-all">{orderNumber}</p>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex flex-col items-center p-2 bg-white rounded-lg">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mb-1" />
                <span className="text-gray-600 font-medium">Confirmed</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-white rounded-lg">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mb-1" />
                <span className="text-gray-600 font-medium">Processing</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-white rounded-lg">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 mb-1" />
                <span className="text-gray-600 font-medium">Email Sent</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            <button 
              onClick={() => window.location.href = '/trackmyorder'}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              Track Your Order
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 sm:py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Continue Shopping
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mx-auto mb-2" />
              <p className="text-blue-800 font-medium">Earned 50 Points</p>
            </div>
            <div className="p-3 sm:p-4 bg-green-50 rounded-lg sm:rounded-xl border border-green-200">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">Total: {formatPrice(orderSummary.total)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Cart", icon: ShoppingCart, subtitle: "Review Items" },
    { number: 2, title: "Shipping", icon: MapPin, subtitle: "Address" },
    { number: 3, title: "Delivery", icon: Truck, subtitle: "Method" },
    { number: 4, title: "Payment", icon: CreditCard, subtitle: "& Review" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Toast Container */}
      <div className="fixed top-0 right-0 z-[9999] space-y-2 p-2 sm:p-4">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} message={toast.message} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* Header */}
      <div className="bg-white shadow-lg sticky top-0 z-[111]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button 
                onClick={() => window.location.href = '/'}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Secure Checkout
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Complete your purchase securely</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-green-600 bg-green-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
              <Shield className="w-3 h-3 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">SSL Secured</span>
              <span className="text-xs font-medium sm:hidden">Secure</span>
            </div>
          </div>
          
          {/* Progress Steps - Desktop */}
          <div className="hidden lg:block mt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex items-center">
                      <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border-2 transition-all duration-300 ${
                        isCompleted ? 'bg-green-600 border-green-600 text-white shadow-lg' :
                        isActive ? 'bg-gradient-to-r from-orange-600 to-red-600 border-orange-600 text-white shadow-lg scale-110' :
                        'bg-gray-100 border-gray-300 text-gray-400'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-7 h-7" /> : <Icon className="w-7 h-7" />}
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm font-bold ${isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                          {step.title}
                        </p>
                        <p className={`text-xs ${isActive ? 'text-orange-500' : isCompleted ? 'text-green-500' : 'text-gray-400'}`}>
                          {step.subtitle}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-4 rounded-full transition-colors duration-300 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Steps - Mobile */}
          <div className="lg:hidden mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-semibold text-gray-700">Step {currentStep} of 4</span>
              <span className="text-xs sm:text-sm text-gray-600">{steps[currentStep - 1].title}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-600 to-red-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8">
              
              {/* Step 1: Cart Review */}
              {currentStep === 1 && (
                <div>
                  <div className="flex items-center justify-between mb-4 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Cart</h2>
                    <span className="text-sm sm:text-base bg-blue-100 text-blue-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold">
                      {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>
                  
                  {cartItems.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">Your cart is empty</h3>
                      <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Add some amazing products to get started</p>
                      <button 
                        onClick={() => window.location.href = '/products'}
                        className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-6 border-2 border-gray-200 rounded-xl sm:rounded-2xl hover:shadow-lg transition-all">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full sm:w-20 h-48 sm:h-20 object-cover rounded-lg"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'; }}
                          />
                          
                          <div className="flex-1 w-full">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 pr-2">
                                <h3 className="font-bold text-gray-900 text-sm sm:text-lg line-clamp-2">{item.name}</h3>
                                {item.brand && (
                                  <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded mt-1 font-medium">
                                    {item.brand}
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            </div>
                            
                            {item.numReviews > 0 && (
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < Math.floor(item.rating) ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500">({item.numReviews})</span>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-100 rounded-lg p-1">
                                <button 
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                                <span className="font-bold text-sm sm:text-lg px-2 sm:px-3">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white flex items-center justify-center hover:bg-blue-100 transition-colors disabled:opacity-50"
                                  disabled={item.quantity >= item.stock}
                                >
                                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                </button>
                              </div>
                              
                              <div className="text-right">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                                  {item.originalPrice && item.originalPrice > item.price && (
                                    <span className="text-xs sm:text-sm text-gray-400 line-through">
                                      {formatPrice(item.originalPrice * item.quantity)}
                                    </span>
                                  )}
                                  <span className="text-lg sm:text-xl font-bold text-gray-900">
                                    {formatPrice(item.price * item.quantity)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {formatPrice(item.price)} each
                                </p>
                              </div>
                            </div>
                            
                            {!item.inStock && (
                              <p className="text-red-500 text-xs sm:text-sm mt-2 flex items-center">
                                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Out of stock
                              </p>
                            )}
                            {item.stock <= 5 && item.stock > 0 && (
                              <p className="text-orange-600 text-xs sm:text-sm mt-2 flex items-center">
                                <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Only {item.stock} left in stock
                              </p>
                            )}
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
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Shipping Information</h2>
                  
                  {/* Address Type */}
                  <div className="mb-4 sm:mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Address Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setShippingInfo(prev => ({ ...prev, addressType: 'home' }))}
                        className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                          shippingInfo.addressType === 'home'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Home className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 ${shippingInfo.addressType === 'home' ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={`text-sm font-semibold ${shippingInfo.addressType === 'home' ? 'text-blue-600' : 'text-gray-700'}`}>
                          Home
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingInfo(prev => ({ ...prev, addressType: 'office' }))}
                        className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                          shippingInfo.addressType === 'office'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Building className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 ${shippingInfo.addressType === 'office' ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={`text-sm font-semibold ${shippingInfo.addressType === 'office' ? 'text-blue-600' : 'text-gray-700'}`}>
                          Office
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        <User className="inline w-4 h-4 mr-2" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={shippingInfo.fullName}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-3 sm:py-4 border-2 rounded-xl focus:outline-none focus:border-orange-500 transition-all text-sm sm:text-base ${
                          errors.fullName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {errors.fullName}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        <Mail className="inline w-4 h-4 mr-2" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={shippingInfo.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-3 sm:py-4 border-2 rounded-xl focus:outline-none focus:border-orange-500 transition-all text-sm sm:text-base ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        <Phone className="inline w-4 h-4 mr-2" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={shippingInfo.phone}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-3 sm:py-4 border-2 rounded-xl focus:outline-none focus:border-orange-500 transition-all text-sm sm:text-base ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="03XXXXXXXXX"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">City *</label>
                      <select
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-3 sm:py-4 border-2 rounded-xl focus:outline-none focus:border-orange-500 transition-all text-sm sm:text-base ${
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
                        <option value="Sialkot">Sialkot</option>
                        <option value="Gujranwala">Gujranwala</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.city && (
                        <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {errors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">State/Province *</label>
                      <select
                        name="state"
                        value={shippingInfo.state}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-3 sm:py-4 border-2 rounded-xl focus:outline-none focus:border-orange-500 transition-all text-sm sm:text-base ${
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
                        <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {errors.state}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        <MapPin className="inline w-4 h-4 mr-2" />
                        Complete Address *
                      </label>
                      <textarea
                        name="address"
                        value={shippingInfo.address}
                        onChange={handleInputChange}
                        rows="3"
                        className={`w-full px-3 sm:px-4 py-3 sm:py-4 border-2 rounded-xl focus:outline-none focus:border-orange-500 transition-all text-sm sm:text-base ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="House/Flat no, Street, Area, Landmarks"
                      />
                      {errors.address && (
                        <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {errors.address}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={shippingInfo.postalCode}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-3 sm:py-4 border-2 rounded-xl focus:outline-none focus:border-orange-500 transition-all text-sm sm:text-base ${
                          errors.postalCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="75500"
                      />
                      {errors.postalCode && (
                        <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {errors.postalCode}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveAddress}
                          onChange={(e) => setSaveAddress(e.target.checked)}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 rounded focus:outline-none focus:ring-0"
                        />
                        <span className="text-xs sm:text-sm text-gray-700 font-medium">Save this address for future orders</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Shipping Method */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Choose Shipping Method</h2>
                  <div className="space-y-3 sm:space-y-4">
                    {shippingOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <label key={option.id} className={`block p-4 sm:p-6 border-2 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 ${
                          selectedShipping === option.id 
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}>
                          <div className="flex items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center flex-1 gap-3">
                              <input
                                type="radio"
                                name="shipping"
                                value={option.id}
                                checked={selectedShipping === option.id}
                                onChange={(e) => setSelectedShipping(e.target.value)}
                                className="mt-1 sm:mt-0 w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                  <div className="flex items-center space-x-2">
                                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${option.premium ? 'text-red-500' : 'text-orange-500'}`} />
                                    <h3 className="font-bold text-gray-900 text-sm sm:text-lg">{option.name}</h3>
                                  </div>
                                  {option.premium && (
                                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold inline-block">
                                      PREMIUM
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">{option.description}</p>
                                <p className="text-xs sm:text-sm text-green-600 font-semibold flex items-center">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  {option.estimatedDays}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                {option.price === 0 ? (
                                  <span className="text-green-600">FREE</span>
                                ) : (
                                  formatPrice(option.price)
                                )}
                              </p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs sm:text-sm text-blue-800">
                        <p className="font-semibold mb-1">Shipping Information</p>
                        <p>All orders are carefully packaged and insured. You'll receive tracking information via email once your order ships.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Payment & Review */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Payment & Final Review</h2>
                  
                  {/* Currency Notice */}
                  <div className="mb-6 sm:mb-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">Payment Currency Information</p>
                        <p className="text-sm text-blue-700">
                          Prices are displayed in <span className="font-bold">{currency}</span>. Your payment will be processed in <span className="font-bold">USD</span>.
                        </p>
                        <p className="text-sm text-blue-600 mt-2 font-semibold">
                          Total: {formatPrice(orderSummary.total)} ≈ ${orderSummary.total.toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="mb-6 sm:mb-8">
                    <button
                      onClick={() => toggleSection('paymentInfo')}
                      className="w-full flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl mb-3"
                    >
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600" />
                        Payment Method
                      </h3>
                      {expandedSections.paymentInfo ? <ChevronUp className="w-5 h-5 text-orange-600" /> : <ChevronDown className="w-5 h-5 text-orange-600" />}
                    </button>
                    
                    {expandedSections.paymentInfo && (
                      <div className="space-y-2 sm:space-y-3">
                        {/* Stripe Payment */}
                        <label className={`block p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          paymentMethod === 'stripe' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              <input
                                type="radio"
                                name="payment"
                                value="stripe"
                                checked={paymentMethod === 'stripe'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-3 flex-shrink-0"
                              />
                              <div className="flex-1">
                                <p className="font-semibold text-sm sm:text-base text-gray-900">Credit/Debit Card</p>
                                <p className="text-xs sm:text-sm text-gray-600">Secure payment via Stripe</p>
                              </div>
                            </div>
                            <div className="bg-blue-100 px-2 sm:px-3 py-1 rounded-full ml-2">
                              <span className="text-blue-700 text-xs font-bold flex items-center">
                                <Shield size={12} className="mr-1" />
                                SECURE
                              </span>
                            </div>
                          </div>
                        </label>
                        
                        {/* Cash on Delivery */}
                        <label className={`block p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          paymentMethod === 'cash_on_delivery' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              <input
                                type="radio"
                                name="payment"
                                value="cash_on_delivery"
                                checked={paymentMethod === 'cash_on_delivery'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-3 flex-shrink-0"
                              />
                              <div className="flex-1">
                                <p className="font-semibold text-sm sm:text-base text-gray-900">Cash on Delivery</p>
                                <p className="text-xs sm:text-sm text-gray-600">Pay when order arrives</p>
                              </div>
                            </div>
                            <div className="bg-green-100 px-2 sm:px-3 py-1 rounded-full ml-2">
                              <span className="text-green-700 text-xs font-bold flex items-center">
                                <TrendingUp size={12} className="mr-1" />
                                POPULAR
                              </span>
                            </div>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="mb-6 sm:mb-8">
                    <button
                      onClick={() => toggleSection('orderSummary')}
                      className="w-full flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl mb-3"
                    >
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600" />
                        Order Summary ({cartItems.length} items)
                      </h3>
                      {expandedSections.orderSummary ? <ChevronUp className="w-5 h-5 text-orange-600" /> : <ChevronDown className="w-5 h-5 text-orange-600" />}
                    </button>
                    
                    {expandedSections.orderSummary && (
                      <div className="bg-gray-50 rounded-xl p-3 sm:p-6 space-y-3 sm:space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex items-center space-x-3 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                            <img src={item.image} alt={item.name} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-1">{item.name}</p>
                              <p className="text-xs sm:text-sm text-gray-600">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold text-sm sm:text-base text-gray-900 flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Shipping Details Summary */}
                  <div className="mb-6 sm:mb-8">
                    <button
                      onClick={() => toggleSection('shippingDetails')}
                      className="w-full flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl mb-3"
                    >
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                        Shipping Details
                      </h3>
                      {expandedSections.shippingDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    
                    {expandedSections.shippingDetails && (
                      <div className="bg-blue-50 rounded-xl p-3 sm:p-6 border border-blue-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Delivery Address:</p>
                            <p className="font-semibold text-sm sm:text-base text-gray-900">{shippingInfo.fullName}</p>
                            <p className="text-xs sm:text-sm text-gray-700">{shippingInfo.address}</p>
                            <p className="text-xs sm:text-sm text-gray-700">{shippingInfo.city}, {shippingInfo.state} {shippingInfo.postalCode}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Contact:</p>
                            <p className="text-xs sm:text-sm text-gray-700 flex items-center mb-1">
                              <Mail className="w-3 h-3 mr-1" />
                              {shippingInfo.email}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-700 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {shippingInfo.phone}
                            </p>
                          </div>
                        </div>
                        <div className="pt-3 sm:pt-4 border-t border-blue-200">
                          <p className="text-xs text-gray-600 mb-1">Shipping Method:</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm sm:text-base text-gray-900">
                                {shippingOptions.find(opt => opt.id === selectedShipping)?.name}
                              </p>
                              <p className="text-xs sm:text-sm text-green-600 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {shippingOptions.find(opt => opt.id === selectedShipping)?.estimatedDays}
                              </p>
                            </div>
                            <button
                              onClick={() => setCurrentStep(2)}
                              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Special Instructions */}
                  <div className="mb-6 sm:mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="3"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 transition-all text-sm sm:text-base"
                      placeholder="Any special delivery instructions, preferred delivery time, etc..."
                    />
                  </div>

                  {/* Terms and Conditions */}
                  <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-orange-600 rounded focus:outline-none focus:ring-0 flex-shrink-0"
                      />
                      <div className="text-xs sm:text-sm text-gray-700">
                        <p>I agree to the <button type="button" className="text-blue-600 hover:underline font-semibold">Terms & Conditions</button> and <button type="button" className="text-blue-600 hover:underline font-semibold">Privacy Policy</button>. I confirm that all information provided is accurate and I authorize the processing of this order.</p>
                      </div>
                    </label>
                  </div>

                  {/* Order Confirmation Notice */}
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 sm:p-4 mb-6">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs sm:text-sm text-amber-800">
                        <p className="font-semibold mb-1">Please Review Your Order</p>
                        <p>Once you place this order, changes may not be possible. Make sure all details are correct before proceeding.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 sm:mt-12">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                    currentStep === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                  Previous Step
                </button>
                
                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    disabled={cartItems.length === 0}
                    className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                      cartItems.length === 0
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    Continue to Next Step
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 inline ml-2 rotate-[-90deg]" />
                  </button>
                ) : (
                  <button
                    onClick={placeOrder}
                    disabled={loading || !agreeToTerms}
                    className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                      loading || !agreeToTerms
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                        Place Order - {formatPrice(orderSummary.total)}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 sticky top-20">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Order Summary
              </h3>
              
              {/* Promo Code */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                  <Gift className="w-4 h-4 mr-2" />
                  Promo Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 transition-all text-sm sm:text-base disabled:bg-gray-100"
                    disabled={promoApplied}
                  />
                  {!promoApplied ? (
                    <button
                      onClick={applyPromoCode}
                      disabled={!promoCode.trim()}
                      className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-colors text-sm sm:text-base flex-shrink-0 ${
                        promoCode.trim() 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Apply
                    </button>
                  ) : (
                    <button
                      onClick={removePromoCode}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm sm:text-base flex items-center flex-shrink-0"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Applied
                    </button>
                  )}
                </div>
                {promoApplied && (
                  <p className="text-green-600 text-xs sm:text-sm mt-2 flex items-center">
                    <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Code "{promoCode}" applied successfully!
                  </p>
                )}
              </div>

              {/* Cart Items Summary */}
              <div className="mb-4 sm:mb-6">
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 flex items-center justify-between">
                  <span>Items ({cartItems.length})</span>
                  <span className="text-xs text-gray-500">{orderSummary.itemCount} total</span>
                </h4>
                <div className="space-y-2 sm:space-y-3 max-h-40 sm:max-h-48 overflow-y-auto custom-scrollbar">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <img src={item.image} alt={item.name} className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2 border-gray-200">
                <div className="flex justify-between text-sm sm:text-base text-gray-600">
                  <span>Subtotal ({orderSummary.itemCount} items)</span>
                  <span className="font-semibold">{formatPrice(orderSummary.subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm sm:text-base text-gray-600">
                  <span className="flex items-center">
                    <Truck className="w-4 h-4 mr-1" />
                    Shipping
                  </span>
                  <span className="font-semibold">
                    {formatPrice(orderSummary.shipping)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm sm:text-base text-gray-600">
                  <span className="flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    Tax (5%)
                  </span>
                  <span className="font-semibold">{formatPrice(orderSummary.tax)}</span>
                </div>
                
                {orderSummary.discount > 0 && (
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="font-semibold text-green-600">Promo Discount</span>
                    <span className="font-bold text-green-600">-{formatPrice(orderSummary.discount)}</span>
                  </div>
                )}
              </div>

              {/* Estimated Delivery */}
              {selectedShipping && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-900">Estimated Delivery</span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-800">
                    {shippingOptions.find(opt => opt.id === selectedShipping)?.estimatedDays || 'Select shipping method'}
                  </p>
                </div>
              )}

              {/* Total Amount */}
              <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-orange-50 via-red-50 to-orange-50 rounded-2xl border-2 border-orange-300 shadow-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-base sm:text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {formatPrice(orderSummary.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-orange-200">
                  <span>Including all taxes and fees</span>
                  <span className="font-semibold">≈ ${orderSummary.total.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Savings Badge */}
              {orderSummary.discount > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-green-200">
                  <div className="flex items-center space-x-2 text-green-700">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-bold">You're saving {formatPrice(orderSummary.discount)}!</span>
                  </div>
                </div>
              )}

              {/* Security Badge */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-green-200">
                <div className="flex items-center space-x-2 text-green-700">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-semibold">256-bit SSL Encryption</span>
                </div>
              </div>

              {/* Available Promo Codes */}
              {!promoApplied && (
                <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                  <h4 className="font-semibold text-sm text-amber-900 mb-2 sm:mb-3 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Available Offers
                  </h4>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between items-center p-2 bg-amber-100 rounded-lg">
                      <span className="font-bold text-amber-900">SAVE10</span>
                      <span className="text-amber-700">10% off</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-amber-100 rounded-lg">
                      <span className="font-bold text-amber-900">SAVE15</span>
                      <span className="text-amber-700">15% off on $10+</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-amber-100 rounded-lg">
                      <span className="font-bold text-amber-900">FREESHIP</span>
                      <span className="text-amber-700">Free ship $7+</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-amber-100 rounded-lg">
                      <span className="font-bold text-amber-900">WELCOME</span>
                      <span className="text-amber-700">$0.72 off $3.50+</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Help & Support */}
              <div className="mt-4 sm:mt-6 text-center p-3 sm:p-4 bg-gray-50 rounded-xl">
                <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">Need help?</p>
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                  <a href="tel:+923001234567" className="flex items-center justify-center text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-semibold">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Call Support
                  </a>
                  <a href="mailto:support@example.com" className="flex items-center justify-center text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-semibold">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-center max-w-sm w-full">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4">
              <div className="w-full h-full border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600 w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Processing Your Order</h3>
            <p className="text-sm sm:text-base text-gray-600">Please wait while we confirm your order...</p>
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes toast-slide {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-toast-slide {
          animation: toast-slide 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #FF6B35, #EF4444);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #EF4444, #DC2626);
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutShipping;