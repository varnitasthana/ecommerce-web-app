const express = require("express");
const { getNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.post("/:id/read", markAsRead);
router.post("/read-all", markAllAsRead);

module.exports = router;
