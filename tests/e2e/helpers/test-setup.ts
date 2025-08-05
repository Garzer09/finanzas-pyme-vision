/**
 * Test setup utility for E2E tests
 * Ensures test users exist and environment is ready
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { TEST_CREDENTIALS } from '../fixtures/test-credentials';

const execAsync = promisify(exec);

/**
 * Setup test environment before running E2E tests
 */
export async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');
  
  try {
    // Check if we can create test users (requires Supabase credentials)
    const hasSupabaseConfig = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY;
    
    if (hasSupabaseConfig) {
      console.log('📝 Creating test users...');
      
      try {
        const { stdout, stderr } = await execAsync('npm run create-test-users', {
          timeout: 60000 // 1 minute timeout
        });
        
        if (stderr && !stderr.includes('warning') && !stderr.includes('warn')) {
          console.warn('⚠️ Test user creation warnings:', stderr);
        }
        
        console.log('✅ Test users ready');
      } catch (error) {
        console.warn('⚠️ Could not create test users automatically:', error);
        console.log('📝 Test user credentials for manual setup:');
        console.log(`   Admin: ${TEST_CREDENTIALS.admin.email} / ${TEST_CREDENTIALS.admin.password}`);
        console.log(`   Viewer: ${TEST_CREDENTIALS.viewer.email} / ${TEST_CREDENTIALS.viewer.password}`);
      }
    } else {
      console.warn('⚠️ Supabase configuration not found - using existing test users');
      console.log('📝 Expected test user credentials:');
      console.log(`   Admin: ${TEST_CREDENTIALS.admin.email} / ${TEST_CREDENTIALS.admin.password}`);
      console.log(`   Viewer: ${TEST_CREDENTIALS.viewer.email} / ${TEST_CREDENTIALS.viewer.password}`);
    }
    
    console.log('✅ Test environment setup completed');
    return true;
    
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    return false;
  }
}

/**
 * Cleanup test environment after tests
 */
export async function cleanupTestEnvironment() {
  console.log('🧹 Cleaning up test environment...');
  
  // For now, we don't clean up test users as they might be used across test runs
  // In a production CI environment, you might want to clean them up
  
  console.log('✅ Test environment cleanup completed');
}

/**
 * Validate that required test files exist
 */
export async function validateTestFiles() {
  console.log('📁 Validating test files...');
  
  const fs = await import('fs');
  const path = await import('path');
  
  const requiredFiles = [
    'public/templates/valid_comma.csv',
    'public/templates/test-data.csv',
    'public/templates/cuenta-pyg.csv'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Required test file not found: ${file}`);
      allFilesExist = false;
    } else {
      console.log(`✅ Test file found: ${file}`);
    }
  }
  
  if (!allFilesExist) {
    throw new Error('Required test files are missing. Please ensure all template files are present.');
  }
  
  console.log('✅ All test files validated');
  return true;
}

/**
 * Pre-test validation - ensures environment is ready
 */
export async function preTestValidation() {
  console.log('🔍 Running pre-test validation...');
  
  try {
    await validateTestFiles();
    
    // Check environment variables
    const requiredEnvVars = ['VITE_SUPABASE_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
      console.warn('Some tests may fail without proper Supabase configuration');
    } else {
      console.log('✅ Environment variables validated');
    }
    
    console.log('✅ Pre-test validation completed');
    return true;
    
  } catch (error) {
    console.error('❌ Pre-test validation failed:', error);
    throw error;
  }
}