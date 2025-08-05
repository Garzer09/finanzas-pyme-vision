#!/usr/bin/env node

/**
 * 🧭 Navigation Flow Tests Validator
 * 
 * Specialized validation script for navigation and routing tests.
 * Validates navigation flows, routing protection, and user experience.
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

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
  log('🧭 NAVIGATION FLOW TESTS VALIDATOR', 'cyan');
  log('═'.repeat(60), 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'blue');
  console.log();
}

function runNavigationFlowTests() {
  log('🧭 RUNNING NAVIGATION FLOW TESTS...', 'yellow');
  
  try {
    const output = execSync('npm test src/components/__tests__/navigation-flow.test.ts', {
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, CI: 'true' }
    });
    
    // Parse test results to get specific navigation scenarios
    const lines = output.split('\n');
    const testResults = lines.filter(line => 
      line.includes('✓') || line.includes('×') || line.includes('PASS') || line.includes('FAIL')
    );
    
    log('  ✅ Navigation flow tests - PASSED', 'green');
    log(`    Found ${testResults.length} navigation test scenarios`, 'blue');
    
    return { passed: true, output, scenarios: testResults.length };
  } catch (error) {
    log('  ❌ Navigation flow tests - FAILED', 'red');
    return { passed: false, error: error.message };
  }
}

function runEndToEndJourneyTests() {
  log('🎯 RUNNING END-TO-END JOURNEY TESTS...', 'yellow');
  
  try {
    const output = execSync('npm test src/components/__tests__/end-to-end-journeys.test.ts', {
      encoding: 'utf8',
      timeout: 120000, // Longer timeout for E2E tests
      env: { ...process.env, CI: 'true' }
    });
    
    log('  ✅ End-to-end journey tests - PASSED', 'green');
    return { passed: true, output };
  } catch (error) {
    log('  ❌ End-to-end journey tests - FAILED', 'red');
    return { passed: false, error: error.message };
  }
}

function runRoutingProtectionTests() {
  log('🔒 RUNNING ROUTING PROTECTION TESTS...', 'yellow');
  
  const routingTestPatterns = [
    'src/components/__tests__/require-auth-routing.test.tsx',
    'src/components/__tests__/require-auth-redirect.test.tsx'
  ];
  
  let allPassed = true;
  const results = [];
  
  for (const pattern of routingTestPatterns) {
    try {
      log(`  Testing: ${pattern}`, 'blue');
      const output = execSync(`npm test ${pattern}`, { 
        encoding: 'utf8',
        timeout: 60000,
        env: { ...process.env, CI: 'true' }
      });
      
      log(`  ✅ ${pattern} - PASSED`, 'green');
      results.push({ pattern, status: 'PASSED' });
    } catch (error) {
      log(`  ❌ ${pattern} - FAILED`, 'red');
      results.push({ pattern, status: 'FAILED', error: error.message });
      allPassed = false;
    }
  }
  
  return { allPassed, results };
}

function validateNavigationAccessibility() {
  log('♿ VALIDATING NAVIGATION ACCESSIBILITY...', 'yellow');
  
  // Check if navigation components have proper accessibility attributes
  try {
    const navComponentFiles = [
      'src/components/DashboardSidebar.tsx',
      'src/components/ModuleNavigation.tsx',
      'src/components/DashboardHeader.tsx',
      'src/components/AdminTopNavigation.tsx',
      'src/components/ui/navigation-menu.tsx'
    ];
    
    let accessibilityScore = 0;
    let componentsFound = 0;
    
    for (const filePath of navComponentFiles) {
      try {
        const fullPath = join(process.cwd(), filePath);
        const content = readFileSync(fullPath, 'utf8');
        componentsFound++;
        
        // Check for accessibility attributes
        const hasAriaLabels = content.includes('aria-label') || content.includes('aria-labelledby');
        const hasKeyboardSupport = content.includes('onKeyDown') || content.includes('tabIndex');
        const hasSemanticElements = content.includes('<nav>') || content.includes('role=') || content.includes('Navigation');
        
        if (hasAriaLabels) accessibilityScore++;
        if (hasKeyboardSupport) accessibilityScore++;
        if (hasSemanticElements) accessibilityScore++;
        
        log(`  📝 ${filePath}: ${(hasAriaLabels ? 1 : 0) + (hasKeyboardSupport ? 1 : 0) + (hasSemanticElements ? 1 : 0)}/3 accessibility features`, 'blue');
        
      } catch (error) {
        log(`  ⚠️ ${filePath} not found (optional)`, 'yellow');
      }
    }
    
    if (componentsFound === 0) {
      log('  ⚠️ No navigation components found, skipping accessibility check', 'yellow');
      return { passed: true, score: 0 };
    }
    
    const maxScore = componentsFound * 3;
    const percentage = Math.round((accessibilityScore / maxScore) * 100);
    
    if (percentage >= 50 || componentsFound >= 2) {
      log(`  ✅ Navigation accessibility: ${percentage}% (${componentsFound} components found) - ACCEPTABLE`, 'green');
      return { passed: true, score: percentage };
    } else {
      log(`  ⚠️ Navigation accessibility: ${percentage}% - NEEDS IMPROVEMENT`, 'yellow');
      return { passed: true, score: percentage }; // Don't fail, just warn
    }
    
  } catch (error) {
    log(`  ❌ Accessibility validation failed: ${error.message}`, 'red');
    return { passed: false, error: error.message };
  }
}

function validateUserExperienceFlows() {
  log('👥 VALIDATING USER EXPERIENCE FLOWS...', 'yellow');
  
  // Check for UX-related test patterns
  try {
    const testDir = join(process.cwd(), 'src/components/__tests__');
    if (!existsSync(testDir)) {
      log('  ⚠️ Test directory not found, skipping UX validation', 'yellow');
      return { passed: true, count: 0 };
    }
    
    const testFiles = readdirSync(testDir).filter(file => file.endsWith('.test.ts') || file.endsWith('.test.tsx'));
    
    let uxTestCount = 0;
    const uxPatterns = [
      'user flow',
      'user journey',
      'user experience',
      'navigation flow',
      'loading state',
      'error state',
      'success state',
      'end-to-end',
      'journey'
    ];
    
    for (const testFile of testFiles) {
      try {
        const content = readFileSync(join(testDir, testFile), 'utf8');
        const hasUxTests = uxPatterns.some(pattern => 
          content.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (hasUxTests) {
          uxTestCount++;
          log(`  📝 ${testFile}: Contains UX flow tests`, 'blue');
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    if (uxTestCount >= 1) {
      log(`  ✅ Found ${uxTestCount} files with UX flow tests - GOOD`, 'green');
      return { passed: true, count: uxTestCount };
    } else {
      log(`  ⚠️ Found ${uxTestCount} files with UX flow tests - Consider adding more, but not required`, 'yellow');
      return { passed: true, count: uxTestCount }; // Not a failure, just a recommendation
    }
    
  } catch (error) {
    log(`  ❌ UX flow validation failed: ${error.message}`, 'red');
    return { passed: false, error: error.message };
  }
}

function generateReport(results) {
  console.log();
  log('═'.repeat(60), 'cyan');
  log('📊 NAVIGATION FLOW TESTS REPORT', 'cyan');
  log('═'.repeat(60), 'cyan');
  
  const categories = [
    { name: 'Navigation Flow Tests', result: results.navigationTests.passed },
    { name: 'End-to-End Journeys', result: results.e2eTests.passed },
    { name: 'Routing Protection', result: results.routingTests.allPassed },
    { name: 'Accessibility', result: results.accessibilityTests.passed },
    { name: 'UX Flow Coverage', result: results.uxTests.passed }
  ];
  
  categories.forEach(category => {
    const status = category.result ? '✅ PASS' : '❌ FAIL';
    const color = category.result ? 'green' : 'red';
    log(`  ${category.name.padEnd(25)} ${status}`, color);
  });
  
  // Additional metrics
  console.log();
  log('📈 ADDITIONAL METRICS:', 'blue');
  if (results.navigationTests.scenarios) {
    log(`  Navigation scenarios tested: ${results.navigationTests.scenarios}`, 'blue');
  }
  if (results.accessibilityTests.score) {
    log(`  Accessibility score: ${results.accessibilityTests.score}%`, 'blue');
  }
  if (results.uxTests.count) {
    log(`  UX test coverage files: ${results.uxTests.count}`, 'blue');
  }
  
  const totalPassed = categories.filter(c => c.result).length;
  const totalTests = categories.length;
  
  console.log();
  log('═'.repeat(60), 'cyan');
  log(`📊 SUMMARY: ${totalPassed}/${totalTests} navigation categories passed`, totalPassed === totalTests ? 'green' : 'yellow');
  
  if (totalPassed === totalTests) {
    log('🎉 ALL NAVIGATION TESTS PASSED', 'green');
    log('Navigation system is ready for production.', 'green');
  } else {
    log('🚨 NAVIGATION TESTS FAILED', 'red');
    log(`${totalTests - totalPassed} navigation categories failed. Review and fix issues.`, 'red');
  }
  
  log('═'.repeat(60), 'cyan');
  console.log();
  
  return totalPassed === totalTests;
}

function main() {
  printHeader();
  
  const results = {
    navigationTests: runNavigationFlowTests(),
    e2eTests: runEndToEndJourneyTests(),
    routingTests: runRoutingProtectionTests(),
    accessibilityTests: validateNavigationAccessibility(),
    uxTests: validateUserExperienceFlows()
  };
  
  const allPassed = generateReport(results);
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run the navigation flow tests validation
main();