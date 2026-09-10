# ShopEase E-commerce Platform - Windows Production Deployment Script
# This script deploys the application to production on Windows

param(
    [switch]$SkipBackup,
    [switch]$SkipBuild,
    [switch]$SkipService
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ShopEase Production Deployment (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$APP_NAME = "shopease"
$APP_DIR = "C:\inetpub\wwwroot\shopease"
$BACKUP_DIR = "C:\backups\shopease"
$SERVICE_NAME = "shopease-backend"

# Check prerequisites
Write-Host "[1/8] Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "  Node.js: $nodeVersion"
Write-Host "  npm: $npmVersion"

if (-not (Get-Command mongod -ErrorAction SilentlyContinue)) {
    Write-Host "  MongoDB: Not found (warning)" -ForegroundColor Yellow
} else {
    $mongoVersion = mongod --version
    Write-Host "  MongoDB: Found"
}

Write-Host "  ✓ Prerequisites check complete" -ForegroundColor Green

# Create directories
Write-Host "[2/8] Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $APP_DIR | Out-Null
New-Item -ItemType Directory -Force -Path "$APP_DIR\uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "$APP_DIR\logs" | Out-Null
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null
Write-Host "  ✓ Directories created" -ForegroundColor Green

# Backup current deployment
if (-not $SkipBackup) {
    Write-Host "[3/8] Creating backup..." -ForegroundColor Yellow
    if (Test-Path $APP_DIR) {
        $backupPath = Join-Path $BACKUP_DIR "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item -Path $APP_DIR -Destination $backupPath -Recurse -Force
        Write-Host "  ✓ Backup created at $backupPath" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ No existing deployment to backup" -ForegroundColor Yellow
    }
} else {
    Write-Host "[3/8] Skipping backup..." -ForegroundColor Yellow
}

# Copy application files
Write-Host "[4/8] Copying application files..." -ForegroundColor Yellow
$sourceDir = Get-Location
Copy-Item -Path "$sourceDir\*" -Destination $APP_DIR -Recurse -Force
Write-Host "  ✓ Files copied" -ForegroundColor Green

# Install dependencies
Write-Host "[5/8] Installing dependencies..." -ForegroundColor Yellow
Set-Location "$APP_DIR\server"
npm ci --only=production
Set-Location "$APP_DIR\client"
npm ci
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

# Build client
if (-not $SkipBuild) {
    Write-Host "[6/8] Building client..." -ForegroundColor Yellow
    Set-Location "$APP_DIR\client"
    npm run build
    Write-Host "  ✓ Client built successfully" -ForegroundColor Green
} else {
    Write-Host "[6/8] Skipping build..." -ForegroundColor Yellow
}

# Setup environment
Write-Host "[7/8] Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path "$APP_DIR\server\.env")) {
    if (Test-Path "$APP_DIR\server\.env.example") {
        Copy-Item "$APP_DIR\server\.env.example" "$APP_DIR\server\.env"
        Write-Host "  ⚠ Created .env file from .env.example" -ForegroundColor Yellow
        Write-Host "  ⚠ Please edit $APP_DIR\server\.env with your production values" -ForegroundColor Yellow
    } else {
        Write-Host "  ✗ .env.example not found" -ForegroundColor Red
    }
} else {
    Write-Host "  ✓ Environment file exists" -ForegroundColor Green
}

# Install and start service
if (-not $SkipService) {
    Write-Host "[8/8] Setting up Windows Service..." -ForegroundColor Yellow
    
    # Check if running as administrator
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host "  ✗ Please run as Administrator" -ForegroundColor Red
        exit 1
    }
    
    # Install NSSM (Non-Sucking Service Manager) if not present
    $nssmPath = "C:\nssm\nssm.exe"
    if (-not (Test-Path $nssmPath)) {
        Write-Host "  Installing NSSM..."
        $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
        $nssmZip = "$env:TEMP\nssm.zip"
        Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip
        Expand-Archive -Path $nssmZip -DestinationPath "C:\nssm" -Force
        Write-Host "  ✓ NSSM installed" -ForegroundColor Green
    }
    
    # Install service
    & $nssmPath install $SERVICE_NAME "node" "C:\inetpub\wwwroot\shopease\server\server.production.js"
    & $nssmPath set $SERVICE_NAME AppDirectory "C:\inetpub\wwwroot\shopease\server"
    & $nssmPath set $SERVICE_NAME DisplayName "ShopEase Backend"
    & $nssmPath set $SERVICE_NAME Start SERVICE_AUTO_START
    & $nssmPath set $SERVICE_NAME AppEnvironmentExtra "NODE_ENV=production"
    
    Start-Service $SERVICE_NAME
    Write-Host "  ✓ Service installed and started" -ForegroundColor Green
} else {
    Write-Host "[8/8] Skipping service setup..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Application URL: http://yourdomain.com" -ForegroundColor Cyan
Write-Host "API URL: http://yourdomain.com/api" -ForegroundColor Cyan
Write-Host "Admin Panel: http://yourdomain.com/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit $APP_DIR\server\.env with your production values" -ForegroundColor White
Write-Host "2. Configure IIS/NGINX as reverse proxy" -ForegroundColor White
Write-Host "3. Setup SSL certificate" -ForegroundColor White
Write-Host "4. Configure firewall rules" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  Get-Service $SERVICE_NAME                    # Check service status" -ForegroundColor White
Write-Host "  Restart-Service $SERVICE_NAME                # Restart service" -ForegroundColor White
Write-Host "  Get-Content $APP_DIR\logs\app.log -Wait      # View logs" -ForegroundColor White
Write-Host ""
