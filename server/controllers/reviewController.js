const Product = require("../models/Product");
const Review = require("../models/Review");
const mongoose = require("mongoose");

const refreshProductRating = async (productId) => {
  const summary = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: "$product", rating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } }
  ]);
  const values = summary[0] || { rating: 0, reviewCount: 0 };

  await Product.findByIdAndUpdate(productId, {
    rating: Number(values.rating.toFixed(1)),
    reviewCount: values.reviewCount
  });
};

const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    const status = error instanceof mongoose.Error.CastError ? 400 : 500;
    res.status(status).json({ message: status === 400 ? "Invalid product id" : error.message });
  }
};

const createReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 || !title || !comment) {
      return res.status(400).json({ message: "Rating, title, and comment are required" });
    }

    const review = await Review.create({
      product: req.params.productId,
      user: req.user.id,
      rating: Number(rating),
      title,
      comment
    });
    await refreshProductRating(review.product);
    res.status(201).json({ message: "Review published", review });
  } catch (error) {
    const duplicate = error.code === 11000;
    res.status(duplicate ? 409 : 400).json({ message: duplicate ? "You already reviewed this product" : error.message });
  }
};

module.exports = { getProductReviews, createReview };