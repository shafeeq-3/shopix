const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { protect } = require('../middleware/authMiddleware');
const { 
  loginLimiter, 
  registerLimiter,
  passwordResetLimiter 
} = require('../middleware/rateLimiter');
const { 
  validateRegistration, 
  validateLogin,
  validateEmail 
} = require('../middleware/validator');
const { 
  checkAccountLockout, 
  auditLog,
  detectSuspiciousActivity 
} = require('../middleware/accountSecurity');

// Import controllers
const {
  sendLoginOTP,
  verifyLoginOTP,
  resendOTP
} = require('../controllers/otpController');

const {
  enable2FA,
  verify2FASetup,
  verify2FALogin,
  disable2FA,
  getBackupCodes,
  regenerateBackupCodes
} = require('../controllers/twoFactorController');

const {
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail
} = require('../controllers/emailVerificationController');

// ============= GOOGLE OAUTH ROUTES =============
// Google OAuth login
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please contact administrator.'
    });
  }
  
  // Check if strategy is registered
  try {
    passport.authenticate('google', { 
      scope: [
        'profile',
        'email',
        'openid'
      ],
      accessType: 'offline',
      prompt: 'consent' // Force consent screen every time
    })(req, res, next);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return res.status(503).json({
      success: false,
      message: 'Google OAuth strategy not initialized. Please restart the server.'
    });
  }
});

// Google OAuth callback
router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_not_configured`);
  }
  
  try {
    passport.authenticate('google', { 
      failureRedirect: '/login',
      session: false 
    })(req, res, (err) => {
      if (err) {
        console.error('Google OAuth callback error:', err);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
      }
      
      // Generate JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
      
      // Redirect to frontend with token
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendURL}/auth/google/success?token=${token}&user=${encodeURIComponent(JSON.stringify({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }))}`);
    });
  } catch (error) {
    console.error('Google OAuth strategy error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_not_initialized`);
  }
});

// ============= OTP ROUTES =============
// Send OTP for login
router.post('/send-otp', 
  loginLimiter,
  validateEmail,
  checkAccountLockout,
  detectSuspiciousActivity,
  auditLog('SEND_OTP'),
  sendLoginOTP
);

// Verify OTP and login
router.post('/verify-otp',
  loginLimiter,
  auditLog('VERIFY_OTP'),
  verifyLoginOTP
);

// Resend OTP
router.post('/resend-otp',
  loginLimiter,
  validateEmail,
  auditLog('RESEND_OTP'),
  resendOTP
);

// ============= 2FA ROUTES =============
// Enable 2FA
router.post('/2fa/enable',
  protect,
  auditLog('ENABLE_2FA'),
  enable2FA
);

// Verify 2FA setup
router.post('/2fa/verify-setup',
  protect,
  auditLog('VERIFY_2FA_SETUP'),
  verify2FASetup
);

// Verify 2FA during login
router.post('/2fa/verify',
  loginLimiter,
  auditLog('VERIFY_2FA_LOGIN'),
  verify2FALogin
);

// Disable 2FA
router.post('/2fa/disable',
  protect,
  auditLog('DISABLE_2FA'),
  disable2FA
);

// Get backup codes info
router.get('/2fa/backup-codes',
  protect,
  getBackupCodes
);

// Regenerate backup codes
router.post('/2fa/regenerate-backup-codes',
  protect,
  auditLog('REGENERATE_BACKUP_CODES'),
  regenerateBackupCodes
);

// ============= EMAIL VERIFICATION ROUTES =============
// Send verification email
router.post('/send-verification',
  protect,
  auditLog('SEND_VERIFICATION'),
  sendVerificationEmail
);

// Verify email
router.get('/verify-email/:token',
  auditLog('VERIFY_EMAIL'),
  verifyEmail
);

// Resend verification email
router.post('/resend-verification',
  protect,
  auditLog('RESEND_VERIFICATION'),
  resendVerificationEmail
);

module.exports = router;
