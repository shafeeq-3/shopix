const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const { emailTemplates, sendEmail } = require('../services/emailService');
const logger = require('../utils/logger');

// @desc    Send email verification
// @route   POST /api/users/send-verification
// @access  Private
const sendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Generate verification token
  const verificationToken = user.getEmailVerificationToken();
  await user.save();

  // Send email verification using centralized service
  const verificationEmail = emailTemplates.emailVerification(user, verificationToken);
  const emailResult = await sendEmail(user.email, 'Verify Your Email - SHOPIX', verificationEmail);

  if (!emailResult.success) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }

  logger.info(`Email verification sent to ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Verification email sent successfully. Please check your inbox.',
    data: {
      email: user.email,
      expiresIn: '24 hours'
    }
  });
});

// @desc    Verify email with token
// @route   GET /api/users/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Verify email
    user.verifyEmail();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      data: {
        userId: user._id,
        email: user.email,
        isEmailVerified: true
      }
    });
  } catch (error) {
    logger.error(`Verify email error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email'
    });
  }
});

// @desc    Resend verification email
// @route   POST /api/users/resend-verification
// @access  Private
const resendVerificationEmail = asyncHandler(async (req, res) => {
  return sendVerificationEmail(req, res);
});

module.exports = {
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail
};
