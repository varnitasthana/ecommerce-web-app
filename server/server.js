const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const isTest = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;
if (!isTest) {
  require("dotenv").config();
}

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
const guestPaymentRoutes = require("./routes/guestPaymentRoutes");
const { handleRazorpayWebhook } = require("./controllers/paymentController");
const compareRoutes = require("./routes/compareRoutes");
const sellerAnalyticsRoutes = require("./routes/sellerAnalyticsRoutes");
const cartRoutes = require("./routes/cartRoutes");
const couponRoutes = require("./routes/couponRoutes");
const couponAdminRoutes = require("./routes/couponAdminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const categoryAdminRoutes = require("./routes/categoryAdminRoutes");
const returnRoutes = require("./routes/returnRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const questionRoutes = require("./routes/questionRoutes");
const { integrationStatus } = require("./config/integrations");
const { validateEnvironment } = require("./config/env");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const Order = require("./models/Order");

const app = express();

const allowedOrigins = new Set([
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  "http://localhost:5179",
  "http://localhost:5180"
]);

const isDev = process.env.NODE_ENV !== "production";

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1|::1|192\.168|10\.0|172\.(1[6-9]|2\d|3[01]))(:\d+)?$/i.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  }
}));
app.use(helmet());
if (!isTest) {
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
}
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleRazorpayWebhook);
app.use(express.json({ limit: "1mb" }));
app.use((req, _res, next) => {
  req.id = req.headers["x-request-id"] || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  next();
});
app.use((req, res, next) => {
  res.setHeader("x-request-id", req.id);
  next();
});
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/products", productRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/orders", orderRoutes.default);
app.use("/api/guest/orders", orderRoutes.guest);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/guest/payments", guestPaymentRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/compare", compareRoutes);
app.use("/api/sellers/analytics", sellerAnalyticsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin/coupons", couponAdminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin/categories", categoryAdminRoutes);
app.use("/api/returns", returnRoutes.default);
app.use("/api/admin/returns", returnRoutes.admin);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/auth/tokens", tokenRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/questions", questionRoutes);

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
    const isConnected = connection.label === "connected";

    const dbName = mongoose.connection.db?.databaseName || process.env.MONGO_DB || "unknown";
    let collections = [];
    let countErrors = {};
    let counts = { users: null, products: null, orders: null };

    if (isConnected && mongoose.connection.db) {
      try {
        collections = await mongoose.connection.db.listCollections().toArray().then(c => c.map(col => col.name)).catch(err => {
          countErrors.collections = err.message;
          return [];
        });

        const collectionNames = new Set(collections.map(c => c.toLowerCase()));

        if (collectionNames.has("users")) {
          counts.users = await mongoose.connection.db.collection("users").countDocuments().catch(err => {
            countErrors.users = err.message;
            return null;
          });
        }
        if (collectionNames.has("products")) {
          counts.products = await mongoose.connection.db.collection("products").countDocuments().catch(err => {
            countErrors.products = err.message;
            return null;
          });
        }
        if (collectionNames.has("orders")) {
          counts.orders = await mongoose.connection.db.collection("orders").countDocuments().catch(err => {
            countErrors.orders = err.message;
            return null;
          });
        }
      } catch (error) {
        countErrors.healthQuery = error.message;
      }
    }

    const hasCountErrors = Object.keys(countErrors).length > 0;
    const dbHealthy = isConnected && !hasCountErrors;

    const health = {
      status: dbHealthy ? "ok" : "degraded",
      service: "ecommerce-api",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: {
        state: connection.state,
        label: connection.label,
        healthy: dbHealthy,
        name: dbName,
        collections,
        counts
      },
      integrations: integrationStatus(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    if (hasCountErrors) {
      health.database.errors = countErrors;
    }

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

    const dbName = mongoose.connection.db?.databaseName || process.env.MONGO_DB || "unknown";
    console.log(`Target database: ${dbName}`);

    try {
      await Order.ensureIdempotencyIndex();
    } catch (error) {
      console.error("Idempotency index setup failed:", error.message);
    }

    try {
      const { validateRazorpayCredentials } = require("./config/razorpay");
      const razorpayStatus = await validateRazorpayCredentials();
      if (!razorpayStatus.valid) {
        console.warn(`Razorpay credential check failed: ${razorpayStatus.reason}. Online payments may not work until valid keys are configured.`);
      } else {
        console.log("Razorpay credentials validated successfully");
      }
    } catch (error) {
      console.warn("Razorpay credential check error:", error.message);
    }

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
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
