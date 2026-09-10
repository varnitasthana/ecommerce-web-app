# ShopEase - E-Commerce Platform

A full-featured e-commerce marketplace supporting buyers, sellers, and admins.

## Features

- Product catalog with search, filters, and recommendations
- Cart, checkout, and order tracking
- Razorpay payments and Cash on Delivery
- Wishlist, compare, and Q&A
- Seller and admin dashboards
- Returns, coupons, and notifications
- Dark mode and mobile-first responsive UI

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Payments**: Razorpay
- **Hosting**: Docker-ready, Railway-ready

## Quick Start

```bash
# Server
cd server
cp .env.example .env
npm install
npm run dev

# Client
cd client
npm install
npm run dev
```

## Deploy to Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for all options.

### Railway (Recommended)

See [RAILWAY.md](./RAILWAY.md) for one-click Railway deployment.

### Docker

```bash
docker-compose up -d
```

## License

Proprietary
