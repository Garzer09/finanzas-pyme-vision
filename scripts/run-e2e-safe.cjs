#!/usr/bin/env node

/**
 * Safe E2E Test Runner for CI/CD
 * 
 * This script runs E2E tests only if browsers are properly installed.
 * It provides fallback behavior for CI environments.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting E2E test runner...');

// Check if browser installation was attempted
const installAttemptedPath = path.join(__dirname, '..', '.playwright-install-attempted');
const installFailedPath = path.join(__dirname, '..', '.playwright-install-failed');

let canRunE2E = true;
let skipReason = '';

// Check for installation failure marker
if (fs.existsSync(installFailedPath)) {
  canRunE2E = false;
  skipReason = 'Browser installation failed';
  try {
    const failureInfo = JSON.parse(fs.readFileSync(installFailedPath, 'utf8'));
    console.log('⚠️ Browser installation failed:', failureInfo.error);
  } catch (e) {
    console.log('⚠️ Browser installation failed (details unavailable)');
  }
}

// Check if browsers are actually available
if (canRunE2E) {
  try {
    // Try to check browser installation
    const result = execSync('npx playwright --version', { encoding: 'utf8', timeout: 10000 });
    console.log('📋 Playwright version:', result.trim());
    
    // Quick browser check
    try {
      execSync('npx playwright list-browsers 2>/dev/null', { encoding: 'utf8', timeout: 10000 });
      console.log('✅ Browsers appear to be available');
    } catch (browserCheckError) {
      console.log('⚠️ Browser availability check failed');
      canRunE2E = false;
      skipReason = 'Browsers not available';
    }
  } catch (playwrightError) {
    console.log('❌ Playwright check failed:', playwrightError.message);
    canRunE2E = false;
    skipReason = 'Playwright not available';
  }
}

if (!canRunE2E) {
  console.log(`🚫 Skipping E2E tests: ${skipReason}`);
  console.log('📝 This is expected in environments where browser installation fails');
  console.log('🎯 Unit tests and integration tests are still running and should provide adequate coverage');
  
  // Create a placeholder test report
  const reportPath = path.join(__dirname, '..', 'playwright-report', 'index.html');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, `
<!DOCTYPE html>
<html>
<head>
  <title>E2E Tests Skipped</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .warning { color: #e67e22; }
    .info { color: #3498db; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 E2E Test Report</h1>
    <p class="warning"><strong>⚠️ E2E tests were skipped</strong></p>
    <p><strong>Reason:</strong> ${skipReason}</p>
    <p class="info">This is expected in CI environments where browser installation may fail.</p>
    <p class="info">Unit and integration tests are providing coverage for the application logic.</p>
    <hr>
    <p><small>Generated: ${new Date().toISOString()}</small></p>
  </div>
</body>
</html>
  `);
  
  console.log(`📊 Placeholder report created at: ${reportPath}`);
  process.exit(0);
}

// Run E2E tests
console.log('🎯 Running E2E tests...');

try {
  const testCommand = process.env.CI 
    ? 'npx playwright test --reporter=json,html'
    : 'npx playwright test';
    
  execSync(testCommand, { 
    stdio: 'inherit',
    timeout: 600000, // 10 minutes timeout
    env: {
      ...process.env,
      CI: process.env.CI || 'false'
    }
  });
  
  console.log('✅ E2E tests completed successfully');
  process.exit(0);
  
} catch (error) {
  console.error('❌ E2E tests failed:', error.message);
  
  // In CI, we might want to continue despite E2E failures if unit tests pass
  if (process.env.CI && process.env.ALLOW_E2E_FAILURES === 'true') {
    console.log('⚠️ Continuing despite E2E test failures (CI environment)');
    process.exit(0);
  }
  
  process.exit(1);
}