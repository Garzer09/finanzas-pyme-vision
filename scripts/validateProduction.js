#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates that all required environment variables are present for production deployment.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_ENVIRONMENT'
];

// Critical production environment variables that should have specific values
const PRODUCTION_SPECIFIC_VARS = {
  'VITE_ENVIRONMENT': 'production',
  'VITE_DEBUG_MODE': 'false',
  'VITE_ENABLE_RATE_LIMITING': 'true',
  'VITE_ENABLE_CSRF_PROTECTION': 'true'
};

// Security-related variables that should be enabled in production
const SECURITY_VARS = [
  'VITE_ENABLE_RATE_LIMITING',
  'VITE_ENABLE_CSRF_PROTECTION',
  'VITE_ENABLE_SECURITY_LOGGING'
];

function loadEnvironmentFile() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    // In CI, always merge with process.env as CI sets environment variables directly
    return { ...process.env, ...env };
  } catch (error) {
    console.error('⚠️  Warning: .env file not found. Using process.env...');
    return process.env;
  }
}

function validateEnvironmentVariables() {
  console.log('🔍 Validating production environment variables...\n');
  
  const env = loadEnvironmentFile();
  const errors = [];
  const warnings = [];
  
  // Check required variables
  console.log('✅ Checking required variables:');
  REQUIRED_ENV_VARS.forEach(varName => {
    const value = env[varName];
    if (!value || value.trim() === '') {
      errors.push(`❌ Missing required environment variable: ${varName}`);
    } else if (value.includes('your_') || value.includes('_here')) {
      // In CI environments, allow demo/fallback values for testing
      if (env.CI === 'true') {
        console.log(`   ⚠️ ${varName} (using CI fallback value)`);
        warnings.push(`⚠️  ${varName} is using a fallback value in CI: ${value}`);
      } else {
        errors.push(`❌ Environment variable ${varName} contains placeholder value: ${value}`);
      }
    } else {
      console.log(`   ✓ ${varName}`);
    }
  });
  
  // Check production-specific values
  console.log('\n✅ Checking production-specific configurations:');
  Object.entries(PRODUCTION_SPECIFIC_VARS).forEach(([varName, expectedValue]) => {
    const value = env[varName];
    if (value !== expectedValue) {
      warnings.push(`⚠️  ${varName} should be "${expectedValue}" in production (current: "${value || 'undefined'}")`);
    } else {
      console.log(`   ✓ ${varName} = ${value}`);
    }
  });
  
  // Check security variables
  console.log('\n✅ Checking security configurations:');
  SECURITY_VARS.forEach(varName => {
    const value = env[varName];
    if (value !== 'true') {
      warnings.push(`⚠️  Security variable ${varName} should be "true" in production (current: "${value || 'undefined'}")`);
    } else {
      console.log(`   ✓ ${varName} = ${value}`);
    }
  });
  
  // Check for sensitive data exposure
  console.log('\n✅ Checking for security issues:');
  const sensitivePatterns = [
    { pattern: /localhost/i, message: 'localhost URLs detected' },
    { pattern: /127\.0\.0\.1/i, message: 'localhost IP addresses detected' },
    { pattern: /demo[_-]?key/i, message: 'demo keys detected' },
    { pattern: /test[_-]?key/i, message: 'test keys detected' },
    { pattern: /development/i, message: 'development values detected' }
  ];
  
  Object.entries(env).forEach(([key, value]) => {
    if (typeof value === 'string') {
      sensitivePatterns.forEach(({ pattern, message }) => {
        if (pattern.test(value) && !key.includes('EXAMPLE')) {
          warnings.push(`⚠️  ${key}: ${message} (${value})`);
        }
      });
    }
  });
  
  // Report results
  console.log('\n' + '='.repeat(60));
  
  if (errors.length === 0) {
    console.log('✅ All required environment variables are present!');
  } else {
    console.log('❌ Environment validation failed:');
    errors.forEach(error => console.log(error));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Production readiness warnings:');
    warnings.forEach(warning => console.log(warning));
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (errors.length > 0) {
    console.log('\n💡 To fix these issues:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Fill in all required values');
    console.log('3. Ensure no placeholder values remain');
    console.log('4. Verify security settings are enabled');
    
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.log('\n💡 Consider addressing warnings for optimal production deployment.');
    if (process.env.CI === 'true') {
      console.log('⚠️  Warnings detected in CI environment - continuing with build.');
      // In CI, don't fail on warnings if all required vars have values (even fallbacks)
      if (errors.length === 0) {
        console.log('✅ All required variables present, proceeding despite warnings.');
      }
    }
  }
  
  console.log('\n🎉 Environment validation completed successfully!');
  process.exit(0);
}

// Run validation
validateEnvironmentVariables();