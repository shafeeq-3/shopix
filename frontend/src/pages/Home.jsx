import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Star, ArrowRight, Truck, Shield, Clock, Tag, ChevronRight } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCategories();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products?limit=8&sort=newest`);
      const data = await response.json();
      setFeaturedProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products/filters`);
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  return (
    <div>
      {/* Hero Banner - Modern E-commerce Style */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6">
              <Tag className="text-white mr-2" size={14} />
              <span className="text-white text-xs sm:text-sm font-semibold">New Arrivals Available</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Discover Amazing Products at
              <span className="block text-yellow-300">Unbeatable Prices</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed">
              Shop from thousands of products across multiple categories. Fast shipping, secure payments, and quality guaranteed.
            </p>
            
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Link 
                to="/products" 
                className="inline-flex items-center justify-center bg-white text-orange-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <ShoppingBag className="mr-2" size={20} />
                Shop Now
                <ArrowRight className="ml-2" size={18} />
              </Link>
              
              <Link 
                to="/products" 
                className="inline-flex items-center justify-center bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-white hover:text-orange-600 transition-all"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories - Modern Grid */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
              <p className="text-sm sm:text-base text-gray-600">Find what you're looking for</p>
            </div>
            <Link to="/products" className="hidden sm:flex items-center text-orange-600 font-semibold hover:text-orange-700">
              View All
              <ChevronRight size={20} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.slice(0, 6).map((category, index) => (
              <button
                key={index}
                onClick={() => navigate(`/products?category=${encodeURIComponent(category)}`)}
                className="group bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-orange-500"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:from-orange-500 group-hover:to-orange-600 transition-all">
                  <ShoppingBag className="text-orange-600 group-hover:text-white transition-colors" size={20} />
                </div>
                <h3 className="font-semibold text-gray-800 text-center group-hover:text-orange-600 transition-colors text-xs sm:text-sm">
                  {category}
                </h3>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Modern Cards */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
              <p className="text-sm sm:text-base text-gray-600">Handpicked items just for you</p>
            </div>
            <Link to="/products" className="hidden sm:flex items-center text-orange-600 font-semibold hover:text-orange-700">
              View All Products
              <ChevronRight size={20} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl overflow-hidden">
                  <div className="h-64 bg-gray-200 animate-pulse"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-gray-100 hover:border-orange-500"
                >
                  <div className="relative h-64 bg-gray-50 overflow-hidden">
                    <img
                      src={product.image || product.images?.[0]?.url || 'https://via.placeholder.com/400'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.stock <= 5 && product.stock > 0 && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Only {product.stock} left!
                      </span>
                    )}
                    {product.discountedPrice && product.discountedPrice > 0 && product.discountedPrice < product.price && (
                      <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors h-12">
                      {product.name}
                    </h3>
                    
                    {product.rating && (
                      <div className="flex items-center space-x-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                        <span className="text-xs text-gray-600 ml-1">({product.rating.toFixed(1)})</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-orange-600">
                          {formatPrice(product.discountedPrice && product.discountedPrice > 0 && product.discountedPrice < product.price ? product.discountedPrice : product.price)}
                        </span>
                        {product.discountedPrice && product.discountedPrice > 0 && product.discountedPrice < product.price && (
                          <span className="text-sm text-gray-400 line-through ml-2">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:mt-10">
            <Link 
              to="/products" 
              className="inline-flex items-center bg-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              View All Products
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Modern Design */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Why Shop with SHOPIX?</h2>
            <p className="text-gray-400 text-base sm:text-lg">Your satisfaction is our priority</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Free Shipping</h3>
              <p className="text-sm sm:text-base text-gray-400">On orders over $50</p>
            </div>
            
            <div className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Secure Payment</h3>
              <p className="text-sm sm:text-base text-gray-400">100% protected transactions</p>
            </div>
            
            <div className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">24/7 Support</h3>
              <p className="text-sm sm:text-base text-gray-400">Always here to help</p>
            </div>
            
            <div className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Best Prices</h3>
              <p className="text-sm sm:text-base text-gray-400">Competitive pricing guaranteed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 md:py-16 bg-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Get Exclusive Deals & Updates</h2>
            <p className="text-orange-100 mb-6 sm:mb-8 text-base sm:text-lg">Subscribe to our newsletter and never miss out on special offers</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-300 text-sm sm:text-base"
              />
              <button className="bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold hover:bg-gray-800 transition-all whitespace-nowrap text-sm sm:text-base">
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
