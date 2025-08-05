#!/usr/bin/env node

/**
 * 🔐 Authentication Tests Validator
 * 
 * Specialized validation script for authentication-related tests.
 * Validates authentication flows, session management, and security.
 */

import { execSync } from 'child_process';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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
  log('═'.repeat(60), 'cyan');
  log('🔐 AUTHENTICATION TESTS VALIDATOR', 'cyan');
  log('═'.repeat(60), 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'blue');
  console.log();
}

function runAuthTests() {
  log('🧪 RUNNING AUTHENTICATION TESTS...', 'yellow');
  
  const authTestPatterns = [
    'src/components/__tests__/auth-flow.test.ts',
    'src/components/__tests__/optimized-auth.test.tsx',
    'src/components/__tests__/integration-auth.test.ts',
    'src/components/__tests__/require-auth*.test.tsx',
    'src/utils/__tests__/authHelpers.test.ts',
    'src/types/__tests__/auth.test.ts'
  ];
  
  let allPassed = true;
  const results = [];
  
  for (const pattern of authTestPatterns) {
    try {
      log(`  Testing: ${pattern}`, 'blue');
      const output = execSync(`npm test ${pattern}`, { 
        encoding: 'utf8',
        timeout: 60000,
        env: { ...process.env, CI: 'true' }
      });
      
      log(`  ✅ ${pattern} - PASSED`, 'green');
      results.push({ pattern, status: 'PASSED', output });
    } catch (error) {
      log(`  ❌ ${pattern} - FAILED`, 'red');
      results.push({ pattern, status: 'FAILED', error: error.message });
      allPassed = false;
    }
  }
  
  return { allPassed, results };
}

function runSessionManagementTests() {
  log('📱 RUNNING SESSION MANAGEMENT TESTS...', 'yellow');
  
  try {
    const output = execSync('npm test src/components/__tests__/session-management.test.ts', {
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, CI: 'true' }
    });
    
    log('  ✅ Session management tests - PASSED', 'green');
    return { passed: true, output };
  } catch (error) {
    log('  ❌ Session management tests - FAILED', 'red');
    return { passed: false, error: error.message };
  }
}

function runRoleDetectionTests() {
  log('👤 RUNNING ROLE DETECTION TESTS...', 'yellow');
  
  try {
    const output = execSync('npm test src/components/__tests__/role-detection.test.ts', {
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, CI: 'true' }
    });
    
    log('  ✅ Role detection tests - PASSED', 'green');
    return { passed: true, output };
  } catch (error) {
    log('  ❌ Role detection tests - FAILED', 'red');
    return { passed: false, error: error.message };
  }
}

function runSecurityValidationTests() {
  log('🛡️ RUNNING SECURITY VALIDATION TESTS...', 'yellow');
  
  try {
    const output = execSync('npm test src/components/__tests__/security-validation.test.ts', {
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, CI: 'true' }
    });
    
    log('  ✅ Security validation tests - PASSED', 'green');
    return { passed: true, output };
  } catch (error) {
    log('  ❌ Security validation tests - FAILED', 'red');
    return { passed: false, error: error.message };
  }
}

function runProductionSecurityTests() {
  log('🔒 RUNNING PRODUCTION SECURITY TESTS...', 'yellow');
  
  try {
    const output = execSync('npm test src/services/__tests__/production-security.test.ts', {
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, CI: 'true' }
    });
    
    log('  ✅ Production security tests - PASSED', 'green');
    return { passed: true, output };
  } catch (error) {
    log('  ❌ Production security tests - FAILED', 'red');
    return { passed: false, error: error.message };
  }
}

function generateReport(results) {
  console.log();
  log('═'.repeat(60), 'cyan');
  log('📊 AUTHENTICATION TESTS REPORT', 'cyan');
  log('═'.repeat(60), 'cyan');
  
  const categories = [
    { name: 'Authentication Flows', result: results.authTests.allPassed },
    { name: 'Session Management', result: results.sessionTests.passed },
    { name: 'Role Detection', result: results.roleTests.passed },
    { name: 'Security Validation', result: results.securityTests.passed },
    { name: 'Production Security', result: results.prodSecurityTests.passed }
  ];
  
  categories.forEach(category => {
    const status = category.result ? '✅ PASS' : '❌ FAIL';
    const color = category.result ? 'green' : 'red';
    log(`  ${category.name.padEnd(25)} ${status}`, color);
  });
  
  const totalPassed = categories.filter(c => c.result).length;
  const totalTests = categories.length;
  
  console.log();
  log('═'.repeat(60), 'cyan');
  log(`📊 SUMMARY: ${totalPassed}/${totalTests} test categories passed`, totalPassed === totalTests ? 'green' : 'yellow');
  
  if (totalPassed === totalTests) {
    log('🎉 ALL AUTHENTICATION TESTS PASSED', 'green');
    log('Authentication system is ready for production.', 'green');
  } else {
    log('🚨 AUTHENTICATION TESTS FAILED', 'red');
    log(`${totalTests - totalPassed} test categories failed. Review and fix issues.`, 'red');
  }
  
  log('═'.repeat(60), 'cyan');
  console.log();
  
  return totalPassed === totalTests;
}

function main() {
  printHeader();
  
  const results = {
    authTests: runAuthTests(),
    sessionTests: runSessionManagementTests(),
    roleTests: runRoleDetectionTests(),
    securityTests: runSecurityValidationTests(),
    prodSecurityTests: runProductionSecurityTests()
  };
  
  const allPassed = generateReport(results);
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run the authentication tests validation
main();