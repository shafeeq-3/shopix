const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Security middleware configuration
const securityMiddleware = (app) => {
  // Helmet - Set security headers (relaxed for OAuth)
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for OAuth compatibility
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  // Prevent NoSQL injection
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`⚠️  Potential NoSQL injection attempt detected: ${key}`);
    },
  }));

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Additional security headers
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Changed from DENY to SAMEORIGIN for OAuth
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy (relaxed for OAuth)
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    
    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
  });
};

module.exports = securityMiddleware;
