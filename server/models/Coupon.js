const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping"],
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0
    },
    maxUsageCount: {
      type: Number,
      default: null,
      min: 1
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    usageLimitPerUser: {
      type: Number,
      default: 1,
      min: 1
    },
    applicableCategories: {
      type: [String],
      default: []
    },
    applicableProducts: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Product",
      default: []
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

couponSchema.index({ code: 1, isActive: 1 });

module.exports = mongoose.model("Coupon", couponSchema);
