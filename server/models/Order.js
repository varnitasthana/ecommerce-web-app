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
    quantity: { type: Number, required: true, min: 1 },
    sku: { type: String, default: null }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      index: true
    },

    guestPhone: {
      type: String,
      trim: true,
      default: null
    },

    idempotencyKey: {
      type: String,
      trim: true
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
      country: { type: String, required: true },
      phone: { type: String, default: null }
    },

    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      default: null
    },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    
    status: {
      type: String,
      enum: [
        "pending_payment",
        "confirmed",
        "processing",
        "packed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "return_requested",
        "return_approved",
        "returned"
      ],
      default: "pending_payment",
      index: true
    },
    
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
      index: true
    },
    
    paymentMethod: {
      type: String,
      enum: ["razorpay", "upi", "card", "wallet", "cod", "other"],
      default: "razorpay"
    },
    
    razorpayOrderId: {
      type: String,
      sparse: true,
      index: true
    },
    
    razorpayPaymentId: {
      type: String,
      sparse: true,
      index: true
    },
    
    paidAt: Date,
    
    stockReserved: {
      type: Boolean,
      default: true
    },
    
    shippingProvider: {
      type: String,
      default: null
    },
    
    trackingNumber: {
      type: String,
      default: null,
      index: true,
      sparse: true
    },
    
    trackingUrl: {
      type: String,
      default: null
    },
    
    shippedAt: Date,
    deliveredAt: Date,
    
    refundRequested: {
      type: Boolean,
      default: false
    },
    
    refundReason: String,
    refundAmount: { type: Number, default: 0, min: 0 },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected", "processed"],
      default: "none"
    },
    refundProcessedAt: Date,
    
    notes: String,
    cancelledReason: String,
    cancelledAt: Date,
    
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotencyKey: { $exists: true }
    }
  }
);
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

const ensureIdempotencyIndex = async () => {
  try {
    const indexes = await Order.collection.indexes();
    const targetName = "user_1_idempotencyKey_1";
    const existing = indexes.find((index) => index.name === targetName);

    if (!existing) {
      await Order.collection.createIndex(
        { user: 1, idempotencyKey: 1 },
        {
          unique: true,
          partialFilterExpression: {
            idempotencyKey: { $exists: true }
          }
        }
      );
      return;
    }

    const partialFilter = existing.partialFilterExpression || {};
    const hasExists = partialFilter.idempotencyKey?.$exists === true;

    if (!hasExists) {
      await Order.collection.dropIndex(targetName);
      await Order.collection.createIndex(
        { user: 1, idempotencyKey: 1 },
        {
          unique: true,
          partialFilterExpression: {
            idempotencyKey: { $exists: true }
          }
        }
      );
    }
  } catch (error) {
    console.error("Order idempotency index check failed:", error.message);
  }
};

Order.ensureIdempotencyIndex = ensureIdempotencyIndex;

module.exports = Order;