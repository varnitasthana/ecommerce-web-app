# Project Audit

Audit date: 2026-08-19

## 1. Current Architecture

This is an existing full-stack JavaScript ecommerce application with two runtime applications:

- `client/`: React 19 + Vite single-page application.
- `server/`: Express 5 REST API using CommonJS modules.
- MongoDB Atlas: persistent database accessed through Mongoose.
- Root scripts: run the client and server together with `concurrently`.
- Authentication: bcrypt password hashing plus JWT bearer tokens.
- Browser API access: Axios from `client/src/api.js`.
- Payments: Stripe-hosted Checkout preparation with server-side pricing, stock reservation, and webhook settlement.
- Integrations: Cloudinary signed-upload preparation, Resend-compatible email preparation, and a generic shipping-provider adapter.

Normal local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Backend health: `http://localhost:5000/api/health`

The root command `npm run dev:clean` stops old project processes and starts one controlled client/server development stack. The server waits for MongoDB before listening.

## 2. Frontend

### Technologies

- React 19
- Vite
- React Router DOM
- Axios
- Oxlint
- Browser `localStorage` for the cart, JWT, and cached user display data

### Main frontend files

- `client/src/main.jsx`: React entry point.
- `client/src/App.jsx`: router, shared header/footer, protected routes, cart state, and cart persistence.
- `client/src/api.js`: shared Axios instance and JWT request interceptor.
- `client/src/App.css`: current marketplace visual system and responsive styles.
- `client/src/index.css`: remaining Vite starter/global styles; should be consolidated or intentionally documented later.

### Pages

- `Home.jsx`: hero, trust messaging, featured products, loading skeletons.
- `Products.jsx`: product listing, search, category filter, price sorting, query-parameter support.
- `ProductDetails.jsx`: product details, rating display, wishlist toggle, reviews, review submission.
- `Cart.jsx`: cart items, quantity changes, removal, total display.
- `Checkout.jsx`: shipping address collection and redirect to server-created Stripe Checkout.
- `Orders.jsx`: authenticated order history and payment/fulfilment status display.
- `Login.jsx`: login form and JWT storage.
- `Register.jsx`: registration form.
- `Wishlist.jsx`: authenticated saved products.
- `Admin.jsx`: admin product create/edit/delete and inventory fields.
- `Partner.jsx`: public seller partnership application form.
- `Support.jsx`: customer FAQ and support email link.
- `Legal.jsx`: privacy, terms, and returns/refunds pages.

### Implemented frontend behavior

- Product browsing through the API.
- Search by product name.
- Category filtering.
- Price sorting.
- Product details and ratings.
- Cart quantity changes and removal.
- Cart persistence in `localStorage`.
- Protected checkout, orders, wishlist, and admin routes.
- Marketplace header, category navigation, trust strip, support links, legal links, and responsive layout.
- Client build and lint pass.

### Partial frontend behavior

- Cart data is persisted in the browser, not associated with a server account.
- Product search and filtering are performed in the browser after loading the product list; large catalogs need server-side search, indexes, pagination, and facet APIs.
- Checkout redirects to Stripe only when real Stripe credentials and webhook configuration exist.
- Order success clears the local cart when the customer returns with a success query parameter; final payment truth still comes from the server webhook.
- Tracking fields exist in orders, but there is no customer-facing tracking timeline UI.
- Cloudinary upload signing exists on the server, but the admin UI still accepts an image URL and does not upload files.
- The frontend has no logout action, account/profile page, password reset, pagination, advanced filters, or address book.

## 3. Backend

### Server entry and configuration

- `server/server.js`: Express app, CORS, Helmet, rate limiting, JSON parser, route mounting, health endpoint, error handling, MongoDB-gated startup, and graceful shutdown.
- `server/config/db.js`: Mongoose connection with bounded server-selection and connection timeouts.
- `server/config/integrations.js`: detects real provider configuration and returns integration readiness flags.

### Routes

| Route | Access | Purpose |
|---|---|---|
| `GET /` | Public | API information response |
| `GET /api/health` | Public | Service and integration readiness status |
| `POST /api/auth/register` | Public | Create a user account |
| `POST /api/auth/login` | Public | Authenticate and issue JWT |
| `GET /api/products` | Public | List products |
| `GET /api/products/:id` | Public | Read one product |
| `POST /api/products` | Admin | Create product |
| `PUT /api/products/:id` | Admin | Update product |
| `DELETE /api/products/:id` | Admin | Delete product |
| `GET /api/orders/mine` | Authenticated | Read current user's orders |
| `GET /api/orders/:id/tracking` | Authenticated owner | Read shipment tracking through provider adapter |
| `GET /api/reviews/:productId` | Public | Read product reviews |
| `POST /api/reviews/:productId` | Authenticated | Create one review per user/product |
| `GET /api/wishlist` | Authenticated | Read current user's wishlist |
| `POST /api/wishlist/:productId/toggle` | Authenticated | Add/remove a wishlist product |
| `POST /api/sellers/applications` | Public | Submit seller partnership application |
| `GET /api/sellers/applications` | Admin | List seller applications |
| `PATCH /api/sellers/applications/:id` | Admin | Approve/reject seller application |
| `POST /api/payments/webhook` | Stripe signed request | Settle payment events |
| `POST /api/payments/create-checkout-session` | Authenticated | Validate cart, reserve stock, and create Stripe Checkout session |
| `GET /api/media/signature` | Admin | Create Cloudinary signed-upload parameters |

### Controllers

- `authController.js`: registration and login.
- `productController.js`: product CRUD and product input validation.
- `orderController.js`: current order listing and tracking lookup. It also contains an old `createOrder` implementation that is no longer routed and duplicates the payment flow.
- `paymentController.js`: server-side cart validation, stock reservation/release, Stripe Checkout session creation, signed webhook verification, payment state changes, and order confirmation email trigger.
- `reviewController.js`: review creation, review listing, and product rating aggregation.
- `wishlistController.js`: account wishlist retrieval and toggle behavior.
- `sellerController.js`: seller application submission and admin status changes.
- `mediaController.js`: Cloudinary signed-upload generation.

### Middleware and services

- `server/middleware/authMiddleware.js`: JWT bearer verification and admin role check.
- `server/services/emailService.js`: Resend-compatible email API call and order confirmation email.
- `server/services/shippingService.js`: generic shipment creation and tracking calls through a configured provider URL.

## 4. Database

MongoDB Atlas is configured through `server/.env` and connected by Mongoose.

### Collections/models

- `User`: name, email, bcrypt password hash, role, timestamps.
- `Product`: name, description, price, category, brand, image URL, stock, comparison price, rating, review count, delivery days, timestamps.
- `Order`: owner, historical item name/price snapshots, quantities, shipping address, server total, fulfilment status, payment status, Stripe IDs, paid timestamp, stock reservation flag, shipping provider, tracking number, tracking URL.
- `Review`: product reference, user reference, 1-5 rating, title, comment, timestamps, unique product/user index.
- `Wishlist`: unique user reference and product references.
- `SellerApplication`: optional applicant reference, brand/contact/category/catalog/message, pending/approved/rejected status.

### Relationships

- `Order.user -> User`.
- `Order.items.product -> Product`, while item name and price are copied for historical accuracy.
- `Review.product -> Product` and `Review.user -> User`.
- `Wishlist.user -> User`; wishlist product IDs reference `Product`.
- `SellerApplication.applicant -> User` is optional because applications are public.

### Database concerns

- Product stock reservation is implemented with conditional atomic updates per item, but a multi-item checkout is not wrapped in a MongoDB transaction.
- Abandoned Stripe sessions do not have a scheduled cleanup job; stock release depends on received expiry/failure events.
- Seller applications have no duplicate/spam policy or verification workflow.
- There is no seller ownership relation on `Product`, so approved partners cannot yet manage their own catalog securely.
- No migration/versioning process exists for future schema changes.

## 5. Authentication

### Implemented

- Registration hashes passwords with bcrypt.
- Login compares the hash and signs a JWT containing user ID and role.
- JWT expiry is one day.
- Axios attaches `Authorization: Bearer <token>` when a token exists.
- Server middleware protects authenticated routes and checks admin role for admin routes.
- Frontend route guards protect checkout, orders, wishlist, and admin UI.

### Gaps

- No logout or token revocation mechanism.
- JWT secret strength and presence are not validated during startup.
- Login responses reveal whether an email exists, which enables account enumeration.
- Registration lacks robust length, normalization, and password-policy validation.
- The frontend stores identity display data in mutable `localStorage`; the server remains the authorization source, but a `/me` endpoint would improve session accuracy.
- No refresh-token/session strategy exists.
- No email verification, password reset, MFA, or suspicious-login workflow exists.

## 6. Payments

### Current implementation

- Stripe SDK is installed in the server.
- Checkout uses Stripe-hosted Checkout rather than collecting card data in the app.
- Server loads products from MongoDB and calculates the authoritative total.
- Server reserves stock before creating a Checkout session.
- A pending-payment order is created with Stripe session metadata.
- Stripe webhook signatures are verified using the raw request body.
- Successful webhook events mark the order paid/confirmed.
- Failure/expiry events release reserved stock and cancel the order.
- Payment confirmation email is attempted after successful webhook settlement.
- The order records payment status and Stripe IDs.

### Configuration status

`server/.env.example` documents:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CURRENCY`
- `CLIENT_URL`

The local environment contains the Stripe variable names, but the supplied values are placeholders. The integration readiness code correctly reports payments as not configured when placeholders are present. No real Stripe secret is included in this report or repository.

### Missing payment production controls

- Stripe test Checkout has not been run in this audit.
- Webhook retry/idempotency coverage has not been automated.
- Refund and partial-refund workflows are missing.
- Payment reconciliation/admin payment views are missing.
- Abandoned-session cleanup job is missing.
- Payment tax, shipping fee, coupon, and currency strategy is not implemented.
- The old unrouted `createOrder` controller should be removed or clearly retired in a later cleanup to avoid duplicate payment/order logic.

## 7. Existing Features

| Feature | Status | Location | Notes |
|---|---|---|---|
| React/Vite client | Implemented | `client/` | Builds successfully. |
| Express API | Implemented | `server/server.js` | Routes are mounted and server syntax passes. |
| MongoDB Atlas connection | Implemented | `server/config/db.js` | Connection was verified during recent runtime checks; Atlas allowlist was previously required. |
| Product browsing | Implemented | `Products.jsx`, product routes/controller | Public list/detail API. |
| Search/filter/sort | Partially Implemented | `Products.jsx` | Browser-side; needs server-side catalog search/pagination for scale. |
| Product details | Implemented | `ProductDetails.jsx` | Includes brand, price, rating, delivery display. |
| Cart | Implemented | `App.jsx`, `Cart.jsx` | Browser persistence; not server/account synced. |
| Registration/login | Implemented | `Register.jsx`, `Login.jsx`, `authController.js` | Needs stronger validation and account recovery. |
| JWT protection | Implemented | `authMiddleware.js`, `App.jsx` | No refresh/revocation/logout. |
| Wishlist | Implemented | `Wishlist.jsx`, wishlist routes/controller/model | Account persisted. |
| Reviews/ratings | Implemented | `ProductDetails.jsx`, review routes/controller/model | One review per user/product; review ownership editing/deletion missing. |
| Admin product CRUD | Implemented | `Admin.jsx`, product routes/controller | Admin UI uses image URL, not media upload. |
| Orders in MongoDB | Partially Implemented | `Order.js`, `orderController.js` | History exists; fulfillment/admin lifecycle is incomplete. |
| Stripe Checkout | Partially Implemented | `paymentController.js`, `Checkout.jsx` | Requires real test keys and webhook; not tested end-to-end here. |
| Payment webhooks | Partially Implemented | `paymentController.js`, `server.js` | Signature verification and states exist; automated retry/reconciliation tests missing. |
| Cloudinary uploads | Prepared | `mediaController.js`, `mediaRoutes.js` | Signed endpoint exists; credentials and admin upload UI are absent. |
| Email notifications | Prepared | `emailService.js`, payment webhook | Resend-compatible order email only; credentials and delivery testing absent. |
| Shipping integration | Prepared | `shippingService.js`, order tracking route | Generic provider adapter; no configured provider or shipment admin flow. |
| Seller collaboration | Partially Implemented | `Partner.jsx`, seller routes/controller/model | Applications are stored and admin status can change; seller catalog ownership is missing. |
| Support/FAQ | Implemented | `Support.jsx` | Static FAQ and email link. |
| Privacy/terms/returns pages | Implemented | `Legal.jsx` | Must receive legal review for the operating jurisdiction. |
| Security headers | Implemented | `server/server.js` | Helmet is installed and mounted. |
| Rate limiting | Implemented | `server/server.js` | Global limit exists; route-specific limits are recommended. |
| Health monitoring | Implemented | `/api/health` | Reports safe integration readiness flags; external uptime monitoring is missing. |
| Deployment | Missing | `DEPLOYMENT.md` | Checklist exists; no deployed environments, HTTPS domain, monitoring, or backup automation. |
| Automated tests | Missing | Repository | No test suite or test command exists. |

## 8. Security Audit

### Strengths

- Environment files are ignored by Git.
- Passwords are hashed with bcrypt.
- Admin product writes are protected server-side.
- Stripe webhook signature verification is present.
- Helmet headers and CORS restrictions are present.
- API rate limiting is present.
- Payment totals and stock checks are server-side.
- Database startup has bounded timeouts.

### Required improvements

- Rotate any credential that may have been exposed during development; never place values in chat, commits, screenshots, or logs.
- Validate `JWT_SECRET`, MongoDB URI, and provider configuration at startup with environment-specific rules.
- Add schema validation for all auth, seller, review, address, and payment request bodies.
- Normalize emails and enforce password length/complexity rules.
- Avoid account-enumeration messages during login.
- Add route-specific rate limits for login, registration, seller applications, reviews, and payment session creation.
- Add CSRF strategy if cookie authentication is introduced.
- Add structured logging with redaction and request IDs.
- Add dependency audit and update policy.
- Add authorization checks for admin/order/refund/tracking operations.
- Add webhook idempotency records and retry-safe processing.
- Add database backups, restore drills, monitoring, and alerting before production.
- Review privacy, terms, returns, seller agreements, tax, and consumer-protection requirements with qualified legal counsel.

## 9. Code Quality

### Positive observations

- Existing functionality was extended incrementally rather than duplicated at the app level.
- Route/controller/model boundaries are understandable.
- Shared Axios configuration avoids repeated API base URLs.
- The root clean-start script addresses stale local processes.
- Client build and lint pass; backend JavaScript syntax checks pass.

### Issues and cleanup opportunities

- `server/controllers/orderController.js` contains an old `createOrder` implementation that is not routed and duplicates payment logic. This is the clearest duplicate functionality and potential maintenance risk.
- `client/src/index.css` still contains Vite starter/theme rules while `App.css` contains the main design system; consolidate carefully later without changing behavior.
- Product fetching, error handling, and loading behavior are repeated across multiple pages; a shared query/data layer could reduce duplication at scale.
- Error responses often expose raw `error.message`; production responses should be generic while logs retain diagnostic details.
- No automated backend tests, API contract tests, webhook fixtures, or component tests exist.
- `createShipment` exists in `shippingService.js` but is not connected to an admin fulfillment action.
- There is no seller/product ownership model despite seller applications.
- Static legal text is not a substitute for jurisdiction-specific legal review.
- Provider adapters assume a generic shipping API shape and should become an explicit provider interface with provider-specific implementations.

## 10. Recommended Architecture

Keep the current client/server split and evolve it without a rewrite.

### Client

- Keep React Router and the shared Axios client.
- Add a small authenticated session layer with `/api/auth/me`, logout, and expiry handling.
- Introduce reusable UI primitives for buttons, forms, alerts, loading states, product cards, status badges, and empty states.
- Add server-side catalog query parameters and pagination.
- Add feature modules for catalog, cart, checkout, orders, account, reviews, wishlist, admin, and seller onboarding.
- Keep payment UI redirect-only; never handle raw card data.

### Server

- Keep route/controller/model boundaries.
- Add request schemas at route boundaries.
- Add a centralized async error wrapper and safe production error formatter.
- Add service modules for payments, inventory, orders, media, notifications, and shipping.
- Add a repository/data-access layer only when query complexity requires it; do not add abstraction for its own sake.
- Use MongoDB transactions for multi-item order creation/reservation where the deployment topology supports them.
- Add durable webhook event/idempotency records.
- Add seller and product ownership fields before enabling multi-vendor catalog operations.

### Operations

- Separate local, staging, and production environment values.
- Deploy client and API separately over HTTPS.
- Use provider dashboards plus `/api/health` for integration readiness.
- Add error monitoring, uptime checks, structured logs, backups, and restore drills.
- Keep secrets in hosting-provider secret stores, never in Git.

## 11. Enhancement Roadmap

1. **Stabilize and clean up**
   - Retire the duplicate unrouted `createOrder` code.
   - Add startup environment validation.
   - Add request schemas and generic production error handling.
   - Add route-specific rate limits.

2. **Test the existing contracts**
   - Add auth, product, order, wishlist, review, seller, and health API tests.
   - Add Stripe webhook fixtures for success, failure, duplicate, and retry events.
   - Add client smoke tests for login, catalog, cart, checkout redirect, and protected routes.

3. **Complete payments**
   - Configure Stripe test credentials and Stripe CLI webhook forwarding.
   - Test successful card, declined card, cancellation, webhook retry, insufficient stock, and abandoned checkout.
   - Add refunds, reconciliation, tax/shipping fees, coupons, and payment admin views.

4. **Complete marketplace operations**
   - Add seller accounts and product ownership.
   - Add seller catalog management and approval workflow.
   - Add admin order management, shipment creation, fulfillment updates, cancellation, and refunds.

5. **Complete customer experience**
   - Add profile, logout, password reset, email verification, addresses, and saved payment-provider customer identity.
   - Add tracking timeline, return request flow, review edit/delete, notifications, and order detail pages.
   - Add server-side search, pagination, facets, recommendations, and analytics events.

6. **Configure providers**
   - Cloudinary/S3 credentials and admin upload UI.
   - Resend/SendGrid/Postmark credentials and verified sending domain.
   - Shipping provider credentials and webhook/event mapping.
   - Stripe production account, tax/refund/reconciliation review.

7. **Stage and launch**
   - Deploy staging client/API with HTTPS.
   - Configure environment variables in hosting secret stores.
   - Configure MongoDB Atlas production access and backups.
   - Add monitoring, alerts, logs, uptime checks, and restore drills.
   - Complete legal, privacy, returns, seller, tax, and consumer-protection review.
   - Run a controlled live payment and fulfillment test before public launch.

## Validation Performed

- Client `npm run build`: passed.
- Client `npm run lint`: passed.
- Backend `node --check` across server JavaScript files: passed.
- MongoDB Atlas connectivity: previously verified successfully after Network Access was corrected.
- API health endpoint: previously returned `200`.
- Product API: previously returned `200` with MongoDB-backed data.
- Git repository: initialized, branch `main`, remote `origin` configured.
- GitHub tracking: local `main` and `origin/main` were aligned at the time of audit.
- `server/.env`: ignored by Git; secret values were not exposed.
- Automated test suite: not available in the repository.
- End-to-end Stripe, Cloudinary, email, and shipping transactions: not claimed as tested because real provider credentials are not configured.

## Final Assessment

The project is a functioning ecommerce MVP foundation with a strong incremental path toward a multi-vendor marketplace. Core browsing, authentication, cart, reviews, wishlist, admin product management, seller applications, payment preparation, and operational integration boundaries exist.

It is not yet production-ready for public commerce because provider credentials, end-to-end payment/webhook testing, seller ownership, fulfillment operations, automated tests, refunds, monitoring, backups, deployment, and legal review remain incomplete. The recommended next step is stabilization and testing, not a frontend or backend rewrite.
