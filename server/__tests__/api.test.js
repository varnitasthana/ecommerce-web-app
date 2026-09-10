process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-that-is-long-enough-2026";
process.env.RAZORPAY_KEY_ID = "rzp_test_unit_only";
process.env.RAZORPAY_KEY_SECRET = "razorpay_test_secret_unit_only";
process.env.RAZORPAY_WEBHOOK_SECRET = "razorpay_webhook_secret_unit_only";

const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

const mockRazorpay = {
  orders: {
    create: jest.fn()
  },
  refunds: {
    create: jest.fn()
  }
};

jest.mock("razorpay", () => jest.fn(() => mockRazorpay));

jest.setTimeout(30000);

let mongoServer;
let app;
let User;
let Product;
let Order;

const adminCredentials = {
  name: "Test Admin",
  email: "admin@test.local",
  password: "TestPassword#123"
};

const customerCredentials = {
  name: "Test Customer",
  email: "customer@test.local",
  password: "TestPassword#123"
};

const secondCustomerCredentials = {
  name: "Second Test Customer",
  email: "customer-two@test.local",
  password: "TestPassword#123"
};

const sellerCredentials = {
  name: "Test Seller",
  email: "seller@test.local",
  password: "TestPassword#123"
};

const login = async (email, password) => {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  return response.body?.accessToken || response.body?.token;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGO_URI, { retryWrites: false });
  ({ app } = require("../server"));
  process.env.RAZORPAY_KEY_ID = "rzp_test_unit_only";
  process.env.RAZORPAY_KEY_SECRET = "razorpay_test_secret_unit_only";
  process.env.RAZORPAY_WEBHOOK_SECRET = "razorpay_webhook_secret_unit_only";
  User = require("../models/User");
  Product = require("../models/Product");
  Order = require("../models/Order");
  const password = await bcrypt.hash(adminCredentials.password, 10);
  await User.create([
    { ...adminCredentials, password, role: "admin", emailVerified: true },
    { ...customerCredentials, password, role: "customer", emailVerified: true },
    { ...secondCustomerCredentials, password, role: "customer", emailVerified: true },
    { ...sellerCredentials, password, role: "seller", emailVerified: true }
  ]);
  await Product.create({
    name: "Test Laptop",
    description: "A test product",
    category: "Electronics",
    brand: "TestBrand",
    price: 500,
    compareAtPrice: 600,
    sku: "TEST-LAPTOP-001",
    slug: "test-laptop",
    image: "https://example.com/test-laptop.jpg",
    images: ["https://example.com/test-laptop.jpg"],
    stock: 8,
    active: true,
    deleted: false
  });
  await Product.createIndexes();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("authentication", () => {
  test("registers a customer and never returns a password", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "New Customer",
      email: " NEW-CUSTOMER@TEST.LOCAL ",
      password: "ValidPassword#123"
    });

    expect(response.status).toBe(201);
    const user = await User.findOne({ email: "new-customer@test.local" }).select("+password");
    expect(user.role).toBe("customer");
    expect(user.password).not.toBe("ValidPassword#123");
    expect(response.body).not.toHaveProperty("password");
  });

  test("rejects duplicate, invalid, and weak registrations", async () => {
    const duplicate = await request(app).post("/api/auth/register").send({ ...customerCredentials });
    const invalidEmail = await request(app).post("/api/auth/register").send({ name: "Bad", email: "bad", password: "ValidPassword#123" });
    const weakPassword = await request(app).post("/api/auth/register").send({ name: "Weak", email: "weak@test.local", password: "short" });

    expect(duplicate.status).toBe(409);
    expect(invalidEmail.status).toBe(400);
    expect(weakPassword.status).toBe(400);
  });

  test("logs in and protects /me with a database-backed token lookup", async () => {
    const response = await request(app).post("/api/auth/login").send(customerCredentials);
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("customer");
    expect(response.body.user).not.toHaveProperty("password");
    const accessToken = response.body.accessToken || response.body.token;
    expect(jwt.verify(accessToken, process.env.JWT_SECRET).exp).toBeGreaterThan(Math.floor(Date.now() / 1000));

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${accessToken}`);
    const missing = await request(app).get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(customerCredentials.email);
    expect(missing.status).toBe(401);
  });

  test("rejects incorrect credentials, malformed tokens, and expired tokens", async () => {
    const incorrect = await request(app).post("/api/auth/login").send({ email: customerCredentials.email, password: "wrong-password" });
    const nonexistent = await request(app).post("/api/auth/login").send({ email: "missing@test.local", password: "TestPassword#123" });
    const malformed = await request(app).get("/api/auth/me").set("Authorization", "Bearer malformed-token");
    const expiredToken = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET, { expiresIn: -1 });
    const expired = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${expiredToken}`);

    expect(incorrect.status).toBe(401);
    expect(nonexistent.status).toBe(401);
    expect(malformed.status).toBe(401);
    expect(expired.status).toBe(401);
  });
});

describe("catalog and authorization", () => {
  test("lists, searches, filters, sorts, paginates, and reads product details", async () => {
    const listing = await request(app).get("/api/products?category=Electronics&brand=TestBrand&minPrice=400&maxPrice=600&availability=in-stock&sort=price-low&limit=1&page=1");
    const search = await request(app).get("/api/search?search=Test%20Laptop&limit=10");
    const detail = await request(app).get(`/api/products/${listing.body.products[0]._id}`);

    expect(listing.status).toBe(200);
    expect(listing.body.pagination).toMatchObject({ total: 1, page: 1, limit: 1, totalPages: 1 });
    expect(search.status).toBe(200);
    expect(search.body.data.products).toHaveLength(1);
    expect(detail.status).toBe(200);
    expect(detail.body.name).toBe("Test Laptop");
  });

  test("serves bounded suggestions and related products", async () => {
    const suggestions = await request(app).get("/api/search/suggestions?q=Test");
    const product = await Product.findOne({ sku: "TEST-LAPTOP-001" });
    const recommendations = await request(app).get(`/api/products/${product._id}/recommendations`);

    expect(suggestions.status).toBe(200);
    expect(suggestions.body.suggestions[0].name).toBe("Test Laptop");
    expect(recommendations.status).toBe(200);
    expect(Array.isArray(recommendations.body.products)).toBe(true);
    expect(recommendations.body.products.find((item) => String(item._id) === String(product._id))).toBeUndefined();
  });

  test("rejects unsafe catalog query parameters and sends security headers", async () => {
    const invalidPage = await request(app).get("/api/products?page=0");
    const invalidRating = await request(app).get("/api/products?minRating=8");
    const health = await request(app).get("/api/health");
    const cors = await request(app).get("/api/health").set("Origin", "http://localhost:5174");

    expect(invalidPage.status).toBe(400);
    expect(invalidRating.status).toBe(400);
    expect(health.headers["x-content-type-options"]).toBe("nosniff");
    expect(cors.headers["access-control-allow-origin"]).toBe("http://localhost:5174");
  });

  test("enforces admin product authorization and duplicate SKU protection", async () => {
    const customerToken = await login(customerCredentials.email, customerCredentials.password);
    const adminToken = await login(adminCredentials.email, adminCredentials.password);
    const payload = {
      name: "Admin Test Product",
      description: "Created by an admin test",
      category: "Electronics",
      brand: "TestBrand",
      price: 100,
      stock: 4,
      sku: "ADMIN-TEST-001",
      image: "https://example.com/admin-test.jpg",
      images: ["https://example.com/admin-test.jpg"]
    };

    const forbidden = await request(app).post("/api/products").set("Authorization", `Bearer ${customerToken}`).send(payload);
    const created = await request(app).post("/api/products").set("Authorization", `Bearer ${adminToken}`).send(payload);
    const duplicate = await request(app).post("/api/products").set("Authorization", `Bearer ${adminToken}`).send(payload);

    expect(forbidden.status).toBe(403);
    expect(created.status).toBe(201);
    expect(duplicate.status).toBe(409);
  });

  test("restricts admin overview metrics to admins", async () => {
    const adminToken = await login(adminCredentials.email, adminCredentials.password);
    const customerToken = await login(customerCredentials.email, customerCredentials.password);
    const adminOverview = await request(app).get("/api/admin/overview").set("Authorization", `Bearer ${adminToken}`);
    const customerOverview = await request(app).get("/api/admin/overview").set("Authorization", `Bearer ${customerToken}`);

    expect(adminOverview.status).toBe(200);
    expect(adminOverview.body).toEqual(expect.objectContaining({ customers: expect.any(Number), products: expect.any(Number), lowStockProducts: expect.any(Number) }));
    expect(customerOverview.status).toBe(403);
  });

  test("soft-deleted products are no longer publicly visible", async () => {
    const adminToken = await login(adminCredentials.email, adminCredentials.password);
    const product = await Product.findOne({ sku: "TEST-LAPTOP-001" });
    const deleted = await request(app).delete(`/api/products/${product._id}`).set("Authorization", `Bearer ${adminToken}`);
    const detail = await request(app).get(`/api/products/${product._id}`);

    expect(deleted.status).toBe(200);
    expect(detail.status).toBe(404);
  });
});

describe("wishlist and reviews", () => {
  test("isolates wishlist data between customers and toggles duplicate items", async () => {
    const customerToken = await login(customerCredentials.email, customerCredentials.password);
    const secondCustomerToken = await login(secondCustomerCredentials.email, secondCustomerCredentials.password);
    const product = await Product.findOne({ sku: "TEST-LAPTOP-001" });

    const saved = await request(app)
      .post(`/api/wishlist/${product._id}/toggle`)
      .set("Authorization", `Bearer ${customerToken}`);
    const duplicateToggle = await request(app)
      .post(`/api/wishlist/${product._id}/toggle`)
      .set("Authorization", `Bearer ${customerToken}`);
    const customerWishlist = await request(app)
      .get("/api/wishlist")
      .set("Authorization", `Bearer ${customerToken}`);
    const otherWishlist = await request(app)
      .get("/api/wishlist")
      .set("Authorization", `Bearer ${secondCustomerToken}`);

    expect(saved.status).toBe(200);
    expect(saved.body.saved).toBe(true);
    expect(duplicateToggle.body.saved).toBe(false);
    expect(customerWishlist.body).toEqual([]);
    expect(otherWishlist.body).toEqual([]);
  });

  test("creates one review per customer and refreshes product rating metadata", async () => {
    const customerToken = await login(customerCredentials.email, customerCredentials.password);
    const product = await Product.findOne({ sku: "TEST-LAPTOP-001" });
    const payload = { rating: 5, title: "Excellent test product", comment: "Useful for API regression testing." };

    const created = await request(app)
      .post(`/api/reviews/${product._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send(payload);
    const duplicate = await request(app)
      .post(`/api/reviews/${product._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send(payload);
    const invalid = await request(app)
      .post(`/api/reviews/${product._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 6, title: "Invalid", comment: "Invalid rating" });
    const reviews = await request(app).get(`/api/reviews/${product._id}`);
    const refreshed = await Product.findById(product._id);

    expect(created.status).toBe(201);
    expect(duplicate.status).toBe(409);
    expect(invalid.status).toBe(400);
    expect(reviews.status).toBe(200);
    expect(reviews.body).toHaveLength(1);
    expect(refreshed.reviewCount).toBe(1);
    expect(refreshed.rating).toBe(5);
  });
});

describe("seller ownership", () => {
  test("allows sellers to manage only their own products", async () => {
    const sellerToken = await login(sellerCredentials.email, sellerCredentials.password);
    const customerToken = await login(customerCredentials.email, customerCredentials.password);
    const ownPayload = {
      name: "Seller-Owned Product",
      description: "A seller-owned test product",
      category: "Fashion",
      brand: "SellerBrand",
      price: 45,
      stock: 5,
      sku: "SELLER-OWNED-001",
      image: "https://example.com/seller-owned.jpg",
      images: ["https://example.com/seller-owned.jpg"]
    };
    const otherProduct = await Product.create({
      name: "Other Owner Product",
      description: "Owned by the admin for authorization testing",
      category: "Fashion",
      brand: "OtherBrand",
      price: 60,
      sku: "OTHER-OWNED-001",
      slug: "other-owner-product",
      stock: 3,
      active: true,
      deleted: false,
      seller: (await User.findOne({ email: adminCredentials.email }))._id
    });

    const customerList = await request(app).get("/api/sellers/products").set("Authorization", `Bearer ${customerToken}`);
    const created = await request(app).post("/api/sellers/products").set("Authorization", `Bearer ${sellerToken}`).send(ownPayload);
    const ownList = await request(app).get("/api/sellers/products").set("Authorization", `Bearer ${sellerToken}`);
    const ownUpdate = await request(app).put(`/api/sellers/products/${created.body.product._id}`).set("Authorization", `Bearer ${sellerToken}`).send({ ...ownPayload, price: 50 });
    const otherUpdate = await request(app).put(`/api/sellers/products/${otherProduct._id}`).set("Authorization", `Bearer ${sellerToken}`).send({ ...ownPayload, sku: "SELLER-OTHER-001" });
    const otherDelete = await request(app).delete(`/api/sellers/products/${otherProduct._id}`).set("Authorization", `Bearer ${sellerToken}`);

    expect(customerList.status).toBe(403);
    expect(created.status).toBe(201);
    expect(ownList.body.products).toHaveLength(1);
    expect(ownUpdate.status).toBe(200);
    expect(ownUpdate.body.product.price).toBe(50);
    expect(otherUpdate.status).toBe(404);
    expect(otherDelete.status).toBe(404);
  });
});

describe("orders", () => {
  test("uses server prices, decrements stock, and isolates order ownership", async () => {
    const customerToken = await login(customerCredentials.email, customerCredentials.password);
    const secondCustomerToken = await login(secondCustomerCredentials.email, secondCustomerCredentials.password);
    const product = await Product.create({
      name: "Order Test Product",
      description: "A product for order regression tests",
      category: "Electronics",
      brand: "TestBrand",
      price: 75,
      compareAtPrice: 100,
      sku: "ORDER-TEST-001",
      slug: "order-test-product",
      stock: 3,
      active: true,
      deleted: false
    });
    const shippingAddress = { name: "Test Customer", street: "1 Test Road", city: "Test City", postalCode: "000001", country: "Testland" };

    const created = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", "order-test-key-1")
      .send({ items: [{ product: product._id, quantity: 2, price: 1 }], shippingAddress });
    const retry = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", "order-test-key-1")
      .send({ items: [{ product: product._id, quantity: 2, price: 1 }], shippingAddress });
    const orders = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`);
    const otherOrders = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${secondCustomerToken}`);
    const refreshed = await Product.findById(product._id);

    expect(created.status).toBe(201);
    expect(created.body.order.subtotal).toBe(150);
    expect(created.body.order.total).toBe(150);
    expect(created.body.order.items[0].price).toBe(75);
    expect(retry.status).toBe(200);
    expect(retry.body.idempotent).toBe(true);
    expect(retry.body.order._id).toBe(created.body.order._id);
    expect(refreshed.stock).toBe(1);
    expect(orders.body.pagination.total).toBe(1);
    expect(otherOrders.body.pagination.total).toBe(0);
  });

  test("rejects invalid quantities and unavailable products", async () => {
    const customerToken = await login(customerCredentials.email, customerCredentials.password);
    const product = await Product.findOne({ sku: "ORDER-TEST-001" });
    const shippingAddress = { name: "Test Customer", street: "1 Test Road", city: "Test City", postalCode: "000001", country: "Testland" };

    const insufficient = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ items: [{ product: product._id, quantity: 2 }], shippingAddress });
    const invalid = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ items: [{ product: "not-an-id", quantity: 1 }], shippingAddress });

    expect(insufficient.status).toBe(400);
    expect(invalid.status).toBe(400);
  });

  test("prevents concurrent overselling with atomic stock conditions", async () => {
    const customer = await User.findOne({ email: customerCredentials.email });
    const customerToken = jwt.sign({ id: customer._id, role: "customer" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const product = await Product.create({
      name: "Concurrency Test Product",
      description: "One-unit inventory for race testing",
      category: "Electronics",
      brand: "TestBrand",
      price: 20,
      sku: "CONCURRENCY-TEST-001",
      slug: "concurrency-test-product",
      stock: 1,
      active: true,
      deleted: false
    });
    const shippingAddress = { name: "Test Customer", street: "1 Test Road", city: "Test City", postalCode: "000001", country: "Testland" };

    const responses = await Promise.all([
      request(app).post("/api/orders").set("Authorization", `Bearer ${customerToken}`).send({ items: [{ product: product._id, quantity: 1 }], shippingAddress }),
      request(app).post("/api/orders").set("Authorization", `Bearer ${customerToken}`).send({ items: [{ product: product._id, quantity: 1 }], shippingAddress })
    ]);
    const refreshed = await Product.findById(product._id);
    const successful = responses.filter((response) => response.status === 201);
    const rejected = responses.filter((response) => response.status === 400);

    expect(successful).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(refreshed.stock).toBe(0);
  });
});

describe("Razorpay payment contract", () => {
  beforeEach(async () => {
    mockRazorpay.orders.create.mockClear();
    mockRazorpay.refunds.create.mockClear();

    const existing = await Product.findOne({ sku: "TEST-LAPTOP-001" });
    if (existing) {
      await Product.findByIdAndUpdate(existing._id, { active: true, deleted: false, stock: 8 });
    }
  });

  test("creates a Razorpay order and reserves stock", async () => {
    const customerToken = await login(customerCredentials.email, customerCredentials.password);
    const product = await Product.findOne({ sku: "TEST-LAPTOP-001" });
    const shippingAddress = { name: "Test Customer", street: "1 Test Road", city: "Test City", postalCode: "000001", country: "Testland" };

    mockRazorpay.orders.create.mockResolvedValue({
      id: "order_Test123",
      amount: 550000,
      currency: "INR",
      receipt: "some-id",
      status: "created"
    });

    const response = await request(app)
      .post("/api/payments/create-order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ items: [{ product: product._id, quantity: 1 }], shippingAddress });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("razorpayOrderId", "order_Test123");
    expect(response.body).toHaveProperty("razorpayKeyId", process.env.RAZORPAY_KEY_ID);
    expect(response.body).toHaveProperty("amount");
    expect(response.body).toHaveProperty("orderId");

    const order = await Order.findById(response.body.orderId);
    expect(order.status).toBe("pending_payment");
    expect(order.paymentStatus).toBe("pending");
    expect(order.razorpayOrderId).toBe("order_Test123");
    expect(order.stockReserved).toBe(true);
  });

  test("enforces idempotency on Razorpay order creation", async () => {
    const customerToken = await login(customerCredentials.email, customerCredentials.password);
    const product = await Product.findOne({ sku: "TEST-LAPTOP-001" });
    const shippingAddress = { name: "Test Customer", street: "1 Test Road", city: "Test City", postalCode: "000001", country: "Testland" };

    mockRazorpay.orders.create.mockResolvedValue({
      id: "order_Idempotent123",
      amount: 50000,
      currency: "INR",
      receipt: "some-id",
      status: "created"
    });

    const first = await request(app)
      .post("/api/payments/create-order")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", "razorpay-idempotency-key")
      .send({ items: [{ product: product._id, quantity: 1 }], shippingAddress });

    const second = await request(app)
      .post("/api/payments/create-order")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", "razorpay-idempotency-key")
      .send({ items: [{ product: product._id, quantity: 1 }], shippingAddress });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.idempotent).toBe(true);
    expect(second.body.order._id).toBe(first.body.orderId);
    expect(mockRazorpay.orders.create).toHaveBeenCalledTimes(1);
  });

  test("verifies payment signature and marks order paid", async () => {
    const customer = await User.findOne({ email: customerCredentials.email });
    const order = await Order.create({
      user: customer._id,
      items: [{ product: (await Product.findOne({ sku: "TEST-LAPTOP-001" }))._id, name: "Test Laptop", price: 500, quantity: 1 }],
      shippingAddress: { name: "Test Customer", street: "1 Test Road", city: "Test City", postalCode: "000001", country: "Testland" },
      subtotal: 500,
      total: 500,
      status: "pending_payment",
      paymentStatus: "pending",
      paymentMethod: "razorpay",
      razorpayOrderId: "order_VerifyTest",
      stockReserved: true
    });
    await Product.findByIdAndUpdate(order.items[0].product, { $inc: { stock: -1 } });

    const razorpayPaymentId = "pay_VerifyTest123";
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`order_VerifyTest|${razorpayPaymentId}`)
      .digest("hex");

    const customerToken = await login(customerCredentials.email, customerCredentials.password);
    const response = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ razorpay_order_id: "order_VerifyTest", razorpay_payment_id: razorpayPaymentId, razorpay_signature: signature });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Payment verified successfully");

    const updated = await Order.findById(order._id);
    expect(updated.paymentStatus).toBe("paid");
    expect(updated.status).toBe("confirmed");
    expect(updated.razorpayPaymentId).toBe(razorpayPaymentId);
    expect(updated.stockReserved).toBe(false);
  });

  test("rejects invalid payment signature", async () => {
    const customerToken = await login(customerCredentials.email, customerCredentials.password);
    const response = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ razorpay_order_id: "order_Invalid", razorpay_payment_id: "pay_Invalid", razorpay_signature: "bad-signature" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Payment signature verification failed");
  });

  test("handles successful webhook payment event", async () => {
    const customer = await User.findOne({ email: customerCredentials.email });
    const product = await Product.findOne({ sku: "TEST-LAPTOP-001" });
    const order = await Order.create({
      user: customer._id,
      items: [{ product: product._id, name: product.name, price: product.price, quantity: 1 }],
      shippingAddress: { name: "Test Customer", street: "1 Test Road", city: "Test City", postalCode: "000001", country: "Testland" },
      subtotal: product.price,
      total: product.price,
      status: "pending_payment",
      paymentStatus: "pending",
      paymentMethod: "razorpay",
      razorpayOrderId: "order_WebhookPaid",
      stockReserved: true
    });
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -1 } });

    const payload = {
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_WebhookPaid123",
            order_id: "order_WebhookPaid",
            status: "captured"
          }
        }
      }
    };
    const bodyString = JSON.stringify(payload);
    const webhookSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(bodyString)
      .digest("hex");

    const paid = await request(app)
      .post("/api/payments/webhook")
      .set("x-razorpay-signature", webhookSignature)
      .set("Content-Type", "application/json")
      .send(bodyString);

    expect(paid.status).toBe(200);
    const confirmed = await Order.findById(order._id);
    expect(confirmed.paymentStatus).toBe("paid");
    expect(confirmed.status).toBe("confirmed");

    const duplicate = await request(app)
      .post("/api/payments/webhook")
      .set("x-razorpay-signature", webhookSignature)
      .set("Content-Type", "application/json")
      .send(bodyString);

    expect(duplicate.status).toBe(200);
    expect(duplicate.body.idempotent).toBe(true);
  });

  test("handles failed webhook payment event and releases stock", async () => {
    const customer = await User.findOne({ email: customerCredentials.email });
    const product = await Product.findOne({ sku: "TEST-LAPTOP-001" });
    const failedOrder = await Order.create({
      user: customer._id,
      items: [{ product: product._id, name: product.name, price: product.price, quantity: 1 }],
      shippingAddress: { name: "Test Customer", street: "1 Test Road", city: "Test City", postalCode: "000001", country: "Testland" },
      subtotal: product.price,
      total: product.price,
      status: "pending_payment",
      paymentStatus: "pending",
      paymentMethod: "razorpay",
      razorpayOrderId: "order_WebhookFailed",
      stockReserved: true
    });
    const stockBeforeFailure = (await Product.findById(product._id)).stock;
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -1 } });

    const payload = {
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_WebhookFailed123",
            order_id: "order_WebhookFailed",
            status: "failed"
          }
        }
      }
    };
    const bodyString = JSON.stringify(payload);
    const webhookSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(bodyString)
      .digest("hex");

    const failed = await request(app)
      .post("/api/payments/webhook")
      .set("x-razorpay-signature", webhookSignature)
      .set("Content-Type", "application/json")
      .send(bodyString);

    expect(failed.status).toBe(200);
    const failedState = await Order.findById(failedOrder._id);
    expect(failedState.paymentStatus).toBe("failed");
    expect(failedState.status).toBe("cancelled");
    const stockAfterFailure = (await Product.findById(product._id)).stock;
    expect(stockAfterFailure).toBe(stockBeforeFailure);
  });

  test("processes demo checkout with COD and stock reservation", async () => {
    const customerToken = await login(customerCredentials.email, customerCredentials.password);
    const product = await Product.findOne({ sku: "TEST-LAPTOP-001" });
    const shippingAddress = { name: "Test Customer", street: "1 Test Road", city: "Test City", postalCode: "000001", country: "Testland" };

    const response = await request(app)
      .post("/api/payments/demo-checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ items: [{ product: product._id, quantity: 1 }], shippingAddress, paymentMethod: "cod" });

    expect(response.status).toBe(201);
    expect(response.body.demo).toBe(true);
    expect(response.body.paymentMethod).toBe("cod");

    const order = await Order.findById(response.body.orderId);
    expect(order.status).toBe("confirmed");
    expect(order.paymentStatus).toBe("paid");
    expect(order.paymentMethod).toBe("cod");
  });

  test("rejects Razorpay order creation without authentication", async () => {
    const response = await request(app)
      .post("/api/payments/create-order")
      .send({ items: [], shippingAddress: {} });

    expect(response.status).toBe(401);
  });
});
