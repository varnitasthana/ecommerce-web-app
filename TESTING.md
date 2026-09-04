# Testing Guide

This document describes the testing strategy for ShopEase e-commerce platform.

## Test Setup

### Test Architecture

Backend API tests live in `server/__tests__/api.test.js` and use Jest,
Supertest, and MongoDB Memory Server. The suite creates and destroys an
isolated in-memory database and never connects to the development seed data.

There is currently no frontend unit-test runner or Playwright project. Browser
smoke checks are performed separately against the running local app and are not
counted as automated E2E tests.

### Running Tests
```bash
npm test                    # Run isolated backend API tests
npm run test:coverage       # Run tests and report actual server coverage
npm --prefix server run test:watch
npm run lint
npm run build
```

## Current Coverage

The focused backend suite currently reports 41.4% statements, 29.77% branches,
37.25% functions, and 42.9% lines. These are measured values, not a
production-readiness claim.

## Test Coverage Goals

- **Unit Tests**: Validators, utilities, helpers (target: 80% coverage)
- **Integration Tests**: Controllers, routes, database interactions (target: 60%)
- **API Tests**: Critical endpoints (target: 80%)
- **Authentication**: Login, authorization flows (target: 90%)
- **Payment Flow**: Checkout, webhook, refund (target: 80%)

## Critical Test Paths

### Authentication (Priority: HIGH)
- [ ] Registration with valid/invalid inputs
- [ ] Login with correct/incorrect credentials
- [ ] JWT token generation and verification
- [ ] Protected route access
- [ ] Role-based authorization
- [ ] Password change flow

### Products (Priority: HIGH)
- [ ] Create product validation
- [ ] Product search with filters
- [ ] Product availability checks
- [ ] Soft delete behavior

### Orders & Payment (Priority: CRITICAL)
- [ ] Checkout session creation
- [ ] Stock reservation
- [ ] Stock release on payment failure
- [ ] Stripe webhook idempotency
- [ ] Refund processing
- [ ] Order state transitions

### Cart & Checkout (Priority: HIGH)
- [ ] Add to cart
- [ ] Update quantities
- [ ] Apply coupon
- [ ] Calculate total
- [ ] Validate items before checkout

### User Account (Priority: MEDIUM)
- [ ] Profile update
- [ ] Password change
- [ ] Address management
- [ ] Default address setting

## Example Test Structure

```javascript
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("Product API", () => {
  let mongoServer;
  let app;
  let token;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    // Setup test app and user
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("GET /api/products", () => {
    test("should return paginated products", async () => {
      const response = await request(app)
        .get("/api/products")
        .expect(200);

      expect(response.body).toHaveProperty("products");
      expect(response.body).toHaveProperty("pagination");
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    test("should filter by category", async () => {
      const response = await request(app)
        .get("/api/products?category=Electronics")
        .expect(200);

      expect(response.body.products.every(p => p.category === "Electronics")).toBe(true);
    });
  });
});
```

## Mocking Strategy

### Database
- Use MongoDB Memory Server for tests
- Factory functions for test data creation

### External Services
- Mock Stripe API responses
- Mock email service
- Mock shipping provider

### Example Mock
```javascript
jest.mock("../services/emailService", () => ({
  sendOrderConfirmation: jest.fn().mockResolvedValue({ success: true })
}));
```

## CI/CD Integration

The repository workflow in `.github/workflows/ci.yml` runs backend tests against
MongoDB Memory Server, frontend lint, and the frontend production build. It
does not require production secrets or Stripe credentials.

## Performance Testing

- [ ] Load test checkout endpoint (100+ concurrent users)
- [ ] Search performance with large product catalog
- [ ] Database query optimization verification

## Security Testing

- [ ] SQL/NoSQL injection attempts
- [ ] CSRF token validation
- [ ] Rate limit effectiveness
- [ ] JWT token expiry

## Current Limitations

- Stripe checkout, webhooks, and refunds are not automated because no Stripe test credentials or mock contract suite is configured.
- Seller product ownership routes are not tested because the current API exposes admin-only product mutation routes, not seller-scoped product management routes.
- Frontend component tests and Playwright E2E tests are not configured yet.

## Future Test Improvements

- [ ] End-to-end (E2E) tests with Cypress/Playwright
- [ ] Visual regression testing
- [ ] Contract testing for API versioning
- [ ] Chaos engineering for resilience
- [ ] Load and stress testing
