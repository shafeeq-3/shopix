const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const { getWishlist } = require('../controllers/whishListController');
const upload = require('../middleware/upload');
const { 
  loginLimiter, 
  registerLimiter,
  passwordResetLimiter 
} = require('../middleware/rateLimiter');
const { 
  validateRegistration, 
  validateLogin,
  validateEmail,
  validatePasswordReset
} = require('../middleware/validator');
const { 
  checkAccountLockout, 
  auditLog,
  detectSuspiciousActivity 
} = require('../middleware/accountSecurity');
const {
  forgotPassword,
  resetPassword,
  verifyResetToken
} = require('../controllers/passwordResetController');

const router = express.Router();

// Public Routes (no authentication required)
router.post('/register', 
  registerLimiter,
  validateRegistration,
  auditLog('USER_REGISTER'),
  registerUser
);

router.post('/login', 
  loginLimiter,
  validateLogin,
  checkAccountLockout,
  detectSuspiciousActivity,
  auditLog('USER_LOGIN'),
  loginUser
);

// Password Reset Routes
router.post('/forgot-password', 
  passwordResetLimiter,
  validateEmail,
  auditLog('PASSWORD_RESET_REQUEST'),
  forgotPassword
);

router.put('/reset-password/:token',
  validatePasswordReset,
  auditLog('PASSWORD_RESET_COMPLETE'),
  resetPassword
);

router.get('/verify-reset-token/:token', verifyResetToken);

// Protected Routes (authentication required)
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/avatar', protect, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'File upload failed' 
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const User = require('../models/User');
    const fs = require('fs');
    const path = require('path');
    
    console.log('File uploaded:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user._id);
    
    // Delete old avatar if exists
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    // Save new avatar path
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();
    
    console.log('Avatar saved:', avatarUrl);
    
    res.json({ 
      success: true, 
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload avatar' });
  }
});
router.get('/wishlist', protect, getWishlist);
router.delete('/account', protect, auditLog('DELETE_ACCOUNT'), async (req, res) => {
  try {
    const userId = req.user._id;
    const User = require('../models/User');
    const Order = require('../models/Order');
    const Cart = require('../models/Cart');
    const Product = require('../models/Product');
    
    // Delete user's cart
    await Cart.deleteMany({ user: userId });
    
    // Delete user's reviews from products
    await Product.updateMany(
      { "reviews.user": userId },
      { $pull: { reviews: { user: userId } } }
    );
    
    // Mark orders as deleted user
    await Order.updateMany(
      { user: userId },
      { $set: { userDeleted: true } }
    );
    
    // Delete user account
    await User.findByIdAndDelete(userId);
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
});

// Admin Routes (authentication + admin role required)
router.get('/', protect, admin, getAllUsers);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;