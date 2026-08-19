const express = require("express");
const { getMyOrders, getOrderTracking } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/mine", getMyOrders);
router.get("/:id/tracking", getOrderTracking);

module.exports = router;