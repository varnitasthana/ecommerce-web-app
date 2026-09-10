const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: {
      type: [cartItemSchema],
      default: []
    },
    savedForLater: {
      type: [cartItemSchema],
      default: []
    }
  },
  { timestamps: true }
);

cartSchema.index({ user: 1 }, { unique: true });

cartSchema.methods.getSubtotal = function() {
  return this.items.reduce((sum, item) => sum + (item.productPrice || 0) * item.quantity, 0);
};

cartSchema.methods.getItemCount = function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
};

module.exports = mongoose.model("Cart", cartSchema);
