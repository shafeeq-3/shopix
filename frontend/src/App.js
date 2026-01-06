import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CurrencyProvider } from './context/CurrencyContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductList from './components/Products/ProductList';
import ProductDetail from './components/Products/ProductDetail';
import LoginNew from './pages/LoginNew';
import RegisterNew from './pages/RegisterNew';
import ForgotPasswordNew from './pages/ForgotPasswordNew';
import ResetPasswordNew from './pages/ResetPasswordNew';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccess from './pages/PaymentSuccess';
import TwoFactorSettings from './components/Auth/TwoFactorSettings';
import UserProfile from './components/Profile/UserProfile';
import Profile from './pages/Profile';
import Checkout from './components/Cart/Checkout';
import UpdateProfile from './components/Profile/UpdateProfile';
import TrackMyOrder from './pages/TrackOrder';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';

function App() {
  return (
    <CurrencyProvider>
      <Router>
        <div className="bg-gray-100 min-h-screen flex flex-col">
          <Navbar />  {/* Navbar component to show across all pages */}

          <main className="flex-grow">
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />  {/* Homepage */}
            <Route path="/products" element={<ProductList />} />  {/* Product listing page */}
            <Route path="/product/:id" element={<ProductDetail />} />  {/* Product detail page */}
          
          {/* Professional Auth Routes with OTP */}
          <Route path="/login" element={<LoginNew />} />
          <Route path="/register" element={<RegisterNew />} />
          <Route path="/forgot-password" element={<ForgotPasswordNew />} />
          <Route path="/reset-password/:token" element={<ResetPasswordNew />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
          
          {/* Payment Routes */}
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          
          {/* Error Pages */}
          <Route path="/500" element={<ServerError />} />

          {/* Protected Routes (Only accessible by logged in users) */}
          {/* Protected Route for Profile */}
          <Route
            path="/profile"
            element={
              // <ProtectedRoute>
                <Profile />
              // </ProtectedRoute>
            }
          />
          {/* Old Profile Component (backup) */}
          <Route
            path="/profile-old"
            element={
              // <ProtectedRoute>
                <UserProfile />
              // </ProtectedRoute>
            }
          />
           {/* Protected Route for Update Profile */}
           <Route
            path="/update-profile"
            element={
              // <ProtectedRoute>
                <UpdateProfile />
              // </ProtectedRoute>
            }
          />
          
          {/* 2FA Settings */}
          <Route
            path="/security/2fa"
            element={
              // <ProtectedRoute>
                <TwoFactorSettings />
              // </ProtectedRoute>
            }
          />

          {/* Admin Routes (Only accessible by admin users) */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Cart & Checkout Routes */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/trackmyorder" element={<TrackMyOrder />} />
        
        {/* 404 - Must be last route */}
        <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />  {/* Footer component to show across all pages */}
        </div>
      </Router>
    </CurrencyProvider>
  );
}

export default App;
