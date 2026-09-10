const jwt = require("jsonwebtoken");
const User = require("../models/User");

const AUTH_CACHE_TTL_MS = 5 * 60 * 1000;
const AUTH_CACHE_MAX_SIZE = 1000;
const authCache = new Map();

const normalizeCacheKey = (value) => String(value);

const getCachedUser = (userId) => {
  const entry = authCache.get(normalizeCacheKey(userId));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    authCache.delete(normalizeCacheKey(userId));
    return null;
  }
  return entry.value;
};

const setCachedUser = (userId, value) => {
  if (authCache.size >= AUTH_CACHE_MAX_SIZE) {
    const oldestKey = authCache.keys().next().value;
    if (oldestKey) authCache.delete(oldestKey);
  }

  authCache.set(normalizeCacheKey(userId), {
    value,
    expiresAt: Date.now() + AUTH_CACHE_TTL_MS
  });
};

const authenticateUser = async (req, res, next) => {
  const requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const authorization = req.headers.authorization;

  if (!authorization || !/^Bearer\s+[^\s]+$/.test(authorization)) {
    console.warn(`auth.missing_header requestId=${requestId}`);
    return res.status(401).json({ message: "Authentication required", code: "AUTH_HEADER_MISSING" });
  }

  try {
    const token = authorization.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.id;

    let user = getCachedUser(userId);
    if (!user) {
      user = await User.findById(userId).select("name email role isActive isDeleted");
      if (!user) {
        console.warn(`auth.user_not_found requestId=${requestId} userId=${userId}`);
        return res.status(401).json({ message: "Authentication required", code: "USER_NOT_FOUND" });
      }
      setCachedUser(userId, user);
    }

    if (user.isDeleted) {
      console.warn(`auth.account_deleted requestId=${requestId} userId=${userId}`);
      return res.status(401).json({ message: "Account not found. Please contact support.", code: "ACCOUNT_DELETED" });
    }

    if (!user.isActive) {
      console.warn(`auth.account_inactive requestId=${requestId} userId=${userId}`);
      return res.status(401).json({ message: "Account is inactive. Please contact support.", code: "ACCOUNT_INACTIVE" });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role === "user" ? "customer" : user.role
    };
    next();
  } catch (error) {
    const reason = error.name || "VERIFY_FAILED";
    console.warn(`auth.token_invalid requestId=${requestId} reason=${reason} message=${error.message}`);
    return res.status(401).json({ message: "Invalid or expired token", code: "TOKEN_INVALID" });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission for this resource", code: "FORBIDDEN" });
  }
  next();
};

const protect = authenticateUser;
const adminOnly = authorizeRoles("admin");
const sellerOnly = authorizeRoles("seller", "admin");

module.exports = { authenticateUser, authorizeRoles, protect, adminOnly, sellerOnly, authCache, getCachedUser, setCachedUser };
