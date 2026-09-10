const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true },
    images: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const returnSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    items: {
      type: [returnItemSchema],
      required: true,
      validate: (items) => items.length > 0
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processed", "completed"],
      default: "pending",
      index: true
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    notes: String,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    processedAt: Date
  },
  { timestamps: true }
);

returnSchema.index({ order: 1, user: 1 });

module.exports = mongoose.model("Return", returnSchema);
