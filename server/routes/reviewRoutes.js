const express = require("express");
const { getProductReviews, createReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:productId", getProductReviews);
router.post("/:productId", protect, createReview);

module.exports = router;