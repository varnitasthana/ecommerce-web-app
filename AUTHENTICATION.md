# Authentication

ShopEase keeps the existing JWT authentication architecture and hardens it with server-side identity lookup, input validation, role authorization, session restoration, and safe logout.

## 1. Registration Flow

1. The React registration page submits name, email, and password through `client/src/services/api.js`.
2. The server normalizes the email to lowercase and validates required fields, email format, and minimum password length.
3. Duplicate emails return `409` without creating another account.
4. The password is hashed with bcrypt before persistence.
5. New users receive the `customer` role by default.
6. The response returns only a user ID and success message; it never returns the password or hash.

## 2. Login Flow

1. The React login page submits email and password.
2. The server normalizes the email and validates the request.
3. The password hash is selected explicitly for comparison; the User model excludes password by default from queries.
4. Valid credentials receive a JWT that expires after one day.
5. Invalid email and invalid password use the same `401 Invalid email or password` response to avoid account enumeration.
6. Authentication endpoints have a focused rate limit in addition to the global API limit.

## 3. JWT Flow

- The signing secret comes only from `server/.env` through `JWT_SECRET`.
- Startup fails if `MONGO_URI` or `JWT_SECRET` is missing/placeholder-like, or if the JWT secret is shorter than 24 characters.
- The JWT contains only the user ID and role needed for initial authentication.
- Tokens expire after one day.
- The browser stores the token in `localStorage` according to the existing application architecture.
- The browser never receives the JWT secret.
- A future production hardening step may move to secure, httpOnly cookies and refresh-token rotation after the deployment threat model is reviewed.

## 4. Protected API Flow

1. Axios reads the browser token and adds `Authorization: Bearer <token>`.
2. `server/middleware/authMiddleware.js` validates the header format.
3. `jwt.verify` rejects malformed, invalid, and expired tokens with `401`.
4. The middleware loads the current user from MongoDB and attaches a safe identity to `req.user`.
5. If the user was deleted or disabled in the future, the token will no longer authorize requests.
6. Controllers receive the authenticated identity without duplicating JWT verification.

## 5. Role-Based Authorization

`authorizeRoles(...roles)` is the reusable server middleware. It returns:

- `401` when no valid authentication exists.
- `403` when a valid user lacks the required role.

`adminOnly` is `authorizeRoles("admin")`. `sellerOnly` allows `seller` and `admin` for shared seller tooling.

The frontend hides navigation and redirects unauthorized users for usability, but the backend enforces every protected resource independently.

## 6. Customer Role

New accounts are customers by default. Customers can:

- Browse products
- Manage cart and wishlist
- Submit reviews
- Checkout
- View their own orders

Customers cannot call admin product mutation, user-role management, or seller-only endpoints.

Legacy accounts with the old `user` role are treated as `customer` in authenticated request context and safe responses. The legacy enum value remains temporarily supported so existing records do not break during migration.

## 7. Seller Role

A seller is promoted only through the admin-only role endpoint:

```text
PATCH /api/users/:id/role
{ "role": "seller" }
```

Sellers can access the protected seller application view:

```text
GET /api/sellers/my-applications
```

The seller dashboard is intentionally narrow until product ownership and seller catalog boundaries are implemented. Seller A must not be allowed to modify Seller B's resources; future seller product APIs must filter every query by seller ownership.

## 8. Admin Role

Only an authenticated admin can change user roles or mutate products. The server checks the current database-backed role, so changing a browser's `localStorage` or manually calling an API cannot grant access.

Admin capabilities currently include product CRUD and seller application review. User management is limited to role changes in this phase; broader admin operations should be added with separate authorization tests.

## 9. Error Handling

Authentication responses use stable status meanings:

- `400`: malformed or incomplete request.
- `401`: missing, invalid, expired, or unauthenticated credential.
- `403`: authenticated but not authorized for the resource.
- `409`: duplicate email or conflicting account resource.
- `500`: unexpected server failure; internal details are logged server-side, not returned.

## 10. Security Considerations

- Passwords are never stored or returned in plaintext.
- The password field has `select: false`; login explicitly opts into it only for bcrypt comparison.
- Safe user projections expose only ID, name, email, and normalized role.
- JWT secrets and provider credentials stay in ignored environment files.
- Auth endpoints are rate-limited.
- Email matching is normalized to lowercase.
- Role changes are server-only and admin-protected.
- Admins cannot remove their own admin access through the role endpoint.
- Logout removes local authentication data and resets the React auth state. JWTs are stateless; immediate server-side revocation is a future session-management enhancement.

## 11. Environment Variables Required

The authentication layer requires:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=replace_with_a_long_random_secret_at_least_24_characters
```

These names belong in `server/.env.example`; actual values belong only in the local/deployment secret store. Never commit `server/.env`.

## Validation

Phase 2 validation covered:

- Valid registration
- Weak password rejection
- Duplicate email rejection
- Generic wrong-password response
- Authenticated `/auth/me`
- Unauthenticated admin request
- Customer-to-admin rejection
- Customer-to-seller rejection
- Frontend build and lint
- Backend syntax checks
