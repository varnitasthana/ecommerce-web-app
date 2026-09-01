const mongoose = require("mongoose");
const crypto = require("crypto");

const tokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["password_reset", "email_verification"],
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }
    },
    used: {
      type: Boolean,
      default: false
    },
    usedAt: Date,
    createdIp: String
  },
  { timestamps: true }
);

tokenSchema.statics.generate = function(userId, type, expirationHours = 24) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
  return { token, expiresAt };
};

tokenSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

module.exports = mongoose.model("Token", tokenSchema);
