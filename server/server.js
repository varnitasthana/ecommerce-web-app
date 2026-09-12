const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const hpp = require("hpp");
const { requestLogger } = require("./middleware/logger");
const mongoSanitize = require("./middleware/mongoSanitize");
const xss = require("./middleware/xss");
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
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(compression());
app.use(mongoSanitize);
app.use(xss);
app.use(hpp());
app.use(requestLogger);
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

// One-time production seed endpoint
app.post("/api/admin/seed", async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!process.env.SEED_TOKEN || token !== process.env.SEED_TOKEN) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const Product = require("./models/Product");
    const User = require("./models/User");
    const Review = require("./models/Review");
    const bcrypt = require("bcryptjs");

    const password = await bcrypt.hash("DemoShopEase#2026", 10);
    const users = {};
    const demoUsers = [
      { key: "admin", name: "Demo Admin", role: "admin" },
      { key: "seller-1", name: "Demo Seller One", role: "seller" },
      { key: "seller-2", name: "Demo Seller Two", role: "seller" },
      { key: "seller-3", name: "Demo Seller Three", role: "seller" },
      ...Array.from({ length: 10 }, (_, index) => ({ key: `customer-${index + 1}`, name: `Demo Customer ${index + 1}`, role: "customer" }))
    ];

    for (const demoUser of demoUsers) {
      const email = `${demoUser.key}@demo.shopease.local`;
      const existing = await User.findOne({ email });
      if (existing) {
        existing.name = demoUser.name;
        existing.role = demoUser.role;
        existing.isActive = true;
        existing.isDeleted = false;
        existing.deletedAt = null;
        existing.emailVerified = true;
        existing.password = password;
        await existing.save();
        users[demoUser.key] = existing;
      } else {
        const created = await User.create({ name: demoUser.name, email, password, role: demoUser.role, emailVerified: true, emailVerifiedAt: new Date(), isActive: true, isDeleted: false });
        users[demoUser.key] = created;
      }
    }

    const categories = [
      { name: "Electronics", code: "ELE", brands: ["NexaTech", "OrbitWare", "PixelPeak", "VoltCraft"], image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80", products: ["AeroBook 14 Laptop", "PulseTab 11 Tablet", "NovaPhone X1", "EchoBuds Pro", "OrbitWatch S2", "VoltCharge 65W Adapter", "NexaTech Mechanical Keyboard", "PixelPeak Wireless Mouse", "ArcView 27 Monitor", "BeamCast 4K Projector", "SoundNest Bluetooth Speaker", "VoltCraft Power Bank", "OrbitWare Wi-Fi Router", "NexaTech USB-C Hub", "PixelPeak Webcam HD", "AeroBook Laptop Stand", "PulseTab Stylus Pen", "NovaPhone Protective Case", "EchoBuds Charging Case", "OrbitWatch Sport Band", "ArcView Monitor Light", "BeamCast HDMI Cable", "SoundNest Headphone Stand", "VoltCraft Smart Plug", "NexaTech Desk Microphone"] },
      { name: "Fashion", code: "FAS", brands: ["ThreadTheory", "UrbanLoom", "MiraMode", "Northline"], image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80", products: ["Everyday Oxford Shirt", "Relaxed Fit Chinos", "CloudKnit Hoodie", "Linen Blend Dress", "TrailReady Sneakers", "Classic Denim Jacket", "Soft Ribbed Cardigan", "Essential Cotton Tee", "Pleated Midi Skirt", "Weekend Canvas Tote", "Minimal Leather Belt", "Avenue Chelsea Boots", "LoungeFlex Joggers", "Alpine Puffer Vest", "Studio Crossbody Bag", "Heritage Polo Shirt", "Daylight Running Cap", "Merino Travel Scarf", "Slim Oxford Trousers", "Everyday Ankle Socks"] },
      { name: "Home & Kitchen", code: "HOM", brands: ["Hearth & Hue", "Nestora", "Cookwell", "LumaLiving"], image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80", products: ["BrewMate Coffee Maker", "ChefStone Nonstick Pan", "LumaLiving Floor Lamp", "Nestora Storage Baskets", "Hearth & Hue Cushion Set", "Cookwell Spice Rack", "DailyHarvest Glass Containers", "LumaLiving Table Lamp", "Nestora Bamboo Organizer", "ChefStone Knife Set", "Hearth & Hue Cotton Bedsheet", "BrewMate Electric Kettle", "Cookwell Digital Scale", "Nestora Laundry Hamper", "LumaLiving Wall Mirror", "ChefStone Air Fryer", "Hearth & Hue Bath Towel Set", "Nestora Shoe Organizer", "BrewMate Travel Mug", "Cookwell Silicone Utensils"] },
      { name: "Beauty", code: "BEA", brands: ["GlowKind", "PurePetal", "Velora", "BloomLab"], image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80", products: ["GlowKind Daily Face Wash", "PurePetal Hydrating Serum", "Velora Matte Lip Color", "BloomLab Mineral Sunscreen", "GlowKind Vitamin C Cream", "PurePetal Gentle Toner", "Velora Brow Sculpt Kit", "BloomLab Overnight Mask", "GlowKind Nourishing Hair Oil", "PurePetal Body Lotion", "Velora Soft Blush Palette", "BloomLab Hand Cream Set", "GlowKind Clay Detox Mask", "PurePetal Cleansing Balm", "Velora Lash Lift Mascara"] },
      { name: "Sports & Fitness", code: "SPT", brands: ["PeakMotion", "FlexForge", "StrideLab", "SummitCore"], image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80", products: ["PeakMotion Yoga Mat", "FlexForge Resistance Bands", "StrideLab Running Shoes", "SummitCore Training Gloves", "PeakMotion Foam Roller", "FlexForge Adjustable Kettlebell", "StrideLab Hydration Bottle", "SummitCore Gym Towel", "PeakMotion Jump Rope", "FlexForge Core Slider Set"] },
      { name: "Grocery", code: "GRO", brands: ["HarvestLane", "DailyRoot", "KindPantry", "GreenBasket"], image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80", products: ["HarvestLane Organic Oats", "DailyRoot Arabica Coffee", "KindPantry Almonds", "GreenBasket Green Tea", "HarvestLane Brown Rice", "DailyRoot Cold Pressed Oil", "KindPantry Trail Mix", "GreenBasket Herbal Infusion", "HarvestLane Whole Wheat Pasta", "DailyRoot Honey Jar"] }
    ];

    const sellers = [users["seller-1"], users["seller-2"], users["seller-3"]];
    let globalIndex = 0;
    for (const definition of categories) {
      for (let index = 0; index < definition.products.length; index += 1) {
        const seller = sellers[globalIndex % sellers.length];
        const price = Math.round((9.99 + ((index * 37 + definition.code.length * 11) % 2100)) * 100) / 100;
        const discounted = index % 3 !== 1;
        const compareAtPrice = discounted ? Math.round(price * (1.12 + (index % 4) * 0.08) * 100) / 100 : 0;
        const stockPattern = index % 10;
        const stock = stockPattern === 0 ? 0 : stockPattern <= 2 ? 4 + index % 5 : stockPattern <= 5 ? 18 + index : 70 + index * 3;
        const name = definition.products[index];
        const sku = `DEMO-${definition.code}-${String(index + 1).padStart(3, "0")}`;
        await Product.findOneAndUpdate({ sku }, { $set: { name, description: `Development catalog item for ${name.toLowerCase()}, prepared for ShopEase marketplace testing.`, longDescription: `Demo-only ${definition.name.toLowerCase()} listing with realistic pricing, inventory, delivery, and seller ownership data.`, price, compareAtPrice, category: definition.name, subcategory: `${definition.name} Essentials`, brand: definition.brands[index % definition.brands.length], slug: sku.toLowerCase(), sku, image: definition.image, images: [definition.image], stock, lowStockThreshold: 10, rating: 0, reviewCount: 0, deliveryDays: 2 + (index % 5), weight: Math.round((0.2 + (index % 12) * 0.15) * 100) / 100, dimensions: { length: 10 + index % 20, width: 8 + index % 15, height: 3 + index % 8 }, warranty: definition.name === "Electronics" ? "12-month demo warranty" : null, returnPolicy: "30-day demo return policy", attributes: { condition: "New demo item", catalog: "ShopEase development marketplace", availability: stock > 0 ? "In stock" : "Out of stock" }, active: true, deleted: false, deletedAt: null, seller: seller._id, views: index * 17, purchases: index % 6 } }, { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true });
        globalIndex += 1;
      }
    }

    const productCount = await Product.countDocuments();
    res.status(200).json({ message: "Seed completed", products: productCount });
  } catch (error) {
    console.error("Seed error:", error);
    res.status(500).json({ message: error.message });
  }
});


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
