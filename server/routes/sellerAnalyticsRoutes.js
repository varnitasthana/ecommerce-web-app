const express = require("express");
const { getSellerAnalytics } = require("../controllers/sellerAnalyticsController");
const { protect, sellerOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, sellerOnly, getSellerAnalytics);

module.exports = router;
