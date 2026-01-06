// config/db.js - MongoDB Atlas connection with diagnostics
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Cache connection for serverless
let cachedConnection = null;

const connectDB = async (retries = 3) => {
  // Return cached connection for serverless (Vercel)
  if (cachedConnection && mongoose.connection.readyState === 1) {
    logger.info('Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('❌ MONGO_URI is not defined in .env file');
    }

    logger.info('Attempting to connect to MongoDB Atlas...');
    logger.info(`Cluster: ${mongoURI.split('@')[1]?.split('/')[0] || 'Unknown'}`);
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    cachedConnection = conn;

    logger.info('MongoDB Connected Successfully!');
    logger.info(`Host: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB runtime error:', err);
      cachedConnection = null;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      cachedConnection = null;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Handle app termination (only in non-serverless environments)
    if (process.env.NODE_ENV !== 'production') {
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      });
    }

    return conn;

  } catch (error) {
    console.error(`\n❌ Connection Failed (${retries} retries left)`);
    console.error(`Error: ${error.message}\n`);
    
    // Detailed troubleshooting
    if (error.message.includes('Could not connect to any servers')) {
      console.error('🔧 POSSIBLE CAUSES:\n');
      console.error('1️⃣  CLUSTER PAUSED (Free tier auto-pauses after inactivity)');
      console.error('   → Go to Atlas Dashboard → Resume Cluster\n');
      
      console.error('2️⃣  IP WHITELIST NOT UPDATED YET (takes 2-3 minutes)');
      console.error('   → Wait a few minutes after adding IP\n');
      
      console.error('3️⃣  WRONG CREDENTIALS in MONGO_URI');
      console.error('   → Check username/password in .env file\n');
      
      console.error('4️⃣  VPN/FIREWALL BLOCKING CONNECTION');
      console.error('   → Try disabling VPN temporarily\n');
      
      console.error('5️⃣  NETWORK ACCESS NOT CONFIGURED');
      console.error('   → Atlas → Network Access → Add IP: 0.0.0.0/0\n');
    }
    
    if (retries > 0) {
      logger.warn(`Retrying in 5 seconds... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }
    
    console.error('❌ All connection attempts failed.\n');
    
    // In serverless, don't exit process
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;