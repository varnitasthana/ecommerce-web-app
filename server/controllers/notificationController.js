const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments({ user: req.user.id }),
      Notification.countDocuments({ user: req.user.id, read: false })
    ]);
    res.status(200).json({ notifications, unreadCount, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: "Unable to load notifications" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    notification.read = true;
    await notification.save();
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Unable to update notification" });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Unable to update notifications" });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
