import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { FaShoppingCart, FaTimes, FaTrash, FaMinus, FaPlus, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { ShoppingCart } from 'lucide-react';

// Professional Toast Component
const Toast = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const toastStyles = {
    success: 'bg-green-500 text-white border-green-600',
    error: 'bg-red-500 text-white border-red-600',
    info: 'bg-blue-500 text-white border-blue-600',
    warning: 'bg-yellow-500 text-white border-yellow-600'
  };

  const icons = {
    success: <FaCheck className="text-lg" />,
    error: <FaExclamationTriangle className="text-lg" />,
    info: <FaShoppingCart className="text-lg" />,
    warning: <FaExclamationTriangle className="text-lg" />
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 max-w-sm ${toastStyles[type]} transform transition-all duration-300`}>
        {icons[type]}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Close notification"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>
    </div>
  );
};

// Toast Hook
const useToast = () => {
  const [toast, setToast] = useState({ message: '', type: 'info', isVisible: false });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return { toast, showToast, hideToast };
};

const CartSidebar = () => {
  const { removeItem, updateCart, cart, totalAmount } = useAuth();
  const { formatPrice } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadingItems, setLoadingItems] = useState(new Set());
  const [scrolled, setScrolled] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate total items with error handling
  const totalItems = cart?.reduce((sum, item) => sum + (item?.quantity || 0), 0) || 0;

  // Toggle sidebar with animation state management
  const toggleSidebar = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsOpen(prev => !prev);
    
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating]);

  // Handle quantity update with loading state and toast notifications
  const handleQuantityUpdate = useCallback(async (productId, change) => {
    if (loadingItems.has(productId)) return;
    
    try {
      setLoadingItems(prev => new Set(prev).add(productId));
      await updateCart(productId, change);
      
      const action = change > 0 ? 'increased' : 'decreased';
      showToast(`Quantity ${action} successfully`, 'success');
    } catch (error) {
      console.error('Failed to update cart:', error);
      showToast('Failed to update quantity. Please try again.', 'error');
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  }, [updateCart, loadingItems, showToast]);

  // Handle item removal with confirmation and toast notifications
  const handleRemoveItem = useCallback(async (productId, productName) => {
    if (loadingItems.has(productId)) return;
    
    const confirmed = window.confirm(`Remove ${productName} from cart?`);
    if (!confirmed) return;
    
    try {
      setLoadingItems(prev => new Set(prev).add(productId));
      await removeItem(productId);
      showToast(`${productName} removed from cart`, 'success');
    } catch (error) {
      console.error('Failed to remove item:', error);
      showToast('Failed to remove item. Please try again.', 'error');
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  }, [removeItem, loadingItems, showToast]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, toggleSidebar]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Prevent layout shift
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [isOpen]);

  return (
    <>
      {/* Professional Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Cart Toggle Button */}
      <div className="relative z-50">
        <button
          onClick={toggleSidebar}
          disabled={isAnimating}
          aria-label={`Shopping cart with ${totalItems} items`}
          className={`relative z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105 group shadow-sm
            ${scrolled 
              ? 'text-gray-700 hover:bg-gray-100 bg-white/90 backdrop-blur-sm border border-gray-200' 
              : 'text-white hover:bg-white/20 bg-black/10 backdrop-blur-sm border border-white/20'
            }`}
        >
          <div className="relative">
            <ShoppingCart className="text-xl group-hover:text-blue-600 transition-colors duration-300" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </div>
          <span className="hidden lg:block font-semibold">Cart</span>
        </button>
      </div>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed  inset-0 bg-black/60 backdrop-blur-sm z-[1111] transition-all duration-300"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Professional Sidebar - Fixed positioning to cover full height */}
      <div
        className={`fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-[1112] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        style={{ height: '100vh', height: '100dvh' }} // Ensures full height coverage
      >
        {/* Professional Header with Gradient */}
        <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 text-white p-6 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <FaShoppingCart className="text-xl text-blue-400" />
                </div>
                <h2 id="cart-title" className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Shopping Cart
                </h2>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90"
                aria-label="Close cart"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            {totalItems > 0 && (
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <p>{totalItems} {totalItems === 1 ? 'item' : 'items'} in cart</p>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex flex-col h-full pt-0" style={{ height: 'calc(100vh - 120px)' }}>
          {/* Cart Items - Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {cart?.length > 0 ? (
              <div className="p-6 space-y-4">
                {cart.map((item, index) => {
                  if (!item?.product) return null;
                  
                  const isLoading = loadingItems.has(item.product._id);
                  
                  return (
                    <div
                      key={item.product._id}
                      className={`relative bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-2xl p-5 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-gray-200 ${
                        isLoading ? 'opacity-50 pointer-events-none' : ''
                      }`}
                      style={{ 
                        animation: `slideInUp 0.3s ease-out ${index * 0.1}s both` 
                      }}
                    >
                      {/* Professional Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.product._id, item.product.name)}
                        className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 z-10"
                        aria-label={`Remove ${item.product.name} from cart`}
                        disabled={isLoading}
                      >
                        <FaTrash className="text-sm" />
                      </button>

                      <div className="flex items-start space-x-4">
                        {/* Enhanced Product Image */}
                        <div className="flex-shrink-0 relative">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                            <img
                              src={item.product.image || '/placeholder-image.jpg'}
                              alt={item.product.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              onError={(e) => {
                                e.target.src = '/placeholder-image.jpg';
                              }}
                            />
                          </div>
                        </div>

                        {/* Enhanced Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg">
                            {item.product.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                              {formatPrice(Number(item.product.price || 0))}
                            </span>
                            <span className="text-sm text-gray-500">each</span>
                          </div>
                          
                          {/* Professional Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center bg-gray-100 rounded-xl p-1">
                              <button
                                onClick={() => handleQuantityUpdate(item.product._id, -1)}
                                disabled={item.quantity <= 1 || isLoading}
                                className="flex items-center justify-center w-8 h-8 bg-white hover:bg-gray-50 disabled:bg-gray-200 disabled:text-gray-400 rounded-lg transition-colors duration-200 shadow-sm"
                                aria-label="Decrease quantity"
                              >
                                <FaMinus className="text-xs" />
                              </button>
                              
                              <span className="font-bold text-gray-900 min-w-12 text-center text-lg">
                                {item.quantity || 0}
                              </span>
                              
                              <button
                                onClick={() => handleQuantityUpdate(item.product._id, 1)}
                                disabled={isLoading}
                                className="flex items-center justify-center w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-sm"
                                aria-label="Increase quantity"
                              >
                                <FaPlus className="text-xs" />
                              </button>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Subtotal</p>
                              <p className="font-bold text-lg text-gray-900">
                                {formatPrice(Number(item.product.price || 0) * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Professional Loading Overlay */}
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl">
                          <div className="flex items-center gap-2 text-blue-600">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                            <span className="font-medium">Updating...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <FaShoppingCart className="text-4xl text-gray-300" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-700">Your cart is empty</h3>
                <p className="text-center text-gray-500 mb-6 max-w-sm">
                  Discover amazing products and add them to your cart to get started
                </p>
                <button
                  onClick={toggleSidebar}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                >
                  Start Shopping
                </button>
              </div>
            )}
          </div>

          {/* Professional Footer */}
          {cart?.length > 0 && (
            <div className="border-t bg-gradient-to-r from-gray-50 to-white p-6 space-y-4 shadow-lg">
              {/* Enhanced Total Display */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 font-medium">Subtotal:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${Number(totalAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Shipping calculated at checkout</span>
                </div>
              </div>

              {/* Professional Action Buttons */}
              <div className="space-y-3">
                <Link to="/checkout" className="block">
                  <button
                    onClick={() => {
                      toggleSidebar();
                      showToast('Redirecting to checkout...', 'info');
                    }}
                    className="w-full bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-opacity-50 relative overflow-hidden"
                  >
                    <span className="relative z-10">Proceed to Checkout</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </Link>
                
                <button
                  onClick={toggleSidebar}
                  className="w-full text-gray-600 hover:text-gray-800 font-semibold py-3 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-200 hover:bg-gray-50"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default CartSidebar;