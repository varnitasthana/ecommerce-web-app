# Architecture

This document describes the current architecture after the Phase 1 maintainability pass. The project remains the existing React/Express application; no working feature was rewritten or duplicated.

## Frontend Architecture

The frontend is a React 19 + Vite single-page application in `client/`.

```text
client/src/
├── services/
│   └── api.js              Shared Axios client and auth interceptor
├── pages/                  Route-level screens and page-specific UI
├── App.jsx                 Router, shared shell, protected routes, cart state
├── App.css                 Application visual system
├── index.css               Existing global/Vite styles
├── api.js                  Compatibility re-export for older imports
└── main.jsx                React entry point
```

### Responsibilities

- `pages/`: screen composition and page-specific interactions.
- `services/`: browser-side external communication. The Axios client owns the API base URL and attaches the JWT bearer token.
- `App.jsx`: application composition, route protection, shared navigation/footer, and cart state. It should remain focused on composition rather than API business logic.
- `App.css`: shared visual language and responsive layout.
- `api.js`: temporary compatibility entry point. New imports should use `services/api.js`; it delegates to the single implementation and does not create another client.

A future expansion can add `components/`, `layouts/`, `hooks/`, `context/`, and `utils/` when repeated behavior justifies them. They are intentionally not empty folders today.

## Backend Architecture

The backend is an Express 5 REST API in `server/` using CommonJS and Mongoose.

```text
server/
├── config/
│   ├── db.js                 MongoDB connection
│   └── integrations.js       Provider readiness and required-provider checks
├── controllers/              HTTP request orchestration
├── middleware/
│   ├── authMiddleware.js     JWT and role authorization
│   └── errorHandler.js       404 and centralized error responses
├── models/                   Mongoose schemas and persistence shape
├── routes/                   URL/method mapping and middleware composition
├── services/
│   ├── emailService.js       Resend-compatible email adapter
│   └── shippingService.js    Shipping provider adapter
├── validators/
│   └── productValidator.js   Product request validation
└── server.js                 Composition root and process lifecycle
```

### Responsibilities

- `routes/`: declare endpoint paths, HTTP methods, and access middleware. Routes should not contain business logic.
- `controllers/`: translate HTTP input into service/model operations and choose response status codes. They should not own reusable provider implementations.
- `services/`: isolate Stripe, email, shipping, media, and other external systems from HTTP routes and database schema details.
- `models/`: define MongoDB documents, constraints, indexes, and relationships.
- `middleware/`: cross-cutting HTTP behavior such as authentication, authorization, parsing errors, not-found responses, and production error formatting.
- `validators/`: request shape and domain input rules that can be reused by controllers and future tests.
- `config/`: environment-backed configuration and infrastructure connection setup.
- `server.js`: composition root only: load configuration, mount middleware/routes, start after MongoDB, and handle shutdown.

## Request Flow

A normal browser API request follows this path:

```text
React page
  ↓
services/api.js (Axios base URL + JWT interceptor)
  ↓
Express middleware (CORS, Helmet, rate limit, JSON parsing)
  ↓
Route definition
  ↓
Auth/role middleware when required
  ↓
Controller
  ↓
Validator and/or service/model
  ↓
MongoDB or external provider
  ↑
Controller response
  ↑
Axios response to React
```

Unknown routes pass through `middleware/errorHandler.js`. Unexpected errors are logged server-side and return a generic production response.

## Authentication Flow

1. A user submits registration or login from a React page.
2. The page calls the shared Axios service.
3. The auth controller validates credentials, hashes/compares passwords with bcrypt, and signs a one-day JWT.
4. The client stores the token and user display data in `localStorage`.
5. The Axios request interceptor adds `Authorization: Bearer <token>` to later requests.
6. `authMiddleware.js` verifies the token and attaches the authenticated identity to `req.user`.
7. `adminOnly` checks the server-side role for admin operations.
8. Frontend route guards improve user experience, but server authorization remains authoritative.

Future auth work should add logout/session invalidation, `/me`, password reset, email verification, stronger request validation, and refresh-token strategy.

## Database Flow

Mongoose models define the persistence contract:

- `User`: account identity and role.
- `Product`: catalog, pricing, stock, rating, and delivery metadata.
- `Order`: user-owned historical line items, shipping address, payment/fulfilment state, and tracking fields.
- `Review`: user/product rating and text, with a unique user/product index.
- `Wishlist`: one saved-product collection per user.
- `SellerApplication`: public partner application and review status.

Controllers use models for reads/writes. Order line items copy product name and price so historical orders do not change when a catalog product changes.

The current checkout reserves stock with conditional product updates before creating a Stripe session. Multi-item checkout transactions, abandoned-session cleanup, migrations, and seller/product ownership are future hardening work.

## Payment Flow

1. Checkout sends product IDs, quantities, and a shipping address.
2. The payment controller loads products from MongoDB and ignores browser prices.
3. Stock is conditionally reserved.
4. A `pending_payment` order is created with the server-calculated total.
5. Stripe-hosted Checkout is created with order metadata.
6. The browser redirects to Stripe and never handles raw card details.
7. Stripe sends a signed webhook to `/api/payments/webhook`.
8. The webhook verifies the signature using the raw request body.
9. A paid event changes the order to `confirmed`/`paid`; failure or expiry releases stock.
10. A confirmation email is attempted through the email service.

Stripe keys are environment-only. Placeholder values are reported as unconfigured by `config/integrations.js`. No browser success page is trusted as payment proof.

## External Services

### Stripe

Implemented behind `controllers/paymentController.js` and `routes/paymentRoutes.js`. Requires real test/live keys and a configured webhook secret. Refunds, reconciliation, and automated webhook tests remain future work.

### Cloudinary

`controllers/mediaController.js` and `routes/mediaRoutes.js` issue admin-only signed upload parameters. The admin UI still needs a file-upload control and the provider credentials must be configured.

### Email

`services/emailService.js` uses a Resend-compatible HTTP API. It currently sends an order confirmation after a verified payment webhook. Email credentials and a verified sending domain are required.

### Shipping

`services/shippingService.js` defines shipment creation and tracking adapter operations. Customer tracking is scoped to the order owner, but admin shipment creation and a provider-specific event/webhook mapping are not yet implemented.

## Error and Response Handling

- `middleware/errorHandler.js` owns not-found and fallback error responses.
- Controllers return feature-specific validation and authorization errors.
- Provider services throw errors with status metadata for configuration failures.
- Unexpected server errors are logged without returning raw implementation details.
- The frontend uses Axios response errors for user-facing messages.

The next improvement should be a shared request-schema layer for auth, addresses, reviews, seller applications, and payment input, followed by automated API tests.

## Configuration and Secrets

- Runtime configuration lives in `server/.env`.
- Variable names are documented in `server/.env.example`; it contains no real credentials.
- Root `.gitignore` excludes `.env`, `node_modules/`, build output, and `.DS_Store`.
- `server/.env` was verified as ignored by Git.
- Production deployment should use the hosting provider's secret store and a separate staging environment.

## Architectural Decisions

- Keep the existing client/server split.
- Keep route/controller/model boundaries.
- Add services only for reusable external integrations.
- Add validators where request rules are reused or security-sensitive.
- Preserve `client/src/api.js` as a compatibility re-export while all current pages use `client/src/services/api.js`.
- Avoid empty architectural folders and speculative abstractions until repeated behavior requires them.

## Phase 1 Scope

Completed in this phase:

- Centralized frontend Axios implementation under `client/src/services`.
- Preserved the old API import path through a compatibility re-export.
- Moved product validation into `server/validators`.
- Moved centralized 404/error handling into `server/middleware`.
- Preserved existing routes, controllers, models, services, pages, and API behavior.
- Documented request flow, ownership boundaries, integrations, configuration, and future architecture.

This phase does not add a new product feature. The next phase should be reviewed and approved before implementation.

## Authentication Architecture

Phase 2 keeps JWT authentication but centralizes its responsibilities:

- `validators/authValidator.js` validates and normalizes registration/login input.
- `models/User.js` defaults new accounts to `customer`, excludes password hashes from normal queries, and temporarily accepts legacy `user` records for compatibility.
- `controllers/authController.js` handles registration/login and returns safe user data only.
- `controllers/userController.js` provides `/api/auth/me` and admin-only role changes.
- `middleware/authMiddleware.js` provides `authenticateUser`, `authorizeRoles`, `protect`, `adminOnly`, and `sellerOnly`.
- `context/AuthContext.jsx` owns frontend session restoration, login, loading state, and logout.
- `context/useAuth.js` exposes the hook without mixing Fast Refresh component and hook exports.

### Role model

- `customer`: shopping, cart, wishlist, reviews, checkout, and personal orders.
- `seller`: seller workspace and seller-owned resources after promotion.
- `admin`: product management, seller management, and user role management.

The backend is authoritative. Frontend route guards and hidden navigation are usability features only.

### Protected route strategy

Axios attaches the JWT to requests. The backend verifies the token, loads the current user from MongoDB, and applies role middleware. Missing/invalid credentials return `401`; authenticated users without permission return `403`.

### Security considerations

Passwords are bcrypt-hashed and excluded by default from Mongoose results. Emails are normalized, login failures are generic, authentication endpoints are rate-limited, JWT configuration is validated at startup, and role changes are restricted to admins. Logout clears the current browser session; server-side token revocation remains a future session-management milestone.
