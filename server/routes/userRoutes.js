const express = require("express");
const { updateUserRole } = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.patch("/:id/role", protect, adminOnly, updateUserRole);

module.exports = router;
