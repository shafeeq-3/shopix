const User = require("../models/User");
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const { emailTemplates, sendEmail } = require('../services/emailService');
const logger = require('../utils/logger');


// Generate reset token and save to user
const generateResetToken = (user) => {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (10 minutes)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// @desc    Send password reset email
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log(email);
  

  // Validation
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email address'
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken(user);
    await user.save();

    // Send password reset email using centralized service
    const resetEmail = emailTemplates.passwordReset(user, resetToken);
    const emailResult = await sendEmail(user.email, 'Reset Your Password - SHOPIX', resetEmail);

    if (!emailResult.success) {
      // Clean up if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    logger.info(`Password reset email sent to ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully. Please check your inbox.',
      data: {
        email: user.email,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email. Please try again later.'
    });
  }
});

// @desc    Reset password with token
// @route   PUT /api/users/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  // Validation
  if (!password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide password and confirm password'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  // Password strength validation
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  // Strong password validation
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!strongPasswordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    });
  }

  try {
    // Hash the token and find user
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    // Set new password (will be hashed automatically by pre-save middleware)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Send password changed confirmation email using centralized service
    const confirmationEmail = emailTemplates.passwordChanged(user);
    await sendEmail(user.email, 'Password Changed - SHOPIX', confirmationEmail);
    logger.info(`Password changed confirmation email sent to ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
      data: {
        userId: user._id,
        email: user.email,
        resetAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.'
    });
  }
});

// @desc    Verify reset token
// @route   GET /api/users/verify-reset-token/:token
// @access  Public
const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        email: user.email,
        expiresAt: user.resetPasswordExpire
      }
    });

  } catch (error) {
    logger.error(`Verify token error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token'
    });
  }
});

module.exports = {
  forgotPassword,
  resetPassword,
  verifyResetToken
};