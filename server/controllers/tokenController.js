const Token = require("../models/Token");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendOrderConfirmation } = require("../services/emailService");

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim(), isDeleted: false });
    if (!user) return res.status(200).json({ message: "If an account exists, a reset link has been sent" });

    const token = await Token.create({
      userId: user._id,
      type: "password_reset",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    const resetLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token.token}`;
    await sendOrderConfirmation({
      email: user.email,
      order: { _id: "password-reset", user: { name: user.name } },
      subject: "Reset your ShopEase password",
      html: `<p>Hi ${user.name},</p><p>Click the link below to reset your password. This link expires in 15 minutes.</p><p><a href="${resetLink}">Reset Password</a></p><p>If you didn't request this, please ignore this email.</p>`
    }).catch(() => {});

    res.status(200).json({ message: "If an account exists, a reset link has been sent" });
  } catch (error) {
    res.status(500).json({ message: "Unable to process password reset request" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) return res.status(400).json({ message: "Valid token and new password (min 8 chars) are required" });

    const tokenDoc = await Token.findOne({ token, type: "password_reset", used: false, expiresAt: { $gt: new Date() } });
    if (!tokenDoc) return res.status(400).json({ message: "Invalid or expired reset token" });

    const user = await User.findById(tokenDoc.userId);
    if (!user || user.isDeleted) return res.status(400).json({ message: "User not found" });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    tokenDoc.used = true;
    await tokenDoc.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Unable to reset password" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const tokenDoc = await Token.findOne({ token, type: "email_verification", used: false, expiresAt: { $gt: new Date() } });
    if (!tokenDoc) return res.status(400).json({ message: "Invalid or expired verification token" });

    const user = await User.findById(tokenDoc.userId);
    if (!user || user.isDeleted) return res.status(400).json({ message: "User not found" });

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    tokenDoc.used = true;
    await tokenDoc.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Unable to verify email" });
  }
};

const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified) return res.status(400).json({ message: "Email is already verified" });

    const token = await Token.create({
      userId: user._id,
      type: "email_verification",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const verifyLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${token.token}`;
    await sendOrderConfirmation({
      email: user.email,
      order: { _id: "email-verify", user: { name: user.name } },
      subject: "Verify your ShopEase email",
      html: `<p>Hi ${user.name},</p><p>Click the link below to verify your email address.</p><p><a href="${verifyLink}">Verify Email</a></p><p>This link expires in 24 hours.</p>`
    }).catch(() => {});

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    res.status(500).json({ message: "Unable to send verification email" });
  }
};

module.exports = { requestPasswordReset, resetPassword, verifyEmail, resendVerification };
