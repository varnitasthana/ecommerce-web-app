const express = require("express");
const { getWishlist, toggleWishlist, getPriceAlert, togglePriceAlert } = require("../controllers/wishlistController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", getWishlist);
router.post("/:productId/toggle", toggleWishlist);
router.get("/:productId/price-alert", getPriceAlert);
router.post("/:productId/price-alert", togglePriceAlert);

module.exports = router;