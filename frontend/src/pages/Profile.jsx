import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  FiUser, FiMail, FiShield, FiCalendar, FiEdit2, FiSave, FiX, FiCamera, FiTrash2,
  FiShoppingBag, FiHeart, FiSettings, FiLogOut, FiClock, FiPackage, FiTruck,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiMapPin, FiDollarSign, FiEye,
  FiShoppingCart, FiStar, FiAward, FiMonitor, FiLock, FiEyeOff, FiActivity
} from 'react-icons/fi';

const Profile = () => {
  const { logoutUser, setUser: setAuthUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null); // Store selected file

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const [userRes, ordersRes, wishlistRes] = await Promise.all([
        axios.get(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/users/wishlist`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUser(userRes.data);
      setOrders(ordersRes.data.data || []);
      setWishlist(wishlistRes.data || []);
      setEditForm({
        name: userRes.data.name,
        email: userRes.data.email,
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl text-white ${
      type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'
    }`;
    toast.innerHTML = `<div class="flex items-center gap-3">${type === 'success' ? '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'}<span class="font-medium">${message}</span></div>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast(`Invalid file type: ${file.type}. Only JPEG, PNG, GIF, WEBP allowed`, 'error');
      console.error('Invalid file type:', file.type);
      return;
    }

    // Store file for later upload
    setSelectedAvatarFile(file);

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('Preview loaded');
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // First, upload avatar if selected
      let avatarUrl = user.avatar;
      if (selectedAvatarFile) {
        console.log('Uploading avatar...');
        const formData = new FormData();
        formData.append('avatar', selectedAvatarFile);
        
        const avatarResponse = await axios.post(`${API_URL}/api/users/avatar`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (avatarResponse.data.success) {
          avatarUrl = avatarResponse.data.avatar;
          console.log('Avatar uploaded:', avatarUrl);
        }
      }
      
      // Then update profile data
      const updateData = { name: editForm.name, email: editForm.email };

      if (editForm.newPassword) {
        if (editForm.newPassword !== editForm.confirmPassword) {
          showToast('Passwords do not match', 'error');
          return;
        }
        if (editForm.newPassword.length < 6) {
          showToast('Password must be at least 6 characters', 'error');
          return;
        }
        updateData.password = editForm.newPassword;
      }

      const response = await axios.put(`${API_URL}/api/users/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update user with new data and avatar
      const updatedUser = { ...response.data, avatar: avatarUrl };
      setUser(updatedUser);
      
      // Update AuthContext (global state)
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const updatedStoredUser = { ...storedUser, ...response.data, avatar: avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedStoredUser));
      setAuthUser(updatedStoredUser);
      
      setShowEditModal(false);
      setAvatarPreview(null);
      setSelectedAvatarFile(null);
      showToast('Profile updated successfully!');
      setEditForm(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/products/${productId}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlist(wishlist.filter(item => item._id !== productId));
      showToast('Removed from wishlist');
    } catch (error) {
      showToast('Failed to remove from wishlist', 'error');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/cart`, 
        { productId: product._id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Added to cart!');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to add to cart', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    logoutUser(); // Update AuthContext
    showToast('Logged out successfully');
    setTimeout(() => navigate('/login'), 1000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/users/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Immediate logout
      localStorage.clear();
      logoutUser(); // Update AuthContext immediately
      showToast('Account deleted successfully');
      
      // Navigate after a short delay for toast to show
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      showToast('Failed to delete account', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FiClock className="w-4 h-4" />,
      confirmed: <FiCheckCircle className="w-4 h-4" />,
      processing: <FiPackage className="w-4 h-4" />,
      shipped: <FiTruck className="w-4 h-4" />,
      delivered: <FiCheckCircle className="w-4 h-4" />,
      cancelled: <FiXCircle className="w-4 h-4" />
    };
    return icons[status] || <FiClock className="w-4 h-4" />;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getRelativeTime = (date) => {
    if (!date) return 'First time login';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    return formatDate(date);
  };

  const getDaysSinceMember = () => {
    if (!user?.createdAt) return 0;
    const days = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getTotalSpent = () => {
    return orders
      .filter(order => order.orderStatus === 'delivered')
      .reduce((sum, order) => sum + (order.orderSummary?.totalAmount || 0), 0);
  };

  const getAccountBadge = () => {
    const days = getDaysSinceMember();
    if (days < 30) return { label: 'New Member', color: 'bg-blue-100 text-blue-700', icon: '🌟' };
    if (days < 180) return { label: 'Regular Member', color: 'bg-green-100 text-green-700', icon: '⭐' };
    return { label: 'Veteran Member', color: 'bg-purple-100 text-purple-700', icon: '👑' };
  };

  const getOrderStats = () => {
    const pending = orders.filter(o => o.orderStatus === 'pending').length;
    const delivered = orders.filter(o => o.orderStatus === 'delivered').length;
    const cancelled = orders.filter(o => o.orderStatus === 'cancelled').length;
    return { pending, delivered, cancelled };
  };

  const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.orderStatus === orderFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-50 py-4 md:py-8 px-3 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500 to-red-500 opacity-10 rounded-full -mr-32 -mt-32"></div>
          
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-lg overflow-hidden">
                {user.avatar ? (
                  <img 
                    src={`${API_URL}${user.avatar}`} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              {user.isEmailVerified && (
                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1.5 md:p-2 shadow-lg">
                  <FiCheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">{user.name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  {user.role === 'admin' && (
                    <span className="px-2 md:px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                      <FiShield className="w-3 h-3" /> ADMIN
                    </span>
                  )}
                  {user.isEmailVerified && (
                    <span className="px-2 md:px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {user.twoFactorEnabled && (
                    <span className="px-2 md:px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                      <FiLock className="w-3 h-3" /> 2FA
                    </span>
                  )}
                  <span className={`px-2 md:px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${getAccountBadge().color}`}>
                    <span>{getAccountBadge().icon}</span> {getAccountBadge().label}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm md:text-base mb-2 flex items-center justify-center md:justify-start gap-2">
                <FiMail className="w-4 h-4" />
                {user.email}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" />
                  Joined {formatDate(user.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <FiClock className="w-4 h-4" />
                  Last login: {getRelativeTime(user.lastLogin)}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm md:text-base"
            >
              <FiEdit2 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 lg:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <FiShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-xs md:text-sm text-gray-500">Total Orders</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 lg:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <FiHeart className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{user.wishlistCount || 0}</p>
            <p className="text-xs md:text-sm text-gray-500">Wishlist Items</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 lg:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <FiDollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Rs. {getTotalSpent().toLocaleString()}</p>
            <p className="text-xs md:text-sm text-gray-500">Total Spent</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 lg:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <FiAward className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{getDaysSinceMember()}</p>
            <p className="text-xs md:text-sm text-gray-500">Days as Member</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: FiUser },
              { id: 'orders', label: 'Orders', icon: FiShoppingBag },
              { id: 'wishlist', label: 'Wishlist', icon: FiHeart },
              { id: 'security', label: 'Security', icon: FiShield },
              { id: 'settings', label: 'Settings', icon: FiSettings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-semibold transition-all text-sm md:text-base ${
                  activeTab === tab.id
                    ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                    : 'text-gray-600 hover:text-orange-500 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 lg:p-8">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Account Overview</h2>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <button
                  onClick={() => setActiveTab('orders')}
                  className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-lg transition-all group"
                >
                  <FiShoppingBag className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-semibold text-gray-900">View Orders</p>
                  <p className="text-xs text-gray-500">{orders.length} orders</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('wishlist')}
                  className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl hover:shadow-lg transition-all group"
                >
                  <FiHeart className="w-8 h-8 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-semibold text-gray-900">Wishlist</p>
                  <p className="text-xs text-gray-500">{user.wishlistCount || 0} items</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('security')}
                  className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-lg transition-all group"
                >
                  <FiShield className="w-8 h-8 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-semibold text-gray-900">Security</p>
                  <p className="text-xs text-gray-500">{user.securityLogs?.length || 0} logs</p>
                </button>
                
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-lg transition-all group"
                >
                  <FiEdit2 className="w-8 h-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-semibold text-gray-900">Edit Profile</p>
                  <p className="text-xs text-gray-500">Update info</p>
                </button>
              </div>
              
              {/* Order Statistics */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 md:p-6 mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiPackage className="w-5 h-5 text-indigo-500" />
                  Order Statistics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-yellow-600">{getOrderStats().pending}</p>
                    <p className="text-xs md:text-sm text-gray-600">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-green-600">{getOrderStats().delivered}</p>
                    <p className="text-xs md:text-sm text-gray-600">Delivered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-red-600">{getOrderStats().cancelled}</p>
                    <p className="text-xs md:text-sm text-gray-600">Cancelled</p>
                  </div>
                </div>
              </div>
              
              {/* Account Information */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiUser className="w-5 h-5 text-orange-500" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Full Name</p>
                    <p className="text-sm md:text-base font-semibold text-gray-900">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Email Address</p>
                    <p className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2">
                      {user.email}
                      {user.isEmailVerified && <FiCheckCircle className="w-4 h-4 text-green-500" />}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Account Role</p>
                    <p className="text-sm md:text-base font-semibold text-gray-900 uppercase">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Join Date</p>
                    <p className="text-sm md:text-base font-semibold text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Last Login</p>
                    <p className="text-sm md:text-base font-semibold text-gray-900">{getRelativeTime(user.lastLogin)}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Account Status</p>
                    <p className="text-sm md:text-base font-semibold text-gray-900">
                      {user.isActive ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <FiCheckCircle className="w-4 h-4" /> Active
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <FiXCircle className="w-4 h-4" /> Inactive
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Overview */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiShield className="w-5 h-5 text-blue-500" />
                  Security Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Email Verification</p>
                    <p className="text-sm md:text-base font-semibold">
                      {user.isEmailVerified ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <FiCheckCircle className="w-4 h-4" /> Verified
                        </span>
                      ) : (
                        <span className="text-yellow-600 flex items-center gap-1">
                          <FiAlertCircle className="w-4 h-4" /> Not Verified
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Two-Factor Authentication</p>
                    <p className="text-sm md:text-base font-semibold">
                      {user.twoFactorEnabled ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <FiLock className="w-4 h-4" /> Enabled
                        </span>
                      ) : (
                        <span className="text-gray-600 flex items-center gap-1">
                          <FiLock className="w-4 h-4" /> Disabled
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Google OAuth</p>
                    <p className="text-sm md:text-base font-semibold">
                      {user.googleId ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <FiCheckCircle className="w-4 h-4" /> Connected
                        </span>
                      ) : (
                        <span className="text-gray-600 flex items-center gap-1">
                          <FiXCircle className="w-4 h-4" /> Not Connected
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Active Sessions</p>
                    <p className="text-sm md:text-base font-semibold text-gray-900">{user.activeSessions || 0} sessions</p>
                  </div>
                </div>
              </div>

              {/* Account Statistics */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiActivity className="w-5 h-5 text-green-500" />
                  Account Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{orders.length}</p>
                    <p className="text-xs md:text-sm text-gray-500">Total Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{user.wishlistCount || 0}</p>
                    <p className="text-xs md:text-sm text-gray-500">Wishlist</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">Rs. {getTotalSpent().toLocaleString()}</p>
                    <p className="text-xs md:text-sm text-gray-500">Total Spent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{getDaysSinceMember()}</p>
                    <p className="text-xs md:text-sm text-gray-500">Days Member</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity Timeline */}
              {user.securityLogs && user.securityLogs.length > 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiClock className="w-5 h-5 text-gray-500" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {user.securityLogs.slice(-5).reverse().map((log, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                          <p className="text-xs text-gray-500">{getRelativeTime(log.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('security')}
                    className="mt-4 text-sm text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1"
                  >
                    View all activity <FiActivity className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">My Orders</h2>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => setOrderFilter(status)}
                      className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-all ${
                        orderFilter === status
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FiShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm md:text-base">No orders found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <div key={order._id} className="border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                          <p className="font-bold text-gray-900 text-sm md:text-base">Order #{order.trackingNumber}</p>
                          <p className="text-xs md:text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(order.orderStatus)}`}>
                          {getStatusIcon(order.orderStatus)}
                          {order.orderStatus.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Items</p>
                          <p className="text-sm font-semibold text-gray-900">{order.orderItems?.length || 0} items</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                          <p className="text-sm font-semibold text-gray-900">Rs. {order.orderSummary?.totalAmount?.toLocaleString() || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Shipping</p>
                          <p className="text-sm font-semibold text-gray-900">{order.shippingMethod?.name || 'N/A'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/order/${order._id}`)}
                        className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">My Wishlist</h2>
              
              {wishlist.length === 0 ? (
                <div className="text-center py-12">
                  <FiHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm md:text-base">Your wishlist is empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {wishlist.map(product => (
                    <div key={product._id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={product.images?.[0] || '/placeholder.jpg'}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base line-clamp-2">{product.name}</h3>
                        <p className="text-lg md:text-xl font-bold text-orange-500 mb-4">Rs. {product.price?.toLocaleString()}</p>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="flex-1 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-xs md:text-sm flex items-center justify-center gap-1"
                          >
                            <FiShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </button>
                          <button
                            onClick={() => handleRemoveFromWishlist(product._id)}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Security & Activity</h2>
              
              {/* Security Logs */}
              <div className="bg-gray-50 rounded-xl p-4 md:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiActivity className="w-5 h-5 text-orange-500" />
                  Recent Activity (Last 10)
                </h3>
                
                {user.securityLogs && user.securityLogs.length > 0 ? (
                  <div className="space-y-3">
                    {user.securityLogs.slice(-10).reverse().map((log, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm md:text-base">{log.action}</p>
                            <p className="text-xs md:text-sm text-gray-500 mt-1">IP: {log.ip}</p>
                            <p className="text-xs text-gray-400 mt-1">{log.userAgent}</p>
                          </div>
                          <p className="text-xs text-gray-500 whitespace-nowrap">{getRelativeTime(log.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No security logs available</p>
                )}
              </div>

              {/* Active Sessions */}
              <div className="bg-gray-50 rounded-xl p-4 md:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiMonitor className="w-5 h-5 text-blue-500" />
                  Active Sessions
                </h3>
                <p className="text-gray-600 text-sm md:text-base">You have {user.activeSessions || 0} active session(s)</p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Account Settings</h2>
              
              {/* Logout */}
              <div className="bg-gray-50 rounded-xl p-4 md:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Logout</h3>
                <p className="text-gray-600 mb-4 text-sm md:text-base">Sign out from your account</p>
                <button
                  onClick={handleLogout}
                  className="px-4 md:px-6 py-2 md:py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-all flex items-center gap-2 text-sm md:text-base"
                >
                  <FiLogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>

              {/* Delete Account */}
              <div className="bg-red-50 rounded-xl p-4 md:p-6 border-2 border-red-200">
                <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5" />
                  Danger Zone
                </h3>
                <p className="text-red-700 mb-4 text-sm md:text-base">
                  Once you delete your account, there is no going back. All your data will be permanently deleted.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 md:px-6 py-2 md:py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center gap-2 text-sm md:text-base"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-red-900 mb-2">
                        Type "DELETE" to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:border-red-500 text-sm md:text-base"
                        placeholder="DELETE"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE'}
                        className="px-4 md:px-6 py-2 md:py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        className="px-4 md:px-6 py-2 md:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm md:text-base"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 md:p-6 flex justify-between items-center">
              <h3 className="text-xl md:text-2xl font-bold">Edit Profile</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setAvatarPreview(null);
                  setSelectedAvatarFile(null);
                }}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : user.avatar ? (
                      <img 
                        src={`${API_URL}${user.avatar}`} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100 transition-all">
                    <FiCamera className="w-5 h-5 text-gray-700" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs md:text-sm text-gray-500">Click camera icon to change avatar</p>
                <p className="text-xs text-gray-400 mt-1">Max size: 5MB (JPEG, PNG, GIF, WEBP)</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 md:py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 text-sm md:text-base"
                  placeholder="Enter your name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 md:py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 text-sm md:text-base"
                  placeholder="Enter your email"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 md:py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 pr-12 text-sm md:text-base"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              {editForm.newPassword && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 md:py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 text-sm md:text-base"
                    placeholder="Confirm new password"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateProfile}
                  className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <FiSave className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setAvatarPreview(null);
                    setSelectedAvatarFile(null);
                  }}
                  className="px-4 md:px-6 py-2 md:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm md:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
