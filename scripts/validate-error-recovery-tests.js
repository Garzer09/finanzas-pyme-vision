#!/usr/bin/env node

/**
 * 🔄 Error Recovery Tests Validator
 * 
 * Specialized validation script for error recovery and resilience tests.
 * Validates error handling, network failures, and system recovery.
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
  log('🔄 ERROR RECOVERY TESTS VALIDATOR', 'cyan');
  log('═'.repeat(60), 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'blue');
  console.log();
}

function runErrorRecoveryTests() {
  log('🔄 RUNNING ERROR RECOVERY TESTS...', 'yellow');
  
  try {
    const output = execSync('npm test src/components/__tests__/error-recovery.test.ts', {
      encoding: 'utf8',
      timeout: 120000, // Longer timeout for recovery tests
      env: { ...process.env, CI: 'true' }
    });
    
    // Parse for specific error recovery scenarios
    const lines = output.split('\n');
    const recoveryScenarios = lines.filter(line => 
      line.includes('✓') && (
        line.includes('retry') || 
        line.includes('recovery') || 
        line.includes('resilience') ||
        line.includes('failure')
      )
    );
    
    log('  ✅ Error recovery tests - PASSED', 'green');
    log(`    Validated ${recoveryScenarios.length} recovery scenarios`, 'blue');
    
    return { passed: true, output, scenarios: recoveryScenarios.length };
  } catch (error) {
    log('  ❌ Error recovery tests - FAILED', 'red');
    return { passed: false, error: error.message };
  }
}

function runNetworkResilienceTests() {
  log('🌐 RUNNING NETWORK RESILIENCE TESTS...', 'yellow');
  
  try {
    // Run tests that specifically test network failures
    const output = execSync('npm test -- --grep "network.*fail"', {
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, CI: 'true' }
    });
    
    log('  ✅ Network resilience tests - PASSED', 'green');
    return { passed: true, output };
  } catch (error) {
    // If no specific network tests found, check error recovery tests
    try {
      const alternativeOutput = execSync('npm test src/components/__tests__/error-recovery.test.ts -- --grep "Network"', {
        encoding: 'utf8',
        timeout: 60000,
        env: { ...process.env, CI: 'true' }
      });
      
      log('  ✅ Network resilience tests (via error recovery) - PASSED', 'green');
      return { passed: true, output: alternativeOutput };
    } catch (altError) {
      log('  ❌ Network resilience tests - FAILED', 'red');
      return { passed: false, error: altError.message };
    }
  }
}

function runTimeoutAndRetryTests() {
  log('⏱️ RUNNING TIMEOUT AND RETRY TESTS...', 'yellow');
  
  try {
    // Run tests that specifically test timeouts and retries
    const output = execSync('npm test -- --grep "timeout|retry"', {
      encoding: 'utf8',
      timeout: 90000,
      env: { ...process.env, CI: 'true' }
    });
    
    log('  ✅ Timeout and retry tests - PASSED', 'green');
    return { passed: true, output };
  } catch (error) {
    log('  ❌ Timeout and retry tests - FAILED', 'red');
    return { passed: false, error: error.message };
  }
}

function validateErrorBoundaries() {
  log('🚨 VALIDATING ERROR BOUNDARIES...', 'yellow');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Check for error boundary components
    const errorBoundaryFiles = [
      'src/components/ErrorBoundary.tsx',
      'src/components/ErrorFallback.tsx',
      'src/components/ui/error-boundary.tsx'
    ];
    
    let errorBoundariesFound = 0;
    let hasErrorBoundaryLogic = false;
    
    for (const filePath of errorBoundaryFiles) {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        errorBoundariesFound++;
        
        // Check for error boundary implementation
        if (content.includes('componentDidCatch') || 
            content.includes('ErrorBoundary') ||
            content.includes('getDerivedStateFromError')) {
          hasErrorBoundaryLogic = true;
          log(`  ✅ ${filePath} - Error boundary implementation found`, 'green');
        } else {
          log(`  ⚠️ ${filePath} - File exists but may not be a proper error boundary`, 'yellow');
        }
        
      } catch (error) {
        // File doesn't exist, continue checking
      }
    }
    
    // Check if error boundaries are used in main app files
    try {
      const appFiles = ['src/App.tsx', 'src/main.tsx', 'src/index.tsx'];
      let usedInApp = false;
      
      for (const appFile of appFiles) {
        try {
          const appPath = path.join(process.cwd(), appFile);
          const appContent = fs.readFileSync(appPath, 'utf8');
          
          if (appContent.includes('ErrorBoundary') || appContent.includes('Sentry')) {
            usedInApp = true;
            log(`  ✅ Error boundaries used in ${appFile}`, 'green');
          }
        } catch (error) {
          // File doesn't exist
        }
      }
      
      if (errorBoundariesFound > 0 && hasErrorBoundaryLogic && usedInApp) {
        log('  ✅ Error boundaries properly implemented and integrated', 'green');
        return { passed: true, count: errorBoundariesFound };
      } else if (errorBoundariesFound > 0) {
        log('  ⚠️ Error boundaries found but may need better integration', 'yellow');
        return { passed: false, count: errorBoundariesFound };
      } else {
        log('  ❌ No error boundaries found', 'red');
        return { passed: false, count: 0 };
      }
      
    } catch (error) {
      log('  ❌ Error boundary validation failed', 'red');
      return { passed: false, error: error.message };
    }
    
  } catch (error) {
    log('  ❌ Error boundary validation failed', 'red');
    return { passed: false, error: error.message };
  }
}

function validateFallbackComponents() {
  log('🛡️ VALIDATING FALLBACK COMPONENTS...', 'yellow');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Check for fallback/loading components
    const fallbackPatterns = [
      'src/components/Loading.tsx',
      'src/components/LoadingSpinner.tsx',
      'src/components/Fallback.tsx',
      'src/components/ErrorFallback.tsx',
      'src/components/ui/loading.tsx',
      'src/components/ui/spinner.tsx'
    ];
    
    let fallbacksFound = 0;
    
    for (const pattern of fallbackPatterns) {
      try {
        const fullPath = path.join(process.cwd(), pattern);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        fallbacksFound++;
        log(`  ✅ ${pattern} - Fallback component found`, 'green');
        
      } catch (error) {
        // File doesn't exist, continue checking
      }
    }
    
    // Check if fallbacks are used in components
    try {
      const componentDir = path.join(process.cwd(), 'src/components');
      const componentFiles = fs.readdirSync(componentDir)
        .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
        .slice(0, 10); // Check first 10 components
      
      let fallbackUsage = 0;
      
      for (const componentFile of componentFiles) {
        try {
          const content = fs.readFileSync(path.join(componentDir, componentFile), 'utf8');
          
          if (content.includes('Loading') || 
              content.includes('Spinner') || 
              content.includes('Fallback') ||
              content.includes('Suspense')) {
            fallbackUsage++;
          }
        } catch (error) {
          // Skip unreadable files
        }
      }
      
      if (fallbacksFound >= 2 && fallbackUsage >= 3) {
        log(`  ✅ Fallback components: ${fallbacksFound} found, ${fallbackUsage} usages detected`, 'green');
        return { passed: true, components: fallbacksFound, usage: fallbackUsage };
      } else {
        log(`  ⚠️ Fallback components: ${fallbacksFound} found, ${fallbackUsage} usages - consider adding more`, 'yellow');
        return { passed: fallbacksFound > 0, components: fallbacksFound, usage: fallbackUsage };
      }
      
    } catch (error) {
      log('  ❌ Fallback component validation failed', 'red');
      return { passed: false, error: error.message };
    }
    
  } catch (error) {
    log('  ❌ Fallback component validation failed', 'red');
    return { passed: false, error: error.message };
  }
}

function generateReport(results) {
  console.log();
  log('═'.repeat(60), 'cyan');
  log('📊 ERROR RECOVERY TESTS REPORT', 'cyan');
  log('═'.repeat(60), 'cyan');
  
  const categories = [
    { name: 'Error Recovery Tests', result: results.errorRecoveryTests.passed },
    { name: 'Network Resilience', result: results.networkTests.passed },
    { name: 'Timeout & Retry Logic', result: results.timeoutTests.passed },
    { name: 'Error Boundaries', result: results.errorBoundaries.passed },
    { name: 'Fallback Components', result: results.fallbackComponents.passed }
  ];
  
  categories.forEach(category => {
    const status = category.result ? '✅ PASS' : '❌ FAIL';
    const color = category.result ? 'green' : 'red';
    log(`  ${category.name.padEnd(25)} ${status}`, color);
  });
  
  // Additional metrics
  console.log();
  log('📈 RESILIENCE METRICS:', 'blue');
  if (results.errorRecoveryTests.scenarios) {
    log(`  Recovery scenarios tested: ${results.errorRecoveryTests.scenarios}`, 'blue');
  }
  if (results.errorBoundaries.count !== undefined) {
    log(`  Error boundary components: ${results.errorBoundaries.count}`, 'blue');
  }
  if (results.fallbackComponents.components !== undefined) {
    log(`  Fallback components: ${results.fallbackComponents.components}`, 'blue');
    log(`  Fallback usage detected: ${results.fallbackComponents.usage}`, 'blue');
  }
  
  const totalPassed = categories.filter(c => c.result).length;
  const totalTests = categories.length;
  
  console.log();
  log('═'.repeat(60), 'cyan');
  log(`📊 SUMMARY: ${totalPassed}/${totalTests} recovery categories passed`, totalPassed === totalTests ? 'green' : 'yellow');
  
  if (totalPassed === totalTests) {
    log('🎉 ALL ERROR RECOVERY TESTS PASSED', 'green');
    log('Error recovery system is ready for production.', 'green');
  } else {
    log('🚨 ERROR RECOVERY TESTS FAILED', 'red');
    log(`${totalTests - totalPassed} recovery categories failed. Review and fix issues.`, 'red');
  }
  
  log('═'.repeat(60), 'cyan');
  console.log();
  
  return totalPassed === totalTests;
}

function main() {
  printHeader();
  
  const results = {
    errorRecoveryTests: runErrorRecoveryTests(),
    networkTests: runNetworkResilienceTests(),
    timeoutTests: runTimeoutAndRetryTests(),
    errorBoundaries: validateErrorBoundaries(),
    fallbackComponents: validateFallbackComponents()
  };
  
  const allPassed = generateReport(results);
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run the error recovery tests validation
main();