import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import { 
  Search, Package, Truck, CheckCircle, Clock, AlertCircle, Eye, Calendar, 
  MapPin, User, CreditCard, X, RefreshCw, ShoppingBag, Download, Printer,
  Star, MessageSquare, RotateCcw, Filter, FileText, TrendingUp, ChevronDown,
  ChevronUp, Mail, Phone, Home, Building, MapPinned, ArrowRight, Check,
  XCircle, Loader, DollarSign, Tag, Gift, Info, ExternalLink
} from 'lucide-react';

const TrackOrder = () => {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  
  // State Management
  const [searchInput, setSearchInput] = useState('');
  const [userOrders, setUserOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [cancelLoading, setCancelLoading] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ orderId: '', rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Get token from localStorage
  const getAuthToken = () => {
    let user = JSON.parse(localStorage.getItem("user"));
    return user?.token;
  };

  // Fetch user orders
  const getUserOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/my-orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setUserOrders(data.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get specific order by ID
  const getOrderById = async (orderId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setSelectedOrder(data.data || data.order || data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to fetch order details');
    }
  };

  // Cancel order
  const cancelOrder = async (orderId, reason = 'Cancelled by customer') => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    setCancelLoading(orderId);
    try {
      const token = getAuthToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      setUserOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, orderStatus: 'cancelled' } : order
      ));

      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: 'cancelled' });
      }

      alert('✅ Order cancelled successfully');
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('❌ Failed to cancel order. Please try again.');
    } finally {
      setCancelLoading('');
    }
  };

  // Reorder functionality
  const handleReorder = (order) => {
    if (!window.confirm('Add all items from this order to your cart?')) return;
    
    // Add items to cart logic here
    alert('✅ Items added to cart! Redirecting to checkout...');
    navigate('/checkout');
  };

  // Submit review
  const submitReview = async () => {
    if (!reviewData.comment.trim()) {
      alert('Please write a review comment');
      return;
    }

    setSubmittingReview(true);
    try {
      // API call to submit review would go here
      console.log('Submitting review:', reviewData);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      alert('✅ Thank you for your review!');
      setShowReviewModal(false);
      setReviewData({ orderId: '', rating: 5, comment: '' });
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('❌ Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Download invoice
  const downloadInvoice = (order) => {
    alert('📄 Downloading invoice... (Feature coming soon)');
    // Implementation for PDF generation would go here
  };

  // Print order
  const printOrder = (order) => {
    window.print();
  };

  // Export orders to CSV
  const exportToCSV = () => {
    const csvData = filteredOrders.map(order => ({
      'Order ID': order.trackingNumber || order._id,
      'Date': formatDate(order.createdAt),
      'Status': order.orderStatus,
      'Total': order.orderSummary?.totalAmount || 0,
      'Items': order.orderItems?.length || 0,
      'Payment': order.isPaid ? 'Paid' : 'Pending'
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    getUserOrders();
  }, []);

  // Helper functions
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'confirmed': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'processing': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'shipped': return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'delivered': return 'text-green-600 bg-green-100 border-green-300';
      case 'cancelled': return 'text-red-600 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'confirmed': return <CheckCircle className="w-5 h-5" />;
      case 'processing': return <Package className="w-5 h-5" />;
      case 'shipped': return <Truck className="w-5 h-5" />;
      case 'delivered': return <CheckCircle className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateEstimatedDelivery = (order) => {
    if (order.isDelivered) return 'Delivered';
    if (order.orderStatus === 'cancelled') return 'Cancelled';
    
    const orderDate = new Date(order.createdAt);
    const estimatedDays = order.shippingMethod?.estimatedDays || 7;
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
    
    return deliveryDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const canCancelOrder = (orderStatus) => {
    return ['pending', 'confirmed'].includes(orderStatus?.toLowerCase());
  };

  const canReorder = (orderStatus) => {
    return ['delivered', 'cancelled'].includes(orderStatus?.toLowerCase());
  };

  const canReview = (order) => {
    return order.orderStatus?.toLowerCase() === 'delivered' && !order.reviewed;
  };

  // Filter and sort orders
  const filteredOrders = userOrders.filter(order => {
    const matchesSearch = order.trackingNumber?.toLowerCase().includes(searchInput.toLowerCase()) ||
                         order._id?.toLowerCase().includes(searchInput.toLowerCase()) ||
                         order.orderItems?.some(item => item.name?.toLowerCase().includes(searchInput.toLowerCase()));
    
    const matchesTab = activeTab === 'all' || order.orderStatus?.toLowerCase() === activeTab;
    
    const matchesDateRange = (!dateRange.start || new Date(order.createdAt) >= new Date(dateRange.start)) &&
                             (!dateRange.end || new Date(order.createdAt) <= new Date(dateRange.end));
    
    const matchesPriceRange = (!priceRange.min || order.orderSummary?.totalAmount >= Number(priceRange.min)) &&
                              (!priceRange.max || order.orderSummary?.totalAmount <= Number(priceRange.max));
    
    return matchesSearch && matchesTab && matchesDateRange && matchesPriceRange;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'price-high':
        return (b.orderSummary?.totalAmount || 0) - (a.orderSummary?.totalAmount || 0);
      case 'price-low':
        return (a.orderSummary?.totalAmount || 0) - (b.orderSummary?.totalAmount || 0);
      default:
        return 0;
    }
  });

  // Order statistics
  const orderStats = {
    total: userOrders.length,
    pending: userOrders.filter(o => o.orderStatus === 'pending').length,
    delivered: userOrders.filter(o => o.orderStatus === 'delivered').length,
    cancelled: userOrders.filter(o => o.orderStatus === 'cancelled').length,
    totalSpent: userOrders.reduce((sum, o) => sum + (o.orderSummary?.totalAmount || 0), 0)
  };

  // Order Timeline Component
  const OrderTimeline = ({ order }) => {
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statuses.indexOf(order.orderStatus?.toLowerCase());
    
    if (order.orderStatus?.toLowerCase() === 'cancelled') {
      return (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-center gap-3 text-red-600">
            <XCircle className="w-8 h-8" />
            <div>
              <p className="font-bold text-lg">Order Cancelled</p>
              <p className="text-sm">This order has been cancelled</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          Order Progress
        </h3>
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
              style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
            />
          </div>

          {/* Status Points */}
          <div className="relative flex justify-between">
            {statuses.map((status, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              
              return (
                <div key={status} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 border-white shadow-lg scale-110' 
                      : 'bg-white border-gray-300'
                  } ${isCurrent ? 'animate-pulse' : ''}`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <p className={`mt-3 text-xs font-medium capitalize ${
                    isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {status}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estimated Delivery */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-gray-700">Estimated Delivery:</span>
            </div>
            <span className="font-bold text-orange-600">{calculateEstimatedDelivery(order)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Review Modal Component
  const ReviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-6 h-6" />
              Rate Your Order
            </h3>
            <button onClick={() => setShowReviewModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewData({ ...reviewData, rating: star })}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-8 h-8 ${star <= reviewData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
            <textarea
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
              placeholder="Share your experience with this order..."
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={submitReview}
            disabled={submittingReview}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {submittingReview ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Order Details Modal Component
  const OrderModal = ({ order, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h2 className="text-2xl font-bold">Order Details</h2>
              <p className="text-orange-100">#{order.trackingNumber || order._id}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => printOrder(order)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
                title="Print Order"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button 
                onClick={() => downloadInvoice(order)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
                title="Download Invoice"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Order Timeline */}
          <OrderTimeline order={order} />

          {/* Order Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <p className={`font-bold ${order.isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                    {order.isPaid ? 'Paid' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-lg">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery Status</p>
                  <p className={`font-bold ${order.isDelivered ? 'text-green-600' : 'text-orange-600'}`}>
                    {order.isDelivered ? 'Delivered' : 'In Transit'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Items</p>
                  <p className="font-bold text-purple-600">{order.orderItems?.length || 0} Products</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl border-2 border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                Order Items
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {order.orderItems?.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>Qty: {item.quantity}</span>
                      <span>•</span>
                      <span>{formatPrice(item.price)} each</span>
                    </div>
                  </div>
                  <p className="font-bold text-lg text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Information */}
          {order.shippingInfo && (
            <div className="bg-white rounded-xl border-2 border-gray-200">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  Shipping Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-semibold text-gray-900">{order.shippingInfo.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">{order.shippingInfo.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold text-gray-900">{order.shippingInfo.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Home className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-semibold text-gray-900">{order.shippingInfo.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">City & State</p>
                        <p className="font-semibold text-gray-900">
                          {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.postalCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPinned className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Country</p>
                        <p className="font-semibold text-gray-900">{order.shippingInfo.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-white rounded-xl border-2 border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Order Summary
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatPrice(order.orderSummary?.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span className="font-semibold">{formatPrice(order.orderSummary?.shippingCost)}</span>
                </div>
                {order.orderSummary?.tax > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Tax</span>
                    <span className="font-semibold">{formatPrice(order.orderSummary?.tax)}</span>
                  </div>
                )}
                {order.orderSummary?.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Discount
                    </span>
                    <span className="font-semibold">-{formatPrice(order.orderSummary?.discount)}</span>
                  </div>
                )}
                <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    {formatPrice(order.orderSummary?.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-700">Payment Method:</span>
                  <span className="font-bold text-blue-600 capitalize">
                    {order.paymentMethod?.type?.replace('_', ' ') || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {(order.notes || order.promoCode) && (
            <div className="space-y-4">
              {order.notes && (
                <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">Order Notes</h4>
                      <p className="text-yellow-700">{order.notes}</p>
                    </div>
                  </div>
                </div>
              )}
              {order.promoCode && (
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Promo Code Applied:</span>
                    <span className="font-bold text-green-600 font-mono">{order.promoCode}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-200">
            {canCancelOrder(order.orderStatus) && (
              <button 
                onClick={() => {
                  onClose();
                  cancelOrder(order._id);
                }}
                disabled={cancelLoading === order._id}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-semibold transition-all hover:shadow-lg"
              >
                {cancelLoading === order._id ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span>{cancelLoading === order._id ? 'Cancelling...' : 'Cancel Order'}</span>
              </button>
            )}
            
            {canReorder(order.orderStatus) && (
              <button 
                onClick={() => {
                  onClose();
                  handleReorder(order);
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg flex items-center gap-2 font-semibold transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reorder</span>
              </button>
            )}
            
            {canReview(order) && (
              <button 
                onClick={() => {
                  setReviewData({ ...reviewData, orderId: order._id });
                  setShowReviewModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:shadow-lg flex items-center gap-2 font-semibold transition-all"
              >
                <Star className="w-5 h-5" />
                <span>Write Review</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
            Track My Orders
          </h1>
          <p className="text-gray-600">Monitor your order status and delivery progress in real-time</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
                <p className="text-xs text-gray-600">Total Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border-2 border-yellow-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{orderStats.pending}</p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border-2 border-green-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{orderStats.delivered}</p>
                <p className="text-xs text-gray-600">Delivered</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border-2 border-red-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{orderStats.cancelled}</p>
                <p className="text-xs text-gray-600">Cancelled</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 border-2 border-orange-300 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatPrice(orderStats.totalSpent)}</p>
                <p className="text-xs text-orange-100">Total Spent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filter, and Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order number or product name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
            </select>

            {/* Action Buttons */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 font-semibold transition-all"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button 
              onClick={getUserOrders}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2 font-semibold transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button 
              onClick={exportToCSV}
              disabled={filteredOrders.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-semibold transition-all hover:shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="pt-4 border-t-2 border-gray-200 space-y-4 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setDateRange({ start: '', end: '' });
                  setPriceRange({ min: '', max: '' });
                  setSearchInput('');
                  setActiveTab('all');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap capitalize font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-white rounded-2xl shadow-lg border-2 border-orange-200">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto text-orange-500 mb-4" />
              <p className="text-gray-600 font-medium">Loading your orders...</p>
            </div>
          </div>
        )}

        {/* Orders List */}
        {!loading && (
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-16 text-center border-2 border-gray-200">
                <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Orders Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchInput || dateRange.start || priceRange.min 
                    ? 'No orders match your search criteria. Try adjusting your filters.' 
                    : 'You haven\'t placed any orders yet. Start shopping now!'}
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-600">
                    Showing <span className="font-bold text-gray-900">{filteredOrders.length}</span> order{filteredOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {filteredOrders.map((order) => (
                  <div 
                    key={order._id} 
                    className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300 border-2 border-gray-200 hover:border-orange-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <h3 className="text-xl font-bold text-gray-900">
                            #{order.trackingNumber || order._id.slice(-8)}
                          </h3>
                          <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 border-2 ${getStatusColor(order.orderStatus)}`}>
                            {getStatusIcon(order.orderStatus)}
                            <span className="capitalize">{order.orderStatus}</span>
                          </div>
                          {order.isPaid && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-300">
                              PAID
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-500">Order Date</p>
                              <p className="font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-500">Total Amount</p>
                              <p className="font-semibold text-gray-900">{formatPrice(order.orderSummary?.totalAmount)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <Package className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-500">Items</p>
                              <p className="font-semibold text-gray-900">{order.orderItems?.length || 0} product(s)</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <Truck className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-500">Delivery</p>
                              <p className="font-semibold text-gray-900">{calculateEstimatedDelivery(order)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={() => getOrderById(order._id)}
                          className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-semibold transition-all hover:border-orange-500 hover:text-orange-600"
                        >
                          <Eye className="w-5 h-5" />
                          <span>View Details</span>
                        </button>
                        
                        {canCancelOrder(order.orderStatus) && (
                          <button 
                            onClick={() => cancelOrder(order._id)}
                            disabled={cancelLoading === order._id}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-semibold transition-all hover:shadow-lg"
                          >
                            {cancelLoading === order._id ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                            <span>{cancelLoading === order._id ? 'Cancelling...' : 'Cancel'}</span>
                          </button>
                        )}

                        {canReorder(order.orderStatus) && (
                          <button 
                            onClick={() => handleReorder(order)}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg flex items-center gap-2 font-semibold transition-all"
                          >
                            <RotateCcw className="w-5 h-5" />
                            <span>Reorder</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Modals */}
        {selectedOrder && (
          <OrderModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}

        {showReviewModal && <ReviewModal />}
      </div>
    </div>
  );
};

export default TrackOrder;
