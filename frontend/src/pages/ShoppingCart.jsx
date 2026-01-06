import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart as CartIcon, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Package,
  Heart,
  Star,
  AlertCircle,
  CheckCircle,
  X,
  Tag,
  TrendingUp,
  Gift,
  Zap,
  Shield
} from 'lucide-react';

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
    info: <AlertCircle size={20} />,
    warning: <AlertCircle size={20} className="animate-pulse" />
  };

  return (
    <div className={`fixed top-6 right-6 z-50 ${styles[type]} text-white px-6 py-4 rounded-2xl shadow-2xl border-2 flex items-center space-x-3 max-w-md animate-toast-slide transform hover:scale-105 transition-transform`}>
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

const ShoppingCart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [updatingItems, setUpdatingItems] = useState(new Set());

  const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

  // Toast functions
  const showToast = (type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

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
      setLoading(true);
      const response = await apiCall('/cart');
      
      if (response.items && response.items.length > 0) {
        const formattedItems = response.items.map(item => ({
          id: item.product._id,
          name: item.product.name,
          price: item.product.discountedPrice > 0 ? item.product.discountedPrice : item.product.price,
          originalPrice: item.product.discountedPrice > 0 ? item.product.price : null,
          quantity: item.quantity,
          image: item.product.images?.[0]?.url || item.product.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      showToast('error', 'Please login to view cart');
      navigate('/login');
      return;
    }
    fetchCartItems();
  }, []);

  // Update quantity
  const updateQuantity = async (id, change) => {
    const currentItem = cartItems.find(item => item.id === id);
    if (!currentItem) return;
    
    const newQuantity = currentItem.quantity + change;
    if (newQuantity < 1 || newQuantity > currentItem.stock) {
      showToast('warning', `Cannot ${change > 0 ? 'add more' : 'reduce'} quantity`);
      return;
    }

    try {
      setUpdatingItems(prev => new Set(prev).add(id));
      
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
      showToast('error', 'Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Remove item
  const removeItem = async (id, name) => {
    const confirmed = window.confirm(`Remove ${name} from cart?`);
    if (!confirmed) return;

    try {
      setUpdatingItems(prev => new Set(prev).add(id));
      
      await apiCall(`/cart/${id}`, { method: 'DELETE' });
      
      setCartItems(prev => prev.filter(item => item.id !== id));
      showToast('success', 'Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      showToast('error', 'Failed to remove item');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const savings = cartItems.reduce((sum, item) => {
    if (item.originalPrice) {
      return sum + ((item.originalPrice - item.price) * item.quantity);
    }
    return sum;
  }, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Toast Container */}
      <div className="fixed top-0 right-0 z-50 space-y-2 p-4">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} message={toast.message} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center">
                <CartIcon className="mr-3 text-orange-600" size={32} />
                Shopping Cart
              </h1>
              <p className="text-gray-600 mt-1">{totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart</p>
            </div>
            <Link to="/products" className="text-orange-600 hover:text-orange-700 font-semibold flex items-center">
              Continue Shopping
              <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          // Empty Cart
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CartIcon size={64} className="text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Package className="mr-2" size={20} />
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const isUpdating = updatingItems.has(item.id);
                const hasDiscount = item.originalPrice && item.originalPrice > item.price;
                
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 ${
                      isUpdating ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Product Image */}
                      <div className="relative flex-shrink-0">
                        <Link to={`/product/${item.id}`}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-xl hover:scale-105 transition-transform"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'; }}
                          />
                        </Link>
                        {hasDiscount && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                            <Zap size={12} className="mr-1" fill="white" />
                            {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 pr-4">
                            <Link to={`/product/${item.id}`}>
                              <h3 className="text-xl font-bold text-gray-900 hover:text-orange-600 transition-colors line-clamp-2">
                                {item.name}
                              </h3>
                            </Link>
                            {item.brand && (
                              <span className="inline-block mt-2 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                {item.brand}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.id, item.name)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={isUpdating}
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>

                        {/* Rating */}
                        {item.numReviews > 0 && (
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={i < Math.floor(item.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">({item.numReviews} reviews)</span>
                          </div>
                        )}

                        {/* Stock Status */}
                        {!item.inStock && (
                          <p className="text-red-500 text-sm mb-3 flex items-center">
                            <AlertCircle size={16} className="mr-1" />
                            Out of stock
                          </p>
                        )}
                        {item.stock <= 5 && item.stock > 0 && (
                          <p className="text-orange-600 text-sm mb-3 flex items-center">
                            <Zap size={16} className="mr-1" />
                            Only {item.stock} left in stock - order soon!
                          </p>
                        )}

                        {/* Price and Quantity */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-3 bg-gray-100 rounded-xl p-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1 || isUpdating}
                              className="w-10 h-10 rounded-lg bg-white flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus size={18} />
                            </button>
                            <span className="font-bold text-xl px-4">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={item.quantity >= item.stock || isUpdating}
                              className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus size={18} />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className="flex flex-col sm:items-end">
                              {hasDiscount && (
                                <span className="text-sm text-gray-400 line-through">
                                  ${(item.originalPrice * item.quantity).toFixed(2)}
                                </span>
                              )}
                              <span className="text-2xl font-bold text-orange-600">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-600">
                                ${item.price.toFixed(2)} each
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Loading Overlay */}
                    {isUpdating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl">
                        <div className="flex items-center gap-2 text-orange-600">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-600 border-t-transparent"></div>
                          <span className="font-medium">Updating...</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-xl p-8 sticky top-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Package className="mr-2 text-orange-600" size={24} />
                  Order Summary
                </h2>

                {/* Summary Details */}
                <div className="space-y-4 mb-6 pb-6 border-b-2 border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({totalItems} items)</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {savings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="font-semibold">You Save</span>
                      <span className="font-bold">-${savings.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-sm text-gray-500">Calculated at checkout</span>
                  </div>
                </div>

                {/* Total */}
                <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Estimated Total</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Savings Badge */}
                {savings > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border-2 border-green-200">
                    <div className="flex items-center space-x-2 text-green-700">
                      <TrendingUp size={20} />
                      <span className="text-sm font-bold">You're saving ${savings.toFixed(2)} on this order!</span>
                    </div>
                  </div>
                )}

                {/* Checkout Button */}
                <Link to="/checkout">
                  <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center mb-4">
                    Proceed to Checkout
                    <ArrowRight className="ml-2" size={20} />
                  </button>
                </Link>

                <Link to="/products">
                  <button className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                    Continue Shopping
                  </button>
                </Link>

                {/* Security Badge */}
                <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center space-x-2 text-green-700">
                    <Shield size={20} />
                    <span className="text-sm font-semibold">Secure Checkout</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">256-bit SSL Encryption</p>
                </div>

                {/* Promo Info */}
                <div className="mt-6 bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center space-x-2 text-amber-900 mb-2">
                    <Gift size={18} />
                    <span className="text-sm font-bold">Available Offers</span>
                  </div>
                  <ul className="text-xs text-amber-800 space-y-1">
                    <li>• Use code SAVE10 for 10% off</li>
                    <li>• Free shipping on orders over $50</li>
                    <li>• Get 15% off with SAVE15</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ShoppingCart;
