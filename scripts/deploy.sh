#!/bin/bash

# ShopEase E-commerce Platform - Production Deployment Script
# This script deploys the application to production

set -e

echo "=========================================="
echo "ShopEase Production Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="shopease"
APP_DIR="/var/www/shopease"
BACKUP_DIR="/var/backups/shopease"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

# Function to print colored output
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}→ $1${NC}"
}

# Step 1: Check prerequisites
print_info "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }
command -v nginx >/dev/null 2>&1 || { print_error "Nginx is required but not installed. Aborting."; exit 1; }
command -v mongod >/dev/null 2>&1 || { print_error "MongoDB is required but not installed. Aborting."; exit 1; }
print_success "All prerequisites installed"

# Step 2: Create application directory
print_info "Creating application directory..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/uploads
mkdir -p $APP_DIR/logs
mkdir -p $BACKUP_DIR
print_success "Directories created"

# Step 3: Pull latest code
print_info "Pulling latest code..."
if [ -d "$APP_DIR/.git" ]; then
  cd $APP_DIR
  git pull origin main
else
  # First time deployment
  if [ -d "server" ] && [ -d "client" ]; then
    # Copy current directory
    cp -r . $APP_DIR/
  else
    print_error "Application files not found. Please ensure you're running this from the project root."
    exit 1
  fi
fi
print_success "Code updated"

# Step 4: Install dependencies
print_info "Installing server dependencies..."
cd $APP_DIR/server
npm ci --only=production
print_success "Server dependencies installed"

print_info "Installing client dependencies..."
cd $APP_DIR/client
npm ci
print_success "Client dependencies installed"

# Step 5: Build client
print_info "Building client for production..."
cd $APP_DIR/client
npm run build
print_success "Client built successfully"

# Step 6: Environment configuration
print_info "Setting up environment configuration..."
if [ ! -f "$APP_DIR/server/.env" ]; then
  if [ -f "$APP_DIR/server/.env.example" ]; then
    cp $APP_DIR/server/.env.example $APP_DIR/server/.env
    print_info "Created .env file from .env.example"
    print_error "Please edit $APP_DIR/server/.env with your production values"
  else
    print_error ".env.example not found. Please create .env file manually."
    exit 1
  fi
else
  print_success "Environment file exists"
fi

# Step 7: Database backup
print_info "Creating database backup..."
mongodump --out=$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S) || print_error "Backup failed"
print_success "Database backed up"

# Step 8: Run database migrations/seeding
print_info "Running database setup..."
cd $APP_DIR/server
node scripts/setup-db.js || print_error "Database setup failed"
print_success "Database ready"

# Step 9: Set permissions
print_info "Setting permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
chmod -R 777 $APP_DIR/uploads
chmod -R 755 $APP_DIR/logs
print_success "Permissions set"

# Step 10: Setup systemd service
print_info "Setting up systemd service..."
cat > /etc/systemd/system/shopease.service << EOF
[Unit]
Description=ShopEase E-commerce Backend
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR/server
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/server/.env
ExecStart=/usr/bin/node server.production.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=shopease

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable shopease
print_success "Systemd service configured"

# Step 11: Setup Nginx
print_info "Configuring Nginx..."
if [ -f "$APP_DIR/nginx/conf.d/shopease.conf" ]; then
  cp $APP_DIR/nginx/conf.d/shopease.conf /etc/nginx/sites-available/shopease
  ln -sf /etc/nginx/sites-available/shopease /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  print_success "Nginx configured"
else
  print_error "Nginx configuration not found"
fi

# Step 12: Start services
print_info "Starting services..."
systemctl start shopease
systemctl enable shopease
systemctl restart nginx
print_success "Services started"

# Step 13: Setup SSL (Let's Encrypt)
print_info "Setting up SSL certificate..."
if command -v certbot >/dev/null 2>&1; then
  read -p "Do you want to setup SSL with Let's Encrypt? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your domain name: " domain
    certbot --nginx -d $domain -d www.$domain
    print_success "SSL certificate configured"
  fi
else
  print_info "Certbot not installed. Please install and run: certbot --nginx -d yourdomain.com"
fi

# Step 14: Setup firewall
print_info "Configuring firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable || true
print_success "Firewall configured"

# Step 15: Final checks
print_info "Running final checks..."
sleep 5
if curl -f http://localhost:5000/health >/dev/null 2>&1; then
  print_success "Backend health check passed"
else
  print_error "Backend health check failed"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Application URL: https://yourdomain.com"
echo "API URL: https://yourdomain.com/api"
echo "Admin Panel: https://yourdomain.com/admin"
echo ""
echo "Next steps:"
echo "1. Edit server/.env with your production values"
echo "2. Update domain name in nginx configuration"
echo "3. Setup SSL certificate with certbot"
echo "4. Configure monitoring and backups"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status shopease   # Check backend status"
echo "  sudo systemctl restart shopease  # Restart backend"
echo "  sudo systemctl status nginx      # Check nginx status"
echo "  tail -f $APP_DIR/logs/app.log    # View logs"
echo ""
