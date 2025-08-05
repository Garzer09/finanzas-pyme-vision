#!/usr/bin/env node

/**
 * Test User Creation Script
 * 
 * Creates predefined test users for development and testing purposes.
 * This script creates:
 * - Admin user with full permissions
 * - Normal user (viewer) with limited permissions
 * 
 * Usage:
 *   npm run create-test-users
 *   node scripts/create_test_users.js
 * 
 * Environment Variables Required:
 *   VITE_SUPABASE_URL - Supabase project URL
 *   VITE_SUPABASE_ANON_KEY - Supabase anonymous key
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Test user configurations
const TEST_USERS = {
  admin: {
    email: 'admin@test.finanzas-pyme.com',
    password: 'AdminTest123!',
    role: 'admin',
    profile: {
      full_name: 'Administrator Test',
      company_name: 'Test Admin Company',
      sector: 'Technology',
      revenue: '1000000',
      employees: '50'
    }
  },
  viewer: {
    email: 'viewer@test.finanzas-pyme.com', 
    password: 'ViewerTest123!',
    role: 'user', // Database uses 'user', frontend maps to 'viewer'
    profile: {
      full_name: 'Viewer Test',
      company_name: 'Test Viewer Company', 
      sector: 'Manufacturing',
      revenue: '500000',
      employees: '25'
    }
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateEnvironment() {
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    log(`❌ Missing required environment variables: ${missing.join(', ')}`, colors.red);
    log('Please check your .env file and ensure all required variables are set.', colors.yellow);
    process.exit(1);
  }
}

async function createSupabaseClient() {
  validateEnvironment();
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  return createClient(supabaseUrl, supabaseKey);
}

async function createUser(supabase, userKey, userData) {
  log(`\n📝 Creating ${userKey} user...`, colors.blue);
  
  try {
    // 1. Create auth user
    log(`   Creating auth user for ${userData.email}...`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email for testing
      user_metadata: {
        full_name: userData.profile.full_name,
        company_name: userData.profile.company_name
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        log(`   ⚠️  User ${userData.email} already exists`, colors.yellow);
        return { success: true, existed: true };
      }
      throw authError;
    }

    const userId = authData.user.id;
    log(`   ✅ Auth user created with ID: ${userId}`, colors.green);

    // 2. Set user role (the trigger should handle this, but let's be explicit)
    log(`   Setting role: ${userData.role}...`);
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: userData.role
      });

    if (roleError) {
      log(`   ⚠️  Role assignment warning: ${roleError.message}`, colors.yellow);
    } else {
      log(`   ✅ Role set to: ${userData.role}`, colors.green);
    }

    // 3. Update user profile with additional data
    log(`   Updating user profile...`);
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        full_name: userData.profile.full_name,
        company_name: userData.profile.company_name,
        sector: userData.profile.sector,
        revenue: userData.profile.revenue,
        employees: userData.profile.employees
      });

    if (profileError) {
      log(`   ⚠️  Profile update warning: ${profileError.message}`, colors.yellow);
    } else {
      log(`   ✅ Profile updated successfully`, colors.green);
    }

    log(`✅ ${userKey} user created successfully!`, colors.green);
    return { success: true, existed: false };

  } catch (error) {
    log(`❌ Failed to create ${userKey} user: ${error.message}`, colors.red);
    return { success: false, error: error.message };
  }
}

async function verifyUsers(supabase) {
  log(`\n🔍 Verifying created users...`, colors.blue);
  
  for (const [userKey, userData] of Object.entries(TEST_USERS)) {
    try {
      // Get user by email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;
      
      const user = authUsers.users.find(u => u.email === userData.email);
      if (!user) {
        log(`   ❌ User ${userData.email} not found in auth`, colors.red);
        continue;
      }

      // Check role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) {
        log(`   ❌ Could not verify role for ${userData.email}: ${roleError.message}`, colors.red);
        continue;
      }

      // Check profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name, company_name')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        log(`   ❌ Could not verify profile for ${userData.email}: ${profileError.message}`, colors.red);
        continue;
      }

      log(`   ✅ ${userKey}: ${userData.email} | Role: ${roleData.role} | Profile: ${profileData.full_name}`, colors.green);

    } catch (error) {
      log(`   ❌ Verification failed for ${userKey}: ${error.message}`, colors.red);
    }
  }
}

async function cleanupExistingUsers(supabase) {
  const confirmCleanup = process.argv.includes('--clean') || process.argv.includes('--reset');
  
  if (!confirmCleanup) {
    return;
  }

  log(`\n🧹 Cleaning up existing test users...`, colors.yellow);
  
  for (const userData of Object.values(TEST_USERS)) {
    try {
      // Find user by email
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      
      const existingUser = authUsers.users.find(u => u.email === userData.email);
      if (existingUser) {
        log(`   Deleting ${userData.email}...`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
        if (deleteError) {
          log(`   ⚠️  Failed to delete ${userData.email}: ${deleteError.message}`, colors.yellow);
        } else {
          log(`   ✅ Deleted ${userData.email}`, colors.green);
        }
      }
    } catch (error) {
      log(`   ❌ Cleanup failed for ${userData.email}: ${error.message}`, colors.red);
    }
  }
}

async function main() {
  log(`${colors.bold}🚀 Test User Creation Script${colors.reset}`);
  log(`Creating test users for development and testing purposes.\n`);

  try {
    const supabase = await createSupabaseClient();
    log(`✅ Connected to Supabase`, colors.green);

    // Cleanup if requested
    await cleanupExistingUsers(supabase);

    // Create test users
    const results = {};
    for (const [userKey, userData] of Object.entries(TEST_USERS)) {
      results[userKey] = await createUser(supabase, userKey, userData);
    }

    // Verify created users
    await verifyUsers(supabase);

    // Summary
    log(`\n📋 Summary:`, colors.bold);
    const successful = Object.values(results).filter(r => r.success).length;
    const existing = Object.values(results).filter(r => r.existed).length;
    log(`   ✅ Successfully created: ${successful - existing} users`);
    log(`   ⚠️  Already existed: ${existing} users`);
    log(`   ❌ Failed: ${Object.values(results).filter(r => !r.success).length} users`);

    log(`\n🔑 Test User Credentials:`, colors.bold);
    log(`   Admin User:`);
    log(`     Email: ${TEST_USERS.admin.email}`);
    log(`     Password: ${TEST_USERS.admin.password}`);
    log(`     Role: Admin (full access)`);
    
    log(`   Viewer User:`);
    log(`     Email: ${TEST_USERS.viewer.email}`);
    log(`     Password: ${TEST_USERS.viewer.password}`);
    log(`     Role: Viewer (limited access)`);

    log(`\n💡 Usage:`, colors.blue);
    log(`   1. Use these credentials to test login functionality`);
    log(`   2. Verify role-based access controls`);
    log(`   3. Test session management and logout`);
    log(`   4. Run automated tests with npm run test:auth`);

    log(`\n⚠️  Security Note:`, colors.yellow);
    log(`   These are test users with well-known passwords.`);
    log(`   Only use in development/testing environments!`);

  } catch (error) {
    log(`❌ Script failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Test User Creation Script

Usage:
  node scripts/create_test_users.js [options]

Options:
  --clean, --reset    Delete existing test users before creating new ones
  --help, -h          Show this help message

Environment Variables Required:
  VITE_SUPABASE_URL      Supabase project URL
  VITE_SUPABASE_ANON_KEY Supabase anonymous key

Created Users:
  - admin@test.finanzas-pyme.com (Admin role)
  - viewer@test.finanzas-pyme.com (Viewer role)
`);
  process.exit(0);
}

// Run the script
main().catch(console.error);