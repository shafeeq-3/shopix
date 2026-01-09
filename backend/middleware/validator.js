const validator = require('validator');
const xss = require('xss');

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return xss(input.trim());
  }
  return input;
};

// Validate and sanitize user registration
const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  console.log('Registration validation:', { name, email, hasPassword: !!password });

  // Name validation
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  if (name && name.length > 50) {
    errors.push('Name must not exceed 50 characters');
  }

  // Email validation
  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Password validation
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Strong password check
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (password && !strongPasswordRegex.test(password)) {
    errors.push('Password must contain uppercase, lowercase, number, and special character');
  }

  if (errors.length > 0) {
    console.log('Validation errors:', errors);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Sanitize inputs
  req.body.name = sanitizeInput(name);
  req.body.email = validator.normalizeEmail(email);
  
  console.log('Validation passed');
  next();
};

// Validate login
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.email = validator.normalizeEmail(email);
  next();
};

// Validate email for password reset
const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  req.body.email = validator.normalizeEmail(email);
  next();
};

// Validate password reset
const validatePasswordReset = (req, res, next) => {
  const { password, confirmPassword } = req.body;
  const errors = [];

  if (!password || !confirmPassword) {
    errors.push('Password and confirm password are required');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (password && password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (password && !strongPasswordRegex.test(password)) {
    errors.push('Password must contain uppercase, lowercase, number, and special character');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateEmail,
  validatePasswordReset,
  sanitizeInput
};
