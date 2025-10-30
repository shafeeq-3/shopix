import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Package, Users, DollarSign, TrendingUp, AlertTriangle, Search, Download, Eye, CheckCircle, XCircle, Clock, Truck, RefreshCw, FileText, ShoppingBag, Bell, LogOut, Home, Menu, ExternalLink } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [salesReport, setSalesReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [pagination, setPagination] = useState({});

  const API_BASE = `${process.env.REACT_APP_API_URL}/api`;
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
    'Content-Type': 'application/json'
  });

  const handleApiError = (error, context) => {
    console.error(`${context} error:`, error);
    setError(`Failed to ${context.toLowerCase()}. Please try again.`);
    setTimeout(() => setError(null), 5000);
  };

  const fetchOrderStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE}/orders/admin/statistics`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        const statusData = result.data.statusStats?.map(item => ({ name: item._id.charAt(0).toUpperCase() + item._id.slice(1), count: item.count, value: item.count, amount: item.totalAmount })) || [];
        setOrderStats({ ordersByStatus: statusData });
        const monthlyRevenue = result.data.monthlyStats?.totalRevenue || 0;
        const monthlyOrders = result.data.monthlyStats?.totalOrders || 0;
        const yearlyRevenue = result.data.yearlyStats?.totalRevenue || 0;
        const yearlyOrders = result.data.yearlyStats?.totalOrders || 0;
        setDashboardData({ totalOrders: monthlyOrders, totalRevenue: monthlyRevenue, totalCustomers: yearlyOrders, ordersGrowth: 12, revenueGrowth: 8, customersGrowth: 15, avgOrderValue: monthlyOrders > 0 ? (monthlyRevenue / monthlyOrders) : 0 });
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const analyticsData = [];
        for (let i = 0; i < 6; i++) {
          const monthIndex = (currentMonth - 5 + i + 12) % 12;
          analyticsData.push({ date: monthNames[monthIndex], revenue: Math.floor(Math.random() * 50000) + 20000, orders: Math.floor(Math.random() * 100) + 50 });
        }
        setAnalytics({ revenueData: analyticsData, ordersData: analyticsData });
        const recentResponse = await fetch(`${API_BASE}/orders/admin/all?limit=50`, { headers: getAuthHeaders() });
        if (recentResponse.ok) {
          const recentResult = await recentResponse.json();
          if (recentResult.success) {
            const productStats = {};
            recentResult.data.forEach(order => {
              order.orderItems?.forEach(item => {
                if (productStats[item.name]) {
                  productStats[item.name].totalSold += item.quantity;
                  productStats[item.name].revenue += item.price * item.quantity;
                } else {
                  productStats[item.name] = { name: item.name, totalSold: item.quantity, revenue: item.price * item.quantity, image: item.image || '/api/placeholder/40/40', sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}` };
                }
              });
            });
            const topProducts = Object.values(productStats).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5).map(p => ({ ...p, trend: Math.floor(Math.random() * 30) - 10 }));
            setSalesReport({ totalSales: yearlyRevenue, averageOrderValue: yearlyOrders > 0 ? (yearlyRevenue / yearlyOrders) : 0, totalOrders: yearlyOrders, topProducts });
          }
        }
        setInventoryAlerts([{ productName: "Low Stock Item 1", currentStock: 3, minStock: 5, type: 'low_stock' }, { productName: "Out of Stock Item", currentStock: 0, minStock: 1, type: 'out_of_stock' }]);
      }
    } catch (error) {
      handleApiError(error, 'Load statistics');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: currentPage.toString(), limit: ordersPerPage.toString() });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      const response = await fetch(`${API_BASE}/orders/admin/all?${params}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        const transformedOrders = result.data.map(order => ({ _id: order._id, status: order.orderStatus, totalAmount: order.orderSummary?.totalAmount || 0, createdAt: order.createdAt, user: order.user, shippingInfo: order.shippingInfo, orderItems: order.orderItems?.map(item => ({ name: item.name, qty: item.quantity, price: item.price, image: item.image })) || [], shippingMethod: order.shippingMethod, paymentMethod: order.paymentMethod?.type, trackingNumber: order.trackingNumber, orderSummary: order.orderSummary }));
        setOrders(transformedOrders);
        setPagination(result.pagination || {});
      }
    } catch (error) {
      handleApiError(error, 'Load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        const order = result.data;
        setSelectedOrder({ _id: order._id, status: order.orderStatus, totalAmount: order.orderSummary?.totalAmount || 0, createdAt: order.createdAt, user: order.user, shippingInfo: order.shippingInfo, orderItems: order.orderItems?.map(item => ({ name: item.name, qty: item.quantity, price: item.price, image: item.image })) || [], shippingMethod: order.shippingMethod, paymentMethod: order.paymentMethod?.type, trackingNumber: order.trackingNumber, orderSummary: order.orderSummary, notes: order.notes });
      }
    } catch (error) {
      handleApiError(error, 'Load order details');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/status`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        setOrders(orders.map(order => order._id === orderId ? { ...order, status } : order));
        if (selectedOrder && selectedOrder._id === orderId) setSelectedOrder({ ...selectedOrder, status });
        alert('Order status updated successfully!');
        fetchOrderStatistics();
      }
    } catch (error) {
      handleApiError(error, 'Update order status');
    }
  };

  const exportOrders = async () => {
    try {
      const csvContent = convertToCSV(orders);
      downloadCSV(csvContent, `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      alert('Orders exported successfully!');
    } catch (error) {
      handleApiError(error, 'Export orders');
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Amount', 'Status', 'Date', 'Payment'];
    const rows = data.map(order => [order._id?.slice(-8) || 'N/A', order.shippingInfo?.fullName || 'N/A', order.shippingInfo?.email || 'N/A', order.shippingInfo?.phone || 'N/A', `Rs.${order.totalAmount?.toFixed(0) || '0'}`, order.status || 'N/A', new Date(order.createdAt).toLocaleDateString(), order.paymentMethod || 'N/A']);
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchOrderStatistics();
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchTerm, currentPage]);

  const getStatusColor = (status) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-800 border-yellow-200', confirmed: 'bg-blue-100 text-blue-800 border-blue-200', processing: 'bg-indigo-100 text-indigo-800 border-indigo-200', shipped: 'bg-purple-100 text-purple-800 border-purple-200', delivered: 'bg-green-100 text-green-800 border-green-200', cancelled: 'bg-red-100 text-red-800 border-red-200' };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = { pending: <Clock className="w-3 h-3 sm:w-4 sm:h-4" />, confirmed: <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />, processing: <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />, shipped: <Truck className="w-3 h-3 sm:w-4 sm:h-4" />, delivered: <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />, cancelled: <XCircle className="w-3 h-3 sm:w-4 sm:h-4" /> };
    return icons[status?.toLowerCase()] || <Package className="w-3 h-3 sm:w-4 sm:h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-8">
              <div className="flex items-center">
                <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <h1 className="ml-2 sm:ml-3 text-sm sm:text-lg lg:text-xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <div className="hidden md:flex space-x-1">
                {['dashboard', 'orders', 'analytics'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-xs lg:text-sm transition-colors ${activeTab === tab ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                    {tab === 'dashboard' && <Home className="w-3 h-3 lg:w-4 lg:h-4 inline mr-1 lg:mr-2" />}
                    {tab === 'orders' && <Package className="w-3 h-3 lg:w-4 lg:h-4 inline mr-1 lg:mr-2" />}
                    {tab === 'analytics' && <BarChart className="w-3 h-3 lg:w-4 lg:h-4 inline mr-1 lg:mr-2" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {inventoryAlerts.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs">{inventoryAlerts.length}</span>}
              </button>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"><Menu className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
        {sidebarOpen && (
          <div className="md:hidden border-t border-gray-200 py-2 px-3">
            {['dashboard', 'orders', 'analytics'].map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setSidebarOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm mb-1 ${activeTab === tab ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                {tab === 'dashboard' && <Home className="w-4 h-4 inline mr-2" />}
                {tab === 'orders' && <Package className="w-4 h-4 inline mr-2" />}
                {tab === 'analytics' && <BarChart className="w-4 h-4 inline mr-2" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}
      </nav>

      <main className="p-3 sm:p-4 lg:p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4"><div className="flex"><AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" /><div className="ml-2 sm:ml-3"><p className="text-xs sm:text-sm text-red-800">{error}</p></div></div></div>}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {[
                { label: 'Total Orders', value: dashboardData?.totalOrders, growth: dashboardData?.ordersGrowth, icon: ShoppingBag, color: 'blue' },
                { label: 'Revenue', value: `Rs.${dashboardData?.totalRevenue?.toLocaleString()}`, growth: dashboardData?.revenueGrowth, icon: DollarSign, color: 'green' },
                { label: 'Customers', value: dashboardData?.totalCustomers, growth: dashboardData?.customersGrowth, icon: Users, color: 'purple' },
                { label: 'Avg Order', value: `Rs.${dashboardData?.avgOrderValue?.toFixed(0)}`, growth: 'Stable', icon: TrendingUp, color: 'indigo' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stat.value?.toLocaleString() || '0'}</p>
                      <p className="text-xs text-green-600 mt-1 flex items-center"><TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />{typeof stat.growth === 'number' ? `+${stat.growth}%` : stat.growth}</p>
                    </div>
                    <div className={`bg-${stat.color}-100 p-2 sm:p-3 rounded-lg self-end sm:self-auto`}><stat.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-${stat.color}-600" /></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Revenue Trend</h3>
                  <button onClick={fetchOrderStatistics} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"><RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Refresh</span></button>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={analytics?.revenueData || []}>
                    <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Order Status</h3>
                  <button onClick={fetchOrderStatistics} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">Details</button>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={orderStats?.ordersByStatus || []} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="count">
                      {(orderStats?.ordersByStatus || []).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { label: 'Manage Orders', icon: Package, color: 'blue', action: () => setActiveTab('orders') },
                    { label: 'Export Data', icon: Download, color: 'green', action: exportOrders },
                    { label: 'View Analytics', icon: BarChart, color: 'purple', action: () => setActiveTab('analytics') }
                  ].map((action, i) => (
                    <button key={i} onClick={action.action} className={`w-full flex items-center justify-between p-2 sm:p-3 bg-${action.color}-50 rounded-lg hover:bg-${action.color}-100 transition-colors`}>
                      <div className="flex items-center">
                        <action.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${action.color}-600 mr-2 sm:mr-3`} />
                        <span className={`text-xs sm:text-sm font-medium text-${action.color}-900`}>{action.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2">
                {inventoryAlerts.length > 0 ? (
                  <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2" />
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Inventory Alerts</h3>
                      </div>
                      <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded-full">{inventoryAlerts.length}</span>
                    </div>
                    <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                      {inventoryAlerts.map((alert, index) => (
                        <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{alert.productName}</p>
                            <p className="text-xs text-gray-600">Stock: <span className="font-medium text-orange-600">{alert.currentStock}</span>{' • '}Min: <span className="font-medium">{alert.minStock}</span></p>
                          </div>
                          <button className="ml-3 px-2 sm:px-3 py-1 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors flex-shrink-0">Restock</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                    <div className="text-center py-6 sm:py-8">
                      <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-3" />
                      <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">All Good!</h3>
                      <p className="text-xs sm:text-sm text-gray-600">No inventory alerts.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">View All<ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Order', 'Customer', 'Amount', 'Status', 'Date', 'Actions'].map((header, i) => (
                        <th key={i} className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase ${(i === 1 && 'hidden sm:table-cell') || (i === 4 && 'hidden md:table-cell')}`}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">#{order._id?.slice(-6)}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{order.shippingInfo?.fullName || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{order.shippingInfo?.email}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">Rs.{order.totalAmount?.toFixed(0)}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="hidden sm:inline">{order.status}</span>
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <button onClick={() => fetchSingleOrder(order._id)} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors" title="View Details"><Eye className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                    <input type="text" placeholder="Search orders..." className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-xs sm:text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <select className="px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={exportOrders} className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium transition-colors text-xs sm:text-sm"><Download className="w-3 h-3 sm:w-4 sm:h-4" />Export</button>
                  <button onClick={fetchOrders} className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 font-medium transition-colors text-xs sm:text-sm"><RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />Refresh</button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Order ID', 'Customer', 'Amount', 'Status', 'Actions'].map((header, i) => (
                        <th key={i} className={`px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase ${i === 1 && 'hidden sm:table-cell'}`}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">#{order._id?.slice(-6) || 'N/A'}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{order.shippingInfo?.fullName || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{order.shippingInfo?.email || 'N/A'}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">Rs.{order.totalAmount?.toFixed(0) || '0'}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="hidden sm:inline">{order.status}</span>
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button onClick={() => fetchSingleOrder(order._id)} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors" title="View Details"><Eye className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                            <select value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {orders.length === 0 && !loading && (
                <div className="text-center py-8 sm:py-12">
                  <Package className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  <h3 className="mt-2 text-xs sm:text-sm font-medium text-gray-900">No orders found</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
              )}
              {loading && (
                <div className="text-center py-8 sm:py-12">
                  <RefreshCw className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-spin" />
                  <p className="mt-2 text-xs sm:text-sm text-gray-600">Loading orders...</p>
                </div>
              )}
            </div>
            {pagination?.totalPages > 1 && (
              <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-gray-700">Showing {((currentPage - 1) * ordersPerPage) + 1} to {Math.min(currentPage * ordersPerPage, pagination.totalOrders || 0)} of {pagination.totalOrders || 0} orders</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                    <span className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700">{currentPage} / {pagination.totalPages}</span>
                    <button onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))} disabled={currentPage >= pagination.totalPages} className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Analytics & Reports</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Track your business performance</p>
                </div>
                <button onClick={fetchOrderStatistics} className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors text-xs sm:text-sm"><RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Refresh</span></button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Monthly Revenue</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics?.revenueData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Monthly Orders</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics?.ordersData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px' }} />
                    <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Top Selling Products</h3>
                <button onClick={exportOrders} className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors"><Download className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Export</span></button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Product', 'SKU', 'Sold', 'Revenue', 'Trend'].map((header, i) => (
                        <th key={i} className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase ${(i === 1 && 'hidden sm:table-cell') || (i === 4 && 'hidden md:table-cell')}`}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesReport?.topProducts?.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg border border-gray-200" src={product.image} alt={product.name} />
                            <div className="ml-3 sm:ml-4">
                              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">{product.sku}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">{product.totalSold}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">Rs.{product.revenue?.toFixed(0)}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap hidden md:table-cell">
                          <span className={`inline-flex items-center gap-1 text-xs sm:text-sm font-medium ${product.trend > 0 ? 'text-green-600' : product.trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {product.trend > 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />}
                            {Math.abs(product.trend)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg sm:rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl my-4">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">Order Details</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Order #{selectedOrder._id?.slice(-8)}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"><XCircle className="w-5 h-5 sm:w-6 sm:h-6" /></button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-2 sm:mb-3 text-gray-900 text-xs sm:text-sm lg:text-base">Order Information</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      {[
                        ['Order ID', `#${selectedOrder._id?.slice(-8)}`],
                        ['Date', new Date(selectedOrder.createdAt).toLocaleDateString()],
                        ['Payment', selectedOrder.paymentMethod],
                        ['Tracking', selectedOrder.trackingNumber || 'Not assigned'],
                        ['Shipping', selectedOrder.shippingMethod?.name || 'N/A']
                      ].map(([label, value], i) => (
                        <div key={i} className="flex justify-between gap-2">
                          <span className="text-gray-600">{label}:</span>
                          {label === 'Status' ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                          ) : (
                            <span className="font-medium truncate">{value}</span>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-2 sm:mb-3 text-gray-900 text-xs sm:text-sm lg:text-base">Customer Information</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      {[
                        ['Name', selectedOrder.shippingInfo?.fullName],
                        ['Email', selectedOrder.shippingInfo?.email],
                        ['Phone', selectedOrder.shippingInfo?.phone]
                      ].map(([label, value], i) => (
                        <div key={i} className="flex justify-between gap-2">
                          <span className="text-gray-600">{label}:</span>
                          <span className="font-medium truncate">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-2 sm:mb-3 text-gray-900 text-xs sm:text-sm lg:text-base">Shipping Address</h3>
                    <div className="text-xs sm:text-sm text-gray-700">
                      <p className="font-medium">{selectedOrder.shippingInfo?.fullName}</p>
                      <p>{selectedOrder.shippingInfo?.address}</p>
                      <p>{selectedOrder.shippingInfo?.city}, {selectedOrder.shippingInfo?.state} {selectedOrder.shippingInfo?.postalCode}</p>
                      <p>{selectedOrder.shippingInfo?.country}</p>
                    </div>
                  </div>
                  {selectedOrder.notes && (
                    <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold mb-2 text-gray-900 text-xs sm:text-sm lg:text-base">Special Notes</h3>
                      <p className="text-xs sm:text-sm text-gray-700">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-3 sm:mb-4 text-gray-900 text-xs sm:text-sm lg:text-base">Order Items</h3>
                  <div className="space-y-3 max-h-56 sm:max-h-80 overflow-y-auto">
                    {selectedOrder.orderItems?.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <img src={item.image || '/api/placeholder/60/60'} alt={item.name} className="w-12 h-12 sm:w-15 sm:h-15 object-cover rounded border" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.qty}</p>
                          <p className="text-xs text-gray-600">Rs.{item.price?.toFixed(0)} each</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-xs sm:text-sm">Rs.{(item.price * item.qty)?.toFixed(0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between"><span>Subtotal:</span><span>Rs.{selectedOrder.orderSummary?.subtotal?.toFixed(0) || '0'}</span></div>
                      <div className="flex justify-between"><span>Shipping:</span><span>Rs.{selectedOrder.orderSummary?.shippingCost?.toFixed(0) || '0'}</span></div>
                      {selectedOrder.orderSummary?.discount > 0 && (<div className="flex justify-between text-green-600"><span>Discount:</span><span>-Rs.{selectedOrder.orderSummary?.discount?.toFixed(0)}</span></div>)}
                      <div className="border-t pt-2 flex justify-between font-bold text-sm sm:text-base"><span>Total:</span><span>Rs.{selectedOrder.totalAmount?.toFixed(0)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
                <select value={selectedOrder.status} onChange={(e) => { updateOrderStatus(selectedOrder._id, e.target.value); setSelectedOrder({...selectedOrder, status: e.target.value}); }} className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button onClick={() => window.print()} className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors text-xs sm:text-sm"><FileText className="w-3 h-3 sm:w-4 sm:h-4" />Print Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;