const User = require("../models/User");
const { validateRole } = require("../validators/userValidator");

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role === "user" ? "customer" : user.role
});

const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.id).select("name email role");
  if (!user) return res.status(401).json({ message: "Authentication required" });
  res.status(200).json({ user: safeUser(user) });
};

const updateUserRole = async (req, res) => {
  const roleError = validateRole(req.body.role);
  if (roleError) return res.status(400).json({ message: roleError });
  if (String(req.user.id) === String(req.params.id) && req.body.role !== "admin") {
    return res.status(400).json({ message: "An admin cannot remove their own admin access" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true, runValidators: true }
  ).select("name email role");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json({ message: "User role updated", user: safeUser(user) });
};

module.exports = { getCurrentUser, updateUserRole, safeUser };
