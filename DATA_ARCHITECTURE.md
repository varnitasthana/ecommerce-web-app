# ShopEase Data Architecture

## Where marketplace data lives

ShopEase stores application data in MongoDB through Mongoose models under `server/models`.
The active connection is configured by `server/.env` using `MONGO_URI`. The development seed command writes only deterministic demo records to that configured development database.

| Data | Model | Ownership / key fields |
|---|---|---|
| Customers, sellers, admins | `User` | `email`, `role`, `password` hash, account status |
| Products | `Product` | `seller`, `category`, `brand`, `sku`, `stock`, `price` |
| Reviews | `Review` | `product`, `user`, rating and comment |
| Wishlists | `Wishlist` | one document per `user`, product references |
| Orders | `Order` | `user`, product snapshots, totals, payment and fulfilment state |
| Addresses | `Address` | customer-owned shipping/profile addresses |
| Seller applications | `SellerApplication` | applicant, brand/category, application status |
| Verification/session tokens | `Token` | hashed/opaque token records with expiry |

Categories and brands are currently stored as validated string values on `Product`; they are not separate collections yet.

## Demo data

Run from the repository root:

```bash
npm --prefix server run seed
```

The seed creates demo-only users, sellers, customers, products, and reviews. It never prints passwords or secrets. Reset is guarded by both `NODE_ENV=development` and `SEED_ALLOW_RESET=true`.

## Authentication and credentials

1. Registration receives a password over HTTPS in production.
2. `authController` hashes it with `bcryptjs` before saving it to `User.password`.
3. The password field uses `select: false`, so normal user queries do not return it.
4. Login compares the submitted password with the bcrypt hash.
5. The server signs a short-lived JWT containing the user id and role.
6. The client stores the token and public user profile in browser `localStorage`.
7. The Axios interceptor sends the token as `Authorization: Bearer ...`.
8. The auth middleware verifies the JWT and reloads the user from MongoDB on every protected request.
9. Logout removes the browser token and cached public profile.

Production hardening recommendation: move the browser token to secure, httpOnly, same-site cookies when the deployment architecture supports CSRF protection and cookie-based sessions.

## Where to get seller/customer/product data

- Admins can manage products through `/admin` and `/api/products`.
- Sellers can manage only their own products through `/seller` and `/api/sellers/products`.
- Customers browse `/products` and `/api/products`.
- Customers create orders through `/api/orders` or the Stripe checkout flow.
- Admin overview metrics are available at `/api/admin/overview` and are restricted to admins.

External payment, media, email, and shipping data is not stored as credentials in MongoDB. Those services are configured through environment variables and should use provider dashboards and secret managers in production.
