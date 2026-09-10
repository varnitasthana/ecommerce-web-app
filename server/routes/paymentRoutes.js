const express = require("express");
const { createRazorpayOrder, verifyRazorpayPayment, handleRazorpayWebhook, createDemoCheckoutSession } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyRazorpayPayment);
router.post("/demo-checkout", protect, createDemoCheckoutSession);

module.exports = router;
