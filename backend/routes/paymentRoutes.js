const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  handleStripeWebhook
} = require('../controllers/paymentController');

// Create payment intent
router.post('/create-intent', protect, createPaymentIntent);

// Confirm payment
router.post('/confirm', protect, confirmPayment);

// Get payment status
router.get('/status/:orderId', protect, getPaymentStatus);

// Stripe webhook (no auth middleware - Stripe will verify)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
