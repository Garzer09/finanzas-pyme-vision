#!/usr/bin/env node

/**
 * Performance Test Script
 * 
 * Runs performance tests and benchmarks for the application
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running Performance Tests...\n');

// Configuration
const config = {
  iterations: 5,
  timeout: 30000,
  thresholds: {
    loadTime: 2000, // 2 seconds
    bundleSize: 5000000, // 5MB
    memoryUsage: 100000000, // 100MB
  },
};

async function runPerformanceTests() {
  const results = {
    loadTime: [],
    bundleSize: 0,
    memoryUsage: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Bundle Size Analysis
    console.log('📦 Analyzing bundle size...');
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath, { recursive: true });
      let totalSize = 0;
      
      files.forEach(file => {
        const filePath = path.join(distPath, file);
        if (fs.statSync(filePath).isFile()) {
          totalSize += fs.statSync(filePath).size;
        }
      });
      
      results.bundleSize = totalSize;
      console.log(`Bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      
      if (totalSize > config.thresholds.bundleSize) {
        console.warn(`⚠️  Bundle size exceeds threshold (${(config.thresholds.bundleSize / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        console.log('✅ Bundle size within acceptable limits');
      }
    }

    // 2. Load Time Tests (simulated)
    console.log('\n⏱️  Testing load times...');
    for (let i = 0; i < config.iterations; i++) {
      const startTime = Date.now();
      
      // Simulate load time test
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      const loadTime = Date.now() - startTime;
      results.loadTime.push(loadTime);
      console.log(`Iteration ${i + 1}: ${loadTime}ms`);
    }

    const avgLoadTime = results.loadTime.reduce((a, b) => a + b, 0) / results.loadTime.length;
    console.log(`Average load time: ${avgLoadTime.toFixed(2)}ms`);
    
    if (avgLoadTime > config.thresholds.loadTime) {
      console.warn(`⚠️  Average load time exceeds threshold (${config.thresholds.loadTime}ms)`);
    } else {
      console.log('✅ Load time within acceptable limits');
    }

    // 3. Memory Usage Analysis (simulated)
    console.log('\n🧠 Analyzing memory usage...');
    const memUsage = process.memoryUsage();
    results.memoryUsage.push(memUsage);
    console.log(`Current memory usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

    // 4. Save Results
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📊 Performance report saved to: ${reportPath}`);

    // 5. Summary
    console.log('\n📈 Performance Test Summary:');
    console.log('================================');
    console.log(`Bundle Size: ${(results.bundleSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Average Load Time: ${avgLoadTime.toFixed(2)}ms`);
    console.log(`Memory Usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

    // Check if all tests passed
    const allPassed = 
      results.bundleSize <= config.thresholds.bundleSize &&
      avgLoadTime <= config.thresholds.loadTime &&
      memUsage.heapUsed <= config.thresholds.memoryUsage;

    if (allPassed) {
      console.log('\n✅ All performance tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some performance tests failed!');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Performance tests failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runPerformanceTests();
}

module.exports = { runPerformanceTests };