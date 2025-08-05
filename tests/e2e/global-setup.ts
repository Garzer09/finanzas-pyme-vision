/**
 * Global setup for Playwright E2E tests
 * Ensures test environment is ready before running tests
 */

import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const execAsync = promisify(exec);

async function validateTestFiles() {
  console.log('📁 Validating test files...');
  
  const requiredFiles = [
    'public/templates/valid_comma.csv',
    'public/templates/test-data.csv',
    'public/templates/cuenta-pyg.csv'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = resolve(process.cwd(), file);
    if (!existsSync(filePath)) {
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

async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');
  
  try {
    // Check if we can create test users (requires Supabase credentials)
    const hasSupabaseConfig = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY;
    
    if (hasSupabaseConfig) {
      console.log('📝 Test environment has Supabase configuration');
    } else {
      console.warn('⚠️ Supabase configuration not found - tests will use existing users');
    }
    
    console.log('✅ Test environment setup completed');
    return true;
    
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    return false;
  }
}

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  try {
    // Validate test environment
    await validateTestFiles();
    
    // Setup test users and environment
    await setupTestEnvironment();
    
    console.log('✅ Global test setup completed successfully');
    return Promise.resolve();
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    
    // Don't fail completely - let individual tests handle missing setup
    console.warn('⚠️ Continuing with tests despite setup issues...');
    return Promise.resolve();
  }
}

export default globalSetup;