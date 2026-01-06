import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AuthStyles.css';

const ForgotPasswordNew = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/users/forgot-password`, {
        email: email.toLowerCase()
      });

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-form-container">
            <div className="auth-form-wrapper">
              {/* Success Icon */}
              <div className="success-icon-container">
                <div className="success-icon">
                  <span>✓</span>
                </div>
                <h2 className="form-title">Check Your Email</h2>
                <p className="form-subtitle">
                  We've sent a password reset link to
                </p>
                <p className="email-highlight">{email}</p>
              </div>

              {/* Instructions */}
              <div className="info-box">
                <h3>📧 Next Steps:</h3>
                <ol>
                  <li>Check your email inbox</li>
                  <li>Click the reset link in the email</li>
                  <li>Enter your new password</li>
                  <li>Login with your new password</li>
                </ol>
              </div>

              {/* Warning */}
              <div className="warning-box">
                <p>
                  <strong>⚠️ Important:</strong> The reset link will expire in 1 hour. 
                  If you don't see the email, check your spam folder.
                </p>
              </div>

              {/* Actions */}
              <div className="form-actions">
                <Link to="/login">
                  <button className="btn btn-primary btn-block">
                    Back to Login
                  </button>
                </Link>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="btn btn-secondary btn-block"
                >
                  Send Another Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="branding-content">
            <h1 className="brand-title">Forgot Password?</h1>
            <p className="brand-subtitle">
              No worries! Enter your email and we'll send you a reset link.
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>Secure Reset Process</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Quick & Easy</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📧</span>
                <span>Email Verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-container">
          <div className="auth-form-wrapper">
            {/* Logo */}
            <div className="auth-logo">
              <img src="/logo-shopix.svg" alt="SHOPIX" style={{ height: '50px', width: 'auto' }} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              <h3 className="form-title">Reset Password</h3>
              <p className="form-subtitle">
                Enter your email address and we'll send you a link to reset your password
              </p>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="form-footer">
                <p>
                  Remember your password?{' '}
                  <Link to="/login" className="link-primary">Back to Login</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordNew;
