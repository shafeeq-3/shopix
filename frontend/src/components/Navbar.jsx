import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Trash2, 
  ShoppingCart,
  Crown,
  UserCircle,
  ChevronDown,
  Store,
  Settings,
  Package,
  Home,
  LayoutDashboard,
  Users,
  ShoppingBag,
  Bell,
  Search,
  TrendingUp,
  Boxes,
  ListOrdered
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import CartSidebar from "./Cart/CartSidebar";
import CurrencySelector from "./CurrencySelector";

const Navbar = () => {
  const { user, logoutUser, wishlist, removeFromWishlist } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const wishlistRef = useRef(null);
  const userMenuRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setWishlistOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wishlistRef.current && !wishlistRef.current.contains(event.target)) {
        setWishlistOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWishlistItemClick = () => {
    setWishlistOpen(false);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logoutUser();
    setMenuOpen(false);
    setUserMenuOpen(false);
    navigate('/');
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/98 backdrop-blur-lg shadow-2xl border-b-2 border-orange-200' 
          : 'bg-gradient-to-r from-orange-600 via-red-600 to-pink-600'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 group">
              <img 
                src={scrolled ? "/logo-shopix.svg" : "/logo-shopix-dark.svg"} 
                alt="SHOPIX" 
                className="h-8 sm:h-10 lg:h-12 w-auto transition-all duration-300 group-hover:scale-110"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Currency Selector */}
              <CurrencySelector />
              
              {!user ? (
                /* Guest User Buttons */
                <div className="flex items-center gap-2">
                  {/* Products Link for Guests */}
                  <Link to="/products">
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                      scrolled 
                        ? 'text-gray-700 hover:text-orange-600 hover:bg-orange-50' 
                        : 'text-white hover:text-orange-200 hover:bg-white/10'
                    }`}>
                      <Boxes className="w-4 h-4" />
                      <span>Shop</span>
                    </button>
                  </Link>
                  
                  <Link to="/login">
                    <button className={`px-5 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                      scrolled 
                        ? 'text-gray-700 hover:text-orange-600 hover:bg-orange-50' 
                        : 'text-white hover:text-orange-200 hover:bg-white/10'
                    }`}>
                      Login
                    </button>
                  </Link>
                  <Link to="/register">
                    <button className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:from-orange-600 hover:to-red-600">
                      Register
                    </button>
                  </Link>
                </div>
              ) : (
                /* Logged In User Navigation */
                <div className="flex items-center gap-1">
                  {/* Home Link */}
                  <Link to="/">
                    <button className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                      isActivePath('/') 
                        ? scrolled 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                          : 'bg-white/20 text-white shadow-md'
                        : scrolled 
                        ? 'text-gray-700 hover:text-orange-600 hover:bg-orange-50' 
                        : 'text-white hover:text-orange-200 hover:bg-white/10'
                    }`}>
                      <Home className="w-4 h-4" />
                      <span className="hidden xl:inline">Home</span>
                    </button>
                  </Link>

                  {/* Products/Shop Link */}
                  <Link to="/products">
                    <button className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                      isActivePath('/products') 
                        ? scrolled 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                          : 'bg-white/20 text-white shadow-md'
                        : scrolled 
                        ? 'text-gray-700 hover:text-orange-600 hover:bg-orange-50' 
                        : 'text-white hover:text-orange-200 hover:bg-white/10'
                    }`}>
                      <Boxes className="w-4 h-4" />
                      <span className="hidden xl:inline">Shop</span>
                    </button>
                  </Link>

                  {/* My Orders Link */}
                  <Link to="/trackmyorder">
                    <button className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                      isActivePath('/trackmyorder') 
                        ? scrolled 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                          : 'bg-white/20 text-white shadow-md'
                        : scrolled 
                        ? 'text-gray-700 hover:text-orange-600 hover:bg-orange-50' 
                        : 'text-white hover:text-orange-200 hover:bg-white/10'
                    }`}>
                      <ListOrdered className="w-4 h-4" />
                      <span className="hidden xl:inline">Orders</span>
                    </button>
                  </Link>

                  {/* Wishlist Dropdown */}
                  <div className="relative" ref={wishlistRef}>
                    <button
                      onClick={() => setWishlistOpen(!wishlistOpen)}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                        scrolled 
                          ? 'text-gray-700 hover:bg-orange-50' 
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="relative">
                        <Heart className={`w-5 h-5 ${wishlist?.length > 0 ? 'fill-red-500 text-red-500' : 'text-red-500'}`} />
                        {wishlist?.length > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                            {wishlist.length}
                          </span>
                        )}
                      </div>
                      <span className="hidden xl:inline">Wishlist</span>
                    </button>

                    {/* Wishlist Dropdown Menu */}
                    {wishlistOpen && (
                      <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border-2 border-orange-200 z-50 animate-in slide-in-from-top-4 duration-300">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-t-2xl">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Heart className="w-5 h-5 fill-white" />
                            Your Wishlist
                            {wishlist?.length > 0 && (
                              <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">
                                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
                              </span>
                            )}
                          </h3>
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto">
                          {wishlist?.length > 0 ? (
                            <div className="p-3 space-y-2">
                              {wishlist.map((item) => (
                                <div key={item._id} className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl transition-all duration-200 group border border-transparent hover:border-orange-200">
                                  <Link
                                    to={`/product/${item._id}`} 
                                    onClick={handleWishlistItemClick}
                                    className="flex items-center gap-3 flex-1 min-w-0"
                                  >
                                    <div className="relative">
                                      <img 
                                        src={item.image} 
                                        alt={item.name} 
                                        className="w-16 h-16 rounded-xl object-cover shadow-md group-hover:shadow-lg transition-shadow" 
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">{item.name}</p>
                                      <p className="text-base font-bold text-orange-600">{formatPrice(item.price)}</p>
                                    </div>
                                  </Link>
                                  <button 
                                    onClick={() => removeFromWishlist(item._id)} 
                                    className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200 hover:scale-110"
                                    title="Remove from wishlist"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-12 text-center">
                              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                                <Heart className="w-10 h-10 text-orange-400" />
                              </div>
                              <p className="text-gray-900 font-semibold text-lg mb-2">Your wishlist is empty</p>
                              <p className="text-sm text-gray-500">Start adding items you love!</p>
                            </div>
                          )}
                        </div>
                        
                        {wishlist?.length > 0 && (
                          <div className="p-3 border-t-2 border-orange-100">
                            <Link to="/wishlist" onClick={() => setWishlistOpen(false)}>
                              <button className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105">
                                View All Wishlist
                              </button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cart Component */}
                  <CartSidebar />

                  {/* User Menu Dropdown */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                        scrolled 
                          ? 'text-gray-700 hover:bg-orange-50 border-2 border-transparent hover:border-orange-200' 
                          : 'text-white hover:bg-white/10 border-2 border-white/20'
                      }`}
                    >
                      <div className="relative">
                        {user?.avatar ? (
                          <img 
                            src={`${process.env.REACT_APP_API_URL}${user.avatar}`}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-lg"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold shadow-lg">
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {user?.role === "admin" && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                            <Crown className="w-3 h-3 text-yellow-900" />
                          </div>
                        )}
                      </div>
                      <span className="max-w-[100px] truncate font-semibold hidden xl:inline">{user?.name}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* User Dropdown Menu */}
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border-2 border-orange-200 py-2 z-50 animate-in slide-in-from-top-4 duration-300">
                        {/* User Info Header */}
                        <div className="px-4 py-4 border-b-2 border-orange-100 bg-gradient-to-r from-orange-50 to-red-50">
                          <div className="flex items-center gap-3">
                            {user?.avatar ? (
                              <img 
                                src={`${process.env.REACT_APP_API_URL}${user.avatar}`}
                                alt={user.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-orange-300 shadow-md"
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                {user?.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                              {user?.role === "admin" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 text-xs font-bold text-yellow-800 bg-yellow-200 rounded-full border border-yellow-300">
                                  <Crown className="w-3 h-3" />
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Regular User Menu Items */}
                        <div className="py-2">
                          <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all group">
                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-orange-100 transition-colors">
                              <User className="w-4 h-4 text-blue-600 group-hover:text-orange-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">My Profile</p>
                              <p className="text-xs text-gray-500">View and edit profile</p>
                            </div>
                          </Link>
                          
                          <Link to="/trackmyorder" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all group">
                            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-orange-100 transition-colors">
                              <ListOrdered className="w-4 h-4 text-purple-600 group-hover:text-orange-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">My Orders</p>
                              <p className="text-xs text-gray-500">Track your orders</p>
                            </div>
                          </Link>

                          <Link to="/update-profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all group">
                            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-orange-100 transition-colors">
                              <Settings className="w-4 h-4 text-green-600 group-hover:text-orange-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">Settings</p>
                              <p className="text-xs text-gray-500">Account settings</p>
                            </div>
                          </Link>
                        </div>
                        
                        {/* Admin Section */}
                        {user?.role === "admin" && (
                          <>
                            <div className="my-2 border-t-2 border-orange-100"></div>
                            <div className="px-4 py-2">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Crown className="w-3 h-3 text-yellow-500" />
                                Admin Panel
                              </p>
                            </div>
                            <div className="py-2">
                              <Link to="/admin/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-all group">
                                <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                                  <LayoutDashboard className="w-4 h-4 text-yellow-600 group-hover:text-yellow-700" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">Admin Dashboard</p>
                                  <p className="text-xs text-gray-500">Manage everything</p>
                                </div>
                              </Link>
                            </div>
                          </>
                        )}

                        {/* Logout */}
                        <div className="mt-2 border-t-2 border-orange-100 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-all group"
                          >
                            <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                              <LogOut className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-sm">Sign Out</p>
                              <p className="text-xs text-gray-500">Logout from account</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button & Icons */}
            <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
              {/* Currency Selector - Mobile */}
              <div className="hidden sm:block">
                <CurrencySelector />
              </div>
              
              {user && (
                <>
                  {/* Mobile Cart Icon */}
                  <CartSidebar />
                  
                  {/* Mobile Wishlist Icon */}
                  <button
                    onClick={() => setWishlistOpen(!wishlistOpen)}
                    className={`relative p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                      scrolled ? 'text-gray-700 hover:bg-orange-50' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${wishlist?.length > 0 ? 'fill-red-500 text-red-500' : 'text-red-500'}`} />
                    {wishlist?.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                        {wishlist.length}
                      </span>
                    )}
                  </button>
                </>
              )}
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  scrolled ? 'text-gray-700 hover:bg-orange-50' : 'text-white hover:bg-white/10'
                }`}
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t-2 border-orange-200 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="px-3 sm:px-4 py-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {!user ? (
                /* Guest User - Mobile */
                <div className="space-y-2">
                  {/* Products Link for Guests */}
                  <Link to="/products" onClick={() => setMenuOpen(false)}>
                    <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold border-2 ${
                      isActivePath('/products')
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md border-transparent'
                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600 border-transparent hover:border-orange-200'
                    }`}>
                      <Boxes className="w-5 h-5" />
                      Browse Products
                    </button>
                  </Link>
                  
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-semibold transition-all flex items-center gap-3 border-2 border-transparent hover:border-orange-200">
                      <User className="w-5 h-5" />
                      Login to Your Account
                    </button>
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}>
                    <button className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-center shadow-lg hover:shadow-xl transition-all hover:scale-105">
                      Create New Account
                    </button>
                  </Link>
                  
                  {/* Currency Selector for Mobile Guest */}
                  <div className="pt-4 border-t-2 border-gray-200 sm:hidden">
                    <p className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Currency</p>
                    <div className="px-2">
                      <CurrencySelector />
                    </div>
                  </div>
                </div>
              ) : (
                /* Logged In User - Mobile */
                <>
                  {/* User Info Card */}
                  <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 shadow-sm">
                    <div className="relative">
                      {user?.avatar ? (
                        <img 
                          src={`${process.env.REACT_APP_API_URL}${user.avatar}`}
                          alt={user.name}
                          className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-lg border-3 border-white">
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {user?.role === "admin" && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                          <Crown className="w-4 h-4 text-yellow-900" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate text-base">{user?.name}</p>
                      <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                      {user?.role === "admin" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 text-xs font-bold text-yellow-800 bg-yellow-200 rounded-full border border-yellow-300">
                          <Crown className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1">
                    <Link to="/" onClick={() => setMenuOpen(false)}>
                      <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold ${
                        isActivePath('/') 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600 border-2 border-transparent hover:border-orange-200'
                      }`}>
                        <Home className="w-5 h-5" />
                        <span>Home</span>
                      </button>
                    </Link>

                    <Link to="/products" onClick={() => setMenuOpen(false)}>
                      <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold ${
                        isActivePath('/products') 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600 border-2 border-transparent hover:border-orange-200'
                      }`}>
                        <Boxes className="w-5 h-5" />
                        <span>Shop Products</span>
                      </button>
                    </Link>

                    <Link to="/profile" onClick={() => setMenuOpen(false)}>
                      <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold ${
                        isActivePath('/profile') 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600 border-2 border-transparent hover:border-orange-200'
                      }`}>
                        <User className="w-5 h-5" />
                        <span>My Profile</span>
                      </button>
                    </Link>

                    <Link to="/trackmyorder" onClick={() => setMenuOpen(false)}>
                      <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold ${
                        isActivePath('/trackmyorder') 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600 border-2 border-transparent hover:border-orange-200'
                      }`}>
                        <ListOrdered className="w-5 h-5" />
                        <span>My Orders</span>
                      </button>
                    </Link>

                    <Link to="/update-profile" onClick={() => setMenuOpen(false)}>
                      <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all font-semibold border-2 border-transparent hover:border-orange-200">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                      </button>
                    </Link>
                  </div>

                  {/* Admin Section */}
                  {user?.role === "admin" && (
                    <>
                      <div className="my-3 border-t-2 border-orange-200"></div>
                      <div className="px-4 py-2 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Panel</p>
                      </div>
                      
                      <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)}>
                        <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 rounded-xl transition-all font-semibold border-2 border-yellow-200 hover:border-yellow-300 bg-yellow-50/50">
                          <LayoutDashboard className="w-5 h-5 text-yellow-600" />
                          <span>Admin Dashboard</span>
                        </button>
                      </Link>
                    </>
                  )}

                  {/* Currency Selector for Mobile */}
                  <div className="pt-3 border-t-2 border-gray-200 sm:hidden">
                    <p className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Currency</p>
                    <div className="px-2">
                      <CurrencySelector />
                    </div>
                  </div>

                  <div className="my-3 border-t-2 border-gray-200"></div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold border-2 border-red-200 hover:border-red-300"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mobile Wishlist Dropdown */}
        {wishlistOpen && user && (
          <div className="lg:hidden bg-white border-t-2 border-orange-200 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="p-3 sm:p-4">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-xl mb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 fill-white" />
                  Your Wishlist
                  {wishlist?.length > 0 && (
                    <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">
                      {wishlist.length}
                    </span>
                  )}
                </h3>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {wishlist?.length > 0 ? (
                  wishlist.map((item) => (
                    <div key={item._id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-all">
                      <Link 
                        to={`/product/${item._id}`} 
                        onClick={handleWishlistItemClick}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-16 h-16 rounded-xl object-cover shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-base font-bold text-orange-600">{formatPrice(item.price)}</p>
                        </div>
                      </Link>
                      <button 
                        onClick={() => removeFromWishlist(item._id)} 
                        className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all hover:scale-110 shadow-md"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                      <Heart className="w-10 h-10 text-orange-400" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">Your wishlist is empty</p>
                    <p className="text-sm text-gray-500">Start adding items you love!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Spacer */}
      <div className="h-14 sm:h-16"></div>
    </>
  );
};

export default Navbar;