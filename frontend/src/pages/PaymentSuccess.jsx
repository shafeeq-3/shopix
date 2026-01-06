import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state?.order;

  useEffect(() => {
    // Redirect to orders if no order data
    if (!orderData) {
      setTimeout(() => {
        navigate('/myorders');
      }, 3000);
    }
  }, [orderData, navigate]);

  return (
    <div className="payment-success-container">
      <div className="success-card">
        <div className="success-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="#10b981" strokeWidth="4" fill="none"/>
            <path d="M25 40L35 50L55 30" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1>Payment Successful! 🎉</h1>
        <p className="success-message">
          Your payment has been processed successfully. Thank you for your purchase!
        </p>

        {orderData && (
          <div className="order-details">
            <div className="detail-item">
              <span className="label">Order Number:</span>
              <span className="value">{orderData.orderNumber}</span>
            </div>
            <div className="detail-item">
              <span className="label">Status:</span>
              <span className="value status-confirmed">{orderData.orderStatus}</span>
            </div>
            <div className="detail-item">
              <span className="label">Payment Date:</span>
              <span className="value">{new Date(orderData.paidAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        <div className="success-info">
          <div className="info-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
            </svg>
            <div>
              <strong>Confirmation Email Sent</strong>
              <p>Check your inbox for order details and receipt</p>
            </div>
          </div>

          <div className="info-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
            </svg>
            <div>
              <strong>Secure Transaction</strong>
              <p>Your payment was processed securely via Stripe</p>
            </div>
          </div>

          <div className="info-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            <div>
              <strong>Order Processing</strong>
              <p>Your order is being prepared for shipment</p>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button
            onClick={() => navigate('/trackmyorder')}
            className="btn btn-primary"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.5 7.5l-4 4-1-1 3-3-3-3 1-1 4 4z"/>
            </svg>
            Track Order
          </button>

          <button
            onClick={() => navigate('/myorders')}
            className="btn btn-secondary"
          >
            View All Orders
          </button>

          <button
            onClick={() => navigate('/')}
            className="btn btn-outline"
          >
            Continue Shopping
          </button>
        </div>

        <div className="shopix-branding">
          <p>Thank you for shopping with <strong>SHOPIX</strong></p>
          <p className="tagline">Shop. Click. Done.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
