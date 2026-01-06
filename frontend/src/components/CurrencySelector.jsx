import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const CurrencySelector = () => {
  const { currency, changeCurrency, currencies, loading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCurrencyChange = (newCurrency) => {
    changeCurrency(newCurrency);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
        <Globe size={18} className="text-gray-400 animate-spin" />
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  const currentCurrency = currencies[currency];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl transition-all duration-200 hover:border-orange-300 hover:shadow-md"
      >
        <Globe size={18} className="text-orange-600" />
        <span className="text-sm font-semibold text-gray-700">
          {currentCurrency?.flag} {currency}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3">
            <h3 className="text-white font-bold text-sm flex items-center">
              <Globe size={16} className="mr-2" />
              Select Currency
            </h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {Object.entries(currencies).map(([code, info]) => (
              <button
                key={code}
                onClick={() => handleCurrencyChange(code)}
                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-orange-50 transition-colors ${
                  currency === code ? 'bg-orange-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{info.flag}</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm">{code}</p>
                    <p className="text-xs text-gray-600">{info.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-700">{info.symbol}</span>
                  {currency === code && (
                    <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              Prices are converted using live exchange rates
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
