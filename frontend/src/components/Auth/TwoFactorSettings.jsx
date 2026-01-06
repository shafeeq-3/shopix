import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TwoFactorSettings.css';

const TwoFactorSettings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState('main'); // main, setup, verify, disable
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [password, setPassword] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      setUser(userInfo);
    }
  }, []);

  const getAuthHeaders = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    return {
      headers: {
        Authorization: `Bearer ${userInfo?.token}`
      }
    };
  };

  // Enable 2FA - Step 1: Generate QR Code
  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/2fa/enable`,
        {},
        getAuthHeaders()
      );

      setQrCode(response.data.data.qrCode);
      setSecret(response.data.data.secret);
      setStep('setup');
      setSuccess('Scan the QR code with your authenticator app');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Enable 2FA - Step 2: Verify Setup
  const handleVerifySetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/2fa/verify-setup`,
        { token: verificationCode },
        getAuthHeaders()
      );

      setBackupCodes(response.data.data.backupCodes);
      setStep('backup-codes');
      setSuccess('2FA enabled successfully!');
      
      // Update user info
      const updatedUser = { ...user, twoFactorEnabled: true };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(
        `${API_URL}/api/auth/2fa/disable`,
        { 
          password: password,
          token: verificationCode 
        },
        getAuthHeaders()
      );

      setSuccess('2FA disabled successfully');
      setStep('main');
      setPassword('');
      setVerificationCode('');
      
      // Update user info
      const updatedUser = { ...user, twoFactorEnabled: false };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    a.click();
  };

  // Copy backup codes
  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setSuccess('Backup codes copied to clipboard');
  };

  if (!user) {
    return <div className="twofa-loading">Loading...</div>;
  }

  return (
    <div className="twofa-container">
      <div className="twofa-card">
        {/* Header */}
        <div className="twofa-header">
          <h2>🔐 Two-Factor Authentication</h2>
          <p>Add an extra layer of security to your account</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="twofa-alert twofa-alert-error">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="twofa-alert twofa-alert-success">
            <span>✓</span> {success}
          </div>
        )}

        {/* Main View */}
        {step === 'main' && (
          <div className="twofa-content">
            <div className="twofa-status">
              <div className="status-badge">
                {user.twoFactorEnabled ? (
                  <span className="badge-enabled">✓ Enabled</span>
                ) : (
                  <span className="badge-disabled">○ Disabled</span>
                )}
              </div>
              <p className="status-text">
                {user.twoFactorEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Protect your account with 2FA'}
              </p>
            </div>

            <div className="twofa-info">
              <h3>What is Two-Factor Authentication?</h3>
              <p>
                2FA adds an extra layer of security by requiring a code from your
                authenticator app in addition to your password when logging in.
              </p>
              
              <div className="info-steps">
                <div className="info-step">
                  <span className="step-number">1</span>
                  <div>
                    <h4>Download an Authenticator App</h4>
                    <p>Google Authenticator, Authy, or Microsoft Authenticator</p>
                  </div>
                </div>
                <div className="info-step">
                  <span className="step-number">2</span>
                  <div>
                    <h4>Scan QR Code</h4>
                    <p>Use your app to scan the QR code we provide</p>
                  </div>
                </div>
                <div className="info-step">
                  <span className="step-number">3</span>
                  <div>
                    <h4>Enter Verification Code</h4>
                    <p>Confirm setup by entering the 6-digit code</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="twofa-actions">
              {!user.twoFactorEnabled ? (
                <button
                  className="btn btn-primary"
                  onClick={handleEnable2FA}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Enable 2FA'}
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  onClick={() => setStep('disable')}
                >
                  Disable 2FA
                </button>
              )}
            </div>
          </div>
        )}

        {/* Setup View - QR Code */}
        {step === 'setup' && (
          <div className="twofa-content">
            <button className="btn-back" onClick={() => setStep('main')}>
              ← Back
            </button>

            <h3>Scan QR Code</h3>
            <p>Use your authenticator app to scan this QR code</p>

            <div className="qr-code-container">
              <img src={qrCode} alt="QR Code" className="qr-code" />
            </div>

            <div className="manual-entry">
              <p>Can't scan? Enter this code manually:</p>
              <div className="secret-code">
                <code>{secret}</code>
                <button
                  className="btn-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(secret);
                    setSuccess('Secret copied!');
                  }}
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <form onSubmit={handleVerifySetup} className="verify-form">
              <div className="form-group">
                <label>Enter 6-digit code from your app</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                  className="code-input"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </form>
          </div>
        )}

        {/* Backup Codes View */}
        {step === 'backup-codes' && (
          <div className="twofa-content">
            <h3>Save Your Backup Codes</h3>
            <p className="backup-warning">
              ⚠️ Save these codes in a safe place. You can use them to access your
              account if you lose your authenticator device.
            </p>

            <div className="backup-codes-container">
              {backupCodes.map((code, index) => (
                <div key={index} className="backup-code">
                  {code}
                </div>
              ))}
            </div>

            <div className="backup-actions">
              <button className="btn btn-secondary" onClick={downloadBackupCodes}>
                📥 Download
              </button>
              <button className="btn btn-secondary" onClick={copyBackupCodes}>
                📋 Copy
              </button>
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={() => setStep('main')}
            >
              Done
            </button>
          </div>
        )}

        {/* Disable 2FA View */}
        {step === 'disable' && (
          <div className="twofa-content">
            <button className="btn-back" onClick={() => setStep('main')}>
              ← Back
            </button>

            <h3>Disable Two-Factor Authentication</h3>
            <p className="disable-warning">
              ⚠️ This will make your account less secure. Are you sure?
            </p>

            <form onSubmit={handleDisable2FA} className="verify-form">
              <div className="form-group">
                <label>Enter your password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                />
              </div>

              <div className="form-group">
                <label>Enter 6-digit code from your app</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                  className="code-input"
                />
              </div>

              <button
                type="submit"
                className="btn btn-danger btn-block"
                disabled={loading}
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSettings;
