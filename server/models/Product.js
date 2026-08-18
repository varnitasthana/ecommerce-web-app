const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    brand: {
      type: String,
      default: "ShopEase"
    },

    image: {
      type: String
    },

    stock: {
      type: Number,
      required: true,
      default: 0
    },

    compareAtPrice: {
      type: Number,
      default: 0
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },

    reviewCount: {
      type: Number,
      default: 0
    },

    deliveryDays: {
      type: Number,
      min: 1,
      default: 3
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);