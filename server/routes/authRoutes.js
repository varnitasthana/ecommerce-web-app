const express = require("express");

const {
  registerUser,
  loginUser
} = require("../controllers/authController");
const { getCurrentUser } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/me", protect, getCurrentUser);

module.exports = router;