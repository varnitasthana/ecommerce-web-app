const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { normaliseEmail, validateRegistration, validateLogin } = require("../validators/authValidator");
const { safeUser } = require("./userController");

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
      password: hashedPassword
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists" });
    res.status(500).json({ message: "Unable to create account" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normaliseEmail(email);
    const validationError = validateLogin({ email: normalizedEmail, password });

    if (validationError) return res.status(400).json({ message: validationError });

    const user = await User.findOne({ email: normalizedEmail }).select("+password name email role");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to sign in" });
  }
};

module.exports = {
  registerUser,
  loginUser
};