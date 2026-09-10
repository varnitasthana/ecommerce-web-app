const Coupon = require("../models/Coupon");

const createCoupon = async (req, res) => {
  try {
    const payload = { ...req.body, code: String(req.body.code).trim().toUpperCase(), createdBy: req.user.id };
    const coupon = await Coupon.create(payload);
    res.status(201).json({ message: "Coupon created", coupon });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Coupon code already exists" });
    res.status(500).json({ message: "Unable to create coupon" });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    Object.assign(coupon, req.body);
    if (req.body.code) coupon.code = String(req.body.code).trim().toUpperCase();
    await coupon.save();
    res.status(200).json({ message: "Coupon updated", coupon });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Coupon code already exists" });
    res.status(500).json({ message: "Unable to update coupon" });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.status(200).json({ message: "Coupon deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete coupon" });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ coupons });
  } catch (error) {
    res.status(500).json({ message: "Unable to load coupons" });
  }
};

module.exports = { createCoupon, updateCoupon, deleteCoupon, getAllCoupons };
