import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './PaymentStyles.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Load Stripe - with validation
const STRIPE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_KEY) {
  console.error('⚠️ STRIPE KEY MISSING! Add REACT_APP_STRIPE_PUBLISHABLE_KEY to frontend/.env');
}

const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

// Card element styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  },
  hidePostalCode: true
};

// Checkout Form Component
const CheckoutForm = ({ orderId, amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');

  // Create payment intent on mount
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;
        
        if (!token) {
          setError('Please login to continue with payment');
          onError('Please login to continue with payment');
          return;
        }
        
        const response = await axios.post(
          `${API_URL}/api/payment/create-intent`,
          { orderId },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          setClientSecret(response.data.clientSecret);
          setPaymentIntentId(response.data.paymentIntentId);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize payment');
        onError(err.response?.data?.message || 'Failed to initialize payment');
      }
    };

    if (orderId) {
      createPaymentIntent();
    }
  }, [orderId, onError]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Confirm card payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        onError(stripeError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;
        
        const response = await axios.post(
          `${API_URL}/api/payment/confirm`,
          {
            paymentIntentId: paymentIntent.id,
            orderId
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          onSuccess(response.data.order);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
      onError(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <div className="card-element-container">
        <label htmlFor="card-element">Credit or Debit Card</label>
        <CardElement id="card-element" options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <div className="error-message">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM7 4h2v5H7V4zm0 6h2v2H7v-2z"/>
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || !clientSecret}
        className="pay-button"
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Processing...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H2zm0 1h12a1 1 0 011 1v1H1V4a1 1 0 011-1zm0 10a1 1 0 01-1-1V7h14v5a1 1 0 01-1 1H2z"/>
            </svg>
            Pay Rs. {amount}
          </>
        )}
      </button>

      <div className="secure-payment-badge">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0l6 3v5c0 3.5-2.5 6.5-6 7-3.5-.5-6-3.5-6-7V3l6-3zm0 1.5L3 4v5c0 2.8 2 5.2 5 5.9 3-.7 5-3.1 5-5.9V4l-5-2.5z"/>
          <path d="M7 8.5l-2-2 .7-.7L7 7.1l3.3-3.3.7.7L7 8.5z"/>
        </svg>
        Secure payment powered by Stripe
      </div>
    </form>
  );
};

// Main Stripe Checkout Component
const StripeCheckout = ({ orderId, amount, onSuccess, onError }) => {
  // Check if Stripe is configured
  if (!stripePromise) {
    return (
      <div className="stripe-checkout-container">
        <div className="payment-header">
          <h2>⚠️ Payment Configuration Error</h2>
          <p>Stripe payment is not configured. Please contact support.</p>
        </div>
        <div className="error-message" style={{ marginTop: '20px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM7 4h2v5H7V4zm0 6h2v2H7v-2z"/>
          </svg>
          Stripe publishable key is missing. Please add REACT_APP_STRIPE_PUBLISHABLE_KEY to your environment variables and restart the server.
        </div>
      </div>
    );
  }

  return (
    <div className="stripe-checkout-container">
      <div className="payment-header">
        <h2>💳 Payment Details</h2>
        <p>Complete your purchase securely</p>
      </div>

      <Elements stripe={stripePromise}>
        <CheckoutForm
          orderId={orderId}
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>

      <div className="payment-info">
        <div className="info-item">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
            <path d="M9 5h2v2H9V5zm0 4h2v6H9V9z"/>
          </svg>
          <div>
            <strong>Secure Payment</strong>
            <p>Your payment information is encrypted and secure</p>
          </div>
        </div>

        <div className="info-item">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 0l8 4v6c0 4.5-3.2 8.4-8 9.5C5.2 18.4 2 14.5 2 10V4l8-4zm0 2L4 5v5c0 3.6 2.5 6.8 6 7.8 3.5-1 6-4.2 6-7.8V5l-6-3z"/>
          </svg>
          <div>
            <strong>Protected Purchase</strong>
            <p>100% secure checkout with Stripe</p>
          </div>
        </div>

        <div className="info-item">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2-1a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H4z"/>
            <path d="M6 8h8v2H6V8zm0 4h5v2H6v-2z"/>
          </svg>
          <div>
            <strong>Instant Confirmation</strong>
            <p>Receive email confirmation immediately</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeCheckout;
