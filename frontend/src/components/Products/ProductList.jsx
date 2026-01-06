import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, X, ChevronLeft, ChevronRight, Grid3X3, List, Star,
  Heart, ShoppingCart, Eye, RefreshCw, Package, DollarSign,
  Tag, Loader2, CheckCircle, XCircle, Info, Zap, TrendingUp,
  SlidersHorizontal, ArrowUpDown, Sparkles, Award, Clock, Percent
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';

// Advanced Toast Component with Multiple Types
const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { bg: 'bg-gradient-to-r from-green-500 to-emerald-600', icon: <CheckCircle size={20} /> },
    error: { bg: 'bg-gradient-to-r from-red-500 to-rose-600', icon: <XCircle size={20} /> },
    info: { bg: 'bg-gradient-to-r from-blue-500 to-indigo-600', icon: <Info size={20} /> },
    warning: { bg: 'bg-gradient-to-r from-yellow-500 to-orange-600', icon: <Zap size={20} /> }
  };

  const { bg, icon } = config[type] || config.info;

  return (
    <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-2xl shadow-2xl ${bg} text-white backdrop-blur-sm flex items-center gap-3 animate-in slide-in-from-right-5 duration-300 min-w-[300px]`}>
      <div className="flex-shrink-0">{icon}</div>
      <p className="font-semibold text-sm flex-1">{message}</p>
      <button onClick={onClose} className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1 transition-colors">
        <X size={18} />
      </button>
    </div>
  );
};

const ProductList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [filters, setFilters] = useState({
    category: [],
    brand: [],
    minPrice: '',
    maxPrice: '',
    search: '',
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [toasts, setToasts] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  const { addToWishlist, removeFromWishlist, wishlist, addToCart: authAddToCart, user } = useAuth();
  const { formatPrice } = useCurrency();
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimerRef = useRef(null);
  const suggestionsTimerRef = useRef(null);

  const API_BASE = `${process.env.REACT_APP_API_URL}/api/products`;

  // Toast Management
  const showToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Wishlist Check
  const isInWishlist = useCallback((productId) => {
    return wishlist?.some(item => item._id === productId || item.product === productId);
  }, [wishlist]);

  // Handle URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: [decodeURIComponent(categoryParam)] }));
    }
  }, [location.search]);

  // Fetch products with advanced sorting
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Filters
      if (filters.category.length > 0) filters.category.forEach(cat => params.append('category', cat));
      if (filters.brand.length > 0) filters.brand.forEach(brand => params.append('brand', brand));
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.search.trim()) params.append('search', filters.search.trim());
      
      params.append('page', currentPage);
      params.append('limit', 12);

      const response = await fetch(`${API_BASE}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      let productsData = data.products || [];

      // Client-side sorting (since backend only sorts by newest)
      productsData = sortProducts(productsData, sortBy);
      
      setProducts(productsData);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.totalProducts || 0);
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, currentPage, showToast]);

  // Advanced Sorting Function
  const sortProducts = (products, sortType) => {
    const sorted = [...products];
    
    switch(sortType) {
      case 'price-low':
        return sorted.sort((a, b) => {
          const priceA = a.discountedPrice > 0 ? a.discountedPrice : a.price;
          const priceB = b.discountedPrice > 0 ? b.discountedPrice : b.price;
          return priceA - priceB;
        });
      case 'price-high':
        return sorted.sort((a, b) => {
          const priceA = a.discountedPrice > 0 ? a.discountedPrice : a.price;
          const priceB = b.discountedPrice > 0 ? b.discountedPrice : b.price;
          return priceB - priceA;
        });
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'discount':
        return sorted.sort((a, b) => {
          const discountA = a.discountedPrice > 0 ? ((a.price - a.discountedPrice) / a.price) * 100 : 0;
          const discountB = b.discountedPrice > 0 ? ((b.price - b.discountedPrice) / b.price) * 100 : 0;
          return discountB - discountA;
        });
      case 'featured':
        return sorted.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
      case 'stock':
        return sorted.sort((a, b) => b.stock - a.stock);
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  // Fetch filters
  const fetchFilters = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/filters`);
      if (!response.ok) throw new Error('Failed to fetch filters');
      const data = await response.json();
      setCategories(data.categories || []);
      setBrands(data.brands || []);
      setPriceRange(data.priceRange || { min: 0, max: 10000 });
    } catch (error) {
      console.error('Error:', error);
    }
  }, []);

  // Search suggestions with debounce
  const fetchSearchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/suggestions?q=${encodeURIComponent(query.trim())}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setSearchSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSearchSuggestions([]);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchFilters(); }, [fetchFilters]);

  // Debounced search - Using refs to avoid re-renders
  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
    
    // Clear existing timers
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (suggestionsTimerRef.current) clearTimeout(suggestionsTimerRef.current);
    
    // Fetch suggestions faster (300ms)
    suggestionsTimerRef.current = setTimeout(() => {
      fetchSearchSuggestions(value);
    }, 300);
    
    // Update filters slower (500ms)
    searchTimerRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      setCurrentPage(1);
    }, 500);
  }, [fetchSearchSuggestions]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (suggestionsTimerRef.current) clearTimeout(suggestionsTimerRef.current);
    };
  }, []);

  // Count active filters
  useEffect(() => {
    const count = filters.category.length + filters.brand.length + 
                  (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0) + 
                  (filters.search ? 1 : 0);
    setActiveFiltersCount(count);
  }, [filters]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckboxChange = useCallback((e) => {
    const { name, value, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: checked ? [...prev[name], value] : prev[name].filter(item => item !== value)
    }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ category: [], brand: [], minPrice: '', maxPrice: '', search: '' });
    handleSearchChange('');
    setCurrentPage(1);
    showToast('info', 'All filters cleared');
  }, [showToast, handleSearchChange]);

  const toggleWishlist = useCallback(async (productId, e) => {
    e?.stopPropagation();
    if (!user) {
      showToast('warning', 'Please login to manage wishlist');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
        showToast('success', 'Removed from wishlist');
      } else {
        await addToWishlist(productId);
        showToast('success', 'Added to wishlist ❤️');
      }
    } catch (error) {
      showToast('error', 'Failed to update wishlist');
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist, showToast, user, navigate]);

  const addToCart = useCallback(async (productId, e) => {
    e?.stopPropagation();
    if (!user) {
      showToast('warning', 'Please login to add to cart');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      if (authAddToCart) {
        await authAddToCart(productId, 1);
        showToast('success', 'Added to cart 🛒');
      }
    } catch (error) {
      showToast('error', 'Failed to add to cart');
    }
  }, [authAddToCart, showToast, user, navigate]);

  const handleSuggestionClick = useCallback((suggestion) => {
    handleSearchChange(suggestion);
    setShowSuggestions(false);
    setCurrentPage(1);
  }, [handleSearchChange]);

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={14}
            className={`${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1 font-semibold">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Advanced Product Card Component
  const ProductCard = ({ product }) => {
    const hasDiscount = product.discountedPrice && product.discountedPrice > 0 && product.discountedPrice < product.price;
    const discountPercent = hasDiscount 
      ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
      : 0;
    const finalPrice = hasDiscount ? product.discountedPrice : product.price;
    const isLowStock = product.stock > 0 && product.stock < 10;
    const isOutOfStock = product.stock === 0;

    return (
      <div 
        onClick={() => navigate(`/product/${product._id}`)}
        className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-gray-100 hover:border-orange-400 flex flex-col h-full cursor-pointer transform hover:-translate-y-2"
      >
        {/* Image Container with Advanced Badges */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 aspect-square">
          <img
            src={product.image || '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
            onError={(e) => { e.target.src = '/placeholder.jpg'; }}
          />
          
          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.isFeatured && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-xl flex items-center gap-1 animate-pulse">
                <Award size={14} />
                FEATURED
              </span>
            )}
            {hasDiscount && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full shadow-xl flex items-center gap-1">
                <Percent size={14} />
                {discountPercent}% OFF
              </span>
            )}
            {isOutOfStock && (
              <span className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-full shadow-xl">
                OUT OF STOCK
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-xl flex items-center gap-1">
                <Clock size={14} />
                ONLY {product.stock} LEFT
              </span>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <button
              onClick={(e) => toggleWishlist(product._id, e)}
              className={`p-3 rounded-full shadow-2xl transition-all hover:scale-125 backdrop-blur-sm ${
                isInWishlist(product._id)
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 text-gray-700 hover:bg-red-50'
              }`}
              title={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={20} className={isInWishlist(product._id) ? 'fill-current' : ''} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/product/${product._id}`); }}
              className="p-3 bg-white/90 text-gray-700 rounded-full shadow-2xl hover:bg-blue-50 transition-all hover:scale-125 backdrop-blur-sm"
              title="View details"
            >
              <Eye size={20} />
            </button>
          </div>

          {/* Add to Cart Button - Bottom Overlay */}
          {!isOutOfStock && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
              <button
                onClick={(e) => addToCart(product._id, e)}
                className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105"
              >
                <ShoppingCart size={20} />
                <span>Add to Cart</span>
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex flex-col flex-1">
          {/* Category & Brand Tags */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {product.category && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
                {product.category}
              </span>
            )}
            {product.brand && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200">
                {product.brand}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-orange-600 transition-colors leading-tight">
            {product.name}
          </h3>

          {/* Rating & Reviews */}
          {product.rating > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2">
                {renderStars(product.rating)}
                {product.numReviews > 0 && (
                  <span className="text-xs text-gray-500">
                    ({product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Price Section */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                {formatPrice(finalPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through font-semibold">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Stock & Savings Info */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {!isOutOfStock ? (
                  <span className={`flex items-center gap-1 font-bold ${isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                    <CheckCircle size={14} />
                    {isLowStock ? `Only ${product.stock}` : 'In Stock'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 font-bold">
                    <XCircle size={14} />
                    Out of Stock
                  </span>
                )}
              </div>
              {hasDiscount && (
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <TrendingUp size={14} />
                  Save {formatPrice(product.price - product.discountedPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Advanced Filter Sidebar
  const FilterSidebar = () => (
    <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:relative lg:bg-transparent' : 'hidden lg:block'} lg:w-80`}>
      <div className={`${showFilters ? 'fixed right-0 top-0 h-full w-80 sm:w-96 transform transition-transform animate-in slide-in-from-right duration-300' : ''} bg-white h-full overflow-y-auto shadow-2xl rounded-2xl lg:sticky lg:top-4`}>
        {/* Header */}
        <div className="p-5 border-b-2 border-orange-200 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <SlidersHorizontal className="text-white" size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Filters</h3>
                {activeFiltersCount > 0 && (
                  <p className="text-xs text-white/90 font-semibold">{activeFiltersCount} active</p>
                )}
              </div>
            </div>
            {showFilters && (
              <button onClick={() => setShowFilters(false)} className="lg:hidden p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X size={22} className="text-white" />
              </button>
            )}
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Advanced Search with Suggestions */}
          <div className="space-y-3" ref={searchRef}>
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <Search size={18} className="text-orange-500" />
              <h4 className="text-sm sm:text-base">Search Products</h4>
            </div>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => {
                  handleSearchChange(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full px-4 py-3 pl-11 pr-11 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-medium transition-all"
                placeholder="Search by name, brand, category..."
                autoComplete="off"
              />
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              {searchInput && (
                <button 
                  onClick={() => { 
                    handleSearchChange(''); 
                    setSearchSuggestions([]); 
                  }} 
                  className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-orange-200 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-center gap-2 border-b border-gray-100 last:border-0"
                    >
                      <Search size={14} className="text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Advanced Price Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-gray-900 font-bold">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-green-500" />
                <h4 className="text-sm sm:text-base">Price Range</h4>
              </div>
              {(filters.minPrice || filters.maxPrice) && (
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
                    setCurrentPage(1);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <X size={14} />
                  Clear
                </button>
              )}
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border-2 border-orange-200">
              {/* Price Inputs */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block font-bold">Min Price</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={filters.maxPrice || priceRange.max}
                      value={filters.minPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Validate: min should not be greater than max
                        if (filters.maxPrice && Number(value) > Number(filters.maxPrice)) {
                          showToast('warning', 'Min price cannot be greater than max price');
                          return;
                        }
                        setFilters(prev => ({ ...prev, minPrice: value }));
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block font-bold">Max Price</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={filters.minPrice || 0}
                      value={filters.maxPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Validate: max should not be less than min
                        if (filters.minPrice && Number(value) < Number(filters.minPrice)) {
                          showToast('warning', 'Max price cannot be less than min price');
                          return;
                        }
                        setFilters(prev => ({ ...prev, maxPrice: value }));
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                      placeholder={priceRange.max}
                    />
                  </div>
                </div>
              </div>

              {/* Visual Price Range Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600 font-semibold">
                  <span>Available Range:</span>
                  <span>{formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}</span>
                </div>
                
                {/* Visual Range Bar */}
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-orange-500 to-red-500"
                    style={{
                      left: `${((filters.minPrice || priceRange.min) / priceRange.max) * 100}%`,
                      right: `${100 - ((filters.maxPrice || priceRange.max) / priceRange.max) * 100}%`
                    }}
                  />
                </div>

                {/* Selected Range Display */}
                {(filters.minPrice || filters.maxPrice) && (
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-orange-600">
                      Selected: {formatPrice(filters.minPrice || priceRange.min)} - {formatPrice(filters.maxPrice || priceRange.max)}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Price Buttons */}
              <div className="mt-3 pt-3 border-t-2 border-orange-200">
                <p className="text-xs text-gray-600 font-bold mb-2">Quick Select:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '50' }));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs font-bold hover:border-orange-500 hover:bg-orange-50 transition-all"
                  >
                    Under {formatPrice(50)}
                  </button>
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, minPrice: '50', maxPrice: '100' }));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs font-bold hover:border-orange-500 hover:bg-orange-50 transition-all"
                  >
                    {formatPrice(50)} - {formatPrice(100)}
                  </button>
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, minPrice: '100', maxPrice: '200' }));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs font-bold hover:border-orange-500 hover:bg-orange-50 transition-all"
                  >
                    {formatPrice(100)} - {formatPrice(200)}
                  </button>
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, minPrice: '200', maxPrice: '' }));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs font-bold hover:border-orange-500 hover:bg-orange-50 transition-all"
                  >
                    Over {formatPrice(200)}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Categories with Count */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <Tag size={18} className="text-blue-500" />
              <h4 className="text-sm sm:text-base">Categories</h4>
              {filters.category.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-bold">
                  {filters.category.length}
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
              {categories.length > 0 ? categories.map((cat) => (
                <label key={cat} className="flex items-center gap-3 p-3 hover:bg-white rounded-xl cursor-pointer transition-all group border-2 border-transparent hover:border-blue-200">
                  <input
                    type="checkbox"
                    name="category"
                    value={cat}
                    checked={filters.category.includes(cat)}
                    onChange={handleCheckboxChange}
                    className="w-5 h-5 text-orange-500 border-2 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 font-semibold group-hover:text-orange-600 transition-colors flex-1">{cat}</span>
                </label>
              )) : (
                <p className="text-sm text-gray-500 text-center py-4">No categories available</p>
              )}
            </div>
          </div>

          {/* Brands with Count */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <Package size={18} className="text-purple-500" />
              <h4 className="text-sm sm:text-base">Brands</h4>
              {filters.brand.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full font-bold">
                  {filters.brand.length}
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
              {brands.length > 0 ? brands.map((brand) => (
                <label key={brand} className="flex items-center gap-3 p-3 hover:bg-white rounded-xl cursor-pointer transition-all group border-2 border-transparent hover:border-purple-200">
                  <input
                    type="checkbox"
                    name="brand"
                    value={brand}
                    checked={filters.brand.includes(brand)}
                    onChange={handleCheckboxChange}
                    className="w-5 h-5 text-orange-500 border-2 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 font-semibold group-hover:text-orange-600 transition-colors flex-1">{brand}</span>
                </label>
              )) : (
                <p className="text-sm text-gray-500 text-center py-4">No brands available</p>
              )}
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="w-full px-5 py-3.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-bold hover:from-gray-200 hover:to-gray-300 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg border-2 border-gray-300"
          >
            <RefreshCw size={18} />
            <span>Reset All Filters</span>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50 py-6 sm:py-8">
      {/* Toast Container */}
      <div className="fixed top-0 right-0 z-[9999] space-y-2 p-4">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} message={toast.message} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-[1600px]">
        {/* Advanced Page Header */}
        <div className="mb-6 sm:mb-8 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
              <Sparkles className="text-white" size={32} />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Discover Products
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Explore our amazing collection of {totalProducts} premium products
          </p>
        </div>

        {/* Advanced Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-6 bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-200">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden px-5 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white border-2 border-orange-600 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Filter size={20} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-2.5 py-0.5 bg-white text-orange-600 text-xs rounded-full font-black animate-pulse">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none">
            {/* Advanced Sort Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:min-w-[220px] pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm bg-white shadow-md appearance-none cursor-pointer hover:border-orange-400 transition-all"
              >
                <option value="newest">🆕 Newest First</option>
                <option value="oldest">📅 Oldest First</option>
                <option value="price-low">💰 Price: Low to High</option>
                <option value="price-high">💎 Price: High to Low</option>
                <option value="name-asc">🔤 Name: A to Z</option>
                <option value="name-desc">🔤 Name: Z to A</option>
                <option value="rating">⭐ Highest Rated</option>
                <option value="discount">🔥 Best Discount</option>
                <option value="featured">👑 Featured</option>
                <option value="stock">📦 Most Stock</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 transition-all ${viewMode === 'grid' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Grid View"
              >
                <Grid3X3 size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="List View"
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 lg:gap-6">
          <FilterSidebar />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <Loader2 className="w-20 h-20 animate-spin mx-auto mb-6 text-orange-500" />
                  <p className="text-gray-900 font-bold text-xl">Loading amazing products...</p>
                  <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-2xl shadow-xl border-2 border-gray-200">
                <div className="bg-gradient-to-br from-orange-100 to-red-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="text-orange-500" size={64} />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-3">No products found</h3>
                <p className="text-gray-600 mb-6 font-medium">Try adjusting your filters or search terms</p>
                <button
                  onClick={resetFilters}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                {/* Results Info with Active Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 p-5 bg-white rounded-2xl shadow-lg border-2 border-gray-200">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm sm:text-base text-gray-700 font-bold">
                      Showing <span className="text-orange-600 text-lg">{products.length}</span> of{' '}
                      <span className="text-orange-600 text-lg">{totalProducts}</span> products
                    </p>
                    {activeFiltersCount > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {filters.search && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs rounded-full font-bold flex items-center gap-1.5 border-2 border-blue-300">
                            <Search size={12} />
                            "{filters.search}"
                            <button onClick={() => { setSearchInput(''); setFilters(prev => ({ ...prev, search: '' })); }} className="hover:bg-blue-300 rounded-full p-0.5">
                              <X size={12} />
                            </button>
                          </span>
                        )}
                        {filters.category.map(cat => (
                          <span key={cat} className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs rounded-full font-bold flex items-center gap-1.5 border-2 border-green-300">
                            <Tag size={12} />
                            {cat}
                            <button onClick={() => setFilters(prev => ({ ...prev, category: prev.category.filter(c => c !== cat) }))} className="hover:bg-green-300 rounded-full p-0.5">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        {filters.brand.map(brand => (
                          <span key={brand} className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-xs rounded-full font-bold flex items-center gap-1.5 border-2 border-purple-300">
                            <Package size={12} />
                            {brand}
                            <button onClick={() => setFilters(prev => ({ ...prev, brand: prev.brand.filter(b => b !== brand) }))} className="hover:bg-purple-300 rounded-full p-0.5">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        {(filters.minPrice || filters.maxPrice) && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 text-xs rounded-full font-bold flex items-center gap-1.5 border-2 border-yellow-300">
                            <DollarSign size={12} />
                            {filters.minPrice || '0'} - {filters.maxPrice || '∞'}
                            <button onClick={() => setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))} className="hover:bg-yellow-300 rounded-full p-0.5">
                              <X size={12} />
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Products Grid */}
                <div className={`grid gap-5 sm:gap-6 mb-8 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Advanced Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 bg-white p-5 rounded-2xl shadow-lg border-2 border-gray-200">
                    <button
                      onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentPage === 1}
                      className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold hover:border-orange-500 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:hover:bg-white disabled:hover:border-gray-300"
                    >
                      <ChevronLeft size={20} />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (currentPage <= 4) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = currentPage - 3 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`w-12 h-12 rounded-xl font-black transition-all shadow-md ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white scale-110 shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border-2 border-gray-300 hover:border-orange-400'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentPage === totalPages}
                      className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold hover:border-orange-500 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:hover:bg-white disabled:hover:border-gray-300"
                    >
                      <span>Next</span>
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
