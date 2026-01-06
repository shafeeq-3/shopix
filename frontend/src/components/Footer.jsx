import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, CreditCard, Truck, Shield } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <Link to="/" className="inline-flex items-center space-x-2 mb-4">
                <span className="text-3xl font-bold">
                  <span className="text-white">SHOP</span>
                  <span className="text-orange-500">IX</span>
                </span>
              </Link>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Your trusted online shopping destination. We bring you the best products at unbeatable prices with fast shipping and secure payments.
              </p>
              
              {/* Social Media */}
              <div className="flex space-x-4">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-all"
                >
                  <Facebook size={18} />
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-all"
                >
                  <Twitter size={18} />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-all"
                >
                  <Instagram size={18} />
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-all"
                >
                  <Youtube size={18} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="hover:text-orange-500 transition-colors flex items-center">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="hover:text-orange-500 transition-colors flex items-center">
                    Products
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-orange-500 transition-colors flex items-center">
                    My Account
                  </Link>
                </li>
                <li>
                  <Link to="/trackmyorder" className="hover:text-orange-500 transition-colors flex items-center">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link to="/checkout" className="hover:text-orange-500 transition-colors flex items-center">
                    Cart
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Customer Service</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/about" className="hover:text-orange-500 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-orange-500 transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" className="hover:text-orange-500 transition-colors">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link to="/returns" className="hover:text-orange-500 transition-colors">
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-orange-500 transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <MapPin size={20} className="text-orange-500 flex-shrink-0 mt-1" />
                  <span className="text-sm">123 Shopping Street, New York, NY 10001</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Phone size={20} className="text-orange-500 flex-shrink-0" />
                  <a href="tel:+12345678900" className="text-sm hover:text-orange-500 transition-colors">
                    +1 (234) 567-8900
                  </a>
                </li>
                <li className="flex items-center space-x-3">
                  <Mail size={20} className="text-orange-500 flex-shrink-0" />
                  <a href="mailto:support@shopix.com" className="text-sm hover:text-orange-500 transition-colors">
                    support@shopix.com
                  </a>
                </li>
              </ul>
              
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-2">We Accept:</p>
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-8 bg-gray-800 rounded flex items-center justify-center">
                    <CreditCard size={20} className="text-gray-400" />
                  </div>
                  <div className="w-12 h-8 bg-gray-800 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400">VISA</span>
                  </div>
                  <div className="w-12 h-8 bg-gray-800 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400">MC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Truck className="text-orange-500" size={24} />
              </div>
              <div>
                <h4 className="text-white font-semibold">Free Shipping</h4>
                <p className="text-sm text-gray-400">On orders over $50</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Shield className="text-orange-500" size={24} />
              </div>
              <div>
                <h4 className="text-white font-semibold">Secure Payment</h4>
                <p className="text-sm text-gray-400">100% protected</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Phone className="text-orange-500" size={24} />
              </div>
              <div>
                <h4 className="text-white font-semibold">24/7 Support</h4>
                <p className="text-sm text-gray-400">Always here to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} <span className="text-white font-semibold">SHOPIX</span>. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/privacy" className="hover:text-orange-500 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-orange-500 transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookies" className="hover:text-orange-500 transition-colors">
                Cookie Policy
              </Link>
              <Link to="/sitemap" className="hover:text-orange-500 transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
