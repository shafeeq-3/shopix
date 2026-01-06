import React from 'react';
import { Search, ShoppingBag, Zap, Shield, Truck } from 'lucide-react';
import './HeroSection.css';

const HeroSection = ({ onSearch, searchQuery, setSearchQuery }) => {
  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="hero-section">
      {/* Main Hero */}
      <div className="hero-content">
        <div className="hero-text">
          <div className="shopix-logo-hero">
            <span className="logo-shop">SHOP</span>
            <span className="logo-ix">IX</span>
          </div>
          <p className="hero-tagline">Shop. Click. Done.</p>
          <h1 className="hero-title">
            Your One-Stop Shop for
            <span className="hero-highlight"> Everything</span>
          </h1>
          <p className="hero-subtitle">
            Discover amazing products at unbeatable prices. Fast shipping, secure payments, and 24/7 support.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hero-search">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search for products, brands, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <ShoppingBag size={20} />
              <span>10,000+ Products</span>
            </div>
            <div className="stat-item">
              <Zap size={20} />
              <span>Fast Delivery</span>
            </div>
            <div className="stat-item">
              <Shield size={20} />
              <span>Secure Payment</span>
            </div>
          </div>
        </div>

        {/* Hero Image/Illustration */}
        <div className="hero-image">
          <div className="floating-card card-1">
            <ShoppingBag size={32} />
            <p>Shop Now</p>
          </div>
          <div className="floating-card card-2">
            <Truck size={32} />
            <p>Fast Shipping</p>
          </div>
          <div className="floating-card card-3">
            <Shield size={32} />
            <p>Secure</p>
          </div>
        </div>
      </div>

      {/* Features Bar */}
      <div className="features-bar">
        <div className="feature-item">
          <div className="feature-icon">
            <Truck size={24} />
          </div>
          <div className="feature-text">
            <h4>Free Shipping</h4>
            <p>On orders over Rs. 2000</p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <Shield size={24} />
          </div>
          <div className="feature-text">
            <h4>Secure Payment</h4>
            <p>100% protected transactions</p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <Zap size={24} />
          </div>
          <div className="feature-text">
            <h4>Fast Delivery</h4>
            <p>2-5 business days</p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <ShoppingBag size={24} />
          </div>
          <div className="feature-text">
            <h4>Easy Returns</h4>
            <p>30-day return policy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
