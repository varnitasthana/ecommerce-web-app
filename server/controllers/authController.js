const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { normaliseEmail, validateRegistration, validateLogin } = require("../validators/authValidator");
const { getCachedUser, setCachedUser } = require("../middleware/authMiddleware");

const ACCESS_TOKEN_TTL = "7d";
const REFRESH_TOKEN_TTL = "30d";

const buildAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email, type: "access" },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

const buildRefreshToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email, type: "refresh" },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normaliseEmail(email);
    const validationError = validateRegistration({ name, email: normalizedEmail, password });

    if (validationError) return res.status(400).json({ message: validationError });

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      emailVerified: false
    });

    const accessToken = buildAccessToken(user);
    const refreshToken = buildRefreshToken(user);

    res.status(201).json({
      message: "Account created successfully",
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: ACCESS_TOKEN_TTL,
      user: user.getPublicProfile()
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists" });
    console.error("Register error:", error);
    res.status(500).json({ message: "Unable to create account" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normaliseEmail(email);
    const validationError = validateLogin({ email: normalizedEmail, password });

    if (validationError) return res.status(400).json({ message: validationError });

    const user = await User.findOne({ email: normalizedEmail }).select("+password name email role isActive isDeleted");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password", code: "INVALID_CREDENTIALS" });
    }

    if (user.isDeleted) {
      return res.status(401).json({ message: "Account not found. Please contact support.", code: "ACCOUNT_DELETED" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is inactive. Please contact support.", code: "ACCOUNT_INACTIVE" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password", code: "INVALID_CREDENTIALS" });
    }

    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    const cachedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isDeleted: user.isDeleted
    };
    setCachedUser(user._id.toString(), cachedUser);

    const accessToken = buildAccessToken(user);
    const refreshToken = buildRefreshToken(user);

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: ACCESS_TOKEN_TTL,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Unable to sign in" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required", code: "REFRESH_TOKEN_MISSING" });
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (payload.type !== "refresh") {
      return res.status(401).json({ message: "Invalid token type", code: "TOKEN_TYPE_INVALID" });
    }

    const user = await User.findById(payload.id).select("name email role isActive isDeleted");

    if (!user) {
      return res.status(401).json({ message: "User not found", code: "USER_NOT_FOUND" });
    }

    if (user.isDeleted || !user.isActive) {
      return res.status(401).json({ message: "Account unavailable", code: "ACCOUNT_UNAVAILABLE" });
    }

    const cachedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isDeleted: user.isDeleted
    };
    setCachedUser(user._id.toString(), cachedUser);

    const accessToken = buildAccessToken(user);

    res.status(200).json({
      accessToken,
      tokenType: "Bearer",
      expiresIn: ACCESS_TOKEN_TTL
    });
  } catch (error) {
    const code = error.name === "JsonWebTokenError" ? "TOKEN_INVALID" : error.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "REFRESH_FAILED";
    res.status(401).json({ message: "Invalid or expired refresh token", code });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken
};
