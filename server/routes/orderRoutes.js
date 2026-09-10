const express = require("express");
const { createOrder, getMyOrders, getOrderById, getOrderTracking, requestRefund, cancelOrder } = require("../controllers/orderController");
const { protect, authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.post("/", createOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);
router.get("/:id/tracking", getOrderTracking);
router.post("/:id/refund", requestRefund);
router.post("/:id/cancel", cancelOrder);

const guestRouter = express.Router();
guestRouter.get("/:id", getOrderById);
guestRouter.get("/:id/tracking", getOrderTracking);
guestRouter.use((req, res, next) => {
  req.isGuest = true;
  next();
});

module.exports = { default: router, guest: guestRouter };
