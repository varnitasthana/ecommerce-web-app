const express = require("express");
const { updateUserRole, getCurrentUser } = require("../controllers/userController");
const { getRecentlyViewed, addRecentlyViewed } = require("../controllers/recentlyViewedController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.patch("/:id/role", protect, adminOnly, updateUserRole);
router.get("/me", protect, getCurrentUser);
router.get("/recently-viewed", protect, getRecentlyViewed);
router.post("/recently-viewed", protect, addRecentlyViewed);

module.exports = router;
