import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StripeCheckout from '../components/Payment/StripeCheckout';
import { ArrowLeft } from 'lucide-react';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, amount, orderNumber } = location.state || {};

  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    // Redirect if no order data
    if (!orderId || !amount) {
      navigate('/cart');
    }
  }, [orderId, amount, navigate]);

  const handlePaymentSuccess = (order) => {
    // Redirect to success page
    navigate('/payment-success', {
      state: { order }
    });
  };

  const handlePaymentError = (error) => {
    setPaymentError(error);
  };

  if (!orderId || !amount) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-width-container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to Cart
          </button>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
            <p className="text-gray-600">Order #{orderNumber}</p>
          </div>
        </div>

        {/* Payment Error */}
        {paymentError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900">Payment Failed</h3>
                <p className="text-red-700 text-sm mt-1">{paymentError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stripe Checkout */}
        <StripeCheckout
          orderId={orderId}
          amount={amount}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />

        {/* Order Summary */}
        <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Order Number:</span>
              <span className="font-medium text-gray-900">{orderNumber}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Amount:</span>
              <span className="font-bold text-xl text-gray-900">Rs. {amount}</span>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact us at support@shopix.com</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
