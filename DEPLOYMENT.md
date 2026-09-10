# ShopEase E-commerce Platform - Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment](#post-deployment)
6. [Testing](#testing)
7. [Maintenance](#maintenance)

---

## Overview

This guide covers deploying ShopEase to production across multiple platforms and hosting providers. The application consists of:
- **Backend**: Node.js/Express API server
- **Frontend**: React/Vite SPA
- **Database**: MongoDB
- **Media**: Cloudinary (optional)
- **Payments**: Razorpay/Stripe

---

## Prerequisites

### Required
- Node.js 18+ and npm
- MongoDB 6+ (local or Atlas)
- Git
- Domain name
- SSL certificate

### Recommended
- Docker & Docker Compose
- Nginx or IIS (Windows)
- PM2 or Windows Service for process management
- Redis (for sessions/caching)
- Cloudflare (CDN & DDoS protection)

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/shopease.git
cd shopease
```

### 2. Backend Configuration

Create `server/.env` from `server/.env.example`:

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ecommerce
# For MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secure-random-string-here-minimum-32-chars
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Security
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://yourdomain.com
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Payment Gateways
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook

# Media (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# URLs
CLIENT_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com

# Optional: Redis
REDIS_URL=redis://localhost:6379

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_SELLER_APPLICATIONS=true
ENABLE_REVIEWS=true
ENABLE_NOTIFICATIONS=true
```

### 3. Generate JWT Secret
```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
[System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N")
```

---

## Deployment Options

### Option 1: Docker Deployment (Recommended)

**Requirements**: Docker 20.10+, Docker Compose 2.0+

#### Step 1: Configure Environment
```bash
# Copy environment file
cp server/.env.example server/.env

# Edit with your values
nano server/.env
```

#### Step 2: Deploy with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

#### Step 3: Setup SSL with Let's Encrypt
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

### Option 2: Manual Server Deployment (Linux)

**Recommended for**: AWS EC2, Google Cloud, DigitalOcean, Linode

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Nginx
sudo apt-get install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt-get install -y git
```

#### Step 2: Deploy Application
```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/shopease.git
cd shopease

# Install dependencies
cd server && npm ci --only=production && cd ..
cd client && npm ci && npm run build && cd ..

# Setup environment
sudo cp server/.env.example server/.env
sudo nano server/.env
```

#### Step 3: Configure Nginx
```bash
# Copy nginx config
sudo cp nginx/conf.d/shopease.conf /etc/nginx/sites-available/shopease
sudo ln -s /etc/nginx/sites-available/shopease /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 4: Start Application
```bash
# Start with PM2
cd /var/www/shopease/server
pm2 start server.production.js --name shopease
pm2 save
pm2 startup

# Or use systemd
sudo cp scripts/shopease.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable shopease
sudo systemctl start shopease
```

#### Step 5: Setup SSL
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test renewal
sudo certbot renew --dry-run
```

---

### Option 3: Windows Server Deployment

**Recommended for**: IIS, Windows Server 2019+

#### Step 1: Prepare Server
```powershell
# Install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js
choco install nodejs-lts -y

# Install MongoDB
choco install mongodb -y

# Install IIS
Install-WindowsFeature Web-Server, Web-Asp-Net45
```

#### Step 2: Deploy Application
```powershell
# Run deployment script
cd C:\path\to\shopease
.\scripts\deploy.ps1
```

#### Step 3: Configure IIS
1. Open IIS Manager
2. Add Website:
   - Site name: `shopease`
   - Physical path: `C:\inetpub\wwwroot\shopease\client\dist`
   - Binding: `https` on port 443 with your SSL certificate
3. Add URL Rewrite rule to proxy `/api/*` to `http://localhost:5000`
4. Install URL Rewrite module if not present

---

### Option 4: Cloud Platform Deployment

#### Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel)**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel --prod
```

**Backend (Railway)**:
1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main

#### Netlify (Frontend) + Render (Backend)

**Frontend (Netlify)**:
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
cd client
npm run build
netlify deploy --prod --dir=dist
```

**Backend (Render)**:
1. Connect GitHub repository to Render
2. Configure build command: `npm run build --prefix client && npm ci --prefix server`
3. Set start command: `node server/server.production.js`
4. Add environment variables
5. Deploy

---

### Option 5: AWS Deployment

#### Using AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
cd server
eb init -p node.js-18 shopease-backend

# Create environment
eb create shopease-production

# Deploy
eb deploy

# Setup database
aws rds create-db-instance --db-instance-identifier shopease-db --db-instance-class db.t3.micro --engine mongodb
```

#### Using AWS Amplify (Frontend)
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
cd client
amplify init

# Deploy
amplify add hosting
amplify publish
```

---

### Option 6: Google Cloud Platform

```bash
# Install GCloud CLI
curl https://sdk.cloud.google.com | bash
gcloud init

# Deploy to Cloud Run
cd server
gcloud run deploy shopease-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production

# Deploy frontend to Firebase Hosting
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

---

## Post-Deployment

### 1. Database Setup
```bash
# Connect to MongoDB
mongosh

# Create database and user
use ecommerce
db.createUser({
  user: 'shopease',
  pwd: 'secure-password',
  roles: ['readWrite']
})

# Run seed script (if available)
node scripts/seed.js
```

### 2. Configure Domain & DNS
```
# DNS Records
A     @           your-server-ip
A     www         your-server-ip
CNAME api         your-server-ip
CNAME cdn         cdn.your-provider.com
```

### 3. Security Checklist
- [ ] Change default JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS_ORIGIN
- [ ] Setup firewall rules (ports 80, 443, 22 only)
- [ ] Enable MongoDB authentication
- [ ] Setup fail2ban (Linux)
- [ ] Configure rate limiting
- [ ] Enable Helmet security headers
- [ ] Setup backup schedule
- [ ] Configure monitoring (UptimeRobot, Pingdom)

### 4. Performance Optimization
- [ ] Enable gzip compression (Nginx)
- [ ] Setup CDN (Cloudflare)
- [ ] Configure browser caching
- [ ] Enable database indexing
- [ ] Setup Redis caching
- [ ] Enable PM2 cluster mode

---

## Testing

### 1. Health Check
```bash
curl https://yourdomain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "ecommerce-api",
  "version": "1.0.0",
  "environment": "production",
  "database": { "state": 1, "label": "connected", "healthy": true },
  "integrations": { "payments": true, "media": false, "notifications": false, "shipping": false },
  "uptime": 123.45,
  "timestamp": "2026-09-10T17:00:00.000Z"
}
```

### 2. API Testing
```bash
# Test products API
curl https://yourdomain.com/api/products

# Test search
curl "https://yourdomain.com/api/products?search=phone"

# Test categories
curl https://yourdomain.com/api/categories
```

### 3. Frontend Testing
- [ ] Homepage loads correctly
- [ ] Products page displays products
- [ ] Search functionality works
- [ ] User registration works
- [ ] User login works
- [ ] Add to cart works
- [ ] Checkout process works
- [ ] Order creation works
- [ ] Payment integration works
- [ ] Admin panel accessible
- [ ] Dark mode works
- [ ] Mobile responsive

### 4. Performance Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API performance
ab -n 1000 -c 10 https://yourdomain.com/api/products

# Test frontend load time
lighthouse https://yourdomain.com --view
```

---

## Maintenance

### 1. Backup Strategy
```bash
# Daily MongoDB backup
0 2 * * * mongodump --out=/var/backups/mongodb/$(date +\%Y\%m\%d)

# Weekly full backup
0 2 * * 0 tar -czf /var/backups/shopease-$(date +\%Y\%m\%d).tar.gz /var/www/shopease
```

### 2. Monitoring
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: New Relic, Datadog
- **Errors**: Sentry, LogRocket
- **Analytics**: Google Analytics, Mixpanel

### 3. Updates
```bash
# Pull latest code
cd /var/www/shopease
git pull origin main

# Install dependencies
cd server && npm ci --only=production
cd ../client && npm ci && npm run build

# Restart service
pm2 restart shopease
# or
sudo systemctl restart shopease
```

### 4. Scaling
- **Horizontal**: Add more backend instances behind load balancer
- **Database**: MongoDB Atlas cluster with read replicas
- **Caching**: Redis cluster for sessions and frequent queries
- **CDN**: Cloudflare for static assets
- **Queue**: BullMQ for background jobs (emails, notifications)

---

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check backend service is running: `pm2 status` or `systemctl status shopease`
   - Check logs: `pm2 logs shopease` or `journalctl -u shopease -f`

2. **Database Connection Failed**
   - Verify MongoDB is running: `systemctl status mongod`
   - Check connection string in .env
   - Verify network/firewall settings

3. **SSL Certificate Issues**
   - Renew certificate: `sudo certbot renew`
   - Check certificate: `sudo certbot certificates`
   - Verify Nginx config: `sudo nginx -t`

4. **High Memory Usage**
   - Enable PM2 cluster mode: `pm2 start server.production.js -i max`
   - Increase swap space
   - Upgrade server plan

5. **Slow Performance**
   - Enable database indexing
   - Setup Redis caching
   - Enable CDN
   - Optimize images
   - Enable gzip compression

---

## Support

For deployment issues:
1. Check logs: `/var/log/nginx/error.log` and `server/logs/app.log`
2. Review this guide
3. Check GitHub issues
4. Contact support: support@shopease.com

---

## License

Proprietary - All rights reserved
