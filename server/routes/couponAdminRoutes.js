const express = require("express");
const { createCoupon, updateCoupon, deleteCoupon, getAllCoupons } = require("../controllers/couponAdminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.post("/", createCoupon);
router.get("/", getAllCoupons);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;
