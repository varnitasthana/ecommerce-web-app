# Security Guide

This document outlines the security measures implemented in the ShopEase e-commerce platform.

## Authentication & Authorization

### Password Security
- Passwords are hashed using bcryptjs with salt rounds of 10
- Minimum password length of 8 characters enforced at registration/password reset
- Passwords are never returned in API responses
- Password field is excluded from default Mongoose queries with `select: false`

### JWT Token Management
- JWT Secret must be at least 24 characters long
- Tokens expire after 24 hours
- Tokens are stored in browser localStorage (not httpOnly cookies)
- Future improvement: Implement refresh token rotation strategy

### Rate Limiting
- Authentication endpoints: 5 attempts per 15 minutes per IP
- Checkout endpoints: 10 attempts per minute per IP
- Refund endpoints: 5 attempts per hour per IP
- General API: 100 requests per minute per IP

### Role-Based Access Control
- Roles: customer, seller, admin
- Role changes are admin-only
- Backend authorizes every protected resource
- Frontend route guards are for UX only; server is authoritative

## Data Protection

### Sensitive Data
- Passwords never logged or exposed
- JWT tokens never logged in plain text
- Credit card and bank details handled by Razorpay only (never stored)
- Personal data fields excluded from public API responses

### Input Validation
- All user input is validated before processing
- Email format and uniqueness validated
- Phone numbers validated for minimum length
- Postal codes validated for format
- MongoDB query injection prevented with proper field isolation

### Database Security
- MongoDB connection uses TLS/SSL for Atlas
- Unique indexes on email and SKU prevent duplicates
- Soft-delete pattern for products (deleted flag, not physical deletion)
- Historical order data preserved unchanged

## Payment Security
### Razorpay Integration

- Razorpay API key stored only in server environment variables
- Webhook signature verification using raw request body
- Webhook idempotency check prevents duplicate payment processing
- Razorpay hosted checkout - card/bank details never touch the server
- Stock reservation with transaction rollback on payment failure

### Stock Management
- Stock decrements only after verified payment
- MongoDB transactions ensure atomic operations
- Stock released on payment failure
- Product availability re-verified before stock reservation

## API Security

### CORS
- Only approved origins allowed (configurable via CLIENT_URL)
- Preflight requests validated

### Security Headers (Helmet.js)
- X-Frame-Options: DENY (clickjacking prevention)
- X-Content-Type-Options: nosniff
- X-XSS-Protection enabled
- Strict-Transport-Security (HSTS) for HTTPS
- Content-Security-Policy configured

### Request Size Limits
- JSON payload limit: 1MB
- Prevents memory exhaustion attacks

### Error Handling
- Generic error messages in production
- Stack traces not exposed in API responses
- Detailed error logging server-side only

## Configuration Security

### Environment Variables
- All secrets in .env file (excluded from git)
- .env.example contains keys only (no real values)
- Required secrets validated at startup
- Placeholder values detected and rejected

### Startup Validation
- Mandatory environment variables checked
- Replica set status verified for transaction support
- Integration credentials validated

## Multi-Vendor Security

### Seller Isolation
- Sellers can only access their own products
- Sellers can only view their own orders
- Admin can grant/revoke seller status
- Product ownership verified server-side on mutations

### Order Ownership
- Users can only view/manage their own orders
- Admin can view all orders
- Sellers can only view orders containing their products

## Future Security Improvements

- [ ] Refresh token rotation strategy
- [ ] Email verification workflow
- [ ] Password reset via secure tokens
- [ ] HttpOnly secure cookies for JWT
- [ ] Audit logging for admin actions
- [ ] IP-based login anomaly detection
- [ ] Two-factor authentication (2FA)
- [ ] API key management for integrations
- [ ] PII encryption at rest
- [ ] Automated security dependency scanning
- [ ] Database encryption at rest
- [ ] Request signing for webhook reliability

## Security Testing

### Recommended Testing
- OWASP Top 10 vulnerability assessment
- Penetration testing on payment flow
- SQL injection and NoSQL injection testing
- CSRF and XSS testing
- Rate limit effectiveness testing
- Authentication/authorization bypass testing

### Monitoring
- Implement error tracking (e.g., Sentry)
- Monitor rate limit hits
- Track failed authentication attempts
- Log admin/seller access patterns
