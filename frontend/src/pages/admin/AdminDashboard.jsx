import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import axios from 'axios';
import {
  LayoutDashboard, Users, Package, ShoppingBag, BarChart3,
  Settings, LogOut, Menu, X, TrendingUp, DollarSign,
  ShoppingCart, AlertCircle, Eye, Edit, Trash2, Search,
  Filter, Download, Plus, ChevronLeft, ChevronRight,
  Bell, User, Clock, CheckCircle, XCircle, Truck, Zap,
  Mail, FileText, Database, RefreshCw, Trash, Send,
  UserPlus, PackagePlus, ShoppingBagIcon, Activity,
  TrendingDown, AlertTriangle, Info, CheckCheck
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logoutUser } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  });
  
  // Data
  const [recentOrders, setRecentOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all'); // all, low-stock, out-of-stock
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [stockRange, setStockRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price-low, price-high, stock-low, stock-high
  const [userStatus, setUserStatus] = useState('all'); // all, active, inactive
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentOrdersPage, setCurrentOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [currentUsersPage, setCurrentUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  
  // Modals
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [showBulkDiscountModal, setShowBulkDiscountModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);
  const [bulkDiscountValue, setBulkDiscountValue] = useState('');
  const [bulkDiscountType, setBulkDiscountType] = useState('percentage'); // percentage or fixed
  const [bulkEditField, setBulkEditField] = useState('price');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [bulkOrderStatus, setBulkOrderStatus] = useState('confirmed');
  
  // Advanced Features
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  useEffect(() => {
    // Generate notifications when data is loaded
    if (orders.length > 0 || products.length > 0 || users.length > 0) {
      generateNotifications();
    }
  }, [orders, products, users, stats]);

  const generateNotifications = () => {
    const notifs = [];
    const now = new Date();
    
    // Pending orders notification
    const pendingCount = orders.filter(o => o.orderStatus === 'pending').length;
    if (pendingCount > 0) {
      notifs.push({
        id: `pending-orders-${Date.now()}`,
        type: 'warning',
        title: `${pendingCount} Pending Order${pendingCount > 1 ? 's' : ''}`,
        message: `You have ${pendingCount} order${pendingCount > 1 ? 's' : ''} waiting for confirmation`,
        time: new Date(now - 5 * 60000),
        read: false,
        icon: 'AlertTriangle',
        action: () => {
          setActiveTab('orders');
          setOrderFilter('pending');
        }
      });
    }
    
    // Low stock notification - FIXED: Show only low stock products
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10);
    if (lowStockProducts.length > 0) {
      notifs.push({
        id: `low-stock-${Date.now()}`,
        type: 'error',
        title: 'Low Stock Alert',
        message: `${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's are' : ' is'} running low: ${lowStockProducts.map(p => p.name).slice(0, 3).join(', ')}${lowStockProducts.length > 3 ? '...' : ''}`,
        time: new Date(now - 15 * 60000),
        read: false,
        icon: 'Package',
        action: () => {
          setActiveTab('products');
          setProductFilter('low-stock'); // Filter to show only low stock
        }
      });
    }
    
    // Out of stock notification
    const outOfStock = products.filter(p => p.stock === 0);
    if (outOfStock.length > 0) {
      notifs.push({
        id: `out-of-stock-${Date.now()}`,
        type: 'error',
        title: 'Out of Stock Alert',
        message: `${outOfStock.length} product${outOfStock.length > 1 ? 's are' : ' is'} out of stock: ${outOfStock.map(p => p.name).slice(0, 3).join(', ')}${outOfStock.length > 3 ? '...' : ''}`,
        time: new Date(now - 20 * 60000),
        read: false,
        icon: 'AlertCircle',
        action: () => {
          setActiveTab('products');
          setProductFilter('out-of-stock');
        }
      });
    }
    
    // New users notification
    const today = new Date().setHours(0, 0, 0, 0);
    const newUsers = users.filter(u => new Date(u.createdAt) >= today);
    if (newUsers.length > 0) {
      notifs.push({
        id: `new-users-${Date.now()}`,
        type: 'success',
        title: 'New Users Joined',
        message: `${newUsers.length} new user${newUsers.length > 1 ? 's' : ''} registered today`,
        time: new Date(now - 30 * 60000),
        read: false,
        icon: 'UserPlus',
        action: () => {
          setActiveTab('users');
          setUserStatus('all');
        }
      });
    }
    
    // Inactive users notification
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const inactiveUsers = users.filter(u => u.lastLogin && new Date(u.lastLogin) < thirtyDaysAgo);
    if (inactiveUsers.length > 5) {
      notifs.push({
        id: `inactive-users-${Date.now()}`,
        type: 'warning',
        title: 'Inactive Users',
        message: `${inactiveUsers.length} users haven't logged in for 30+ days`,
        time: new Date(now - 45 * 60000),
        read: false,
        icon: 'User',
        action: () => {
          setActiveTab('users');
          setUserStatus('inactive');
        }
      });
    }
    
    // Revenue milestone
    if (stats.totalRevenue > 50000) {
      notifs.push({
        id: `revenue-milestone-${Date.now()}`,
        type: 'success',
        title: 'Revenue Milestone',
        message: `Total revenue reached Rs. ${stats.totalRevenue.toLocaleString()}`,
        time: new Date(now - 60 * 60000),
        read: true,
        icon: 'TrendingUp',
        action: () => setActiveTab('analytics')
      });
    }
    
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.read).length);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all products with pagination disabled (get all for admin)
      const productsRes = await axios.get(`${API_URL}/api/products?limit=1000`);
      
      const [ordersRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/orders/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const ordersData = ordersRes.data.data || [];
      const usersData = usersRes.data || [];
      const productsData = productsRes.data.products || [];

      setOrders(ordersData);
      setUsers(usersData);
      setProducts(productsData);
      setRecentOrders(ordersData.slice(0, 10));

      // Calculate stats
      const totalRevenue = ordersData
        .filter(o => o.orderStatus === 'delivered')
        .reduce((sum, o) => sum + (o.orderSummary?.totalAmount || 0), 0);
      
      const pendingOrders = ordersData.filter(o => o.orderStatus === 'pending').length;
      const lowStock = productsData.filter(p => p.stock < 10).length;

      setStats({
        totalRevenue,
        totalOrders: ordersData.length,
        totalUsers: usersData.length,
        totalProducts: productsData.length,
        pendingOrders,
        lowStockProducts: lowStock
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  // Order Handlers
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setOrders(orders.map(o => 
        o._id === orderId ? { ...o, orderStatus: newStatus } : o
      ));
      setRecentOrders(recentOrders.map(o => 
        o._id === orderId ? { ...o, orderStatus: newStatus } : o
      ));
      
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleViewOrder = (order) => {
    setViewingOrder(order);
  };

  // User Handlers
  const handleViewUser = (user) => {
    setViewingUser(user);
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(users.filter(u => u._id !== userId));
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  // Product Handlers
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddProduct(true);
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProducts(products.filter(p => p._id !== productId));
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (editingProduct) {
        // Update existing product
        const response = await axios.put(
          `${API_URL}/api/products/${editingProduct._id}`,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setProducts(products.map(p => 
          p._id === editingProduct._id ? response.data : p
        ));
        alert('Product updated successfully!');
      } else {
        // Create new product
        const response = await axios.post(
          `${API_URL}/api/products`,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setProducts([response.data, ...products]);
        alert('Product created successfully!');
      }
      
      setShowAddProduct(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  // Quick Actions Handlers
  const quickActions = [
    {
      id: 'new-order',
      title: 'Create Order',
      description: 'Manually create a new order',
      icon: 'ShoppingBag',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      action: () => {
        alert('Create Order feature - Coming soon!');
        setShowQuickActions(false);
      }
    },
    {
      id: 'add-product',
      title: 'Add Product',
      description: 'Add a new product quickly',
      icon: 'PackagePlus',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      action: () => {
        setShowAddProduct(true);
        setShowQuickActions(false);
      }
    },
    {
      id: 'send-notification',
      title: 'Send Notification',
      description: 'Notify all users',
      icon: 'Send',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      action: () => {
        alert('Send Notification feature - Coming soon!');
        setShowQuickActions(false);
      }
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create sales report',
      icon: 'FileText',
      gradient: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
      action: () => {
        alert('Generate Report feature - Coming soon!');
        setShowQuickActions(false);
      }
    },
    {
      id: 'bulk-email',
      title: 'Bulk Email',
      description: 'Send email to customers',
      icon: 'Mail',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
      action: () => {
        alert('Bulk Email feature - Coming soon!');
        setShowQuickActions(false);
      }
    },
    {
      id: 'refresh-data',
      title: 'Refresh Data',
      description: 'Reload all dashboard data',
      icon: 'RefreshCw',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      action: async () => {
        setShowQuickActions(false);
        await fetchDashboardData();
        alert('Data refreshed successfully!');
      }
    }
  ];

  const getIconComponent = (iconName) => {
    const icons = {
      AlertTriangle, Package, UserPlus, TrendingUp, Info,
      ShoppingBag, PackagePlus, Send, FileText, Mail, RefreshCw,
      User, AlertCircle
    };
    return icons[iconName] || Info;
  };

  // Advanced filtering and sorting functions
  const getFilteredAndSortedProducts = () => {
    let filtered = [...products];
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply product filter
    if (productFilter === 'low-stock') {
      filtered = filtered.filter(p => p.stock > 0 && p.stock < 10);
    } else if (productFilter === 'out-of-stock') {
      filtered = filtered.filter(p => p.stock === 0);
    } else if (productFilter === 'in-stock') {
      filtered = filtered.filter(p => p.stock >= 10);
    }
    
    // Apply price range
    filtered = filtered.filter(p => 
      p.price >= priceRange.min && p.price <= priceRange.max
    );
    
    // Apply stock range
    filtered = filtered.filter(p => 
      p.stock >= stockRange.min && p.stock <= stockRange.max
    );
    
    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'stock-low':
        filtered.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock-high':
        filtered.sort((a, b) => b.stock - a.stock);
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    
    return filtered;
  };

  // Pagination for Products
  const getPaginatedProducts = () => {
    const filtered = getFilteredAndSortedProducts();
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalProductPages = () => {
    return Math.ceil(getFilteredAndSortedProducts().length / itemsPerPage);
  };

  const handleProductPageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pagination for Orders
  const getPaginatedOrders = () => {
    const filtered = orders.filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = orderFilter === 'all' || order.orderStatus === orderFilter;
      return matchesSearch && matchesFilter;
    });
    
    const indexOfLastItem = currentOrdersPage * ordersPerPage;
    const indexOfFirstItem = indexOfLastItem - ordersPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalOrderPages = () => {
    const filtered = orders.filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = orderFilter === 'all' || order.orderStatus === orderFilter;
      return matchesSearch && matchesFilter;
    });
    return Math.ceil(filtered.length / ordersPerPage);
  };

  const handleOrderPageChange = (pageNumber) => {
    setCurrentOrdersPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pagination for Users
  const getPaginatedUsers = () => {
    const filtered = getFilteredUsers();
    const indexOfLastItem = currentUsersPage * usersPerPage;
    const indexOfFirstItem = indexOfLastItem - usersPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalUserPages = () => {
    return Math.ceil(getFilteredUsers().length / usersPerPage);
  };

  const handleUserPageChange = (pageNumber) => {
    setCurrentUsersPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getFilteredUsers = () => {
    let filtered = [...users];
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply role filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(u => u.role === userFilter);
    }
    
    // Apply status filter
    if (userStatus === 'active') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(u => u.lastLogin && new Date(u.lastLogin) >= sevenDaysAgo);
    } else if (userStatus === 'inactive') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(u => !u.lastLogin || new Date(u.lastLogin) < thirtyDaysAgo);
    }
    
    return filtered;
  };

  const getUserStatusBadge = (lastLogin) => {
    if (!lastLogin) return { text: 'Never', color: 'bg-gray-100 text-gray-800' };
    
    const daysSinceLogin = Math.floor((Date.now() - new Date(lastLogin)) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLogin === 0) return { text: 'Active Today', color: 'bg-green-100 text-green-800' };
    if (daysSinceLogin <= 7) return { text: 'Active', color: 'bg-blue-100 text-blue-800' };
    if (daysSinceLogin <= 30) return { text: 'Inactive', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Offline', color: 'bg-red-100 text-red-800' };
  };

  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkAction = (action) => {
    if (selectedItems.length === 0) {
      alert('Please select items first');
      return;
    }
    
    switch (action) {
      case 'delete':
        if (window.confirm(`Delete ${selectedItems.length} selected items?`)) {
          alert(`Bulk delete feature - ${selectedItems.length} items selected`);
        }
        break;
      case 'export':
        alert(`Exporting ${selectedItems.length} items...`);
        break;
      default:
        break;
    }
  };

  // Bulk Product Operations
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllProducts = () => {
    const filteredProducts = getFilteredAndSortedProducts();
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p._id));
    }
  };

  const handleBulkDeleteProducts = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products first');
      return;
    }

    if (!window.confirm(`Delete ${selectedProducts.length} selected product(s)? This cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedProducts.map(id =>
          axios.delete(`${API_URL}/api/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      
      setProducts(products.filter(p => !selectedProducts.includes(p._id)));
      setSelectedProducts([]);
      alert(`Successfully deleted ${selectedProducts.length} product(s)!`);
    } catch (error) {
      console.error('Error deleting products:', error);
      alert('Failed to delete some products');
    }
  };

  const handleBulkDiscount = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products first');
      return;
    }

    if (!bulkDiscountValue || bulkDiscountValue <= 0) {
      alert('Please enter a valid discount value');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updatedProducts = await Promise.all(
        selectedProducts.map(async (id) => {
          const product = products.find(p => p._id === id);
          let newPrice = product.price;
          
          if (bulkDiscountType === 'percentage') {
            newPrice = product.price * (1 - bulkDiscountValue / 100);
          } else {
            newPrice = product.price - bulkDiscountValue;
          }
          
          newPrice = Math.max(0, Math.round(newPrice));
          
          const response = await axios.put(
            `${API_URL}/api/products/${id}`,
            { price: newPrice },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          return response.data;
        })
      );
      
      setProducts(products.map(p => {
        const updated = updatedProducts.find(up => up._id === p._id);
        return updated || p;
      }));
      
      setSelectedProducts([]);
      setBulkDiscountValue('');
      setShowBulkDiscountModal(false);
      alert(`Successfully applied discount to ${selectedProducts.length} product(s)!`);
    } catch (error) {
      console.error('Error applying discount:', error);
      alert('Failed to apply discount to some products');
    }
  };

  const handleBulkEdit = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products first');
      return;
    }

    if (!bulkEditValue) {
      alert('Please enter a value');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updateData = {};
      
      if (bulkEditField === 'price') {
        updateData.price = Number(bulkEditValue);
      } else if (bulkEditField === 'stock') {
        updateData.stock = Number(bulkEditValue);
      } else if (bulkEditField === 'category') {
        updateData.category = bulkEditValue;
      } else if (bulkEditField === 'brand') {
        updateData.brand = bulkEditValue;
      }
      
      const updatedProducts = await Promise.all(
        selectedProducts.map(async (id) => {
          const response = await axios.put(
            `${API_URL}/api/products/${id}`,
            updateData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return response.data;
        })
      );
      
      setProducts(products.map(p => {
        const updated = updatedProducts.find(up => up._id === p._id);
        return updated || p;
      }));
      
      setSelectedProducts([]);
      setBulkEditValue('');
      setShowBulkEditModal(false);
      alert(`Successfully updated ${selectedProducts.length} product(s)!`);
    } catch (error) {
      console.error('Error updating products:', error);
      alert('Failed to update some products');
    }
  };

  // Bulk Order Operations
  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = () => {
    const filteredOrders = orders.filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = orderFilter === 'all' || order.orderStatus === orderFilter;
      return matchesSearch && matchesFilter;
    });
    
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o._id));
    }
  };

  const handleBulkOrderStatusUpdate = async () => {
    if (selectedOrders.length === 0) {
      alert('Please select orders first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedOrders.map(id =>
          axios.put(
            `${API_URL}/api/orders/${id}/status`,
            { status: bulkOrderStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      
      setOrders(orders.map(o => 
        selectedOrders.includes(o._id) ? { ...o, orderStatus: bulkOrderStatus } : o
      ));
      setRecentOrders(recentOrders.map(o => 
        selectedOrders.includes(o._id) ? { ...o, orderStatus: bulkOrderStatus } : o
      ));
      
      setSelectedOrders([]);
      setShowBulkOrderModal(false);
      alert(`Successfully updated ${selectedOrders.length} order(s) to ${bulkOrderStatus}!`);
    } catch (error) {
      console.error('Error updating orders:', error);
      alert('Failed to update some orders');
    }
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrders.length === 0) {
      alert('Please select orders first');
      return;
    }

    if (!window.confirm(`Delete ${selectedOrders.length} selected order(s)? This cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedOrders.map(id =>
          axios.delete(`${API_URL}/api/orders/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      
      setOrders(orders.filter(o => !selectedOrders.includes(o._id)));
      setRecentOrders(recentOrders.filter(o => !selectedOrders.includes(o._id)));
      setSelectedOrders([]);
      alert(`Successfully deleted ${selectedOrders.length} order(s)!`);
    } catch (error) {
      console.error('Error deleting orders:', error);
      alert('Failed to delete some orders');
    }
  };

  // Bulk User Operations
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    const filteredUsers = getFilteredUsers();
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u._id));
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    // Don't allow deleting current user
    if (selectedUsers.includes(user._id)) {
      alert('Cannot delete your own account!');
      return;
    }

    if (!window.confirm(`Delete ${selectedUsers.length} selected user(s)? This cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedUsers.map(id =>
          axios.delete(`${API_URL}/api/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      
      setUsers(users.filter(u => !selectedUsers.includes(u._id)));
      setSelectedUsers([]);
      alert(`Successfully deleted ${selectedUsers.length} user(s)!`);
    } catch (error) {
      console.error('Error deleting users:', error);
      alert('Failed to delete some users');
    }
  };

  const handleBulkExportUsers = () => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    const selectedUserData = users.filter(u => selectedUsers.includes(u._id));
    const exportData = selectedUserData.map(u => ({
      Name: u.name,
      Email: u.email,
      Role: u.role,
      Status: getUserStatusBadge(u.lastLogin).text,
      Joined: formatDate(u.createdAt),
      LastLogin: u.lastLogin ? formatDate(u.lastLogin) : 'Never'
    }));
    
    exportToCSV(exportData, 'selected-users');
    alert(`Exported ${selectedUsers.length} user(s) to CSV!`);
  };

  const markNotificationAsRead = (notifId) => {
    setNotifications(notifications.map(n => 
      n.id === notifId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationColor = (type) => {
    const colors = {
      success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      warning: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
      error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      info: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
    };
    return colors[type] || colors.info;
  };

  // Low Stock Management
  const handleUpdateStock = async (productId, newStock) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/products/${productId}`,
        { stock: newStock },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProducts(products.map(p => 
        p._id === productId ? { ...p, stock: newStock } : p
      ));
      
      alert('Stock updated successfully!');
      generateNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amountInUSD) => {
    // Format in user's selected currency
    return formatPrice(amountInUSD);
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Menu Button - Fixed Top Left */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        ${sidebarOpen ? 'w-64' : 'md:w-20'}
        bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300
        fixed md:sticky top-0 h-screen z-40
        overflow-y-auto
      `}>
        {/* Logo */}
        <div className="p-3 md:p-4 border-b border-gray-700 flex items-center justify-between min-h-[60px]">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src="/logo-shopix-dark.svg" alt="SHOPIX" className="h-6 md:h-8" />
              <span className="font-bold text-base md:text-xl">ADMIN</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:block p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4 md:w-5 md:h-5" /> : <Menu className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2 md:p-4 space-y-1 md:space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all text-sm md:text-base ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-lg'
                  : 'hover:bg-gray-700'
              }`}
            >
              <item.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 w-full p-2 md:p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-red-600 transition-all text-sm md:text-base"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 w-full md:ml-0 min-h-screen">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div className="ml-12 md:ml-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[150px] sm:max-w-none">
                Welcome back, {user.name}
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {/* Quick Actions Button */}
              <div className="relative">
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="p-1.5 md:p-2 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white rounded-lg transition-all relative group"
                  title="Quick Actions"
                >
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-gray-600 group-hover:text-white" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse"></span>
                </button>

                {/* Quick Actions Dropdown */}
                {showQuickActions && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowQuickActions(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-slideDown">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Quick Actions</h3>
                          </div>
                          <button
                            onClick={() => setShowQuickActions(false)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-white/80 mt-1">Powerful actions at your fingertips</p>
                      </div>

                      {/* Actions Grid */}
                      <div className="p-3 grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                        {quickActions.map((action) => {
                          const IconComponent = getIconComponent(action.icon);
                          return (
                            <button
                              key={action.id}
                              onClick={action.action}
                              className="group relative overflow-hidden rounded-xl p-4 text-left transition-all hover:scale-105 hover:shadow-lg"
                              style={{ background: action.gradient }}
                            >
                              <div className="relative z-10">
                                <IconComponent className="w-6 h-6 text-white mb-2" />
                                <h4 className="font-semibold text-white text-sm mb-1">{action.title}</h4>
                                <p className="text-xs text-white/80 line-clamp-2">{action.description}</p>
                              </div>
                              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                            </button>
                          );
                        })}
                      </div>

                      {/* Footer */}
                      <div className="border-t border-gray-200 p-3 bg-gray-50">
                        <p className="text-xs text-gray-500 text-center">
                          Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Ctrl+K</kbd> for more actions
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Notifications Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg relative group"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-bounce">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-slideDown">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Notifications</h3>
                            {unreadCount > 0 && (
                              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                                {unreadCount} new
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {notifications.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-white/80 hover:text-white transition-colors"
                            >
                              Mark all read
                            </button>
                            <span className="text-white/40">•</span>
                            <button
                              onClick={clearAllNotifications}
                              className="text-xs text-white/80 hover:text-white transition-colors"
                            >
                              Clear all
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No notifications yet</p>
                            <p className="text-gray-400 text-xs mt-1">We'll notify you when something happens</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {notifications.map((notif) => {
                              const IconComponent = getIconComponent(notif.icon);
                              return (
                                <div
                                  key={notif.id}
                                  onClick={() => {
                                    if (!notif.read) markNotificationAsRead(notif.id);
                                    if (notif.action) {
                                      notif.action();
                                      setShowNotifications(false);
                                    }
                                  }}
                                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                                    !notif.read ? 'bg-blue-50/50' : ''
                                  }`}
                                >
                                  <div className="flex gap-3">
                                    <div 
                                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                                      style={{ background: getNotificationColor(notif.type) }}
                                    >
                                      <IconComponent className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-semibold text-gray-900 text-sm">{notif.title}</h4>
                                        {!notif.read && (
                                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTimeAgo(notif.time)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="border-t border-gray-200 p-3 bg-gray-50">
                          <button
                            onClick={() => {
                              setShowNotifications(false);
                              setActiveTab('analytics');
                            }}
                            className="w-full text-center text-sm text-orange-500 hover:text-orange-600 font-semibold transition-colors"
                          >
                            View All Activity →
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-1.5 md:gap-2">
                {user.avatar ? (
                  <img
                    src={`${API_URL}${user.avatar}`}
                    alt={user.name}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-orange-500"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xs md:text-base">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-xs md:text-sm font-semibold text-gray-900 truncate max-w-[100px] md:max-w-none">
                    {user.name}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-3 sm:p-4 md:p-6">
          {/* Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 md:space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <DollarSign className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
                    <span className="text-[10px] md:text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      +12.5%
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-xs md:text-sm font-medium">Total Revenue</h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>

                <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <ShoppingCart className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
                    <span className="text-[10px] md:text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {stats.pendingOrders} pending
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-xs md:text-sm font-medium">Total Orders</h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
                    {stats.totalOrders}
                  </p>
                </div>

                <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-purple-500" />
                    <span className="text-[10px] md:text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      +8.2%
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-xs md:text-sm font-medium">Total Users</h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
                    {stats.totalUsers}
                  </p>
                </div>

                <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <Package className="w-8 h-8 md:w-10 md:h-10 text-orange-500" />
                    <span className="text-[10px] md:text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      {stats.lowStockProducts} low
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-xs md:text-sm font-medium">Total Products</h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
                    {stats.totalProducts}
                  </p>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Recent Orders</h2>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-orange-500 hover:text-orange-600 font-semibold text-xs sm:text-sm"
                  >
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
                            Order ID
                          </th>
                          <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
                            Customer
                          </th>
                          <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">
                            Date
                          </th>
                          <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
                            Amount
                          </th>
                          <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
                            Status
                          </th>
                          <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map(order => (
                          <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-900 whitespace-nowrap">
                              #{order.trackingNumber?.slice(-8)}
                            </td>
                            <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600">
                              <div className="max-w-[100px] sm:max-w-[150px] truncate">
                                {order.shippingInfo?.fullName}
                              </div>
                            </td>
                            <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 whitespace-nowrap hidden sm:table-cell">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">
                              {formatCurrency(order.orderSummary?.totalAmount)}
                            </td>
                            <td className="py-2 md:py-3 px-2 md:px-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-semibold whitespace-nowrap ${getStatusColor(order.orderStatus)}`}>
                                {order.orderStatus}
                              </span>
                            </td>
                            <td className="py-2 md:py-3 px-2 md:px-4">
                              <button 
                                onClick={() => handleViewOrder(order)}
                                className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg"
                              >
                                <Eye className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4 md:space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-3 sm:p-4 md:p-6">
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="w-full">
                    <div className="relative">
                      <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="flex-1 px-2 md:px-4 py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    >
                      <option value="all">All Orders</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setOrderFilter('all');
                      }}
                      className="px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Bar for Orders */}
              {selectedOrders.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-4 animate-slideDown">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-500" />
                      <span className="font-semibold text-gray-900">
                        {selectedOrders.length} order(s) selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowBulkOrderModal(true)}
                        className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        Update Status
                      </button>
                      <button
                        onClick={handleBulkDeleteOrders}
                        className="px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedOrders([])}
                        className="px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders Table */}
              <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedOrders.length > 0 && selectedOrders.length === orders.filter(order => {
                                const matchesSearch = searchTerm === '' || 
                                  order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  order.shippingInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
                                const matchesFilter = orderFilter === 'all' || order.orderStatus === orderFilter;
                                return matchesSearch && matchesFilter;
                              }).length}
                              onChange={handleSelectAllOrders}
                              className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-purple-500"
                            />
                          </th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
                            Order ID
                          </th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
                            Customer
                          </th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">
                            Date
                          </th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap hidden md:table-cell">
                            Items
                          </th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
                            Amount
                          </th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
                            Status
                          </th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedOrders().map(order => (
                            <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6">
                                <input
                                  type="checkbox"
                                  checked={selectedOrders.includes(order._id)}
                                  onChange={() => handleSelectOrder(order._id)}
                                  className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-purple-500"
                                />
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-medium text-gray-900 whitespace-nowrap">
                                #{order.trackingNumber?.slice(-8)}
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6">
                                <div className="max-w-[80px] sm:max-w-[120px] md:max-w-none">
                                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                                    {order.shippingInfo?.fullName}
                                  </p>
                                  <p className="text-[10px] md:text-xs text-gray-500 truncate hidden md:block">
                                    {order.shippingInfo?.email}
                                  </p>
                                </div>
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm text-gray-600 whitespace-nowrap hidden sm:table-cell">
                                {formatDate(order.createdAt)}
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm text-gray-600 whitespace-nowrap hidden md:table-cell">
                                {order.orderItems?.length} items
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">
                                {formatCurrency(order.orderSummary?.totalAmount)}
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6">
                                <select
                                  value={order.orderStatus}
                                  onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                  className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-orange-500 ${getStatusColor(order.orderStatus)}`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6">
                                <button
                                  onClick={() => handleViewOrder(order)}
                                  className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination for Orders */}
                {orders.filter(order => {
                  const matchesSearch = searchTerm === '' || 
                    order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.shippingInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesFilter = orderFilter === 'all' || order.orderStatus === orderFilter;
                  return matchesSearch && matchesFilter;
                }).length > 0 && (
                  <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Show:</span>
                        <select
                          value={ordersPerPage}
                          onChange={(e) => {
                            setOrdersPerPage(Number(e.target.value));
                            setCurrentOrdersPage(1);
                          }}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-gray-600">per page</span>
                      </div>

                      <div className="text-sm text-gray-600">
                        Page {currentOrdersPage} of {getTotalOrderPages()}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOrderPageChange(currentOrdersPage - 1)}
                          disabled={currentOrdersPage === 1}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOrderPageChange(currentOrdersPage + 1)}
                          disabled={currentOrdersPage === getTotalOrderPages()}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {orders.filter(order => {
                const matchesSearch = searchTerm === '' || 
                  order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  order.shippingInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesFilter = orderFilter === 'all' || order.orderStatus === orderFilter;
                return matchesSearch && matchesFilter;
              }).length === 0 && (
                <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden">
                  <div className="text-center py-8 md:py-12">
                    <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                    <p className="text-gray-500 text-sm md:text-base">No orders found</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4 md:space-y-6">
              {/* Bulk Actions Bar for Users */}
              {selectedUsers.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 animate-slideDown">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-gray-900">
                        {selectedUsers.length} user(s) selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleBulkExportUsers}
                        className="px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                      <button
                        onClick={handleBulkDeleteUsers}
                        className="px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedUsers([])}
                        className="px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Advanced Filters Bar */}
              <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                {/* Top Row: Search + Quick Actions */}
                <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const exportData = getFilteredUsers().map(u => ({
                          Name: u.name,
                          Email: u.email,
                          Role: u.role,
                          Status: getUserStatusBadge(u.lastLogin).text,
                          Joined: formatDate(u.createdAt),
                          LastLogin: u.lastLogin ? formatDate(u.lastLogin) : 'Never'
                        }));
                        exportToCSV(exportData, 'users');
                      }}
                      className="px-4 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  </div>
                </div>

                {/* Second Row: Role Filter + Status Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="all">All Roles ({users.length})</option>
                    <option value="admin">Admins ({users.filter(u => u.role === 'admin').length})</option>
                    <option value="user">Regular Users ({users.filter(u => u.role === 'user').length})</option>
                  </select>

                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active (Last 7 days)</option>
                    <option value="inactive">Inactive (30+ days)</option>
                  </select>

                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setUserFilter('all');
                      setUserStatus('all');
                    }}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Clear Filters
                  </button>
                </div>

                {/* Active Filters Chips */}
                {(userFilter !== 'all' || userStatus !== 'all' || searchTerm) && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="text-xs text-gray-500 self-center">Active filters:</span>
                    {searchTerm && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                        Search: "{searchTerm}"
                        <button onClick={() => setSearchTerm('')} className="hover:bg-blue-200 rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {userFilter !== 'all' && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center gap-1">
                        Role: {userFilter}
                        <button onClick={() => setUserFilter('all')} className="hover:bg-purple-200 rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {userStatus !== 'all' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                        Status: {userStatus}
                        <button onClick={() => setUserStatus('all')} className="hover:bg-green-200 rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}

                {/* Results Count */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{getFilteredUsers().length}</span> of <span className="font-semibold text-gray-900">{users.length}</span> users
                  </p>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedUsers.length > 0 && selectedUsers.length === getFilteredUsers().length}
                              onChange={handleSelectAllUsers}
                              className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-500"
                            />
                          </th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">User</th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">Email</th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">Role</th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap hidden md:table-cell">Joined</th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap hidden lg:table-cell">Last Login</th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">Status</th>
                          <th className="text-left py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedUsers().map(u => {
                          const statusBadge = getUserStatusBadge(u.lastLogin);
                          return (
                            <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6">
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(u._id)}
                                  onChange={() => handleSelectUser(u._id)}
                                  className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-500"
                                />
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6">
                                <div className="flex items-center gap-2 md:gap-3">
                                  {u.avatar ? (
                                    <img
                                      src={`${API_URL}${u.avatar}`}
                                      alt={u.name}
                                      className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
                                      crossOrigin="anonymous"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xs md:text-base flex-shrink-0">
                                      {u.name?.charAt(0)}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{u.name}</p>
                                    <p className="text-[10px] md:text-xs text-gray-500 truncate sm:hidden">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm text-gray-600 hidden sm:table-cell">
                                <div className="max-w-[150px] md:max-w-none truncate">{u.email}</div>
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6">
                                <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-semibold whitespace-nowrap ${
                                  u.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm text-gray-600 whitespace-nowrap hidden md:table-cell">
                                {formatDate(u.createdAt)}
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6 text-xs md:text-sm text-gray-600 whitespace-nowrap hidden lg:table-cell">
                                {u.lastLogin ? formatDate(u.lastLogin) : 'Never'}
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6">
                                <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-semibold whitespace-nowrap ${statusBadge.color}`}>
                                  {statusBadge.text}
                                </span>
                              </td>
                              <td className="py-2 md:py-4 px-2 sm:px-4 md:px-6">
                                <div className="flex gap-1 md:gap-2">
                                  <button
                                    onClick={() => handleViewUser(u)}
                                    className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                                  </button>
                                  {u._id !== user._id && (
                                    <button
                                      onClick={() => handleDeleteUser(u._id, u.name)}
                                      className="p-1.5 md:p-2 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete User"
                                    >
                                      <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination for Users */}
                {getFilteredUsers().length > 0 && (
                  <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Show:</span>
                        <select
                          value={usersPerPage}
                          onChange={(e) => {
                            setUsersPerPage(Number(e.target.value));
                            setCurrentUsersPage(1);
                          }}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-gray-600">per page</span>
                      </div>

                      <div className="text-sm text-gray-600">
                        Page {currentUsersPage} of {getTotalUserPages()}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUserPageChange(currentUsersPage - 1)}
                          disabled={currentUsersPage === 1}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUserPageChange(currentUsersPage + 1)}
                          disabled={currentUsersPage === getTotalUserPages()}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {getFilteredUsers().length === 0 && (
                <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden">
                  <div className="text-center py-8 md:py-12">
                    <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                    <p className="text-gray-500 text-sm md:text-base">No users found</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-4 md:space-y-6">
              {/* Advanced Filters Bar */}
              <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                {/* Top Row: Search + Quick Filters */}
                <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search products by name, category, or brand..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                        showAdvancedFilters
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      <span className="hidden sm:inline">Filters</span>
                      {(productFilter !== 'all' || priceRange.min > 0 || priceRange.max < 100000 || stockRange.min > 0 || stockRange.max < 1000) && (
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                      )}
                    </button>
                    <button
                      onClick={() => setShowAddProduct(true)}
                      className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Product</span>
                    </button>
                    <button
                      onClick={() => {
                        const exportData = getFilteredAndSortedProducts().map(p => ({
                          Name: p.name,
                          Category: p.category,
                          Brand: p.brand,
                          Price: p.price,
                          Stock: p.stock
                        }));
                        exportToCSV(exportData, 'products');
                      }}
                      className="px-4 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  </div>
                </div>

                {/* Second Row: Status Filter + Sort */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="all">All Products ({products.length})</option>
                    <option value="in-stock">In Stock ({products.filter(p => p.stock >= 10).length})</option>
                    <option value="low-stock">Low Stock ({products.filter(p => p.stock > 0 && p.stock < 10).length})</option>
                    <option value="out-of-stock">Out of Stock ({products.filter(p => p.stock === 0).length})</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="stock-low">Stock: Low to High</option>
                    <option value="stock-high">Stock: High to Low</option>
                  </select>
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200 animate-slideDown">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-orange-500" />
                      Advanced Filters
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Price Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price Range: Rs. {priceRange.min.toLocaleString()} - Rs. {priceRange.max.toLocaleString()}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                          />
                          <span className="text-gray-500 self-center">to</span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 100000 })}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {/* Stock Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stock Range: {stockRange.min} - {stockRange.max} units
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={stockRange.min}
                            onChange={(e) => setStockRange({ ...stockRange, min: parseInt(e.target.value) || 0 })}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                          />
                          <span className="text-gray-500 self-center">to</span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={stockRange.max}
                            onChange={(e) => setStockRange({ ...stockRange, max: parseInt(e.target.value) || 1000 })}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          setPriceRange({ min: 0, max: 100000 });
                          setStockRange({ min: 0, max: 1000 });
                          setProductFilter('all');
                          setSortBy('newest');
                          setSearchTerm('');
                        }}
                        className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Reset All Filters
                      </button>
                      <button
                        onClick={() => setShowAdvancedFilters(false)}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Filters Chips */}
                {(productFilter !== 'all' || searchTerm || priceRange.min > 0 || priceRange.max < 100000 || stockRange.min > 0 || stockRange.max < 1000) && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="text-xs text-gray-500 self-center">Active filters:</span>
                    {searchTerm && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                        Search: "{searchTerm}"
                        <button onClick={() => setSearchTerm('')} className="hover:bg-blue-200 rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {productFilter !== 'all' && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center gap-1">
                        Status: {productFilter}
                        <button onClick={() => setProductFilter('all')} className="hover:bg-purple-200 rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {(priceRange.min > 0 || priceRange.max < 100000) && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                        Price: Rs. {priceRange.min.toLocaleString()} - Rs. {priceRange.max.toLocaleString()}
                        <button onClick={() => setPriceRange({ min: 0, max: 100000 })} className="hover:bg-green-200 rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {(stockRange.min > 0 || stockRange.max < 1000) && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full flex items-center gap-1">
                        Stock: {stockRange.min} - {stockRange.max}
                        <button onClick={() => setStockRange({ min: 0, max: 1000 })} className="hover:bg-orange-200 rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}

                {/* Results Count */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{getFilteredAndSortedProducts().length}</span> of <span className="font-semibold text-gray-900">{products.length}</span> products
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === getFilteredAndSortedProducts().length && getFilteredAndSortedProducts().length > 0}
                      onChange={handleSelectAllProducts}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">Select All</span>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedProducts.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-4 animate-slideDown">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold text-gray-900">
                        {selectedProducts.length} product(s) selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowBulkDiscountModal(true)}
                        className="px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        Apply Discount
                      </button>
                      <button
                        onClick={() => setShowBulkEditModal(true)}
                        className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Bulk Edit
                      </button>
                      <button
                        onClick={handleBulkDeleteProducts}
                        className="px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedProducts([])}
                        className="px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Grid */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {getPaginatedProducts().map(product => (
                    <div key={product._id} className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative">
                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => handleSelectProduct(product._id)}
                          className="w-5 h-5 rounded border-2 border-white shadow-lg cursor-pointer accent-orange-500"
                        />
                      </div>
                      
                      <div className="relative h-32 sm:h-40 md:h-48 bg-gray-100">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 md:top-2 right-1 md:right-2 flex gap-1 md:gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-1.5 md:p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
                          >
                            <Edit className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id, product.name)}
                            className="p-1.5 md:p-2 bg-white rounded-lg shadow-md hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                          </button>
                        </div>
                        {product.stock < 10 && (
                          <div className="absolute top-1 md:top-2 left-10 md:left-12">
                            <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-red-500 text-white text-[10px] md:text-xs font-semibold rounded animate-pulse">
                              Low Stock
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 md:p-4">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base mb-1 truncate">{product.name}</h3>
                        <p className="text-[10px] md:text-xs text-gray-500 mb-2 truncate">{product.category} • {product.brand}</p>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-base sm:text-lg font-bold text-orange-500">{formatCurrency(product.price)}</p>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs md:text-sm font-semibold ${product.stock < 10 ? 'text-red-600' : 'text-gray-600'}`}>
                              Stock: {product.stock}
                            </span>
                          </div>
                        </div>
                        {product.stock < 10 && (
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="0"
                              defaultValue={product.stock}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const newStock = parseInt(e.target.value);
                                  if (newStock >= 0) {
                                    handleUpdateStock(product._id, newStock);
                                  }
                                }
                              }}
                              className="flex-1 px-2 py-1 text-xs border border-orange-300 rounded focus:outline-none focus:border-orange-500"
                              placeholder="New stock"
                            />
                            <button
                              onClick={(e) => {
                                const input = e.target.previousSibling;
                                const newStock = parseInt(input.value);
                                if (newStock >= 0) {
                                  handleUpdateStock(product._id, newStock);
                                }
                              }}
                              className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded hover:shadow-lg transition-all"
                            >
                              Update
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Pagination for Products */}
              {getFilteredAndSortedProducts().length > 0 && (
                <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Items per page */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Show:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      >
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                        <option value={48}>48</option>
                        <option value={96}>96</option>
                      </select>
                      <span className="text-sm text-gray-600">per page</span>
                    </div>

                    {/* Page info */}
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, getFilteredAndSortedProducts().length)} of {getFilteredAndSortedProducts().length} products
                    </div>

                    {/* Pagination buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleProductPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Page numbers */}
                      <div className="flex gap-1">
                        {Array.from({ length: getTotalProductPages() }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first page, last page, current page, and pages around current
                            return page === 1 || 
                                   page === getTotalProductPages() || 
                                   (page >= currentPage - 1 && page <= currentPage + 1);
                          })
                          .map((page, index, array) => (
                            <React.Fragment key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-3 py-1.5 text-gray-500">...</span>
                              )}
                              <button
                                onClick={() => handleProductPageChange(page)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                    : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          ))}
                      </div>

                      <button
                        onClick={() => handleProductPageChange(currentPage + 1)}
                        disabled={currentPage === getTotalProductPages()}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {getFilteredAndSortedProducts().length === 0 && (
                <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-8 md:p-12 text-center">
                  <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                  <p className="text-gray-500 text-sm md:text-base">No products found</p>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 md:space-y-6">
              {/* Revenue Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                  <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs md:text-sm text-green-600 mt-2">↑ 12.5% from last month</p>
                </div>
                <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                  <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-2">Average Order Value</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0)}
                  </p>
                  <p className="text-xs md:text-sm text-green-600 mt-2">↑ 8.2% from last month</p>
                </div>
                <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 sm:col-span-2 lg:col-span-1">
                  <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-2">Conversion Rate</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {stats.totalUsers > 0 ? ((stats.totalOrders / stats.totalUsers) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs md:text-sm text-green-600 mt-2">↑ 3.1% from last month</p>
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Order Status Breakdown</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => {
                    const count = orders.filter(o => o.orderStatus === status).length;
                    const percentage = stats.totalOrders > 0 ? ((count / stats.totalOrders) * 100).toFixed(1) : 0;
                    return (
                      <div key={status} className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                        <p className={`text-xl sm:text-2xl font-bold mb-1 ${getStatusColor(status).split(' ')[1]}`}>
                          {count}
                        </p>
                        <p className="text-[10px] md:text-xs text-gray-600 capitalize mb-1">{status}</p>
                        <p className="text-[10px] md:text-xs text-gray-500">{percentage}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Top Selling Products</h2>
                <div className="space-y-3 md:space-y-4">
                  {products
                    .sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0))
                    .slice(0, 5)
                    .map((product, index) => (
                      <div key={product._id} className="flex items-center gap-2 sm:gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xs md:text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base truncate">{product.name}</h3>
                          <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 truncate">{product.category}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">{formatCurrency(product.price)}</p>
                          <p className="text-[10px] sm:text-xs md:text-sm text-gray-500">{product.numReviews || 0} reviews</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Recent Activity</h2>
                <div className="space-y-3 md:space-y-4">
                  {orders.slice(0, 10).map(order => (
                    <div key={order._id} className="flex items-center gap-2 sm:gap-3 md:gap-4 p-3 md:p-4 border-l-4 border-orange-500 bg-gray-50 rounded-r-lg">
                      <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${getStatusColor(order.orderStatus)}`}>
                        <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          Order #{order.trackingNumber?.slice(-8)} - {order.shippingInfo?.fullName}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          {formatDate(order.createdAt)} • {formatCurrency(order.orderSummary?.totalAmount)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-semibold whitespace-nowrap flex-shrink-0 ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Order Details</h2>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Order ID</p>
                  <p className="font-semibold text-gray-900 text-sm md:text-base">#{viewingOrder.trackingNumber}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold ${getStatusColor(viewingOrder.orderStatus)}`}>
                    {viewingOrder.orderStatus}
                  </span>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Order Date</p>
                  <p className="font-semibold text-gray-900 text-sm md:text-base">{formatDate(viewingOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Total Amount</p>
                  <p className="font-semibold text-gray-900 text-sm md:text-base">{formatCurrency(viewingOrder.orderSummary?.totalAmount)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t border-gray-200 pt-4 md:pt-6">
                <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Customer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900 text-sm md:text-base">{viewingOrder.shippingInfo?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900 text-sm md:text-base break-all">{viewingOrder.shippingInfo?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900 text-sm md:text-base">{viewingOrder.shippingInfo?.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">City</p>
                    <p className="font-medium text-gray-900 text-sm md:text-base">{viewingOrder.shippingInfo?.city}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs md:text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900 text-sm md:text-base">{viewingOrder.shippingInfo?.address}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-gray-200 pt-4 md:pt-6">
                <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Order Items</h3>
                <div className="space-y-3 md:space-y-4">
                  {viewingOrder.orderItems?.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base truncate">{item.name}</p>
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-gray-900 text-xs sm:text-sm md:text-base flex-shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4 md:pt-6">
                <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm md:text-base">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(viewingOrder.orderSummary?.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm md:text-base">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">{formatCurrency(viewingOrder.orderSummary?.shippingCost)}</span>
                  </div>
                  {viewingOrder.orderSummary?.discount > 0 && (
                    <div className="flex justify-between text-green-600 text-xs sm:text-sm md:text-base">
                      <span>Discount</span>
                      <span className="font-medium">-{formatCurrency(viewingOrder.orderSummary?.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatCurrency(viewingOrder.orderSummary?.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal - PROFESSIONAL & DETAILED */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 p-4 md:p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 md:w-8 md:h-8 text-white" />
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">User Profile Details</h2>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* User Profile Card */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 md:p-6 border-2 border-orange-200">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {viewingUser.avatar ? (
                    <img
                      src={`${API_URL}${viewingUser.avatar}`}
                      alt={viewingUser.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-white shadow-lg flex-shrink-0"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-2xl md:text-3xl font-bold flex-shrink-0 shadow-lg border-4 border-white">
                      {viewingUser.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{viewingUser.name}</h3>
                    <p className="text-sm md:text-base text-gray-600 mb-3 break-all">{viewingUser.email}</p>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                        viewingUser.role === 'admin' 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-blue-500 text-white'
                      }`}>
                        {viewingUser.role === 'admin' ? '👑 Administrator' : '👤 User'}
                      </span>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                        getUserStatusBadge(viewingUser.lastLogin).color
                      }`}>
                        {getUserStatusBadge(viewingUser.lastLogin).text}
                      </span>
                      {viewingUser.isEmailVerified && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500 text-white shadow-sm">
                          ✓ Verified
                        </span>
                      )}
                      {viewingUser.twoFactorEnabled && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500 text-white shadow-sm">
                          🔐 2FA Enabled
                        </span>
                      )}
                      {viewingUser.googleId && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500 text-white shadow-sm">
                          🔗 Google Account
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2">
                    <Info className="w-4 h-4 text-orange-500" />
                    Account Information
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">User ID</p>
                    <p className="font-mono text-xs text-gray-900 break-all">{viewingUser._id}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Account Created</p>
                    <p className="font-semibold text-sm text-gray-900">
                      {new Date(viewingUser.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.floor((Date.now() - new Date(viewingUser.createdAt)) / (1000 * 60 * 60 * 24))} days ago
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Last Login</p>
                    {viewingUser.lastLogin ? (
                      <>
                        <p className="font-semibold text-sm text-gray-900">
                          {new Date(viewingUser.lastLogin).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(viewingUser.lastLogin)}
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold text-sm text-gray-500">Never logged in</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Account Status</p>
                    <p className={`font-semibold text-sm ${viewingUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {viewingUser.isActive ? '✓ Active Account' : '✗ Inactive Account'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security & Verification */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Security & Verification
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      viewingUser.isEmailVerified ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {viewingUser.isEmailVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email Verified</p>
                      <p className={`font-semibold text-sm ${viewingUser.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                        {viewingUser.isEmailVerified ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      viewingUser.twoFactorEnabled ? 'bg-indigo-100' : 'bg-gray-100'
                    }`}>
                      {viewingUser.twoFactorEnabled ? (
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">2FA Enabled</p>
                      <p className={`font-semibold text-sm ${viewingUser.twoFactorEnabled ? 'text-indigo-600' : 'text-gray-500'}`}>
                        {viewingUser.twoFactorEnabled ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      viewingUser.googleId ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {viewingUser.googleId ? (
                        <CheckCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Google OAuth</p>
                      <p className={`font-semibold text-sm ${viewingUser.googleId ? 'text-red-600' : 'text-gray-500'}`}>
                        {viewingUser.googleId ? 'Linked' : 'Not Linked'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Statistics */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    Activity Statistics
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-2xl font-bold text-blue-600">{viewingUser.wishlist?.length || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Wishlist Items</p>
                  </div>
                  <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <p className="text-2xl font-bold text-purple-600">{viewingUser.loginAttempts || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Login Attempts</p>
                  </div>
                  <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-600">{viewingUser.activeSessions?.length || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Active Sessions</p>
                  </div>
                  <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                    <p className="text-2xl font-bold text-orange-600">{viewingUser.securityLogs?.length || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Security Logs</p>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              {viewingUser.activeSessions && viewingUser.activeSessions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      Active Sessions ({viewingUser.activeSessions.length})
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                    {viewingUser.activeSessions.map((session, index) => (
                      <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                              <Activity className="w-4 h-4 text-green-500" />
                              {session.device || 'Unknown Device'}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">IP: {session.ip || 'Unknown'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Last Activity: {session.lastActivity ? formatTimeAgo(session.lastActivity) : 'Unknown'}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-semibold">
                            Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Logs */}
              {viewingUser.securityLogs && viewingUser.securityLogs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      Recent Security Logs (Last 10)
                    </h3>
                  </div>
                  <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {viewingUser.securityLogs.slice(-10).reverse().map((log, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-gray-200">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-semibold text-sm text-gray-900 flex-1">{log.action}</p>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            IP: {log.ip}
                          </span>
                          {log.userAgent && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded truncate max-w-xs">
                              {log.userAgent}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Actions */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
                <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-orange-500" />
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
                    Send Email
                  </button>
                  <button className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors">
                    Reset Password
                  </button>
                  <button className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors">
                    View Orders
                  </button>
                  {viewingUser._id !== user._id && (
                    <button 
                      onClick={() => {
                        setViewingUser(null);
                        handleDeleteUser(viewingUser._id, viewingUser.name);
                      }}
                      className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete User
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowAddProduct(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const productData = {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  price: Number(formData.get('price')), // Always in USD
                  discountedPrice: formData.get('discountedPrice') ? Number(formData.get('discountedPrice')) : 0,
                  category: formData.get('category'),
                  brand: formData.get('brand'),
                  stock: Number(formData.get('stock')),
                  image: formData.get('image')
                };
                handleSaveProduct(productData);
              }}
              className="p-4 md:p-6 space-y-3 md:space-y-4"
            >
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 md:mb-2">Product Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingProduct?.name || ''}
                  required
                  className="w-full px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 md:mb-2">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingProduct?.description || ''}
                  required
                  rows="3"
                  className="w-full px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                    Price (USD) *
                    <span className="block text-xs text-gray-500 font-normal mt-1">All prices are stored in USD</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={editingProduct?.price || ''}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                    Discounted Price (USD)
                    <span className="block text-xs text-gray-500 font-normal mt-1">Optional discount price</span>
                  </label>
                  <input
                    type="number"
                    name="discountedPrice"
                    defaultValue={editingProduct?.discountedPrice || ''}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 md:mb-2">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    defaultValue={editingProduct?.stock || ''}
                    required
                    min="0"
                    className="w-full px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 md:mb-2">Category</label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={editingProduct?.category || ''}
                    required
                    className="w-full px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 md:mb-2">Brand</label>
                <input
                  type="text"
                  name="brand"
                  defaultValue={editingProduct?.brand || ''}
                  required
                  className="w-full px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 md:mb-2">Image URL</label>
                <input
                  type="url"
                  name="image"
                  defaultValue={editingProduct?.image || ''}
                  required
                  className="w-full px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-3 md:pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 md:px-6 py-2 md:py-3 text-xs sm:text-sm md:text-base bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProduct(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 md:px-6 py-2 md:py-3 text-xs sm:text-sm md:text-base bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Discount Modal */}
      {showBulkDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 md:p-6 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-white" />
                <h2 className="text-lg md:text-xl font-bold text-white">Apply Bulk Discount</h2>
              </div>
              <button
                onClick={() => {
                  setShowBulkDiscountModal(false);
                  setBulkDiscountValue('');
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>{selectedProducts.length}</strong> product(s) selected
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="percentage"
                      checked={bulkDiscountType === 'percentage'}
                      onChange={(e) => setBulkDiscountType(e.target.value)}
                      className="w-4 h-4 accent-green-500"
                    />
                    <span className="text-sm">Percentage (%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="fixed"
                      checked={bulkDiscountType === 'fixed'}
                      onChange={(e) => setBulkDiscountType(e.target.value)}
                      className="w-4 h-4 accent-green-500"
                    />
                    <span className="text-sm">Fixed Amount (Rs.)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value {bulkDiscountType === 'percentage' ? '(%)' : '(Rs.)'}
                </label>
                <input
                  type="number"
                  value={bulkDiscountValue}
                  onChange={(e) => setBulkDiscountValue(e.target.value)}
                  placeholder={bulkDiscountType === 'percentage' ? 'e.g., 10' : 'e.g., 100'}
                  min="0"
                  max={bulkDiscountType === 'percentage' ? '100' : undefined}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>

              {bulkDiscountValue && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-green-800 mb-2">Preview:</p>
                  <p className="text-xs text-green-700">
                    {bulkDiscountType === 'percentage' 
                      ? `${bulkDiscountValue}% discount will be applied`
                      : `Rs. ${bulkDiscountValue} will be deducted from each product`
                    }
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowBulkDiscountModal(false);
                    setBulkDiscountValue('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDiscount}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  Apply Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 md:p-6 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-2">
                <Edit className="w-6 h-6 text-white" />
                <h2 className="text-lg md:text-xl font-bold text-white">Bulk Edit Products</h2>
              </div>
              <button
                onClick={() => {
                  setShowBulkEditModal(false);
                  setBulkEditValue('');
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>{selectedProducts.length}</strong> product(s) selected
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Field to Edit</label>
                <select
                  value={bulkEditField}
                  onChange={(e) => setBulkEditField(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="price">Price</option>
                  <option value="stock">Stock</option>
                  <option value="category">Category</option>
                  <option value="brand">Brand</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New {bulkEditField.charAt(0).toUpperCase() + bulkEditField.slice(1)}
                </label>
                {bulkEditField === 'price' || bulkEditField === 'stock' ? (
                  <input
                    type="number"
                    value={bulkEditValue}
                    onChange={(e) => setBulkEditValue(e.target.value)}
                    placeholder={`Enter new ${bulkEditField}`}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <input
                    type="text"
                    value={bulkEditValue}
                    onChange={(e) => setBulkEditValue(e.target.value)}
                    placeholder={`Enter new ${bulkEditField}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                )}
              </div>

              {bulkEditValue && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-blue-800 mb-2">Preview:</p>
                  <p className="text-xs text-blue-700">
                    All selected products will have their {bulkEditField} set to: <strong>{bulkEditValue}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkEditValue('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkEdit}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Order Status Update Modal */}
      {showBulkOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 md:p-6 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-2">
                <Truck className="w-6 h-6 text-white" />
                <h2 className="text-lg md:text-xl font-bold text-white">Update Order Status</h2>
              </div>
              <button
                onClick={() => setShowBulkOrderModal(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">
                  <strong>{selectedOrders.length}</strong> order(s) selected
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <select
                  value={bulkOrderStatus}
                  onChange={(e) => setBulkOrderStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-purple-800 mb-2">Preview:</p>
                <p className="text-xs text-purple-700">
                  All selected orders will be updated to: <strong className="capitalize">{bulkOrderStatus}</strong>
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBulkOrderModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkOrderStatusUpdate}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

// Add these styles to your global CSS or create a style tag
const styles = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slideDown {
    animation: slideDown 0.2s ease-out;
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }

  .animate-bounce {
    animation: bounce 1s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;
