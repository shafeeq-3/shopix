const mongoose = require('mongoose');

// Review schema definition
const reviewSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserShopingCart', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

// Product schema definition
const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true }, // Always stored in USD (base currency)
    discountedPrice: { type: Number, default: 0 }, // Optional discounted price in USD
    category: { type: String, required: true }, // Category field
    brand: { type: String, required: true }, // Brand field
    stock: { type: Number, required: true, default: 0 }, // Stock availability
    image: { type: String, required: true }, // Main image
    images: [
      {
        // public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ], // Array for multiple images
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false }, // Highlighted products
    tags: [String], // Search tags
    createdAt: { type: Date, default: Date.now },
  }
);

// Method to calculate rating based on reviews
productSchema.methods.calculateRating = function () {
  if (this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating = totalRating / this.reviews.length;
    this.numReviews = this.reviews.length;
  } else {
    this.rating = 0;
    this.numReviews = 0;
  }
};

module.exports = mongoose.model('Product', productSchema);
