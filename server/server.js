const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { connectDB, disconnectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const accountRoutes = require("./routes/accountRoutes");
const productRoutes = require("./routes/productRoutes");
const searchRoutes = require("./routes/searchRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { handleStripeWebhook } = require("./controllers/paymentController");
const mediaRoutes = require("./routes/mediaRoutes");
const { integrationStatus } = require("./config/integrations");
const { validateEnvironment } = require("./config/env");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  }
}));
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/products", productRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "E-Commerce API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const { getConnectionState } = require("./config/db");
    const connection = getConnectionState();
    const dbHealthy = connection.state === "connected";

    const health = {
      status: dbHealthy ? "ok" : "degraded",
      service: "ecommerce-api",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: {
        state: connection.state,
        label: connection.label,
        healthy: dbHealthy
      },
      integrations: integrationStatus(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: "error",
      service: "ecommerce-api",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    validateEnvironment();
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Stop the existing app or run npm run dev:clean.`);
        process.exit(1);
      }

      console.error("Server error:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  console.log("Received shutdown signal. Starting graceful shutdown...");

  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
    });
  }

  try {
    await disconnectDB();
  } catch (error) {
    console.error("Error during shutdown:", error.message);
  }

  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
