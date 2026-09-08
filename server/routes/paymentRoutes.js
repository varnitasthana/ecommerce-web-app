const express = require("express");
const { createCheckoutSession, handleStripeWebhook, getCheckoutSession, createDemoCheckoutSession } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-checkout-session", protect, createCheckoutSession);
router.post("/demo-checkout", protect, createDemoCheckoutSession);
router.get("/session", protect, getCheckoutSession);
router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

module.exports = router;
