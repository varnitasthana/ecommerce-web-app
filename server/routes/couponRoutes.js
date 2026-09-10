const express = require("express");
const { validateCoupon, getCoupons } = require("../controllers/couponController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/validate", protect, validateCoupon);
router.get("/", getCoupons);

module.exports = router;
