// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['user', 'admin'], default: 'user' },
//   createdAt: { type: Date, default: Date.now },
//   wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
//   resetPasswordToken: { type: String },
//   resetPasswordExpire: { type: Date },
// });

// // Hash password before saving
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) {
//     return next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Compare password for login
// userSchema.methods.matchPassword = async function (enteredPassword) {
//     // console.log(enteredPassword);
    
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// // Generate JWT Token
// userSchema.methods.generateAuthToken = function () {
//   return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// // Generate Reset Password Token
// userSchema.methods.getResetPasswordToken = function () {
//   const resetToken = crypto.randomBytes(20).toString('hex');

//   this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//   this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

//   return resetToken;
// };

// module.exports = mongoose.model('UserShopingCart', userSchema);



const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' }, // Avatar URL
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  
  // OAuth Fields
  googleId: { type: String, sparse: true, unique: true },
  
  // Reset Password Fields
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  
  // Email Verification Fields
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpire: { type: Date },
  
  // OTP Fields
  otpCode: { type: String },
  otpExpire: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  otpLockedUntil: { type: Date },
  
  // Two-Factor Authentication (2FA)
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  twoFactorBackupCodes: [{ type: String }],
  
  // Account Security
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  
  // Session Management
  activeSessions: [{
    token: String,
    device: String,
    ip: String,
    lastActivity: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Security Logs
  securityLogs: [{
    action: String,
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT Token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Generate Reset Password Token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

  return resetToken;
};

// Generate Email Verification Token (Add this method)
userSchema.methods.getEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString('hex');

  this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Method to verify email (Add this method)
userSchema.methods.verifyEmail = function () {
  this.isEmailVerified = true;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpire = undefined;
};

// Generate OTP Code
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  
  this.otpCode = crypto.createHash('sha256').update(otp).digest('hex');
  this.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.otpAttempts = 0;
  
  return otp;
};

// Verify OTP Code
userSchema.methods.verifyOTP = function (enteredOTP) {
  // Check if OTP is locked
  if (this.otpLockedUntil && Date.now() < this.otpLockedUntil) {
    return { success: false, message: 'OTP locked. Too many attempts.' };
  }
  
  // Check if OTP expired
  if (!this.otpExpire || Date.now() > this.otpExpire) {
    return { success: false, message: 'OTP expired. Please request a new one.' };
  }
  
  // Hash entered OTP and compare
  const hashedOTP = crypto.createHash('sha256').update(enteredOTP).digest('hex');
  
  if (hashedOTP === this.otpCode) {
    // Success - clear OTP data
    this.otpCode = undefined;
    this.otpExpire = undefined;
    this.otpAttempts = 0;
    this.otpLockedUntil = undefined;
    return { success: true, message: 'OTP verified successfully' };
  } else {
    // Failed attempt
    this.otpAttempts += 1;
    
    // Lock after 5 failed attempts
    if (this.otpAttempts >= 5) {
      this.otpLockedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
      return { success: false, message: 'Too many failed attempts. OTP locked for 30 minutes.' };
    }
    
    return { 
      success: false, 
      message: `Invalid OTP. ${5 - this.otpAttempts} attempts remaining.` 
    };
  }
};

// Generate 2FA Secret
userSchema.methods.generate2FASecret = function () {
  const speakeasy = require('speakeasy');
  
  const secret = speakeasy.generateSecret({
    name: `${process.env.STORE_NAME || 'Store'} (${this.email})`,
    length: 32
  });
  
  this.twoFactorSecret = secret.base32;
  
  return secret;
};

// Verify 2FA Token
userSchema.methods.verify2FAToken = function (token) {
  const speakeasy = require('speakeasy');
  
  return speakeasy.totp.verify({
    secret: this.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps before/after
  });
};

// Generate Backup Codes for 2FA
userSchema.methods.generateBackupCodes = function () {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  
  // Hash and store backup codes
  this.twoFactorBackupCodes = codes.map(code => 
    crypto.createHash('sha256').update(code).digest('hex')
  );
  
  return codes; // Return plain codes to show user once
};

// Verify Backup Code
userSchema.methods.verifyBackupCode = function (code) {
  const hashedCode = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
  const index = this.twoFactorBackupCodes.indexOf(hashedCode);
  
  if (index !== -1) {
    // Remove used backup code
    this.twoFactorBackupCodes.splice(index, 1);
    return true;
  }
  
  return false;
};

// Check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 15 * 60 * 1000; // 15 minutes
  
  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Add security log
userSchema.methods.addSecurityLog = function (action, ip, userAgent) {
  this.securityLogs.push({
    action,
    ip,
    userAgent,
    timestamp: new Date()
  });
  
  // Keep only last 50 logs
  if (this.securityLogs.length > 50) {
    this.securityLogs = this.securityLogs.slice(-50);
  }
};

module.exports = mongoose.model('UserShopingCart', userSchema);