import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  ChevronRight,
  Minus,
  Plus,
  Check,
  X,
  Package,
  Award,
  Zap,
  Tag as TagIcon,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useAuth();
  const { formatPrice, convertPrice, currency } = useCurrency();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [toast, setToast] = useState(null);
  
  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products/${id}`);
      const data = await response.json();
      setProduct(data);
      
      if (data.category) {
        fetchRelatedProducts(data.category, data._id);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      showToast('Failed to load product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (category, currentProductId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products?category=${category}&limit=6`);
      const data = await response.json();
      const filtered = data.products.filter(p => p._id !== currentProductId);
      setRelatedProducts(filtered.slice(0, 6));
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        showToast('Please login to add items to cart', 'error');
        navigate('/login');
        return;
      }
      await addToCart(product._id, quantity);
      showToast('Added to cart successfully!', 'success');
    } catch (error) {
      showToast('Failed to add to cart', 'error');
    }
  };

  const handleBuyNow = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        showToast('Please login to continue', 'error');
        navigate('/login');
        return;
      }
      await addToCart(product._id, quantity);
      navigate('/checkout');
    } catch (error) {
      showToast('Failed to proceed', 'error');
    }
  };

  const handleWishlistToggle = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        showToast('Please login to manage wishlist', 'error');
        navigate('/login');
        return;
      }

      const isInWishlist = wishlist.some(item => item._id === product._id || item.product === product._id);
      
      if (isInWishlist) {
        await removeFromWishlist(product._id);
        showToast('Removed from wishlist', 'success');
      } else {
        await addToWishlist(product._id);
        showToast('Added to wishlist', 'success');
      }
    } catch (error) {
      showToast('Failed to update wishlist', 'error');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        showToast('Please login to write a review', 'error');
        navigate('/login');
        return;
      }

      setSubmittingReview(true);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (response.ok) {
        showToast('Review submitted successfully!', 'success');
        setReviewComment('');
        setReviewRating(5);
        setShowReviewForm(false);
        fetchProduct(); // Refresh product to show new review
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to submit review', 'error');
      }
    } catch (error) {
      showToast('Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isInWishlist = () => {
    return wishlist.some(item => item._id === product._id || item.product === product._id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package size={64} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
          <Link to="/products" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold">
            <ChevronRight size={20} className="rotate-180" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 
    ? product.images.map(img => img.url) 
    : product.image 
    ? [product.image]
    : ['https://via.placeholder.com/600'];

  const hasDiscount = product.discountedPrice && product.discountedPrice > 0 && product.discountedPrice < product.price;
  const displayPrice = hasDiscount ? product.discountedPrice : product.price;
  const discount = hasDiscount ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) : 0;
  const savings = hasDiscount ? (product.price - product.discountedPrice) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white flex items-center space-x-3`}>
          {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm overflow-x-auto">
            <Link to="/" className="text-gray-600 hover:text-orange-600 whitespace-nowrap">Home</Link>
            <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
            <Link to="/products" className="text-gray-600 hover:text-orange-600 whitespace-nowrap">Products</Link>
            {product.category && (
              <>
                <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
                <Link to={`/products?category=${product.category}`} className="text-gray-600 hover:text-orange-600 whitespace-nowrap">
                  {product.category}
                </Link>
              </>
            )}
            <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 font-medium truncate">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-5">
            <div className="sticky top-4 space-y-3 sm:space-y-4">
              <div className="relative bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100">
                <div className="aspect-square relative">
                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-contain p-2 sm:p-4"
                  />
                  
                  {hasDiscount && (
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-xs sm:text-base md:text-lg shadow-lg flex items-center space-x-1">
                        <Zap size={14} fill="white" className="sm:w-[18px] sm:h-[18px]" />
                        <span>{discount}% OFF</span>
                      </div>
                    </div>
                  )}

                  {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-lg animate-pulse">
                        Only {product.stock} left!
                      </div>
                    </div>
                  )}

                  {product.stock === 0 && (
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                      <div className="bg-gray-800 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-lg">
                        Out of Stock
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleWishlistToggle}
                    className={`absolute bottom-2 sm:bottom-4 right-2 sm:right-4 p-2 sm:p-3 rounded-full shadow-lg transition-all ${
                      isInWishlist()
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <Heart size={20} className={isInWishlist() ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative aspect-square rounded-md sm:rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index 
                          ? 'border-orange-500 shadow-lg scale-105' 
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            {product.brand && (
              <div className="flex items-center space-x-2">
                <Award className="text-orange-600" size={18} />
                <span className="text-orange-600 font-bold text-base sm:text-lg">{product.brand}</span>
              </div>
            )}

            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {product.rating > 0 && (
                <div className="flex items-center space-x-2 bg-green-50 px-2 sm:px-3 py-1.5 rounded-lg">
                  <div className="flex items-center">
                    <Star size={16} className="fill-green-600 text-green-600 sm:w-[18px] sm:h-[18px]" />
                    <span className="ml-1 font-bold text-green-700 text-sm sm:text-base">{product.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">| {product.numReviews} reviews</span>
                </div>
              )}
              {product.category && (
                <span className="bg-gray-100 text-gray-700 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold">
                  {product.category}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
              <div className="flex flex-wrap items-end gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    {hasDiscount ? 'Special Price' : 'Price'}
                  </p>
                  <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-orange-600">
                    {formatPrice(displayPrice)}
                  </span>
                </div>
                {hasDiscount && (
                  <>
                    <span className="text-lg sm:text-xl md:text-2xl text-gray-400 line-through mb-1 sm:mb-2">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-1 sm:mb-2">
                      Save {formatPrice(savings)}
                    </span>
                  </>
                )}
              </div>
              {hasDiscount && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full font-bold">
                    {discount}% OFF
                  </span>
                  <span className="text-gray-600">Limited time offer!</span>
                </div>
              )}
            </div>

            {/* Stock Info */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg flex items-center">
                <Package className="mr-2 text-orange-600" size={16} />
                Stock Information
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Availability</p>
                  <p className={`font-bold text-xs sm:text-sm md:text-base ${
                    product.stock > 10 ? 'text-green-600' : 
                    product.stock > 0 ? 'text-orange-600' : 
                    'text-red-600'
                  }`}>
                    {product.stock > 10 ? 'In Stock' : 
                     product.stock > 0 ? `Only ${product.stock} left` : 
                     'Out of Stock'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Units Available</p>
                  <p className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">{product.stock} units</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base md:text-lg">Product Description</h3>
              <p className="text-gray-700 leading-relaxed text-xs sm:text-sm md:text-base">{product.description}</p>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span key={index} className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    <TagIcon size={14} />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4 md:mb-6">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Quantity</p>
                  <div className="flex items-center border-2 border-gray-200 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 sm:px-6 md:px-8 font-bold text-sm sm:text-base md:text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      disabled={quantity >= product.stock || product.stock === 0}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <ShoppingCart size={18} />
                  <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>
                
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Zap size={18} />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-6 sm:mt-8 md:mt-12 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="mr-2 text-orange-600" size={18} />
              Customer Reviews ({product.numReviews})
            </h2>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-all text-xs sm:text-sm md:text-base"
            >
              Write a Review
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="mb-6 sm:mb-8 bg-gray-50 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl">
              <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg">Write Your Review</h3>
              
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        size={24}
                        className={star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Your Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 text-xs sm:text-sm md:text-base"
                  rows="4"
                  placeholder="Share your experience with this product..."
                  required
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-all disabled:bg-gray-400 text-xs sm:text-sm md:text-base"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="bg-gray-200 text-gray-700 px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all text-xs sm:text-sm md:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {product.reviews && product.reviews.length > 0 ? (
            <div className="space-y-6">
              {product.reviews.map((review, index) => (
                <div key={index} className="border-b pb-6 last:border-b-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm sm:text-base">
                          {review.user?.name || review.user?.email?.split('@')[0] || 'Anonymous User'}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Calendar size={12} />
                          <span>{new Date(review.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex ml-13 sm:ml-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base ml-0 sm:ml-15 bg-gray-50 p-3 sm:p-4 rounded-lg">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-sm sm:text-base">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 sm:mt-10 md:mt-12">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Related Products</h2>
              <Link to="/products" className="text-orange-600 hover:text-orange-700 font-semibold flex items-center text-xs sm:text-sm md:text-base">
                View All
                <ChevronRight size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct._id}
                  to={`/product/${relatedProduct._id}`}
                  className="group bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-orange-500"
                >
                  <div className="relative h-32 sm:h-40 bg-gray-50 overflow-hidden">
                    <img
                      src={relatedProduct.image || relatedProduct.images?.[0]?.url || 'https://via.placeholder.com/400'}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-2 sm:p-3">
                    <h3 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors h-8 sm:h-10">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-lg font-bold text-orange-600">
                        {formatPrice(
                          relatedProduct.discountedPrice && relatedProduct.discountedPrice > 0 && relatedProduct.discountedPrice < relatedProduct.price 
                            ? relatedProduct.discountedPrice 
                            : relatedProduct.price
                        )}
                      </span>
                      {relatedProduct.rating > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star size={10} className="fill-yellow-400 text-yellow-400 sm:w-3 sm:h-3" />
                          <span className="text-xs text-gray-600">{relatedProduct.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
