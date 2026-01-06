const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables FIRST
dotenv.config();

const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const logger = require('./utils/logger');

// Import passport AFTER dotenv is loaded
const passport = require('./config/passport');

const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const passwordRoutes = require('./routes/passwordRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Security middleware
const securityMiddleware = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');

securityMiddleware(app);

// CORS aur Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve uploaded files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ ROOT ENDPOINT - YAHI HEALTH CHECK HAI (Railway yahi check karega)
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is healthy and running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'MERN Ecommerce Backend',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ ALAG HEALTH ENDPOINT (optional)
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'OK', 
    message: 'Health check endpoint',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Database connection (will be cached in serverless)
connectDB().catch(err => {
  logger.error('Database connection error:', err);
});

// API Routes
app.use('/api/', apiLimiter); // Rate limiting for all API routes
app.use('/api/auth', authRoutes); // Auth routes with OTP & 2FA
app.use('/api/users', require('./routes/userRoutes')); // User routes (register, login, profile)
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use("/api/orders", orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes); // Stripe payment routes

// ✅ Static files (only in production when build exists)
const buildPath = path.join(__dirname, '../frontend/build');

if (fs.existsSync(buildPath)) {
  logger.info(`Serving frontend build from: ${buildPath}`);
  app.use(express.static(buildPath));
  
  // Catch-all route for frontend
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  logger.warn('Frontend build not found. Running in API-only mode.');
  logger.info('Frontend should run separately on port 3000');
  
  // Fallback for undefined routes
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Route not found',
      message: 'This is the backend API. Frontend runs on http://localhost:3000'
    });
  });
}

const PORT = process.env.PORT || 5000;

// ✅ Server start (only for local development)
if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Root endpoint (Health check): http://0.0.0.0:${PORT}/`);
    logger.info(`Health endpoint: http://0.0.0.0:${PORT}/health`);
    logger.info('Server ready!');
  });

  // ✅ Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
    });
  });
}

// ✅ Export for Vercel serverless
module.exports = app;