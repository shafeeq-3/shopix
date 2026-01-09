const User = require('../models/User');

// Track failed login attempts
const loginAttempts = new Map();

// Account lockout configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Check if account is locked
const checkAccountLockout = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next();
  }

  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: null };

  // Check if account is currently locked
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60);
    return res.status(429).json({
      success: false,
      message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingTime} minutes.`,
      lockedUntil: new Date(attempts.lockedUntil).toISOString()
    });
  }

  // Reset if lockout period has passed
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    loginAttempts.delete(email);
  }

  next();
};

// Record failed login attempt
const recordFailedLogin = (email, ip) => {
  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: null, attempts: [] };
  
  attempts.count += 1;
  attempts.attempts.push({
    timestamp: new Date(),
    ip: ip
  });

  // Lock account if max attempts reached
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
    console.warn(`⚠️  Account locked: ${email} (IP: ${ip}) - ${attempts.count} failed attempts`);
  }

  loginAttempts.set(email, attempts);

  return {
    attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - attempts.count),
    isLocked: attempts.count >= MAX_LOGIN_ATTEMPTS
  };
};

// Clear failed login attempts on successful login
const clearFailedLogins = (email) => {
  loginAttempts.delete(email);
};

// Audit log middleware
const auditLog = (action) => {
  return (req, res, next) => {
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override res.json
    res.json = function(data) {
      // Log the action
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        userId: req.user?._id || 'anonymous',
        email: req.body?.email || req.user?.email,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        success: res.statusCode < 400,
        statusCode: res.statusCode
      };

      console.log('🔍 AUDIT LOG:', JSON.stringify(logEntry));

      // Restore original method before calling
      res.json = originalJson;
      return res.json(data);
    };

    // Override res.send
    res.send = function(data) {
      // Log the action
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        userId: req.user?._id || 'anonymous',
        email: req.body?.email || req.user?.email,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        success: res.statusCode < 400,
        statusCode: res.statusCode
      };

      console.log('🔍 AUDIT LOG:', JSON.stringify(logEntry));

      // Restore original method before calling
      res.send = originalSend;
      return res.send(data);
    };

    next();
  };
};

// Detect suspicious activity
const detectSuspiciousActivity = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));

  if (isSuspicious) {
    console.warn(`⚠️  Suspicious activity detected from IP: ${ip}, User-Agent: ${userAgent}`);
    // You can add additional logic here (e.g., block, rate limit more aggressively)
  }

  next();
};

module.exports = {
  checkAccountLockout,
  recordFailedLogin,
  clearFailedLogins,
  auditLog,
  detectSuspiciousActivity
};
