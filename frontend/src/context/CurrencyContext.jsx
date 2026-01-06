import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

// Base currency for the platform (all prices stored in USD)
const BASE_CURRENCY = 'USD';

// Supported currencies with symbols and formatting
export const CURRENCIES = {
  USD: { 
    symbol: '$', 
    name: 'US Dollar', 
    flag: '🇺🇸',
    locale: 'en-US',
    decimals: 2
  },
  EUR: { 
    symbol: '€', 
    name: 'Euro', 
    flag: '🇪🇺',
    locale: 'de-DE',
    decimals: 2
  },
  GBP: { 
    symbol: '£', 
    name: 'British Pound', 
    flag: '🇬🇧',
    locale: 'en-GB',
    decimals: 2
  },
  AUD: { 
    symbol: 'A$', 
    name: 'Australian Dollar', 
    flag: '🇦🇺',
    locale: 'en-AU',
    decimals: 2
  },
  CAD: { 
    symbol: 'C$', 
    name: 'Canadian Dollar', 
    flag: '🇨🇦',
    locale: 'en-CA',
    decimals: 2
  },
  PKR: { 
    symbol: 'Rs', 
    name: 'Pakistani Rupee', 
    flag: '🇵🇰',
    locale: 'en-PK',
    decimals: 0
  },
  INR: { 
    symbol: '₹', 
    name: 'Indian Rupee', 
    flag: '🇮🇳',
    locale: 'en-IN',
    decimals: 0
  },
  AED: { 
    symbol: 'د.إ', 
    name: 'UAE Dirham', 
    flag: '🇦🇪',
    locale: 'ar-AE',
    decimals: 2
  },
  SAR: { 
    symbol: 'ر.س', 
    name: 'Saudi Riyal', 
    flag: '🇸🇦',
    locale: 'ar-SA',
    decimals: 2
  },
  JPY: { 
    symbol: '¥', 
    name: 'Japanese Yen', 
    flag: '🇯🇵',
    locale: 'ja-JP',
    decimals: 0
  },
  CNY: { 
    symbol: '¥', 
    name: 'Chinese Yuan', 
    flag: '🇨🇳',
    locale: 'zh-CN',
    decimals: 2
  },
  BDT: { 
    symbol: '৳', 
    name: 'Bangladeshi Taka', 
    flag: '🇧🇩',
    locale: 'bn-BD',
    decimals: 0
  },
};

// Country to currency mapping (ISO 3166-1 alpha-2)
const COUNTRY_CURRENCY_MAP = {
  US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD',
  PK: 'PKR', IN: 'INR', AE: 'AED', SA: 'SAR',
  JP: 'JPY', CN: 'CNY', BD: 'BDT',
  // European countries
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', PT: 'EUR', IE: 'EUR', GR: 'EUR',
  FI: 'EUR', SK: 'EUR', SI: 'EUR', LT: 'EUR', LV: 'EUR',
  EE: 'EUR', CY: 'EUR', MT: 'EUR', LU: 'EUR',
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD'); // Display currency
  const [exchangeRates, setExchangeRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [userCountry, setUserCountry] = useState(null);
  const [ratesLastUpdated, setRatesLastUpdated] = useState(null);

  // Initialize currency on mount
  useEffect(() => {
    initializeCurrency();
    fetchExchangeRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchExchangeRates, 3600000);
    return () => clearInterval(interval);
  }, []);

  const initializeCurrency = async () => {
    try {
      // Check for saved currency preference first
      const savedCurrency = localStorage.getItem('selectedCurrency');
      
      if (savedCurrency && CURRENCIES[savedCurrency]) {
        setCurrency(savedCurrency);
        setLoading(false);
        return;
      }

      // Try multiple geolocation APIs with fallbacks
      let countryCode = null;
      
      // Method 1: Try ipapi.co (may fail due to CORS in localhost)
      try {
        const response = await axios.get('https://ipapi.co/json/', {
          timeout: 3000
        });
        countryCode = response.data.country_code;
      } catch (err) {
        console.log('ipapi.co failed, trying alternative...');
      }
      
      // Method 2: Try ip-api.com (CORS-friendly)
      if (!countryCode) {
        try {
          const response = await axios.get('http://ip-api.com/json/', {
            timeout: 3000
          });
          countryCode = response.data.countryCode;
        } catch (err) {
          console.log('ip-api.com failed, trying alternative...');
        }
      }
      
      // Method 3: Try browser timezone as fallback
      if (!countryCode) {
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          // Map common timezones to countries
          const timezoneMap = {
            'America/New_York': 'US',
            'America/Chicago': 'US',
            'America/Los_Angeles': 'US',
            'America/Toronto': 'CA',
            'Europe/London': 'GB',
            'Europe/Paris': 'FR',
            'Europe/Berlin': 'DE',
            'Asia/Karachi': 'PK',
            'Asia/Kolkata': 'IN',
            'Asia/Dubai': 'AE',
            'Asia/Riyadh': 'SA',
            'Asia/Tokyo': 'JP',
            'Asia/Shanghai': 'CN',
            'Asia/Dhaka': 'BD',
            'Australia/Sydney': 'AU',
          };
          countryCode = timezoneMap[timezone];
        } catch (err) {
          console.log('Timezone detection failed');
        }
      }
      
      if (countryCode) {
        setUserCountry(countryCode);
        
        // Set currency based on country
        const detectedCurrency = COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
        setCurrency(detectedCurrency);
        
        // Save detected currency
        localStorage.setItem('selectedCurrency', detectedCurrency);
      } else {
        // Ultimate fallback to USD
        setCurrency('USD');
        localStorage.setItem('selectedCurrency', 'USD');
      }
      
    } catch (error) {
      console.error('Error detecting location:', error);
      // Fallback to USD
      setCurrency('USD');
      localStorage.setItem('selectedCurrency', 'USD');
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      // Using exchangerate-api.com with USD as base
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`,
        { timeout: 10000 }
      );
      
      setExchangeRates(response.data.rates);
      setRatesLastUpdated(new Date());
      
      // Cache rates in localStorage with timestamp
      localStorage.setItem('exchangeRates', JSON.stringify({
        rates: response.data.rates,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Try to use cached rates
      const cached = localStorage.getItem('exchangeRates');
      if (cached) {
        const { rates, timestamp } = JSON.parse(cached);
        // Use cached rates if less than 24 hours old
        if (Date.now() - timestamp < 86400000) {
          setExchangeRates(rates);
          setRatesLastUpdated(new Date(timestamp));
          return;
        }
      }
      
      // Fallback rates (approximate, updated regularly)
      setExchangeRates({
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        AUD: 1.52,
        CAD: 1.36,
        PKR: 278.50,
        INR: 83.12,
        AED: 3.67,
        SAR: 3.75,
        JPY: 149.50,
        CNY: 7.24,
        BDT: 109.50,
      });
    }
  };

  const changeCurrency = useCallback((newCurrency) => {
    if (!CURRENCIES[newCurrency]) {
      console.error(`Invalid currency: ${newCurrency}`);
      return;
    }
    
    setCurrency(newCurrency);
    localStorage.setItem('selectedCurrency', newCurrency);
  }, []);

  const convertPrice = useCallback((priceInUSD, targetCurrency = currency) => {
    if (!priceInUSD || isNaN(priceInUSD)) return 0;
    
    // If target is USD, no conversion needed
    if (targetCurrency === 'USD') return priceInUSD;
    
    // Convert from USD to target currency
    const rate = exchangeRates[targetCurrency] || 1;
    return priceInUSD * rate;
  }, [currency, exchangeRates]);

  const formatPrice = useCallback((priceInUSD, targetCurrency = currency, options = {}) => {
    const {
      showSymbol = true,
      showCode = false,
      compact = false
    } = options;
    
    const convertedPrice = convertPrice(priceInUSD, targetCurrency);
    const currencyInfo = CURRENCIES[targetCurrency] || CURRENCIES.USD;
    
    // Format based on currency decimals
    const formattedNumber = convertedPrice.toLocaleString(currencyInfo.locale, {
      minimumFractionDigits: currencyInfo.decimals,
      maximumFractionDigits: currencyInfo.decimals,
    });
    
    // Build price string
    let priceString = '';
    
    if (showSymbol) {
      priceString = `${currencyInfo.symbol}${formattedNumber}`;
    } else {
      priceString = formattedNumber;
    }
    
    if (showCode) {
      priceString += ` ${targetCurrency}`;
    }
    
    return priceString;
  }, [currency, convertPrice]);

  const getCurrencySymbol = useCallback((currencyCode = currency) => {
    return CURRENCIES[currencyCode]?.symbol || '$';
  }, [currency]);

  const getConversionRate = useCallback((targetCurrency = currency) => {
    return exchangeRates[targetCurrency] || 1;
  }, [currency, exchangeRates]);

  const value = {
    // Current state
    currency,
    baseCurrency: BASE_CURRENCY,
    exchangeRates,
    loading,
    userCountry,
    ratesLastUpdated,
    
    // Functions
    changeCurrency,
    convertPrice,
    formatPrice,
    getCurrencySymbol,
    getConversionRate,
    refreshRates: fetchExchangeRates,
    
    // Constants
    currencies: CURRENCIES,
    supportedCurrencies: Object.keys(CURRENCIES),
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
