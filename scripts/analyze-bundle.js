#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * 
 * Analyzes the build output and provides insights about bundle size and composition
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Analyzing build bundle...\n');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundleSize() {
  const distPath = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  const analysis = {
    totalSize: 0,
    files: [],
    assetTypes: {},
    recommendations: [],
  };

  function analyzeDirectory(dir, basePath = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const relativePath = path.join(basePath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        analyzeDirectory(filePath, relativePath);
      } else {
        const size = stats.size;
        const ext = path.extname(file).toLowerCase();
        
        analysis.totalSize += size;
        analysis.files.push({
          path: relativePath,
          size: size,
          formattedSize: formatBytes(size),
          type: ext,
        });
        
        if (!analysis.assetTypes[ext]) {
          analysis.assetTypes[ext] = { count: 0, totalSize: 0 };
        }
        analysis.assetTypes[ext].count++;
        analysis.assetTypes[ext].totalSize += size;
      }
    });
  }

  analyzeDirectory(distPath);

  // Sort files by size (largest first)
  analysis.files.sort((a, b) => b.size - a.size);

  // Generate recommendations
  if (analysis.totalSize > 5 * 1024 * 1024) { // 5MB
    analysis.recommendations.push('Consider code splitting to reduce bundle size');
  }

  const jsSize = analysis.assetTypes['.js']?.totalSize || 0;
  if (jsSize > 2 * 1024 * 1024) { // 2MB
    analysis.recommendations.push('JavaScript bundle is large - consider lazy loading');
  }

  const cssSize = analysis.assetTypes['.css']?.totalSize || 0;
  if (cssSize > 500 * 1024) { // 500KB
    analysis.recommendations.push('CSS bundle is large - consider purging unused styles');
  }

  // Display results
  console.log('📊 Bundle Analysis Results:');
  console.log('============================');
  console.log(`Total Bundle Size: ${formatBytes(analysis.totalSize)}`);
  console.log();

  console.log('📁 Largest Files:');
  analysis.files.slice(0, 10).forEach((file, index) => {
    console.log(`${index + 1}. ${file.path} - ${file.formattedSize}`);
  });
  console.log();

  console.log('📋 Asset Type Breakdown:');
  Object.entries(analysis.assetTypes).forEach(([ext, data]) => {
    console.log(`${ext || 'no-ext'}: ${data.count} files, ${formatBytes(data.totalSize)}`);
  });
  console.log();

  if (analysis.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log();
  }

  // Save detailed report
  const reportPath = path.join(process.cwd(), 'bundle-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);

  // Check thresholds
  const sizeThreshold = 10 * 1024 * 1024; // 10MB warning threshold
  if (analysis.totalSize > sizeThreshold) {
    console.log(`\n⚠️  Warning: Bundle size (${formatBytes(analysis.totalSize)}) exceeds ${formatBytes(sizeThreshold)}`);
    process.exit(1);
  } else {
    console.log(`\n✅ Bundle size is within acceptable limits`);
  }
}

// Run if called directly
if (require.main === module) {
  analyzeBundleSize();
}

module.exports = { analyzeBundleSize };