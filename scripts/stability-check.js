#!/usr/bin/env node

/**
 * 🚨 SYSTEM STABILIZATION VALIDATOR
 * 
 * Command-line tool to validate system stability during the crisis response.
 * Run this script to check if the system is ready for production deployment.
 * 
 * Usage:
 *   npm run stability-check
 *   node scripts/stability-check.js
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(color, text) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(color, message));
}

function printHeader() {
  console.log();
  log('═'.repeat(70), 'cyan');
  log('🚨 FINANZAS PYME VISION - SYSTEM STABILIZATION VALIDATOR', 'cyan');
  log('═'.repeat(70), 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'blue');
  log('═'.repeat(70), 'cyan');
  console.log();
}

function checkCodeFreezeStatus() {
  log('📋 CHECKING CODE FREEZE STATUS...', 'yellow');
  
  try {
    const statusFile = path.join(process.cwd(), 'SYSTEM_STABILIZATION_STATUS.md');
    const content = readFileSync(statusFile, 'utf8');
    
    if (content.includes('CODE FREEZE ACTIVE')) {
      log('✅ Code freeze is active', 'green');
      return true;
    } else {
      log('⚠️ Code freeze status unclear', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Could not read stabilization status file', 'red');
    return false;
  }
}

function runTests() {
  log('🧪 RUNNING TEST SUITE...', 'yellow');
  
  try {
    const testOutput = execSync('npm test', { 
      encoding: 'utf8',
      timeout: 120000 // 2 minutes timeout
    });
    
    // Parse test results
    const lines = testOutput.split('\n');
    const summaryLine = lines.find(line => line.includes('Test Files') && line.includes('Tests'));
    
    if (summaryLine) {
      log(`✅ ${summaryLine.trim()}`, 'green');
    } else {
      log('✅ Tests completed successfully', 'green');
    }
    
    return true;
  } catch (error) {
    log('❌ Test suite failed', 'red');
    log(error.stdout || error.message, 'red');
    return false;
  }
}

function buildApplication() {
  log('🏗️ BUILDING APPLICATION...', 'yellow');
  
  try {
    const buildOutput = execSync('npm run build', { 
      encoding: 'utf8',
      timeout: 300000 // 5 minutes timeout
    });
    
    if (buildOutput.includes('✓ built in')) {
      log('✅ Build completed successfully', 'green');
      return true;
    } else {
      log('⚠️ Build completed with warnings', 'yellow');
      return true;
    }
  } catch (error) {
    log('❌ Build failed', 'red');
    log(error.stdout || error.message, 'red');
    return false;
  }
}

function checkEnvironmentConfig() {
  log('⚙️ CHECKING ENVIRONMENT CONFIGURATION...', 'yellow');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  let allConfigured = true;
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      log(`❌ Missing environment variable: ${varName}`, 'red');
      allConfigured = false;
    } else {
      log(`✅ ${varName} is configured`, 'green');
    }
  }
  
  // Check for production-specific settings
  if (process.env.NODE_ENV === 'production') {
    if (process.env.VITE_DEBUG_MODE === 'true') {
      log('⚠️ Debug mode enabled in production', 'yellow');
    } else {
      log('✅ Debug mode properly disabled for production', 'green');
    }
  }
  
  return allConfigured;
}

function checkCriticalFiles() {
  log('📁 CHECKING CRITICAL FILES...', 'yellow');
  
  const criticalFiles = [
    'src/contexts/AuthContext.tsx',
    'src/types/auth.ts',
    'src/hooks/useInactivityDetection.ts',
    'src/utils/systemHealthCheck.ts',
    'src/utils/codeFreeze.ts',
    'src/utils/productionStabilityValidator.ts'
  ];
  
  let allPresent = true;
  
  for (const filePath of criticalFiles) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      readFileSync(fullPath, 'utf8');
      log(`✅ ${filePath}`, 'green');
    } catch (error) {
      log(`❌ Missing: ${filePath}`, 'red');
      allPresent = false;
    }
  }
  
  return allPresent;
}

function generateStabilityReport(results) {
  console.log();
  log('═'.repeat(70), 'cyan');
  log('📊 SYSTEM STABILITY REPORT', 'cyan');
  log('═'.repeat(70), 'cyan');
  
  const checks = [
    { name: 'Code Freeze Status', result: results.codeFreezeActive },
    { name: 'Test Suite', result: results.testsPass },
    { name: 'Build Success', result: results.buildSuccess },
    { name: 'Environment Config', result: results.envConfigured },
    { name: 'Critical Files', result: results.filesPresent }
  ];
  
  checks.forEach(check => {
    const status = check.result ? '✅ PASS' : '❌ FAIL';
    const color = check.result ? 'green' : 'red';
    log(`${check.name.padEnd(20)} ${status}`, color);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  
  console.log();
  log('═'.repeat(70), 'cyan');
  
  if (allPassed) {
    log('🎉 SYSTEM STABLE - READY FOR PRODUCTION', 'green');
    log('All stability checks passed. System is ready for deployment.', 'green');
  } else {
    log('🚨 SYSTEM UNSTABLE - NOT READY FOR PRODUCTION', 'red');
    log('Critical issues detected. Resolve all failures before deployment.', 'red');
  }
  
  log('═'.repeat(70), 'cyan');
  console.log();
  
  return allPassed;
}

function main() {
  printHeader();
  
  const results = {
    codeFreezeActive: checkCodeFreezeStatus(),
    testsPass: runTests(),
    buildSuccess: buildApplication(),
    envConfigured: checkEnvironmentConfig(),
    filesPresent: checkCriticalFiles()
  };
  
  const isStable = generateStabilityReport(results);
  
  // Exit with appropriate code
  process.exit(isStable ? 0 : 1);
}

// Run the stability check
main();