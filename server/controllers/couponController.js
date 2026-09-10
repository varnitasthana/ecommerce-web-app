const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");

const validateCoupon = async (req, res) => {
  try {
    const { code, cartItems = [] } = req.body;
    const couponCode = String(code || "").trim().toUpperCase();
    if (!couponCode) return res.status(400).json({ message: "Coupon code is required" });

    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });

    const now = new Date();
    if (coupon.startDate > now) return res.status(400).json({ message: "Coupon is not yet active" });
    if (coupon.endDate < now) return res.status(400).json({ message: "Coupon has expired" });
    if (coupon.maxUsageCount && coupon.usageCount >= coupon.maxUsageCount) return res.status(400).json({ message: "Coupon usage limit reached" });

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    if (subtotal < coupon.minOrderAmount) return res.status(400).json({ message: `Minimum order amount of ₹${coupon.minOrderAmount} required` });

    const userUsageCount = await Coupon.countDocuments({ code: couponCode, createdBy: req.user?.id });
    if (userUsageCount >= coupon.usageLimitPerUser) return res.status(400).json({ message: "You have already used this coupon" });

    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else if (coupon.type === "fixed") {
      discountAmount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === "free_shipping") {
      discountAmount = 49;
    }

    res.status(200).json({
      coupon: {
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        discountAmount: Math.round(discountAmount * 100) / 100,
        minOrderAmount: coupon.minOrderAmount
      },
      subtotal,
      totalAfterDiscount: Math.round((subtotal - discountAmount) * 100) / 100
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to validate coupon" });
  }
};

const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ isActive: true }).select("-createdBy");
    res.status(200).json({ coupons });
  } catch (error) {
    res.status(500).json({ message: "Unable to load coupons" });
  }
};

module.exports = { validateCoupon, getCoupons };
