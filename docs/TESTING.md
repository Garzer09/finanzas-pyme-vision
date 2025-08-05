# Testing Guide - Authentication System

This document provides comprehensive instructions for testing the authentication system of the finanzas-pyme-vision application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Test Users Setup](#test-users-setup)
3. [Running Automated Tests](#running-automated-tests)
4. [Manual Testing](#manual-testing)
5. [Test Coverage](#test-coverage)
6. [Troubleshooting](#troubleshooting)
7. [Security Considerations](#security-considerations)

## Prerequisites

Before testing the authentication system, ensure you have:

### Environment Setup
1. **Node.js** (v18+ recommended)
2. **npm** or **yarn** package manager
3. **Supabase project** configured
4. **Environment variables** properly set

### Required Environment Variables

Create a `.env` file in the project root with:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Enable debug mode for detailed logging
VITE_DEBUG_MODE=true
VITE_ENABLE_LOGGING=true
VITE_LOG_LEVEL=DEBUG
```

### Dependencies Installation

```bash
npm install
```

## Test Users Setup

### Automatic Test User Creation

The project includes a script to automatically create test users with predefined credentials and roles.

#### Running the Script

```bash
# Create test users
npm run create-test-users

# Or directly
node scripts/create_test_users.js
```

#### Script Options

```bash
# Clean existing test users before creating new ones
npm run create-test-users -- --clean

# View help
node scripts/create_test_users.js --help
```

#### Created Test Users

The script creates the following test users:

| User Type | Email | Password | Role | Permissions |
|-----------|--------|----------|------|-------------|
| **Admin** | `admin@test.finanzas-pyme.com` | `AdminTest123!` | `admin` | Full access to all features |
| **Viewer** | `viewer@test.finanzas-pyme.com` | `ViewerTest123!` | `viewer` | Limited access, read-only |

### Manual Test User Creation

If you need to create test users manually:

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to Authentication > Users

2. **Create Admin User**
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES ('admin@test.finanzas-pyme.com', crypt('AdminTest123!', gen_salt('bf')), now());
   
   -- Set admin role
   INSERT INTO public.user_roles (user_id, role)
   VALUES ((SELECT id FROM auth.users WHERE email = 'admin@test.finanzas-pyme.com'), 'admin');
   ```

3. **Create Viewer User**
   ```sql
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES ('viewer@test.finanzas-pyme.com', crypt('ViewerTest123!', gen_salt('bf')), now());
   
   -- Set viewer role (stored as 'user' in database)
   INSERT INTO public.user_roles (user_id, role)
   VALUES ((SELECT id FROM auth.users WHERE email = 'viewer@test.finanzas-pyme.com'), 'user');
   ```

## Running Automated Tests

### Full Test Suite

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:ui
```

### Authentication-Specific Tests

```bash
# Run only authentication tests
npm run test:auth

# Run with detailed output
npm run test:auth -- --reporter=verbose

# Run specific test cases
npm run test:auth -- --grep "login flow"
```

### Test Categories

The automated test suite covers:

#### 1. **Login Flow Tests**
- ✅ Successful authentication with valid credentials
- ❌ Failed authentication with invalid credentials
- 🔒 Password security validation
- 🚫 SQL injection prevention
- ⏱️ Network timeout handling

#### 2. **Role-Based Access Control Tests**
- 👑 Admin user permissions and access
- 👤 Viewer user permissions and restrictions
- 🚫 Role escalation prevention
- 🔐 Permission enforcement

#### 3. **Session Management Tests**
- 🔄 Session creation and validation
- 🔄 Token refresh mechanism
- 👋 Logout and session cleanup
- 👥 Concurrent session handling

#### 4. **Security Tests**
- 🛡️ Brute force attack prevention
- 🧹 Input sanitization
- 🔒 CSRF protection
- 📋 Malformed request handling

### Expected Test Results

All tests should pass if the environment is properly configured:

```
Authentication System - Comprehensive Tests
✓ Login Flow - Success Cases (8 tests)
✓ Login Flow - Failure Cases (12 tests)
✓ Role-Based Access Control (4 tests)
✓ Session Management (4 tests)
✓ Password Security (3 tests)
✓ Permission Enforcement (3 tests)
✓ Edge Cases and Security (3 tests)

Authentication Integration Tests
✓ Integration workflows (2 tests)

Total: 39 tests passed
```

## Manual Testing

### 1. Login Testing

#### Admin User Login
1. Navigate to `/auth`
2. Enter credentials:
   - Email: `admin@test.finanzas-pyme.com`
   - Password: `AdminTest123!`
3. Click "Iniciar Sesión"
4. **Expected**: Redirect to `/admin/empresas` (admin dashboard)

#### Viewer User Login
1. Navigate to `/auth`
2. Enter credentials:
   - Email: `viewer@test.finanzas-pyme.com`
   - Password: `ViewerTest123!`
3. Click "Iniciar Sesión"
4. **Expected**: Redirect to `/app/mis-empresas` (viewer dashboard)

#### Invalid Credentials
1. Try logging in with wrong email or password
2. **Expected**: Error message displayed, no redirect

### 2. Role-Based Access Testing

#### Admin Access Verification
1. Login as admin user
2. Test access to admin routes:
   - `/admin/empresas` ✅ Should work
   - `/admin/users` ✅ Should work
   - `/admin/settings` ✅ Should work
3. **Expected**: Full access to all admin features

#### Viewer Access Verification
1. Login as viewer user
2. Test access restrictions:
   - `/admin/empresas` ❌ Should redirect or show error
   - `/app/mis-empresas` ✅ Should work
   - Direct URL manipulation ❌ Should be blocked

### 3. Session Management Testing

#### Session Persistence
1. Login with any user
2. Refresh the page
3. **Expected**: User remains logged in

#### Logout Testing
1. Login with any user
2. Click logout button
3. **Expected**: 
   - Redirect to login page
   - No access to protected routes
   - Session completely cleared

#### Session Timeout
1. Login and remain inactive for 30 minutes (if configured)
2. **Expected**: Automatic logout or warning

### 4. Security Testing

#### Brute Force Protection
1. Make multiple failed login attempts (5+ times)
2. **Expected**: Rate limiting kicks in, temporary lockout

#### Direct Route Access
1. Without logging in, try accessing:
   - `/admin/empresas`
   - `/app/mis-empresas`
2. **Expected**: Redirect to `/auth`

## Test Coverage

### Current Coverage Areas

- ✅ **Authentication Flows**: Login, logout, signup
- ✅ **Role Management**: Admin vs viewer permissions
- ✅ **Session Handling**: Creation, persistence, cleanup
- ✅ **Security**: Rate limiting, input validation, CSRF
- ✅ **Error Handling**: Network errors, invalid input
- ✅ **Integration**: End-to-end user workflows

### Coverage Metrics

Run coverage reports to see detailed metrics:

```bash
npm run test:coverage
```

Target coverage goals:
- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

## Troubleshooting

### Common Issues

#### 1. Test Users Not Found
**Error**: `Test user admin not found or invalid`

**Solution**:
```bash
# Recreate test users
npm run create-test-users -- --clean
```

#### 2. Environment Variables Missing
**Error**: `Missing required environment variables`

**Solution**:
1. Check `.env` file exists
2. Verify Supabase URL and key are correct
3. Restart development server

#### 3. Supabase Connection Issues
**Error**: `Failed to connect to Supabase`

**Solution**:
1. Verify Supabase project is active
2. Check network connectivity
3. Verify API keys are valid

#### 4. Role Detection Issues
**Error**: `Role query returned null`

**Solution**:
1. Check database migrations are applied
2. Verify `get_user_role()` function exists
3. Check RLS policies are configured

### Debug Mode

Enable debug mode for detailed logging:

```bash
# In .env file
VITE_DEBUG_MODE=true
VITE_ENABLE_LOGGING=true
VITE_LOG_LEVEL=DEBUG

# Then run tests
npm run test:auth -- --reporter=verbose
```

### Database State Verification

Check database state directly:

```sql
-- Verify test users exist
SELECT email, created_at FROM auth.users 
WHERE email LIKE '%@test.finanzas-pyme.com';

-- Check user roles
SELECT u.email, ur.role 
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email LIKE '%@test.finanzas-pyme.com';

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive 
FROM pg_policies 
WHERE tablename IN ('user_roles', 'user_profiles');
```

## Security Considerations

### Test Environment Security

⚠️ **Important Security Notes**:

1. **Test Credentials**: The test users have well-known passwords and should **NEVER** be used in production environments.

2. **Environment Isolation**: Always run tests in isolated development/testing environments.

3. **Data Cleanup**: Test data should be regularly cleaned up to prevent accumulation.

4. **Access Control**: Ensure test environments don't have access to production data.

### Production Testing

For production testing:

1. **Use different credentials** with complex, unique passwords
2. **Implement proper test data lifecycle management**
3. **Use separate Supabase projects** for different environments
4. **Enable audit logging** for security monitoring
5. **Regular security assessments** of authentication flows

### Sensitive Data Handling

- Test users should not contain real personal information
- Use mock data for profile information
- Regularly rotate test credentials
- Monitor for any data leakage between environments

## Advanced Testing Scenarios

### Multi-Factor Authentication (MFA)
If MFA is enabled:
```bash
# Test MFA setup and validation
npm run test:auth -- --grep "mfa"
```

### Password Reset Flow
```bash
# Test password recovery
npm run test:auth -- --grep "password reset"
```

### Concurrent Sessions
```bash
# Test multiple simultaneous logins
npm run test:auth -- --grep "concurrent"
```

### Performance Testing
```bash
# Run performance tests
npm run test:auth -- --performance
```

## Continuous Integration

### CI/CD Pipeline Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test-auth.yml
name: Authentication Tests
on: [push, pull_request]
jobs:
  test-auth:
    runs-on: ubuntu-latest
    env:
      VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run create-test-users
      - run: npm run test:auth
```

---

## Support

For additional help:

1. **Check the logs**: Enable debug mode for detailed output
2. **Review test results**: Look for specific failing assertions
3. **Verify environment**: Ensure all prerequisites are met
4. **Consult documentation**: Reference Supabase and React documentation
5. **Community support**: Reach out to the development team

---

*Last updated: January 2025*