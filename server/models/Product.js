const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    description: {
      type: String,
      required: true
    },

    longDescription: {
      type: String,
      default: ""
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    compareAtPrice: {
      type: Number,
      default: 0,
      min: 0
    },

    category: {
      type: String,
      required: true,
      index: true
    },

    subcategory: {
      type: String,
      trim: true,
      default: "",
      index: true
    },

    brand: {
      type: String,
      default: "ShopEase",
      trim: true,
      index: true
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
      lowercase: true
    },

    sku: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
      uppercase: true
    },

    image: {
      type: String,
      default: null
    },

    images: {
      type: [String],
      default: []
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0
    },

    deliveryDays: {
      type: Number,
      min: 1,
      default: 3
    },

    weight: {
      type: Number,
      default: null,
      min: 0
    },

    dimensions: {
      length: { type: Number, default: null },
      width: { type: Number, default: null },
      height: { type: Number, default: null }
    },

    warranty: {
      type: String,
      default: null
    },

    returnPolicy: {
      type: String,
      default: null
    },

    attributes: {
      type: Map,
      of: String,
      default: new Map()
    },

    active: {
      type: Boolean,
      default: true,
      index: true
    },

    deleted: {
      type: Boolean,
      default: false,
      index: true
    },

    deletedAt: {
      type: Date,
      default: null
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    views: {
      type: Number,
      default: 0,
      min: 0
    },

    purchases: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ active: 1, deleted: 1, category: 1, price: 1 });
productSchema.index({ active: 1, deleted: 1, rating: -1, createdAt: -1 });
productSchema.index({ name: "text", brand: "text", category: "text", sku: "text", longDescription: "text" });
productSchema.index({ seller: 1, active: 1, deleted: 1 });
productSchema.index({ stock: 1, active: 1 });

productSchema.methods.getDiscountPercentage = function() {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
};

productSchema.methods.getStockStatus = function() {
  if (!this.active || this.deleted) return "unavailable";
  if (this.stock <= 0) return "out_of_stock";
  if (this.stock <= this.lowStockThreshold) return "low_stock";
  return "in_stock";
};

productSchema.methods.isAvailable = function() {
  return this.active && !this.deleted && this.stock > 0;
};

productSchema.query.active = function() {
  return this.where({ active: true, deleted: false });
};

productSchema.query.available = function() {
  return this.where({ active: true, deleted: false, stock: { $gt: 0 } });
};

module.exports = mongoose.model("Product", productSchema);