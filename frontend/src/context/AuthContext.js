import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

// Create AuthContext
export const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null); // Store user info
  const [loading, setLoading] = useState(true); // Track loading state
  const [cart, setCart] = useState([]); // Store cart items
  const [wishlist, setWishlist] = useState([]); // Store wishlist items
  const [totalAmount, setTotalAmount] = useState(0); // Total cart amount

  // Load user from localStorage when app loads
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  // Fetch cart and wishlist when user is logged in
  useEffect(() => {
    if (user) {
      fetchCart();
      fetchWishlist();
    }
  }, [user]);

  // Fetch wishlist data from the backend
  const fetchWishlist = async () => {
    try {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/wishlist`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setWishlist(response.data); // Update wishlist state
    } catch (error) {
      console.error("Error fetching wishlist:", error.response?.data?.message || error.message);
    }
  };

  // Register new user
  const registerUser = async (name, email, password) => {
    try {
  const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/register`, {
        name,
        email,
        password,
      });
      localStorage.setItem("user", JSON.stringify(response.data));
      setUser(response.data);
    } catch (error) {
      console.error("Error registering user:", error.response?.data?.message || error.message);
    }
  };

  // Login existing user
  const login = async (email, password) => {
    try {
  const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/login`, {
        email,
        password,
      });
      localStorage.setItem("user", JSON.stringify(response.data));
      setUser(response.data);
    } catch (error) {
      console.error("Error logging in:", error.response?.data?.message || error.message);
    }
  };

  // Logout user
  const logoutUser = () => {
    localStorage.removeItem("user");
    setUser(null);
    setCart([]);
    setWishlist([]);
    setTotalAmount(0);
  };

  // Fetch cart items from the backend
  const fetchCart = async () => {
    try {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const items = response.data.items || [];
      setCart(items);
      calculateTotal(items);
    } catch (error) {
      console.error("Error fetching cart:", error.response?.data?.message || error.message);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      await axios.post(
  `${process.env.REACT_APP_API_URL}/api/cart`,
        { productId, quantity },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      await fetchCart(); // Ensure the cart is updated immediately
    } catch (error) {
      console.error("Error adding to cart:", error.response?.data?.message || error.message);
    }
  };
  
  const updateCart = async (productId, quantityChange) => {
    try {
      await axios.post(
  `${process.env.REACT_APP_API_URL}/api/cart`,
        { productId, quantity: quantityChange },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      await fetchCart(); // Ensure the cart is updated immediately
    } catch (error) {
      console.error("Error updating cart:", error.response?.data?.message || error.message);
    }
  };
  
  const removeItem = async (productId) => {
    try {
  await axios.delete(`${process.env.REACT_APP_API_URL}/api/cart/${productId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      await fetchCart(); // Ensure the cart is updated immediately
    } catch (error) {
      console.error("Error removing item:", error.response?.data?.message || error.message);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchCart(); // Load cart data when user logs in
    }
  }, [user]); // Re-fetch cart whenever the user changes
  
  // Calculate total cart amount
  const calculateTotal = (items) => {
    const total = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    setTotalAmount(total);
  };

  // Add product to wishlist
  const addToWishlist = async (productId) => {
    try {
      await axios.post(
  `${process.env.REACT_APP_API_URL}/api/products/${productId}/wishlist`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchWishlist();
    } catch (error) {
      console.error("Error adding to wishlist:", error.response?.data?.message || error.message);
    }
  };

  // Remove product from wishlist
  const removeFromWishlist = async (productId) => {
    try {
  await axios.delete(`${process.env.REACT_APP_API_URL}/api/products/${productId}/wishlist`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchWishlist();
    } catch (error) {
      console.error("Error removing from wishlist:", error.response?.data?.message || error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        cart,
        wishlist,
        registerUser,
        login,
        logoutUser,
        addToCart,
        removeItem,
        updateCart,
        totalAmount,
        addToWishlist,
        removeFromWishlist,
        fetchCart,
        fetchWishlist,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
