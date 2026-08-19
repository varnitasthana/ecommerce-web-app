const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateUser = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !/^Bearer\s+[^\s]+$/.test(authorization)) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const token = authorization.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("name email role");
    if (!user) return res.status(401).json({ message: "Authentication required" });
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role === "user" ? "customer" : user.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission for this resource" });
  }
  next();
};

const protect = authenticateUser;
const adminOnly = authorizeRoles("admin");
const sellerOnly = authorizeRoles("seller", "admin");

module.exports = { authenticateUser, authorizeRoles, protect, adminOnly, sellerOnly };