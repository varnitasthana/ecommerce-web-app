const express = require("express");
const { getCart, addToCart, updateCartItem, removeFromCart, saveForLater, moveToCart, clearCart } = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getCart);
router.post("/items", addToCart);
router.put("/items", updateCartItem);
router.delete("/items", removeFromCart);
router.post("/save-for-later", saveForLater);
router.post("/move-to-cart", moveToCart);
router.delete("/clear", clearCart);

module.exports = router;
