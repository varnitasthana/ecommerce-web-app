const express = require("express");
const { getWishlist, toggleWishlist } = require("../controllers/wishlistController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", getWishlist);
router.post("/:productId/toggle", toggleWishlist);

module.exports = router;