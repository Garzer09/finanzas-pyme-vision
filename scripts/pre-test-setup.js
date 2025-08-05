#!/usr/bin/env node

/**
 * Pre-test setup script
 * Ensures test users exist before running E2E tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@test.finanzas-pyme.com',
    password: 'AdminTest123!'
  },
  viewer: {
    email: 'viewer@test.finanzas-pyme.com',
    password: 'ViewerTest123!'
  }
};

/**
 * Setup test environment before running E2E tests
 */
async function setupTestEnvironment() {
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
        console.warn('⚠️ Could not create test users automatically:', error.message);
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

async function main() {
  console.log('🔧 Running pre-test setup...');
  
  try {
    const success = await setupTestEnvironment();
    
    if (success) {
      console.log('✅ Pre-test setup completed successfully');
      process.exit(0);
    } else {
      console.warn('⚠️ Pre-test setup completed with warnings');
      process.exit(0); // Don't fail - tests can still run
    }
  } catch (error) {
    console.error('❌ Pre-test setup failed:', error);
    console.log('⚠️ Tests may fail without proper setup');
    process.exit(0); // Don't fail completely
  }
}

main();