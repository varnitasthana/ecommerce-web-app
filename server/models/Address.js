const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home"
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      default: ""
    },
    postalCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: "India"
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

addressSchema.index({ user: 1, isDefault: 1 });

module.exports = mongoose.model("Address", addressSchema);
