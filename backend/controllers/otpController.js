const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { sendEmail } = require('../services/emailService');
const logger = require('../utils/logger');

// @desc    Send OTP for login
// @route   POST /api/auth/send-otp
// @access  Public
const sendLoginOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email'
    });
  }

  // Check if account is locked
  if (user.isLocked()) {
    return res.status(423).json({
      success: false,
      message: 'Account is temporarily locked. Please try again later.'
    });
  }

  // Check if OTP is locked
  if (user.otpLockedUntil && Date.now() < user.otpLockedUntil) {
    const remainingTime = Math.ceil((user.otpLockedUntil - Date.now()) / 1000 / 60);
    return res.status(429).json({
      success: false,
      message: `OTP locked. Please try again in ${remainingTime} minutes.`
    });
  }

  // Generate OTP
  const otp = user.generateOTP();
  await user.save();

  // Professional OTP email template with SHOPIX branding
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Login OTP</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 40px auto; 
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .content { 
          padding: 40px 30px;
        }
        .otp-box {
          background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
          color: white;
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 8px;
          text-align: center;
          padding: 20px;
          border-radius: 8px;
          margin: 30px 0;
          font-family: 'Courier New', monospace;
        }
        .info-box {
          background-color: #FFF3E0;
          border-left: 4px solid #FF6B35;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning-box {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer { 
          text-align: center; 
          padding: 30px;
          background-color: #f8f9fa;
          color: #6c757d;
          font-size: 14px;
        }
        .footer a {
          color: #FF6B35;
          text-decoration: none;
        }
        ul {
          padding-left: 20px;
        }
        li {
          margin: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SHOPIX</div>
          <h1>🔐 Login Verification</h1>
        </div>
        <div class="content">
          <h2>Hello ${user.name},</h2>
          <p>We received a login request for your account. Use the OTP code below to complete your login:</p>
          
          <div class="otp-box">
            ${otp}
          </div>
          
          <div class="info-box">
            <strong>⏱️ Valid for 10 minutes</strong><br>
            This OTP will expire in 10 minutes for security reasons.
          </div>
          
          <div class="warning-box">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin: 10px 0;">
              <li>Never share this OTP with anyone</li>
              <li>Our team will never ask for your OTP</li>
              <li>If you didn't request this, please secure your account immediately</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">
            <strong>Login Details:</strong><br>
            Time: ${new Date().toLocaleString()}<br>
            Email: ${user.email}
          </p>
          
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
            If you didn't attempt to log in, please ignore this email or contact our support team immediately.
          </p>
        </div>
        <div class="footer">
          <p><strong>SHOPIX</strong> - Shop. Click. Done.</p>
          <p>Need help? Contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.SMTP_EMAIL}">${process.env.SUPPORT_EMAIL || process.env.SMTP_EMAIL}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail(user.email, `Your Login OTP: ${otp}`, emailTemplate);
    logger.info(`OTP email sent to ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      data: {
        email: user.email,
        expiresIn: '10 minutes'
      }
    });
  } catch (error) {
    logger.error(`Send OTP error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
});

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyLoginOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Verify OTP
  const result = user.verifyOTP(otp);

  if (!result.success) {
    await user.save();
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    // OTP verified but need 2FA
    await user.save();
    return res.json({
      success: true,
      requires2FA: true,
      message: 'OTP verified. Please enter your 2FA code.',
      email: user.email
    });
  }

  // OTP verified - Reset login attempts and generate token
  await user.resetLoginAttempts();
  
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

  // Update user
  user.lastLogin = new Date();
  user.securityLogs.push({
    action: 'OTP_LOGIN',
    ip: ip,
    userAgent: userAgent,
    timestamp: new Date()
  });
  await user.save();

  logger.info(`User logged in successfully: ${user.email}`);

  res.json({
    success: true,
    message: 'Login successful',
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: token,
    isEmailVerified: user.isEmailVerified,
    twoFactorEnabled: user.twoFactorEnabled
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email'
    });
  }

  // Check if previous OTP is still valid
  if (user.otpExpire && Date.now() < user.otpExpire) {
    const remainingTime = Math.ceil((user.otpExpire - Date.now()) / 1000 / 60);
    return res.status(429).json({
      success: false,
      message: `Previous OTP is still valid. Please wait ${remainingTime} minutes before requesting a new one.`
    });
  }

  // Generate new OTP
  const otp = user.generateOTP();
  await user.save();

  // Send email with SHOPIX branding
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your New OTP</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 40px auto; 
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .content { padding: 40px 30px; }
        .otp-box {
          background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
          color: white;
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 8px;
          text-align: center;
          padding: 20px;
          border-radius: 8px;
          margin: 30px 0;
          font-family: 'Courier New', monospace;
        }
        .footer { 
          text-align: center; 
          padding: 30px;
          background-color: #f8f9fa;
          color: #6c757d;
          font-size: 14px;
        }
        .footer a {
          color: #FF6B35;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SHOPIX</div>
          <h1>🔐 New OTP Code</h1>
        </div>
        <div class="content">
          <h2>Hello ${user.name},</h2>
          <p>Here is your new OTP code:</p>
          <div class="otp-box">${otp}</div>
          <p><strong>Valid for 10 minutes</strong></p>
        </div>
        <div class="footer">
          <p><strong>SHOPIX</strong> - Shop. Click. Done.</p>
          <p>Need help? Contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.SMTP_EMAIL}">${process.env.SUPPORT_EMAIL || process.env.SMTP_EMAIL}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail(user.email, `Your New Login OTP: ${otp}`, emailTemplate);
    logger.info(`Resend OTP email sent to ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully',
      data: {
        email: user.email,
        expiresIn: '10 minutes'
      }
    });
  } catch (error) {
    logger.error(`Resend OTP error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

module.exports = {
  sendLoginOTP,
  verifyLoginOTP,
  resendOTP
};
