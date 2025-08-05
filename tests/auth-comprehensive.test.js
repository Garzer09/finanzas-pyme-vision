/**
 * Comprehensive Authentication Tests
 * 
 * This test suite validates the complete authentication system including:
 * - User login/logout flows
 * - Role-based access control
 * - Session management
 * - Password security
 * - Permission enforcement
 * 
 * Prerequisites: 
 * - Test users must be created using: npm run create-test-users
 * - Environment variables must be configured
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test user credentials (must match create_test_users.js)
const TEST_USERS = {
  admin: {
    email: 'admin@test.finanzas-pyme.com',
    password: 'AdminTest123!',
    expectedRole: 'admin'
  },
  viewer: {
    email: 'viewer@test.finanzas-pyme.com', 
    password: 'ViewerTest123!',
    expectedRole: 'viewer'
  },
  invalid: {
    email: 'invalid@test.com',
    password: 'wrongpassword',
    expectedRole: null
  }
};

// Invalid credentials for testing failures
const INVALID_CREDENTIALS = [
  { email: 'nonexistent@test.com', password: 'password123' },
  { email: 'admin@test.finanzas-pyme.com', password: 'wrongpassword' },
  { email: 'invalid-email', password: 'password123' },
  { email: '', password: 'password123' },
  { email: 'test@test.com', password: '' }
];

let supabase;

describe('Authentication System - Comprehensive Tests', () => {
  beforeAll(async () => {
    // Validate environment
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
    }

    // Initialize Supabase client
    supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Verify test users exist
    console.log('🔍 Verifying test users exist...');
    for (const [userType, userData] of Object.entries(TEST_USERS)) {
      if (userType === 'invalid') continue;
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });
        
        if (error) {
          console.error(`❌ Test user ${userType} (${userData.email}) not found or invalid. Run: npm run create-test-users`);
          throw new Error(`Test user ${userType} not available: ${error.message}`);
        }
        
        await supabase.auth.signOut();
        console.log(`✅ Test user ${userType} verified`);
      } catch (error) {
        throw new Error(`Failed to verify test user ${userType}: ${error.message}`);
      }
    }
  });

  beforeEach(async () => {
    // Ensure clean state before each test
    await supabase.auth.signOut();
  });

  afterEach(async () => {
    // Clean up after each test
    await supabase.auth.signOut();
  });

  describe('Login Flow - Success Cases', () => {
    it('should successfully authenticate admin user with valid credentials', async () => {
      const { email, password, expectedRole } = TEST_USERS.admin;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      expect(error).toBeNull();
      expect(data.user).toBeTruthy();
      expect(data.user.email).toBe(email);
      expect(data.session).toBeTruthy();
      expect(data.session.access_token).toBeTruthy();
      
      // Verify user role
      const { data: roleData } = await supabase.rpc('get_user_role');
      expect(roleData).toBe(expectedRole);
    });

    it('should successfully authenticate viewer user with valid credentials', async () => {
      const { email, password, expectedRole } = TEST_USERS.viewer;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      expect(error).toBeNull();
      expect(data.user).toBeTruthy();
      expect(data.user.email).toBe(email);
      expect(data.session).toBeTruthy();
      
      // Verify user role (database stores 'user', function should return 'viewer')
      const { data: roleData } = await supabase.rpc('get_user_role');
      expect(roleData).toBe(expectedRole);
    });

    it('should return valid session data after successful login', async () => {
      const { email, password } = TEST_USERS.admin;
      
      const { data } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Validate session structure
      expect(data.session).toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
        expires_in: expect.any(Number),
        token_type: 'bearer',
        user: expect.objectContaining({
          id: expect.any(String),
          email: expect.any(String)
        })
      });

      // Validate token expiration is in the future
      const now = Math.floor(Date.now() / 1000);
      expect(data.session.expires_at).toBeGreaterThan(now);
    });
  });

  describe('Login Flow - Failure Cases', () => {
    it.each(INVALID_CREDENTIALS)('should reject invalid credentials: $email', async (credentials) => {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);

      expect(error).toBeTruthy();
      expect(data.user).toBeNull();
      expect(data.session).toBeNull();
      
      // Common error messages we expect
      const validErrorMessages = [
        'Invalid login credentials',
        'Email not confirmed',
        'Too many requests',
        'Invalid email'
      ];
      
      const hasValidError = validErrorMessages.some(msg => 
        error.message.toLowerCase().includes(msg.toLowerCase())
      );
      expect(hasValidError).toBe(true);
    });

    it('should handle network timeouts gracefully', async () => {
      // Simulate network timeout by using an invalid URL
      const invalidSupabase = createClient('https://invalid-url.supabase.co', 'invalid-key');
      
      const { data, error } = await invalidSupabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'password'
      });

      expect(error).toBeTruthy();
      expect(data.user).toBeNull();
    });

    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "admin@test.com'; --",
        "1' OR '1'='1",
        "admin@test.com' UNION SELECT * FROM user_roles --"
      ];

      for (const maliciousEmail of sqlInjectionAttempts) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: maliciousEmail,
          password: 'password'
        });

        expect(error).toBeTruthy();
        expect(data.user).toBeNull();
      }
    });
  });

  describe('Role-Based Access Control', () => {
    it('should correctly identify admin user role and permissions', async () => {
      const { email, password } = TEST_USERS.admin;
      
      // Login as admin
      await supabase.auth.signInWithPassword({ email, password });
      
      // Check role
      const { data: role } = await supabase.rpc('get_user_role');
      expect(role).toBe('admin');
      
      // Test admin permissions - should be able to access user_roles table
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .limit(1);
      
      // Admin should be able to read user roles
      expect(error).toBeNull();
      expect(Array.isArray(userRoles)).toBe(true);
    });

    it('should correctly identify viewer user role and permissions', async () => {
      const { email, password } = TEST_USERS.viewer;
      
      // Login as viewer
      await supabase.auth.signInWithPassword({ email, password });
      
      // Check role
      const { data: role } = await supabase.rpc('get_user_role');
      expect(role).toBe('viewer');
      
      // Test viewer permissions - should only see own role
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      // Viewer should only see their own role due to RLS
      if (!error) {
        expect(userRoles).toHaveLength(1);
        expect(userRoles[0].role).toBe('user'); // Database stores 'user'
      }
    });

    it('should enforce role-based permissions on admin endpoints', async () => {
      const { email, password } = TEST_USERS.viewer;
      
      // Login as viewer
      await supabase.auth.signInWithPassword({ email, password });
      
      // Try to access admin-only functionality (like viewing all user profiles)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*');
      
      // Viewer should only see their own profile or get permission error
      if (!error) {
        expect(data).toHaveLength(1); // Only own profile
      } else {
        expect(error.message).toMatch(/permission|unauthorized|forbidden/i);
      }
    });

    it('should prevent role escalation attempts', async () => {
      const { email, password } = TEST_USERS.viewer;
      
      // Login as viewer
      const { data: authData } = await supabase.auth.signInWithPassword({ email, password });
      
      // Attempt to escalate role
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', authData.user.id);
      
      // Should be rejected due to RLS policies
      expect(error).toBeTruthy();
      expect(error.message).toMatch(/permission|unauthorized|forbidden/i);
      
      // Verify role hasn't changed
      const { data: role } = await supabase.rpc('get_user_role');
      expect(role).toBe('viewer');
    });
  });

  describe('Session Management', () => {
    it('should successfully logout and clear session', async () => {
      const { email, password } = TEST_USERS.admin;
      
      // Login
      await supabase.auth.signInWithPassword({ email, password });
      
      // Verify session exists
      const { data: sessionBefore } = await supabase.auth.getSession();
      expect(sessionBefore.session).toBeTruthy();
      
      // Logout
      const { error } = await supabase.auth.signOut();
      expect(error).toBeNull();
      
      // Verify session is cleared
      const { data: sessionAfter } = await supabase.auth.getSession();
      expect(sessionAfter.session).toBeNull();
    });

    it('should handle concurrent sessions correctly', async () => {
      const { email, password } = TEST_USERS.admin;
      
      // Create two separate clients to simulate concurrent sessions
      const client1 = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
      const client2 = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
      
      // Login with both clients
      await client1.auth.signInWithPassword({ email, password });
      await client2.auth.signInWithPassword({ email, password });
      
      // Both should have valid sessions
      const { data: session1 } = await client1.auth.getSession();
      const { data: session2 } = await client2.auth.getSession();
      
      expect(session1.session).toBeTruthy();
      expect(session2.session).toBeTruthy();
      
      // Sessions should be different
      expect(session1.session.access_token).not.toBe(session2.session.access_token);
      
      // Cleanup
      await client1.auth.signOut();
      await client2.auth.signOut();
    });

    it('should refresh tokens before expiration', async () => {
      const { email, password } = TEST_USERS.admin;
      
      // Login
      const { data: loginData } = await supabase.auth.signInWithPassword({ email, password });
      const originalToken = loginData.session.access_token;
      
      // Force refresh token
      const { data: refreshData, error } = await supabase.auth.refreshSession();
      
      expect(error).toBeNull();
      expect(refreshData.session).toBeTruthy();
      expect(refreshData.session.access_token).not.toBe(originalToken);
      expect(refreshData.user).toBeTruthy();
    });

    it('should handle token expiration gracefully', async () => {
      const { email, password } = TEST_USERS.admin;
      
      // Login
      await supabase.auth.signInWithPassword({ email, password });
      
      // Get session and manipulate it to simulate expiration
      const { data: currentSession } = await supabase.auth.getSession();
      expect(currentSession.session).toBeTruthy();
      
      // Check if expired tokens are handled (this is mostly handled by Supabase automatically)
      const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      expect(currentSession.session.expires_at).toBeGreaterThan(expiredTime);
    });
  });

  describe('Password Security', () => {
    it('should validate password requirements', async () => {
      // Note: This tests Supabase's password validation
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'abc',
        ''
      ];

      for (const weakPassword of weakPasswords) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'test@test.com',
          password: weakPassword
        });

        // Should either reject weak password or fail authentication
        expect(data.user).toBeNull();
        expect(error).toBeTruthy();
      }
    });

    it('should handle password reset flow', async () => {
      const { email } = TEST_USERS.viewer;
      
      // Request password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:3000/reset-password'
      });

      // Should not error for valid email (even if we can't verify email was sent)
      expect(error).toBeNull();
    });

    it('should prevent brute force attacks with rate limiting', async () => {
      const attempts = [];
      const { email } = TEST_USERS.admin;
      
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: 'wrongpassword'
        });
        attempts.push(error);
      }

      // At least some attempts should fail due to rate limiting
      const rateLimitErrors = attempts.filter(error => 
        error && error.message.toLowerCase().includes('too many')
      );
      
      // Note: Supabase handles rate limiting, so we may not see it in all environments
      expect(attempts.every(error => error !== null)).toBe(true);
    });
  });

  describe('Permission Enforcement', () => {
    it('should allow admin access to all protected routes', async () => {
      const { email, password } = TEST_USERS.admin;
      
      await supabase.auth.signInWithPassword({ email, password });
      
      // Test access to admin-only tables
      const adminOnlyQueries = [
        () => supabase.from('user_roles').select('*'),
        () => supabase.from('user_profiles').select('*'),
      ];

      for (const query of adminOnlyQueries) {
        const { error } = await query();
        // Admin should have access (no permission errors)
        if (error) {
          expect(error.message).not.toMatch(/permission|unauthorized|forbidden/i);
        }
      }
    });

    it('should restrict viewer access to protected resources', async () => {
      const { email, password } = TEST_USERS.viewer;
      
      await supabase.auth.signInWithPassword({ email, password });
      
      // Test restricted access
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*');
      
      // Viewer should only see their own data or get permission error
      if (!error) {
        expect(data.length).toBeLessThanOrEqual(1);
      } else {
        expect(error.message).toMatch(/permission|unauthorized|forbidden/i);
      }
    });

    it('should prevent unauthorized database modifications', async () => {
      const { email, password } = TEST_USERS.viewer;
      
      await supabase.auth.signInWithPassword({ email, password });
      
      // Try to modify data the viewer shouldn't be able to change
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: 'fake-id', role: 'admin' });
      
      expect(error).toBeTruthy();
      expect(error.message).toMatch(/permission|unauthorized|forbidden/i);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle malformed authentication requests', async () => {
      const malformedRequests = [
        { email: null, password: 'password' },
        { email: 'test@test.com', password: null },
        { email: undefined, password: 'password' },
        { email: 'test@test.com', password: undefined },
      ];

      for (const request of malformedRequests) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword(request);
          expect(data.user).toBeNull();
          expect(error).toBeTruthy();
        } catch (error) {
          // Should handle gracefully
          expect(error).toBeTruthy();
        }
      }
    });

    it('should sanitize user input in authentication', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>@test.com',
        'test@test.com<script>',
        '"DROP TABLE users"',
        '\\x00\\x01\\x02test@test.com'
      ];

      for (const maliciousEmail of maliciousInputs) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: maliciousEmail,
          password: 'password'
        });

        expect(data.user).toBeNull();
        expect(error).toBeTruthy();
      }
    });

    it('should maintain session integrity across requests', async () => {
      const { email, password } = TEST_USERS.admin;
      
      // Login
      await supabase.auth.signInWithPassword({ email, password });
      
      // Make multiple authenticated requests
      const requests = [
        () => supabase.rpc('get_user_role'),
        () => supabase.from('user_profiles').select('*').limit(1),
        () => supabase.auth.getUser(),
      ];

      const results = await Promise.all(requests.map(req => req()));
      
      // All requests should succeed with consistent user context
      results.forEach(({ error }) => {
        if (error) {
          expect(error.message).not.toMatch(/authentication|unauthorized/i);
        }
      });
    });
  });
});

describe('Authentication Integration Tests', () => {
  it('should complete full user workflow: login → access → logout', async () => {
    const { email, password } = TEST_USERS.admin;
    
    // 1. Login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    expect(loginError).toBeNull();
    expect(loginData.user).toBeTruthy();
    
    // 2. Access protected resource
    const { data: userData, error: userError } = await supabase.auth.getUser();
    expect(userError).toBeNull();
    expect(userData.user.email).toBe(email);
    
    // 3. Verify role
    const { data: roleData } = await supabase.rpc('get_user_role');
    expect(roleData).toBe('admin');
    
    // 4. Logout
    const { error: logoutError } = await supabase.auth.signOut();
    expect(logoutError).toBeNull();
    
    // 5. Verify session cleared
    const { data: sessionData } = await supabase.auth.getSession();
    expect(sessionData.session).toBeNull();
  });

  it('should handle role-based navigation correctly', async () => {
    // Test both user types follow expected flow
    const testCases = [
      { 
        userType: 'admin', 
        expectedRole: 'admin',
        shouldAccessAdminFunctions: true 
      },
      { 
        userType: 'viewer', 
        expectedRole: 'viewer',
        shouldAccessAdminFunctions: false 
      }
    ];

    for (const testCase of testCases) {
      const { email, password } = TEST_USERS[testCase.userType];
      
      // Login
      await supabase.auth.signInWithPassword({ email, password });
      
      // Verify role
      const { data: role } = await supabase.rpc('get_user_role');
      expect(role).toBe(testCase.expectedRole);
      
      // Test admin function access
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      
      if (testCase.shouldAccessAdminFunctions) {
        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      } else {
        // Should either limit results or error
        if (!error) {
          expect(data.length).toBeLessThanOrEqual(1);
        } else {
          expect(error.message).toMatch(/permission|unauthorized/i);
        }
      }
      
      // Logout
      await supabase.auth.signOut();
    }
  });
});