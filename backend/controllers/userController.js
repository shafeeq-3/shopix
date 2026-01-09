const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Product = require('../models/Product');
const { emailTemplates, sendEmail } = require('../services/emailService');
const logger = require('../utils/logger');

//  Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  console.log('Registration attempt:', { name, email, hasPassword: !!password });

  const userExists = await User.findOne({ email: email.trim().toLowerCase() });

  if (userExists) {
    console.log('User already exists:', email);
    res.status(400);
    throw new Error('User already exists');
  }

  const user = new User({
    name,
    email: email.trim().toLowerCase(),
    password,
  });

  // Generate email verification token before first save
  const verificationToken = user.getEmailVerificationToken();
  
  // Add security log
  user.securityLogs = [{
    action: 'ACCOUNT_CREATED',
    ip: ip,
    userAgent: userAgent,
    timestamp: new Date()
  }];

  await user.save();

  // Send welcome email (optional - won't fail registration if email fails)
  try {
    const welcomeEmail = emailTemplates.welcome(user);
    await sendEmail(user.email, 'Welcome to SHOPIX! 🎉', welcomeEmail);
    logger.info(`Welcome email sent to ${user.email}`);
  } catch (error) {
    logger.error(`Failed to send welcome email: ${error.message}`);
    // Don't fail registration if email fails
  }

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
    isEmailVerified: user.isEmailVerified,
    message: 'Registration successful!'
  });
});
// //log in - Step 1: Verify credentials and send OTP
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  logger.info(`Login attempt: ${email}`);

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    logger.warn(`User not found: ${email}`);
    res.status(401);
    throw new Error('Invalid email or password');
  }

  logger.info(`User found: ${user.email}`);

  // Check if account is locked
  if (user.isLocked()) {
    const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
    logger.warn(`Account locked: ${email}`);
    res.status(423);
    throw new Error(`Account locked. Try again in ${lockTime} minutes.`);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    // Increment failed login attempts
    await user.incLoginAttempts();
    
    const attemptsLeft = 5 - (user.loginAttempts + 1);
    logger.warn(`Invalid password for ${email}. Attempts left: ${attemptsLeft}`);
    res.status(401);
    throw new Error(
      attemptsLeft > 0 
        ? `Invalid credentials. ${attemptsLeft} attempts remaining.`
        : 'Account locked due to multiple failed attempts.'
    );
  }

  logger.info(`Password verified for ${user.email}`);

  // Password is correct - Now MANDATORY OTP verification
  // Generate and send OTP
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content { 
          padding: 40px 30px;
        }
        .otp-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          background-color: #f0f4ff;
          border-left: 4px solid #667eea;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
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
        </div>
        <div class="footer">
          <p>Best regards,<br><strong>${process.env.STORE_NAME || 'Your Store'} Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"${process.env.STORE_NAME || 'Your Store'}" <${process.env.SMTP_EMAIL}>`,
      to: user.email,
      subject: `Your Login OTP: ${otp}`,
      html: emailTemplate
    });

    // Don't send token yet - require OTP verification
    res.json({
      success: true,
      requiresOTP: true,
      message: 'OTP sent to your email. Please verify to complete login.',
      email: user.email,
      expiresIn: '10 minutes'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500);
    throw new Error('Failed to send OTP. Please try again.');
  }
});
  
//  Get User Profile (Protected)
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -otpCode -twoFactorSecret -twoFactorBackupCodes');
  
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '', // Include avatar
      role: user.role,
      createdAt: user.createdAt,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      googleId: user.googleId ? true : false, // Just show if connected
      wishlistCount: user.wishlist?.length || 0,
      activeSessions: user.activeSessions?.length || 0,
      securityLogs: user.securityLogs?.slice(-10) || [] // Last 10 logs
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

//  Update User Profile (Protected)
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const changes = {};
    
    if (req.body.name && req.body.name !== user.name) {
      changes.name = `${user.name} → ${req.body.name}`;
      user.name = req.body.name;
    }
    
    if (req.body.email && req.body.email !== user.email) {
      changes.email = `${user.email} → ${req.body.email}`;
      user.email = req.body.email;
    }

    if (req.body.password) {
      changes.password = "Password updated";
      user.password = req.body.password; // Will be hashed in schema
    }

    const updatedUser = await user.save();

    // Send profile update email if there were changes
    if (Object.keys(changes).length > 0) {
      try {
        const profileUpdateEmail = emailTemplates.profileUpdated(updatedUser, changes);
        await sendEmail(updatedUser.email, 'Profile Updated - SHOPIX', profileUpdateEmail);
        logger.info(`Profile update email sent to ${updatedUser.email}`);
      } catch (error) {
        logger.error(`Failed to send profile update email: ${error.message}`);
      }
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      token: generateToken(updatedUser._id),
      role: user.role,
      message: 'Profile updated successfully'
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


//  Get All Users (Admin Only)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

//  Delete User (Admin Only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Delete user reviews from all products
    await Product.updateMany(
      { "reviews.user": req.params.id }, // Find products with this user in reviews
      { 
        $pull: { 
          reviews: { user: req.params.id } // Remove the user's review completely
        }
      }
    );

    // Now delete the user
    await user.deleteOne();
    res.json({ message: 'User and their reviews have been removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
};
