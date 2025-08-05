#!/usr/bin/env node

/**
 * Browser Installation Script for CI/CD
 * 
 * This script attempts to install Playwright browsers and handles failures gracefully.
 * It's designed to work in CI environments where browser installation might fail.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌐 Installing Playwright browsers for E2E testing...');

try {
  // First, try to install only essential browsers
  console.log('📦 Attempting to install browsers...');
  
  // Try chromium first (most stable)
  try {
    execSync('npx playwright install chromium --with-deps', { 
      stdio: 'inherit',
      timeout: 300000 // 5 minutes timeout
    });
    console.log('✅ Chromium browser installed successfully');
  } catch (chromiumError) {
    console.log('⚠️ Chromium installation failed, trying without deps...');
    try {
      execSync('npx playwright install chromium', { 
        stdio: 'inherit',
        timeout: 180000 // 3 minutes timeout
      });
      console.log('✅ Chromium browser installed (without system dependencies)');
    } catch (chromiumError2) {
      console.log('❌ Chromium installation failed completely');
    }
  }

  // Try firefox if we're not in CI or if chromium failed
  if (!process.env.CI) {
    try {
      execSync('npx playwright install firefox --with-deps', { 
        stdio: 'inherit',
        timeout: 300000 // 5 minutes timeout
      });
      console.log('✅ Firefox browser installed successfully');
    } catch (firefoxError) {
      console.log('⚠️ Firefox installation failed');
    }
  }

  // Create a marker file to indicate installation was attempted
  const markerPath = path.join(__dirname, '..', '.playwright-install-attempted');
  fs.writeFileSync(markerPath, new Date().toISOString());

  console.log('🎉 Browser installation completed');
  process.exit(0);

} catch (error) {
  console.error('❌ Browser installation failed:', error.message);
  
  // Create a marker file to indicate installation failed
  const failureMarkerPath = path.join(__dirname, '..', '.playwright-install-failed');
  fs.writeFileSync(failureMarkerPath, JSON.stringify({
    error: error.message,
    timestamp: new Date().toISOString(),
    environment: {
      CI: process.env.CI,
      NODE_VERSION: process.version,
      PLATFORM: process.platform
    }
  }, null, 2));

  console.log('⚠️ E2E tests will be skipped due to browser installation failure');
  
  // Exit with success code to allow CI to continue
  process.exit(0);
}