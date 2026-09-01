# CI/CD Pipeline Documentation

## GitHub Actions Workflows

### Recommended Configuration

Create `.github/workflows/ci-cd.yml` in the repository:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm --prefix client ci && npm --prefix client run lint
      - run: node -c server/server.js

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm --prefix client ci && npm --prefix client run build

  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:5
        options: --health-cmd mongosh --health-interval 10s
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm --prefix server ci && npm --prefix server test

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm --prefix client audit --audit-level=moderate
      - run: npm --prefix server audit --audit-level=moderate
```

## Local Development Workflow

### Prerequisites
```bash
node --version  # v18 or higher
npm --version   # v9 or higher
git --version   # Latest
```

### Setup
```bash
git clone https://github.com/varnitasthana/ecommerce-web-app.git
cd ecommerce-web-app
npm install  # Installs both client and server dependencies
cp server/.env.example server/.env
# Edit server/.env with your configuration
```

### Development
```bash
npm run dev          # Run both client and server
npm run dev:clean    # Clean and restart
npm --prefix client run dev    # Client only
npm --prefix server run dev    # Server only
```

### Pre-commit Checks
```bash
npm --prefix client run lint   # Check for linting errors
npm --prefix client run build  # Verify build succeeds
node -c server/server.js       # Check server syntax
```

## Deployment Checklist

### Before Merging to Main
- [ ] All tests passing
- [ ] No linting errors
- [ ] No security vulnerabilities
- [ ] Test coverage above 50%
- [ ] Documentation updated
- [ ] No sensitive data in code
- [ ] No breaking API changes

### Before Production Deployment
- [ ] Staging deployment successful
- [ ] Smoke tests passed
- [ ] Performance baseline met
- [ ] Database backups verified
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] All environment variables set
- [ ] API keys and secrets rotated

## Environments

### Local Development
- URL: `http://localhost:5173` (frontend)
- API: `http://localhost:5000/api`
- Database: MongoDB local or Atlas dev

### Staging
- URL: `https://staging.example.com`
- API: `https://api-staging.example.com`
- Database: MongoDB Atlas staging
- Stripe: Test mode keys

### Production
- URL: `https://example.com`
- API: `https://api.example.com`
- Database: MongoDB Atlas production
- Stripe: Live mode keys

## Environment Variables

### server/.env
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommerce
JWT_SECRET=your-secret-key-at-least-24-characters
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=inr
CLIENT_URL=http://localhost:5173
```

### .env for Staging/Production
All variables same as above, with appropriate:
- MONGO_URI pointing to staging/production database
- STRIPE_SECRET_KEY using staging/production keys
- CLIENT_URL for the deployed frontend
- NODE_ENV=production

## Monitoring & Observability

### Recommended Tools
- Error tracking: Sentry
- Performance monitoring: New Relic or DataDog
- Log aggregation: CloudWatch or ELK
- Uptime monitoring: Pingdom or StatusPage

### Health Checks
```bash
curl https://api.example.com/api/health
```

Response:
```json
{
  "status": "ok",
  "service": "ecommerce-api",
  "integrations": {
    "payments": true,
    "media": true,
    "notifications": true,
    "shipping": false
  },
  "timestamp": "2026-09-01T..."
}
```

## Rollback Procedure

1. **Immediate Rollback**
   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Database Migration Rollback**
   - MongoDB: Restore from backup snapshot
   - Stripe: Use Stripe's test mode for verification

3. **Communication**
   - Notify customer support team
   - Update status page
   - Notify affected customers

## Performance Targets

- API response time: < 200ms (p95)
- Homepage load: < 2s (on 4G)
- Search results: < 500ms
- Checkout completion: < 1s
- Database query: < 50ms (p95)

## Security Scanning

- SAST (Static Application Security Testing)
- DAST (Dynamic Application Security Testing)
- Dependency scanning (npm audit)
- Code review (2+ approvals)
- Staging testing before production
