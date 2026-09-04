process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-that-is-long-enough-2026";

const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

jest.setTimeout(30000);

let mongoServer;
let app;
let User;
let Product;

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
  return response.body.token;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGO_URI);
  ({ app } = require("../server"));
  User = require("../models/User");
  Product = require("../models/Product");
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
    expect(jwt.verify(response.body.token, process.env.JWT_SECRET).exp).toBeGreaterThan(Math.floor(Date.now() / 1000));

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${response.body.token}`);
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
      sku: "OTHER-OWNER-001",
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
    const customerToken = await login(customerCredentials.email, customerCredentials.password);
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