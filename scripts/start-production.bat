@echo off
REM ShopEase E-commerce Platform - Windows Production Startup Script

echo.
echo ==========================================
echo ShopEase Production Startup (Windows)
echo ==========================================
echo.

set SERVICE_NAME=shopease-backend
set APP_DIR=%~dp0
set SERVER_DIR=%APP_DIR%server

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is required but not installed. Aborting.
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is required but not installed. Aborting.
    pause
    exit /b 1
)

REM Check if .env exists
if not exist "%SERVER_DIR%\.env" (
    echo [WARNING] .env file not found. Copying from .env.example...
    if exist "%SERVER_DIR%\.env.example" (
        copy "%SERVER_DIR%\.env.example" "%SERVER_DIR%\.env"
        echo [WARNING] Please edit %SERVER_DIR%\.env with your production values
    ) else (
        echo [ERROR] .env.example not found. Cannot create .env file.
        pause
        exit /b 1
    )
)

REM Install dependencies if node_modules doesn't exist
if not exist "%SERVER_DIR%\node_modules" (
    echo [1/4] Installing server dependencies...
    cd /d "%SERVER_DIR%"
    call npm ci --only=production
    echo [OK] Server dependencies installed
) else (
    echo [1/4] Server dependencies already installed
)

if not exist "%APP_DIR%client\node_modules" (
    echo [2/4] Installing client dependencies...
    cd /d "%APP_DIR%client"
    call npm ci
    echo [OK] Client dependencies installed
) else (
    echo [2/4] Client dependencies already installed
)

REM Build client if dist doesn't exist
if not exist "%APP_DIR%client\dist" (
    echo [3/4] Building client...
    cd /d "%APP_DIR%client"
    call npm run build
    echo [OK] Client built successfully
) else (
    echo [3/4] Client build already exists
)

REM Create required directories
echo [4/4] Creating directories...
if not exist "%SERVER_DIR%\uploads" mkdir "%SERVER_DIR%\uploads"
if not exist "%SERVER_DIR%\logs" mkdir "%SERVER_DIR%\logs"
echo [OK] Directories created

echo.
echo ==========================================
echo Starting ShopEase Backend...
echo ==========================================
echo.

cd /d "%SERVER_DIR%"
node server.production.js

pause
