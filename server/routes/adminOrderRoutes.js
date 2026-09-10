const express = require("express");
const { getAllOrders, getOrderByIdAdmin, updateOrderStatus, bulkUpdateOrderStatus } = require("../controllers/adminOrderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/", getAllOrders);
router.get("/:id", getOrderByIdAdmin);
router.put("/:id", updateOrderStatus);
router.post("/bulk-update", bulkUpdateOrderStatus);

module.exports = router;
