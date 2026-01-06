const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const QRCode = require('qrcode');

// @desc    Enable 2FA - Generate QR code
// @route   POST /api/auth/2fa/enable
// @access  Private
const enable2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.twoFactorEnabled) {
    return res.status(400).json({
      success: false,
      message: '2FA is already enabled'
    });
  }

  // Generate 2FA secret
  const secret = user.generate2FASecret();
  await user.save();

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  res.json({
    success: true,
    message: '2FA secret generated. Scan QR code with your authenticator app.',
    data: {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntry: secret.base32
    }
  });
});

// @desc    Verify 2FA setup and enable
// @route   POST /api/auth/2fa/verify-setup
// @access  Private
const verify2FASetup = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.twoFactorSecret) {
    return res.status(400).json({
      success: false,
      message: 'Please generate 2FA secret first'
    });
  }

  // Verify token
  const isValid = user.verify2FAToken(token);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid 2FA token'
    });
  }

  // Enable 2FA and generate backup codes
  user.twoFactorEnabled = true;
  const backupCodes = user.generateBackupCodes();
  await user.save();

  res.json({
    success: true,
    message: '2FA enabled successfully',
    data: {
      backupCodes: backupCodes,
      message: 'Save these backup codes in a safe place. You can use them if you lose access to your authenticator app.'
    }
  });
});

// @desc    Verify 2FA token during login
// @route   POST /api/auth/2fa/verify
// @access  Public (but requires valid credentials first)
const verify2FALogin = asyncHandler(async (req, res) => {
  const { email, token, useBackupCode } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  if (!user.twoFactorEnabled) {
    return res.status(400).json({
      success: false,
      message: '2FA is not enabled for this account'
    });
  }

  let isValid = false;

  if (useBackupCode) {
    // Verify backup code
    isValid = user.verifyBackupCode(token);
    if (isValid) {
      await user.save(); // Save to remove used backup code
    }
  } else {
    // Verify 2FA token
    isValid = user.verify2FAToken(token);
  }

  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: useBackupCode ? 'Invalid backup code' : 'Invalid 2FA token'
    });
  }

  // Generate JWT token
  const jwt = require('jsonwebtoken');
  const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

  // Update user
  user.lastLogin = new Date();
  user.addSecurityLog('2FA_LOGIN', ip, userAgent);
  await user.save();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: authToken,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled
    }
  });
});

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
const disable2FA = asyncHandler(async (req, res) => {
  const { password, token } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.twoFactorEnabled) {
    return res.status(400).json({
      success: false,
      message: '2FA is not enabled'
    });
  }

  // Verify password
  const bcrypt = require('bcryptjs');
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password'
    });
  }

  // Verify 2FA token
  const isTokenValid = user.verify2FAToken(token);

  if (!isTokenValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid 2FA token'
    });
  }

  // Disable 2FA
  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = [];
  await user.save();

  res.json({
    success: true,
    message: '2FA disabled successfully'
  });
});

// @desc    Get backup codes
// @route   GET /api/auth/2fa/backup-codes
// @access  Private
const getBackupCodes = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.twoFactorEnabled) {
    return res.status(400).json({
      success: false,
      message: '2FA is not enabled'
    });
  }

  res.json({
    success: true,
    data: {
      remainingCodes: user.twoFactorBackupCodes.length,
      message: 'You have backup codes available. Contact support if you need to regenerate them.'
    }
  });
});

// @desc    Regenerate backup codes
// @route   POST /api/auth/2fa/regenerate-backup-codes
// @access  Private
const regenerateBackupCodes = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.twoFactorEnabled) {
    return res.status(400).json({
      success: false,
      message: '2FA is not enabled'
    });
  }

  // Verify password
  const bcrypt = require('bcryptjs');
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password'
    });
  }

  // Generate new backup codes
  const backupCodes = user.generateBackupCodes();
  await user.save();

  res.json({
    success: true,
    message: 'Backup codes regenerated successfully',
    data: {
      backupCodes: backupCodes,
      warning: 'Old backup codes are now invalid. Save these new codes in a safe place.'
    }
  });
});

module.exports = {
  enable2FA,
  verify2FASetup,
  verify2FALogin,
  disable2FA,
  getBackupCodes,
  regenerateBackupCodes
};
