const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (items) => items.length > 0
    },
    shippingAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending_payment", "pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending_payment"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    stripeCheckoutSessionId: {
      type: String,
      index: true
    },
    stripePaymentIntentId: String,
    paidAt: Date,
    stockReserved: {
      type: Boolean,
      default: true
    },
    shippingProvider: String,
    trackingNumber: String,
    trackingUrl: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);