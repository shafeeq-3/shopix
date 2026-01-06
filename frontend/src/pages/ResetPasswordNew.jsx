import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './AuthStyles.css';

const ResetPasswordNew = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Verify token on mount
  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      await axios.get(`${API_URL}/api/users/verify-reset-token/${token}`);
      setTokenValid(true);
    } catch (err) {
      setTokenValid(false);
      setError('Invalid or expired reset link');
    } finally {
      setVerifying(false);
    }
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return '#ef4444';
    if (passwordStrength <= 3) return '#f59e0b';
    if (passwordStrength <= 4) return '#3b82f6';
    return '#10b981';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const validateForm = () => {
    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (passwordStrength < 4) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await axios.put(`${API_URL}/api/users/reset-password/${token}`, {
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-form-container">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-form-container">
            <div className="auth-form-wrapper">
              <div className="success-icon-container">
                <div className="error-icon">
                  <span>❌</span>
                </div>
                <h2 className="form-title">Invalid Reset Link</h2>
                <p className="form-subtitle">
                  This password reset link is invalid or has expired.
                </p>
              </div>
              <Link to="/forgot-password">
                <button className="btn btn-primary btn-block">
                  Request New Reset Link
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-form-container">
            <div className="auth-form-wrapper">
              <div className="success-icon-container">
                <div className="success-icon">
                  <span>✓</span>
                </div>
                <h2 className="form-title">Password Reset Successful!</h2>
                <p className="form-subtitle">
                  Your password has been reset successfully. Redirecting to login...
                </p>
              </div>
              <Link to="/login">
                <button className="btn btn-primary btn-block">
                  Go to Login
                </button>
              </Link>
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
            <h1 className="brand-title">Reset Password</h1>
            <p className="brand-subtitle">
              Create a new strong password for your account
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>Secure Process</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🛡️</span>
                <span>Protected Account</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Easy Setup</span>
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
              <h3 className="form-title">Create New Password</h3>
              <p className="form-subtitle">Enter a strong password for your account</p>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <div className="input-with-icon">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill"
                        style={{ 
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: getPasswordStrengthColor()
                        }}
                      ></div>
                    </div>
                    <span 
                      className="strength-text"
                      style={{ color: getPasswordStrengthColor() }}
                    >
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                )}

                <div className="password-requirements">
                  <p className="requirements-title">Password must contain:</p>
                  <ul>
                    <li className={formData.password.length >= 8 ? 'valid' : ''}>
                      {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={formData.password.match(/[A-Z]/) ? 'valid' : ''}>
                      {formData.password.match(/[A-Z]/) ? '✓' : '○'} One uppercase letter
                    </li>
                    <li className={formData.password.match(/[a-z]/) ? 'valid' : ''}>
                      {formData.password.match(/[a-z]/) ? '✓' : '○'} One lowercase letter
                    </li>
                    <li className={formData.password.match(/[0-9]/) ? 'valid' : ''}>
                      {formData.password.match(/[0-9]/) ? '✓' : '○'} One number
                    </li>
                    <li className={formData.password.match(/[^a-zA-Z0-9]/) ? 'valid' : ''}>
                      {formData.password.match(/[^a-zA-Z0-9]/) ? '✓' : '○'} One special character
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-with-icon">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <div className="password-match">
                    {formData.password === formData.confirmPassword ? (
                      <span className="match-success">✓ Passwords match</span>
                    ) : (
                      <span className="match-error">✗ Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
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

export default ResetPasswordNew;
