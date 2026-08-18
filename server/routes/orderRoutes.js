const express = require("express");
const { createOrder, getMyOrders } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.post("/", createOrder);
router.get("/mine", getMyOrders);

module.exports = router;