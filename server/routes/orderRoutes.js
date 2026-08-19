const express = require("express");
const { getMyOrders } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/mine", getMyOrders);

module.exports = router;