#!/usr/bin/env node

/**
 * ShopEase Deployment Verification Script
 * Checks if the application is ready for production deployment
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function check(description, fn) {
  try {
    const result = fn();
    if (result === true) {
      console.log(`  ✓ ${description}`);
      checks.passed++;
    } else if (result === 'warning') {
      console.log(`  ⚠ ${description}`);
      checks.warnings++;
    } else {
      console.log(`  ✗ ${description}`);
      checks.failed++;
    }
  } catch (error) {
    console.log(`  ✗ ${description}: ${error.message}`);
    checks.failed++;
  }
}

console.log('');
console.log('==========================================');
console.log('ShopEase Deployment Verification');
console.log('==========================================');
console.log('');

// Check Node.js
check('Node.js is installed', () => {
  const version = process.version;
  const major = parseInt(version.split('.')[0].replace('v', ''));
  return major >= 18 ? true : `Node.js ${version} found, but v18+ required`;
});

// Check npm
check('npm is installed', () => {
  try {
    const { execSync } = require('child_process');
    const version = execSync('npm --version').toString().trim();
    return true;
  } catch {
    return false;
  }
});

// Check server directory
check('Server directory exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'server'));
});

// Check client directory
check('Client directory exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'client'));
});

// Check server package.json
check('Server package.json exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'server', 'package.json'));
});

// Check client package.json
check('Client package.json exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'client', 'package.json'));
});

// Check server .env file
check('Server .env file exists', () => {
  const envPath = path.join(__dirname, '..', 'server', '.env');
  if (!fs.existsSync(envPath)) return 'warning';
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasJWTSecret = envContent.includes('JWT_SECRET=') && !envContent.includes('JWT_SECRET=your-');
  const hasMongoURI = (envContent.includes('MONGODB_URI=') || envContent.includes('MONGO_URI=')) && 
                      !envContent.includes('MONGODB_URI=mongodb://localhost') &&
                      !envContent.includes('MONGO_URI=mongodb://localhost');
  
  if (!hasJWTSecret) return 'JWT_SECRET not configured';
  if (!hasMongoURI) return 'MongoDB URI not configured for production';
  
  return true;
});

// Check node_modules
check('Server node_modules installed', () => {
  return fs.existsSync(path.join(__dirname, '..', 'server', 'node_modules'));
});

check('Client node_modules installed', () => {
  return fs.existsSync(path.join(__dirname, '..', 'client', 'node_modules'));
});

// Check client build
check('Client build exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

// Check uploads directory
check('Uploads directory exists', () => {
  const uploadsDir = path.join(__dirname, '..', 'server', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    return 'warning';
  }
  return true;
});

// Check logs directory
check('Logs directory exists', () => {
  const logsDir = path.join(__dirname, '..', 'server', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    return 'warning';
  }
  return true;
});

// Summary
console.log('');
console.log('==========================================');
console.log('Verification Summary');
console.log('==========================================');
console.log(`  Passed: ${checks.passed}`);
console.log(`  Warnings: ${checks.warnings}`);
console.log(`  Failed: ${checks.failed}`);
console.log('');

if (checks.failed > 0) {
  console.log('❌ Deployment verification failed. Please fix the issues above.');
  process.exit(1);
} else if (checks.warnings > 0) {
  console.log('⚠️  Deployment verification passed with warnings. Review warnings above.');
  process.exit(0);
} else {
  console.log('✅ All checks passed! Application is ready for deployment.');
  process.exit(0);
}
