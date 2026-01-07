import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AuthStyles.css';

const LoginNew = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState('email'); // email, password, otp, 2fa
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
    twoFactorCode: '',
    useBackupCode: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Step 1: Email validation
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email) {
      setError('Please enter your email');
      return;
    }

    setStep('password');
  };

  // Step 2: Password login - Now sends OTP
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/users/login`, {
        email: formData.email,
        password: formData.password
      });

      // Check if OTP is required (MANDATORY)
      if (response.data.requiresOTP) {
        setStep('otp');
        setOtpTimer(600); // 10 minutes
        setSuccess('OTP sent to your email. Please check and enter the code.');
      } else if (response.data.requires2FA) {
        // If 2FA is enabled
        setStep('2fa');
        setSuccess('Please enter your 2FA code');
      } else {
        // Direct login (should not happen with mandatory OTP)
        const userData = {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
          token: response.data.token
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.data.token); // Save token separately
        setUser(userData);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Alternative: Send OTP
  const handleSendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/api/auth/send-otp`, {
        email: formData.email
      });

      setStep('otp');
      setOtpTimer(600); // 10 minutes
      setSuccess('OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email: formData.email,
        otp: formData.otp
      });

      // Check if 2FA is required after OTP
      if (response.data.requires2FA) {
        setStep('2fa');
        setSuccess('OTP verified! Now enter your 2FA code.');
      } else {
        // Login successful - Update AuthContext and localStorage
        const userData = {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
          token: response.data.token
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.data.token); // Save token separately
        setUser(userData);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Verify 2FA
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/2fa/verify`, {
        email: formData.email,
        token: formData.twoFactorCode,
        useBackupCode: formData.useBackupCode
      });

      // Login successful - Update AuthContext and localStorage
      const userData = {
        _id: response.data.data._id,
        name: response.data.data.name,
        email: response.data.data.email,
        role: response.data.data.role,
        token: response.data.data.token
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.data.data.token); // Save token separately
      setUser(userData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/api/auth/resend-otp`, {
        email: formData.email
      });

      setOtpTimer(600);
      setSuccess('New OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="branding-content">
            <h1 className="brand-title">Welcome Back!</h1>
            <p className="brand-subtitle">
              Sign in to access your account and continue shopping
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>Secure Authentication</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Fast & Easy Login</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🛡️</span>
                <span>Protected Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-form-container">
          <div className="auth-form-wrapper">
            {/* Logo */}
            <div className="auth-logo">
              <img src="/logo-shopix.svg" alt="SHOPIX" style={{ height: '50px', width: 'auto' }} />
            </div>

            {/* Progress Steps */}
            <div className="auth-steps">
              <div className={`step ${step === 'email' || step === 'password' || step === 'otp' || step === '2fa' ? 'active' : ''}`}>
                <div className="step-number">1</div>
                <span>Email</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step === 'password' || step === 'otp' || step === '2fa' ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <span>Verify</span>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <span className="alert-icon">✓</span>
                {success}
              </div>
            )}

            {/* Step 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="auth-form">
                <h3 className="form-title">Sign In</h3>
                <p className="form-subtitle">Enter your email to continue</p>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                  Continue
                </button>

                {/* Divider */}
                <div className="divider">
                  <span>OR</span>
                </div>

                {/* Google Sign In Button - Temporarily Disabled */}
                {/* 
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `${API_URL}/api/auth/google`;
                  }}
                  className="btn btn-secondary btn-block"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    color: '#374151',
                    fontWeight: '600'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  Continue with Google
                </button>
                */}

                <div style={{
                  padding: '12px',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Google Sign-In temporarily unavailable. Please use email/password.
                </div>

                <div className="form-footer">
                  <p>
                    Don't have an account?{' '}
                    <Link to="/register" className="link-primary">Sign up</Link>
                  </p>
                </div>
              </form>
            )}

            {/* Step 2: Password */}
            {step === 'password' && (
              <form onSubmit={handlePasswordLogin} className="auth-form">
                <button 
                  type="button" 
                  className="btn-back"
                  onClick={() => setStep('email')}
                >
                  ← Back
                </button>

                <h3 className="form-title">Enter Password</h3>
                <p className="form-subtitle">{formData.email}</p>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-with-icon">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
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
                </div>

                <div className="form-options">
                  <Link to="/forgot-password" className="link-secondary">
                    Forgot password?
                  </Link>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </button>

                <div className="form-footer">
                  <p className="info-text">
                    📧 An OTP will be sent to your email for verification
                  </p>
                </div>
              </form>
            )}

            {/* Step 3: OTP Verification */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="auth-form">
                <button 
                  type="button" 
                  className="btn-back"
                  onClick={() => setStep('password')}
                >
                  ← Back
                </button>

                <h3 className="form-title">Enter OTP</h3>
                <p className="form-subtitle">
                  We sent a 6-digit code to<br />
                  <strong>{formData.email}</strong>
                </p>

                <div className="form-group">
                  <label htmlFor="otp">OTP Code</label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="000000"
                    maxLength="6"
                    pattern="[0-9]{6}"
                    required
                    autoFocus
                    className="otp-input"
                  />
                </div>

                {otpTimer > 0 && (
                  <div className="timer-display">
                    ⏱️ Code expires in {formatTime(otpTimer)}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <div className="form-footer">
                  <p>
                    Didn't receive code?{' '}
                    <button
                      type="button"
                      className="link-primary"
                      onClick={handleResendOTP}
                      disabled={loading || otpTimer > 540}
                    >
                      Resend OTP
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* Step 4: 2FA Verification */}
            {step === '2fa' && (
              <form onSubmit={handleVerify2FA} className="auth-form">
                <h3 className="form-title">Two-Factor Authentication</h3>
                <p className="form-subtitle">
                  Enter the code from your authenticator app
                </p>

                <div className="form-group">
                  <label htmlFor="twoFactorCode">
                    {formData.useBackupCode ? 'Backup Code' : '2FA Code'}
                  </label>
                  <input
                    type="text"
                    id="twoFactorCode"
                    name="twoFactorCode"
                    value={formData.twoFactorCode}
                    onChange={handleChange}
                    placeholder={formData.useBackupCode ? 'XXXXXXXX' : '000000'}
                    maxLength={formData.useBackupCode ? 8 : 6}
                    required
                    autoFocus
                    className="otp-input"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </button>

                <div className="form-footer">
                  <button
                    type="button"
                    className="link-secondary"
                    onClick={() => setFormData({ ...formData, useBackupCode: !formData.useBackupCode })}
                  >
                    {formData.useBackupCode ? 'Use authenticator code' : 'Use backup code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginNew;
