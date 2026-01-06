const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Base email template with SHOPIX branding
const getEmailTemplate = (content, title = 'SHOPIX') => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
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
          padding: 30px; 
          text-align: center;
        }
        .logo {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .logo-text {
          color: #2C3E50;
        }
        .logo-accent {
          color: white;
        }
        .tagline {
          font-size: 12px;
          opacity: 0.9;
          letter-spacing: 2px;
        }
        .content { 
          padding: 40px 30px;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
        .info-box {
          background-color: #FFF3E0;
          border-left: 4px solid #FF6B35;
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
        .divider {
          height: 1px;
          background: #e0e0e0;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span class="logo-text">SHOP</span><span class="logo-accent">IX</span>
          </div>
          <div class="tagline">SHOP. CLICK. DONE.</div>
        </div>
        ${content}
        <div class="footer">
          <p><strong>SHOPIX</strong> - Your trusted online shopping destination</p>
          <p>Need help? Contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.SMTP_EMAIL}">${process.env.SUPPORT_EMAIL || process.env.SMTP_EMAIL}</a></p>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            © ${new Date().getFullYear()} SHOPIX. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email Templates
const emailTemplates = {
  // Welcome Email
  welcome: (user) => {
    const content = `
      <div class="content">
        <h2>Welcome to SHOPIX, ${user.name}! 🎉</h2>
        <p>We're thrilled to have you join our community of smart shoppers!</p>
        
        <div class="info-box">
          <strong>Your Account is Ready!</strong><br>
          You can now browse thousands of products, add items to your wishlist, and enjoy exclusive member benefits.
        </div>
        
        <p><strong>What's Next?</strong></p>
        <ul>
          <li>✅ Browse our latest products</li>
          <li>✅ Add items to your wishlist</li>
          <li>✅ Get exclusive deals and offers</li>
          <li>✅ Track your orders in real-time</li>
        </ul>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Start Shopping</a>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6c757d; font-size: 14px;">
          <strong>Account Details:</strong><br>
          Email: ${user.email}<br>
          Joined: ${new Date().toLocaleDateString()}
        </p>
      </div>
    `;
    return getEmailTemplate(content, 'Welcome to SHOPIX');
  },

  // Email Verification
  emailVerification: (user, token) => {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
    const content = `
      <div class="content">
        <h2>Verify Your Email Address</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for registering with SHOPIX! Please verify your email address to activate your account.</p>
        
        <div style="text-align: center;">
          <a href="${verificationLink}" class="button">Verify Email Address</a>
        </div>
        
        <div class="info-box">
          <strong>⏱️ Link expires in 24 hours</strong><br>
          For security reasons, this verification link will expire in 24 hours.
        </div>
        
        <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${verificationLink}" style="color: #FF6B35; word-break: break-all;">${verificationLink}</a>
        </p>
        
        <p style="color: #6c757d; font-size: 14px;">
          If you didn't create an account with SHOPIX, please ignore this email.
        </p>
      </div>
    `;
    return getEmailTemplate(content, 'Verify Your Email - SHOPIX');
  },

  // Password Reset
  passwordReset: (user, token) => {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
    const content = `
      <div class="content">
        <h2>Reset Your Password</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">Reset Password</a>
        </div>
        
        <div class="info-box">
          <strong>⏱️ Link expires in 1 hour</strong><br>
          For security reasons, this reset link will expire in 1 hour.
        </div>
        
        <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #FF6B35; word-break: break-all;">${resetLink}</a>
        </p>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <strong>⚠️ Security Notice:</strong><br>
          If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.
        </div>
      </div>
    `;
    return getEmailTemplate(content, 'Reset Your Password - SHOPIX');
  },

  // Password Changed Confirmation
  passwordChanged: (user) => {
    const content = `
      <div class="content">
        <h2>Password Changed Successfully ✅</h2>
        <p>Hello ${user.name},</p>
        <p>Your password has been changed successfully.</p>
        
        <div class="info-box">
          <strong>Change Details:</strong><br>
          Time: ${new Date().toLocaleString()}<br>
          Email: ${user.email}
        </div>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <strong>⚠️ Didn't make this change?</strong><br>
          If you didn't change your password, please contact our support team immediately to secure your account.
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Your Account</a>
        </div>
      </div>
    `;
    return getEmailTemplate(content, 'Password Changed - SHOPIX');
  },

  // Profile Updated
  profileUpdated: (user, changes) => {
    const changesList = Object.keys(changes).map(key => `<li>${key}: ${changes[key]}</li>`).join('');
    const content = `
      <div class="content">
        <h2>Profile Updated Successfully ✅</h2>
        <p>Hello ${user.name},</p>
        <p>Your profile has been updated successfully.</p>
        
        <div class="info-box">
          <strong>Changes Made:</strong>
          <ul style="margin: 10px 0;">
            ${changesList}
          </ul>
          <strong>Updated at:</strong> ${new Date().toLocaleString()}
        </div>
        
        <p style="color: #6c757d; font-size: 14px;">
          If you didn't make these changes, please contact our support team immediately.
        </p>
      </div>
    `;
    return getEmailTemplate(content, 'Profile Updated - SHOPIX');
  },

  // Order Confirmation
  orderConfirmation: (order, user) => {
    const itemsList = order.orderItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${item.price}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${item.quantity * item.price}</td>
      </tr>
    `).join('');

    const content = `
      <div class="content">
        <h2>Order Confirmed! 🎉</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for your order! We've received your order and it's being processed.</p>
        
        <div class="info-box">
          <strong>Order Number:</strong> ${order.trackingNumber}<br>
          <strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br>
          <strong>Payment Method:</strong> ${order.paymentMethod.type}
        </div>
        
        <h3>Order Items:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
              <td style="padding: 10px; text-align: right;">Rs. ${order.orderSummary.subtotal}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Shipping:</td>
              <td style="padding: 10px; text-align: right;">Rs. ${order.orderSummary.shippingCost}</td>
            </tr>
            ${order.orderSummary.discount > 0 ? `
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold; color: #27AE60;">Discount:</td>
              <td style="padding: 10px; text-align: right; color: #27AE60;">- Rs. ${order.orderSummary.discount}</td>
            </tr>
            ` : ''}
            <tr style="background-color: #f8f9fa;">
              <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px;">Total:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; color: #FF6B35;">Rs. ${order.orderSummary.totalAmount}</td>
            </tr>
          </tfoot>
        </table>
        
        <h3>Shipping Address:</h3>
        <div class="info-box">
          ${order.shippingInfo.fullName}<br>
          ${order.shippingInfo.address}<br>
          ${order.shippingInfo.city}, ${order.shippingInfo.state} ${order.shippingInfo.zipCode}<br>
          ${order.shippingInfo.country}<br>
          Phone: ${order.shippingInfo.phone}
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/trackmyorder" class="button">Track Your Order</a>
        </div>
        
        <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
          We'll send you another email when your order ships.
        </p>
      </div>
    `;
    return getEmailTemplate(content, `Order Confirmation - ${order.trackingNumber}`);
  },

  // Order Shipped
  orderShipped: (order, user, trackingInfo) => {
    const content = `
      <div class="content">
        <h2>Your Order Has Shipped! 📦</h2>
        <p>Hello ${user.name},</p>
        <p>Great news! Your order has been shipped and is on its way to you.</p>
        
        <div class="info-box">
          <strong>Order Number:</strong> ${order.trackingNumber}<br>
          <strong>Courier Service:</strong> ${trackingInfo.courierService || 'Standard Shipping'}<br>
          <strong>Tracking Number:</strong> ${trackingInfo.courierTrackingNumber || 'Will be updated soon'}<br>
          <strong>Expected Delivery:</strong> ${trackingInfo.expectedDeliveryDate ? new Date(trackingInfo.expectedDeliveryDate).toLocaleDateString() : 'Within 3-5 business days'}
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/trackmyorder" class="button">Track Your Order</a>
        </div>
        
        <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
          You can track your package using the tracking number provided above.
        </p>
      </div>
    `;
    return getEmailTemplate(content, `Order Shipped - ${order.trackingNumber}`);
  },

  // Order Delivered
  orderDelivered: (order, user) => {
    const content = `
      <div class="content">
        <h2>Order Delivered Successfully! ✅</h2>
        <p>Hello ${user.name},</p>
        <p>Your order has been delivered successfully!</p>
        
        <div class="info-box">
          <strong>Order Number:</strong> ${order.trackingNumber}<br>
          <strong>Delivered On:</strong> ${new Date(order.deliveredAt).toLocaleDateString()}<br>
          <strong>Total Amount:</strong> Rs. ${order.orderSummary.totalAmount}
        </div>
        
        <p>We hope you're satisfied with your purchase. If you have any issues, please contact our support team.</p>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/product/${order.orderItems[0]?.product}" class="button">Leave a Review</a>
        </div>
        
        <p style="text-align: center; margin-top: 30px;">
          <strong>Thank you for shopping with SHOPIX!</strong>
        </p>
      </div>
    `;
    return getEmailTemplate(content, `Order Delivered - ${order.trackingNumber}`);
  }
};

// Send Email Function
const sendEmail = async (to, subject, template) => {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"SHOPIX" <${process.env.SMTP_EMAIL}>`,
      to: to,
      subject: subject,
      html: template
    });

    logger.info(`Email sent successfully to ${to}: ${subject}`);
    return { success: true };
  } catch (error) {
    logger.error(`Email send failed to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  emailTemplates,
  sendEmail
};
