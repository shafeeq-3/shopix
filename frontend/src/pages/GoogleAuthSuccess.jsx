import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        const userData = {
          ...user,
          token
        };

        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token); // Save token separately
        
        // Update AuthContext
        setUser(userData);

        // Redirect to home
        navigate('/');
      } catch (error) {
        console.error('Google auth error:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        {/* Logo */}
        <img 
          src="/logo-shopix-dark.svg" 
          alt="SHOPIX" 
          style={{ 
            height: '60px', 
            width: 'auto', 
            marginBottom: '30px',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
          }} 
        />
        
        <div className="spinner" style={{ 
          width: '50px', 
          height: '50px', 
          margin: '0 auto 20px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ fontSize: '18px', fontWeight: '500' }}>Completing Google Sign In...</p>
        <p style={{ fontSize: '14px', opacity: '0.8', marginTop: '10px' }}>Please wait...</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
