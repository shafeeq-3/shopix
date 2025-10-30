import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useParams } from "react-router-dom";

// Icon Components
const HeartIcon = ({ filled, className }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.682l-1.318-1.364a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
  </svg>
);

const StarIcon = ({ filled, className, half = false }) => {
  if (half) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <defs>
          <linearGradient id="half-fill">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          fill="url(#half-fill)"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    );
  }
  return (
    <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
};

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ExclamationIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.464 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const TruckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LoadingSpinner = ({ size = "w-6 h-6" }) => (
  <div className={`animate-spin rounded-full border-2 border-transparent border-t-current ${size}`}></div>
);

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 transform ${getToastStyles()} max-w-sm`}>
      <div className="flex items-center space-x-3">
        <span className="font-semibold text-sm sm:text-base">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-80 text-xl font-bold">
          ×
        </button>
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isReviewing, setIsReviewing] = useState(false);
  const [toast, setToast] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState({
    page: true,
    wishlist: false,
    cart: false,
    review: false
  });
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { id } = useParams();

  const { user, wishlist, addToWishlist, removeFromWishlist, addToCart } = useAuth();

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, page: true }));
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error("Product Detail Error:", error);
      showToast(error.response?.data?.message || 'Failed to load product', 'error');
    } finally {
      setLoading(prev => ({ ...prev, page: false }));
    }
  }, [id, showToast]);

  useEffect(() => {
    if (wishlist && id) {
      setIsInWishlist(wishlist.some((item) => item._id === id));
    }
    fetchProduct();
  }, [wishlist, id, fetchProduct]);

  const discountInfo = useMemo(() => {
    if (!product || !product.price) return null;
    
    const originalPrice = parseFloat(product.price);
    const discountedPrice = parseFloat(product.discountedPrice);
    
    if (discountedPrice && discountedPrice > 0 && discountedPrice < originalPrice) {
      const discountAmount = originalPrice - discountedPrice;
      const discountPercentage = Math.round((discountAmount / originalPrice) * 100);
      
      return {
        hasDiscount: true,
        originalPrice,
        discountedPrice,
        discountAmount,
        discountPercentage,
        finalPrice: discountedPrice
      };
    }
    
    return {
      hasDiscount: false,
      originalPrice,
      finalPrice: originalPrice
    };
  }, [product]);

  const handleWishlistToggle = useCallback(async () => {
    if (!user) {
      showToast("Please login to manage wishlist", 'warning');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, wishlist: true }));
      
      if (isInWishlist) {
        await removeFromWishlist(id);
        showToast("Removed from wishlist", 'success');
      } else {
        await addToWishlist(id);
        showToast("Added to wishlist", 'success');
      }
      
      setIsInWishlist(prev => !prev);
    } catch (error) {
      console.error("Wishlist error:", error);
      showToast("Failed to update wishlist", 'error');
    } finally {
      setLoading(prev => ({ ...prev, wishlist: false }));
    }
  }, [user, isInWishlist, id, addToWishlist, removeFromWishlist, showToast]);

  const handleAddToCart = useCallback(async () => {
    if (!user) {
      showToast("Please login to add to cart", 'warning');
      return;
    }

    if (!product || product.stock === 0) {
      showToast("Product out of stock", 'error');
      return;
    }

    if (quantity > product.stock) {
      showToast(`Only ${product.stock} items available`, 'error');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, cart: true }));
      await addToCart(product._id, quantity);
      showToast(`Added ${quantity} item(s) to cart!`, 'success');
    } catch (error) {
      console.error("Add to cart error:", error);
      showToast(error.response?.data?.message || 'Failed to add to cart', 'error');
    } finally {
      setLoading(prev => ({ ...prev, cart: false }));
    }
  }, [user, quantity, product, addToCart, showToast]);

  const handleAddReview = useCallback(async () => {
    if (!user) {
      showToast("Please login to write a review", 'warning');
      return;
    }

    if (!comment.trim()) {
      showToast("Please enter a comment", 'error');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, review: true }));
      
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/products/${id}/reviews`,
        { rating, comment: comment.trim() },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      const newReview = {
        user: { name: user.name },
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      };

      setProduct(prev => ({
        ...prev,
        reviews: [newReview, ...(prev.reviews || [])],
        numReviews: (prev.numReviews || 0) + 1,
        rating: (((prev.rating || 0) * (prev.numReviews || 0) + rating) / ((prev.numReviews || 0) + 1)).toFixed(1)
      }));

      showToast("Review added successfully!", 'success');
      setIsReviewing(false);
      setComment("");
      setRating(5);
    } catch (error) {
      console.error("Review error:", error);
      showToast(error.response?.data?.message || 'Failed to add review', 'error');
    } finally {
      setLoading(prev => ({ ...prev, review: false }));
    }
  }, [comment, rating, user, id, showToast]);

  const renderStars = useCallback((rating, interactive = false, onRate = null) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIcon
            key={i}
            filled={true}
            className={`w-5 h-5 transition-all ${
              interactive ? 'cursor-pointer hover:scale-110' : ''
            } text-amber-400`}
            onClick={interactive ? () => onRate(i + 1) : undefined}
          />
        );
      } else if (i === fullStars && hasHalfStar && !interactive) {
        stars.push(
          <StarIcon
            key={i}
            half={true}
            className="w-5 h-5 text-amber-400"
          />
        );
      } else {
        stars.push(
          <StarIcon
            key={i}
            filled={false}
            className={`w-5 h-5 transition-all ${
              interactive ? 'cursor-pointer hover:scale-110' : ''
            } text-gray-300`}
            onClick={interactive ? () => onRate(i + 1) : undefined}
          />
        );
      }
    }
    return stars;
  }, []);

  if (loading.page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="w-16 h-16" />
          <p className="mt-6 text-slate-700 font-semibold text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExclamationIcon className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">Product Not Found</h2>
          <p className="text-slate-600 mb-8">This product doesn't exist or has been removed.</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 flex items-center space-x-2 overflow-x-auto whitespace-nowrap pb-2">
          <span className="hover:text-blue-600 cursor-pointer transition-colors">Home</span>
          <span>/</span>
          <span className="hover:text-blue-600 cursor-pointer transition-colors capitalize">{product.category}</span>
          <span>/</span>
          <span className="text-slate-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Main Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-10">
            {/* Image Gallery */}
            <div className="space-y-3 sm:space-y-4">
              <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl overflow-hidden group">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <LoadingSpinner size="w-10 h-10" />
                  </div>
                )}
                <img
                  src={selectedImage === 0 ? product.image : product.images?.[selectedImage - 1]?.url}
                  alt={product.name}
                  className={`w-full h-full object-contain p-4 sm:p-8 transition-all duration-700 ${
                    imageLoading ? 'opacity-0' : 'opacity-100 group-hover:scale-105'
                  }`}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
                {discountInfo?.hasDiscount && (
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl">
                    {discountInfo.discountPercentage}% OFF
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
                    <span className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-bold text-sm sm:text-lg shadow-2xl">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images?.length > 0 && (
                <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                  <div
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                      selectedImage === 0 
                        ? 'border-blue-500 shadow-lg scale-105 ring-2 ring-blue-200' 
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedImage(0)}
                  >
                    <img src={product.image} alt="Main" className="w-full h-full object-cover" />
                  </div>
                  {product.images.map((img, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                        selectedImage === index + 1 
                          ? 'border-blue-500 shadow-lg scale-105 ring-2 ring-blue-200' 
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedImage(index + 1)}
                    >
                      <img src={img.url} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 sm:mb-3 leading-tight">
                  {product.name}
                </h1>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base lg:text-lg">
                  {product.description}
                </p>
              </div>

              {/* Rating */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-0.5 sm:space-x-1">
                    {renderStars(Number(product.rating) || 0)}
                  </div>
                  <span className="text-slate-900 font-bold text-base sm:text-lg">
                    {Number(product.rating).toFixed(1)}
                  </span>
                </div>
                <div className="h-5 w-px bg-amber-200"></div>
                <span className="text-slate-700 font-medium text-sm sm:text-base">
                  {product.numReviews} {product.numReviews === 1 ? 'Review' : 'Reviews'}
                </span>
              </div>

              {/* Price */}
              <div className="space-y-2 sm:space-y-3 p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-100">
                {discountInfo?.hasDiscount ? (
                  <>
                    <div className="flex flex-wrap items-baseline gap-2 sm:gap-4">
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-600">
                        ${discountInfo.finalPrice.toFixed(2)}
                      </span>
                      <span className="text-lg sm:text-xl lg:text-2xl text-slate-500 line-through">
                        ${discountInfo.originalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold">
                        Save ${discountInfo.discountAmount.toFixed(2)}
                      </span>
                      <span className="bg-emerald-100 text-emerald-700 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold">
                        {discountInfo.discountPercentage}% Discount
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-600">
                    ${discountInfo?.finalPrice?.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">Brand</span>
                  <p className="font-bold text-sm sm:text-base text-slate-900">{product.brand}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">Category</span>
                  <p className="font-bold text-sm sm:text-base text-slate-900 capitalize">{product.category}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">Stock</span>
                  <p className={`font-bold text-sm sm:text-base ${
                    product.stock > 10 ? 'text-emerald-600' : product.stock > 0 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {product.stock > 0 ? `${product.stock} items` : 'Out of Stock'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">Status</span>
                  <p className={`font-bold text-sm sm:text-base ${product.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? '✔ Available' : '❌ Unavailable'}
                  </p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-slate-700 font-bold text-sm sm:text-base">Quantity:</label>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg sm:text-xl"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
                      className="w-14 sm:w-16 h-10 sm:h-12 text-center border-0 bg-transparent focus:ring-0 font-bold text-base sm:text-lg"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg sm:text-xl"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-slate-600 font-medium text-xs sm:text-sm">
                    ({product.stock} available)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={loading.cart || product.stock === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 sm:space-x-3 shadow-xl text-sm sm:text-base"
                >
                  {loading.cart ? (
                    <LoadingSpinner size="w-5 h-5" />
                  ) : (
                    <>
                      <CartIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleWishlistToggle}
                  disabled={loading.wishlist}
                  className={`p-3 sm:p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    isInWishlist
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border-2 border-slate-200'
                  }`}
                >
                  {loading.wishlist ? (
                    <LoadingSpinner size="w-6 h-6" />
                  ) : (
                    <HeartIcon filled={isInWishlist} className="w-6 h-6 sm:w-7 sm:h-7" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="border-t-2 border-slate-200 p-4 sm:p-6 lg:p-10 bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-3xl sm:text-4xl">💬</span>
                Customer Reviews
              </h3>
              {user && !isReviewing && (
                <button
                  onClick={() => setIsReviewing(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg text-sm sm:text-base whitespace-nowrap"
                >
                  ✍️ Write Review
                </button>
              )}
            </div>

            {/* Review Form */}
            {isReviewing && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-xl border-2 border-blue-100">
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  Share Your Experience
                </h4>
                
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-slate-700 font-bold mb-2 sm:mb-3 text-sm sm:text-base">
                      Your Rating:
                    </label>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {renderStars(rating, true, setRating)}
                      <span className="ml-2 sm:ml-3 text-slate-600 font-semibold text-sm sm:text-base">
                        ({rating} {rating === 1 ? 'star' : 'stars'})
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-2 sm:mb-3 text-sm sm:text-base">
                      Your Review:
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us what you think about this product..."
                      className="w-full p-3 sm:p-4 border-2 border-slate-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all text-sm sm:text-base"
                      rows="4"
                      maxLength={500}
                    />
                    <div className="text-right text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">
                      {comment.length}/500
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      onClick={handleAddReview}
                      disabled={loading.review || !comment.trim()}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 sm:px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 font-bold shadow-lg text-sm sm:text-base"
                    >
                      {loading.review ? (
                        <LoadingSpinner size="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <>
                          <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Submit Review</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsReviewing(false);
                        setComment("");
                        setRating(5);
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 sm:px-8 py-3 rounded-xl transition-all duration-300 font-semibold text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews List */}
            {product.reviews?.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                {product.reviews.map((review, index) => (
                  <div key={index} className="bg-white border-2 border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                          {(review.user?.name || "A").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-900 text-sm sm:text-base lg:text-lg truncate">
                            {review.user?.name || "Anonymous"}
                          </h5>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <div className="flex space-x-0.5">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-slate-500 text-xs sm:text-sm font-medium">
                              {new Date(review.createdAt || review.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap self-start">
                        {review.rating}/5 ⭐
                      </div>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-sm sm:text-base bg-slate-50 p-3 sm:p-4 rounded-xl">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl">📝</span>
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-600 mb-2">No reviews yet</h4>
                <p className="text-slate-500 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 px-4">
                  Be the first to share your experience!
                </p>
                {user && !isReviewing && (
                  <button
                    onClick={() => setIsReviewing(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg text-sm sm:text-base"
                  >
                    Write First Review
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="border-t-2 border-slate-200 p-4 sm:p-6 lg:p-10 bg-white">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 sm:mb-8 flex items-center gap-2">
              <span className="text-3xl sm:text-4xl">📋</span>
              Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="space-y-3 sm:space-y-4">
                {[
                  { label: 'Product Name', value: product.name },
                  { label: 'Brand', value: product.brand },
                  { label: 'Category', value: product.category }
                ].map((spec, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-3 border-b border-slate-200 gap-1 sm:gap-2">
                    <span className="font-bold text-slate-700 text-sm sm:text-base">{spec.label}</span>
                    <span className="text-slate-900 font-medium text-sm sm:text-base capitalize truncate">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { 
                    label: 'Availability', 
                    value: product.stock > 0 ? 'In Stock' : 'Out of Stock',
                    className: product.stock > 0 ? 'text-emerald-600' : 'text-red-600'
                  },
                  { label: 'Stock Quantity', value: `${product.stock} units` },
                  { 
                    label: 'Rating', 
                    value: `${Number(product.rating).toFixed(1)}/5 (${product.numReviews})`
                  }
                ].map((spec, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-3 border-b border-slate-200 gap-1 sm:gap-2">
                    <span className="font-bold text-slate-700 text-sm sm:text-base">{spec.label}</span>
                    <span className={`font-bold text-sm sm:text-base ${spec.className || 'text-slate-900'}`}>
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Cards */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: '🚚', title: 'Free Shipping', desc: 'On orders over $50', gradient: 'from-blue-500 to-indigo-600' },
            { icon: '🔒', title: 'Secure Payment', desc: '100% protected transactions', gradient: 'from-emerald-500 to-teal-600' },
            { icon: '↩️', title: 'Easy Returns', desc: '30-day hassle-free returns', gradient: 'from-amber-500 to-orange-600' }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-slate-100">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-2xl sm:text-3xl shadow-lg`}>
                {feature.icon}
              </div>
              <h4 className="font-bold text-slate-900 mb-1 sm:mb-2 text-center text-sm sm:text-base lg:text-lg">
                {feature.title}
              </h4>
              <p className="text-slate-600 text-center text-xs sm:text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;