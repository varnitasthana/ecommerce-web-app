const express = require("express");
const { requestPasswordReset, resetPassword, verifyEmail, resendVerification } = require("../controllers/tokenController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", protect, resendVerification);

module.exports = router;
