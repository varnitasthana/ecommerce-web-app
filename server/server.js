const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { handleStripeWebhook } = require("./controllers/paymentController");
const mediaRoutes = require("./routes/mediaRoutes");
const { integrationStatus } = require("./config/integrations");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173"
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
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/media", mediaRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "E-Commerce API is running"
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "ecommerce-api", integrations: integrationStatus(), timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the existing app or run npm run dev:clean.`);
      process.exit(1);
    }

    console.error(error);
    process.exit(1);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});

const shutdown = () => {
  if (!server) {
    process.exit(0);
  }

  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);