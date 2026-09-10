#!/bin/bash

# ShopEase E-commerce Platform - Linux Production Deployment Script
set -e

echo ""
echo "=========================================="
echo "ShopEase Production Deployment (Linux)"
echo "=========================================="
echo ""

APP_NAME="shopease"
APP_DIR="/opt/shopease"
SERVICE_USER="www-data"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Check prerequisites
echo "[1/7] Checking prerequisites..." -e "\033[33m"
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || echo "  Docker not found (optional for manual deployment)"
command -v docker-compose >/dev/null 2>&1 || echo "  Docker Compose not found (optional)"
echo "  ✓ Prerequisites check complete" -e "\033[32m"

# Create directories
echo "[2/7] Creating directories..." -e "\033[33m"
sudo mkdir -p $APP_DIR
sudo mkdir -p $APP_DIR/uploads
sudo mkdir -p $APP_DIR/logs
sudo mkdir -p $APP_DIR/nginx/conf.d
sudo mkdir -p $APP_DIR/nginx/ssl
sudo chown -R $USER:$USER $APP_DIR
echo "  ✓ Directories created" -e "\033[32m"

# Copy files
echo "[3/7] Copying application files..." -e "\033[33m"
cp -r ./* $APP_DIR/
echo "  ✓ Files copied" -e "\033[32m"

# Install dependencies
echo "[4/7] Installing dependencies..." -e "\033[33m"
cd $APP_DIR/server
npm ci --only=production
cd $APP_DIR/client
npm ci
echo "  ✓ Dependencies installed" -e "\033[32m"

# Build client
echo "[5/7] Building client..." -e "\033[33m"
cd $APP_DIR/client
npm run build
echo "  ✓ Client built successfully" -e "\033[32m"

# Setup environment
echo "[6/7] Setting up environment..." -e "\033[33m"
if [ ! -f "$APP_DIR/server/.env" ]; then
  if [ -f "$APP_DIR/server/.env.example" ]; then
    cp $APP_DIR/server/.env.example $APP_DIR/server/.env
    echo "  ⚠ Created .env file from .env.example" -e "\033[33m"
    echo "  ⚠ Please edit $APP_DIR/server/.env with your production values" -e "\033[33m"
  else
    echo "  ✗ .env.example not found" -e "\033[31m"
  fi
else
  echo "  ✓ Environment file exists" -e "\033[32m"
fi

# Setup systemd service
echo "[7/7] Setting up systemd service..." -e "\033[33m"
sudo tee /etc/systemd/system/shopease.service > /dev/null <<EOF
[Unit]
Description=ShopEase Backend
After=network.target mongodb.service
Requires=mongodb.service

[Service]
Type=simple
WorkingDirectory=$APP_DIR/server
ExecStart=/usr/bin/node server.production.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/server/.env
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable shopease
sudo systemctl start shopease

echo "  ✓ Service installed and started" -e "\033[32m"

echo ""
echo "==========================================" -e "\033[32m"
echo "Deployment Complete!" -e "\033[32m"
echo "==========================================" -e "\033[32m"
echo ""
echo "Application URL: http://your-domain.com" -e "\033[36m"
echo "API URL: http://your-domain.com/api" -e "\033[36m"
echo "Health Check: http://your-domain.com/health" -e "\033[36m"
echo "Admin Panel: http://your-domain.com/admin" -e "\033[36m"
echo ""
echo "Next steps:" -e "\033[33m"
echo "1. Edit $APP_DIR/server/.env with your production values" -e "\033[37m"
echo "2. Configure nginx reverse proxy (see nginx/conf.d/default.conf)" -e "\033[37m"
echo "3. Setup SSL certificate with Let's Encrypt:" -e "\033[37m"
echo "   sudo certbot --nginx -d your-domain.com -d www.your-domain.com" -e "\033[37m"
echo "4. Configure firewall:" -e "\033[37m"
echo "   sudo ufw allow 80/tcp" -e "\033[37m"
echo "   sudo ufw allow 443/tcp" -e "\033[37m"
echo "   sudo ufw enable" -e "\033[37m"
echo ""
echo "Useful commands:" -e "\033[33m"
echo "  sudo systemctl status shopease" -e "\033[37m"
echo "  sudo systemctl restart shopease" -e "\033[37m"
echo "  sudo journalctl -u shopease -f" -e "\033[37m"
echo ""
