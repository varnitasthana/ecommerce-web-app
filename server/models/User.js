const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    phone: {
      type: String,
      default: null
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say", null],
      default: null
    },

    dateOfBirth: {
      type: Date,
      default: null
    },

    profileImage: {
      type: String,
      default: null
    },

    emailVerified: {
      type: Boolean,
      default: false
    },

    emailVerifiedAt: {
      type: Date,
      default: null
    },

    role: {
      type: String,
      enum: ["customer", "seller", "admin", "user"],
      default: "customer"
    },

    defaultAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      default: null
    },

    lastLogin: {
      type: Date,
      default: null
    },

    loginCount: {
      type: Number,
      default: 0
    },

    recentlyViewed: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      default: []
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ email: 1, isDeleted: 1 });
userSchema.index({ role: 1, isActive: 1 });

userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    gender: this.gender,
    dateOfBirth: this.dateOfBirth,
    profileImage: this.profileImage,
    emailVerified: this.emailVerified,
    role: this.role === "user" ? "customer" : this.role,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model("User", userSchema);