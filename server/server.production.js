const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { logger, requestLogger } = require('./middleware/logger');
const { corsOptions } = require('./config/cors');
const mongoSanitize = require('./middleware/mongoSanitize');
const xss = require('./middleware/xss');

// Route imports
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const guestPaymentRoutes = require('./routes/guestPaymentRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const couponAdminRoutes = require('./routes/couponAdminRoutes');
const returnRoutes = require('./routes/returnRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const questionRoutes = require('./routes/questionRoutes');
const searchRoutes = require('./routes/searchRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const sellerAnalyticsRoutes = require('./routes/sellerAnalyticsRoutes');
const compareRoutes = require('./routes/compareRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const categoryAdminRoutes = require('./routes/categoryAdminRoutes');
const { integrationStatus } = require('./config/integrations');

const app = express();

// Connect to database
(async () => {
  try {
    await connectDB();
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
})();

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'", "https://*.razorpay.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors(corsOptions));

// Request logging
app.use(requestLogger);

// Compression
app.use(compression());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL injection
app.use(mongoSanitize);

// Data sanitization against XSS
app.use(xss);

// Prevent parameter pollution
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Strict rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many authentication attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true
  }));
}

// Health check
app.get('/health', async (req, res) => {
  try {
    const { getConnectionState } = require('./config/db');
    const connection = getConnectionState();
    const isConnected = connection.label === 'connected';

    const dbName = mongoose.connection.db?.databaseName || process.env.MONGO_DB || 'unknown';
    let collections = [];
    let counts = { users: null, products: null, orders: null };

    if (isConnected && mongoose.connection.db) {
      try {
        collections = await mongoose.connection.db.listCollections().toArray().then(c => c.map(col => col.name)).catch(() => []);
        const collectionNames = new Set(collections.map(c => c.toLowerCase()));
        if (collectionNames.has('users')) counts.users = await mongoose.connection.db.collection('users').countDocuments().catch(() => null);
        if (collectionNames.has('products')) counts.products = await mongoose.connection.db.collection('products').countDocuments().catch(() => null);
        if (collectionNames.has('orders')) counts.orders = await mongoose.connection.db.collection('orders').countDocuments().catch(() => null);
      } catch {
        // health query failed
      }
    }

    const dbHealthy = isConnected;
    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json({
      status: dbHealthy ? 'ok' : 'degraded',
      service: 'ecommerce-api',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
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
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'ecommerce-api',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes.default);
app.use('/api/guest/orders', orderRoutes.guest);
app.use('/api/payments', paymentRoutes);
app.use('/api/guest/payments', guestPaymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/sellers/analytics', sellerAnalyticsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin/coupons', couponAdminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/categories', categoryAdminRoutes);
app.use('/api/returns', returnRoutes.default);
app.use('/api/admin/returns', returnRoutes.admin);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/auth/tokens', tokenRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/questions', questionRoutes);

// SPA fallback for client-side routing
if (fs.existsSync(clientDistPath)) {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);

server.listen(PORT, HOST, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Server running on http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = { app, server };
