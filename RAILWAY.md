# Deploying ShopEase to Railway

Railway is the fastest way to get ShopEase live. This guide covers backend + frontend on Railway, using either Railway's MongoDB addon or MongoDB Atlas.

## Prerequisites

- GitHub account
- Railway account (free tier available)
- MongoDB Atlas cluster OR Railway MongoDB plugin
- Razorpay test/live keys (optional but recommended)

## Step 1: Push to GitHub

Make sure your code is pushed to a GitHub repository:

```bash
git remote -v
git push origin main
```

## Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your ShopEase repository
6. Choose the branch to deploy (usually `main`)

## Step 3: Configure Build Settings

Railway should auto-detect the `Dockerfile` in the repo root. Verify:
- **Build Command**: auto
- **Publish Directory**: auto
- **Port**: Railway will set `PORT` automatically

If Railway asks for a start command, use:
```
node server/server.production.js
```

## Step 4: Add MongoDB

### Option A: Railway MongoDB Plugin (Recommended)

1. In your Railway project, click **"New"** → **"Database"** → **"MongoDB"**
2. Railway will provision a MongoDB instance
3. Copy the **MongoDB connection string** (it will look like `mongodb://mongo:...@railway.app:27017/...`)

### Option B: MongoDB Atlas

1. Create a cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Whitelist `0.0.0.0/0` (or Railway's IPs) in Atlas Network Access
3. Create a database user
4. Copy the connection string

## Step 5: Set Environment Variables

In Railway, go to your service → **"Variables"** tab and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `MONGO_URI` | Your MongoDB connection string | From Step 4 |
| `MONGO_DB` | `ecommerce` | Database name |
| `JWT_SECRET` | Generate a secure 32+ char string | Use `openssl rand -hex 32` |
| `RAZORPAY_KEY_ID` | Your Razorpay key ID | Optional |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret | Optional |
| `RAZORPAY_WEBHOOK_SECRET` | Your webhook secret | Optional |
| `CLIENT_URL` | `https://your-app.up.railway.app` | Update after first deploy |
| `RATE_LIMIT_WINDOW` | `15` | Optional |
| `RATE_LIMIT_MAX` | `100` | Optional |

### Generate JWT Secret

```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
[System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N")
```

## Step 6: Deploy

1. Railway will automatically build and deploy when you push to GitHub
2. Monitor the build logs in Railway dashboard
3. First deploy takes 3-5 minutes (Docker build)

## Step 7: Verify Deployment

Once deployed, Railway provides a public URL like:
```
https://shopease-production.up.railway.app
```

Test these endpoints:
```bash
# Health check
curl https://your-app.up.railway.app/health

# API check
curl https://your-app.up.railway.app/api/products
```

## Step 8: Add Custom Domain (Optional)

1. In Railway, go to **"Settings"** → **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `shop.yourdomain.com`)
4. Railway will provide DNS records to add to your domain registrar
5. SSL certificate is automatically provisioned by Railway

### DNS Records

Add these to your domain's DNS settings:

| Type | Name | Value |
|------|------|-------|
| A | @ | Railway's IP (shown in dashboard) |
| CNAME | www | your-app.up.railway.app |

Or use Railway's nameservers for automatic SSL.

## Step 9: Update CLIENT_URL

After your first deploy:
1. Get your Railway URL from the dashboard
2. Update the `CLIENT_URL` environment variable in Railway
3. Redeploy if necessary

## Step 10: Seed Database (Optional)

To add demo products and users:

```bash
# Railway CLI required
npm install -g @railway/cli
railway login
railway link
railway run npm run seed
```

Or use the Railway dashboard's shell feature:
1. Go to your service → **"Deployments"** → **"Shell"**
2. Run: `npm run seed`

## Troubleshooting

### Build Fails

- Check build logs in Railway dashboard
- Ensure `Dockerfile` is in repo root
- Verify `client/package.json` has `build` script

### Database Connection Issues

- Verify `MONGO_URI` is correct
- Check MongoDB Atlas IP whitelist includes Railway
- For Railway MongoDB, use the internal connection string

### App Crashes on Startup

- Check `NODE_ENV=production` is set
- Verify `PORT` is not hardcoded (Railway sets it dynamically)
- Review logs in Railway dashboard

### CORS Errors

- Update `CLIENT_URL` to match your Railway domain
- Redeploy after changing environment variables

## Cost Estimate

Railway pricing (as of 2024):
- **Hobby Plan**: $5/month free credits
- **Pro Plan**: $20/month per service
- **MongoDB Plugin**: ~$5-10/month depending on usage

Typical ShopEase deployment:
- Backend service: ~$5-10/month
- MongoDB addon: ~$5/month
- **Total**: ~$10-15/month

## Advantages of Railway

- ✅ Zero-config Docker deployment
- ✅ Automatic HTTPS
- ✅ Custom domains included
- ✅ Built-in MongoDB plugin
- ✅ Automatic deploys from GitHub
- ✅ Environment variable management
- ✅ Logs and monitoring dashboard
- ✅ No server management needed

## Next Steps

1. ✅ Deploy backend
2. ✅ Setup MongoDB
3. ✅ Configure environment variables
4. ✅ Test all features
5. ✅ Add custom domain
6. ✅ Setup payment webhooks in Razorpay dashboard
7. ✅ Configure email service (Resend/SendGrid)
8. ✅ Setup monitoring and alerts

---

For additional support, see the main [DEPLOYMENT.md](./DEPLOYMENT.md).
