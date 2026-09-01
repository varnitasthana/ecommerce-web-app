const express = require("express");
const { createOrder, getMyOrders, getOrderById, getOrderTracking, requestRefund, cancelOrder } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.post("/", createOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);
router.get("/:id/tracking", getOrderTracking);
router.post("/:id/refund", requestRefund);
router.post("/:id/cancel", cancelOrder);

module.exports = router;