const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      trim: true,
      default: ""
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    answeredAt: {
      type: Date,
      default: null
    },
    helpful: {
      type: Number,
      default: 0,
      min: 0
    },
    reported: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

questionSchema.index({ product: 1, createdAt: -1 });
questionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Question", questionSchema);
