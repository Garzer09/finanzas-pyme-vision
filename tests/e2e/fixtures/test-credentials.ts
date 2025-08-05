/**
 * Test credentials for E2E testing
 * These match the users created by the create_test_users.js script
 */

export const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@test.finanzas-pyme.com',
    password: 'AdminTest123!',
    role: 'admin',
    displayName: 'Administrator Test'
  },
  viewer: {
    email: 'viewer@test.finanzas-pyme.com', 
    password: 'ViewerTest123!',
    role: 'viewer',
    displayName: 'Viewer Test'
  }
} as const;

export const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@demo.com',
    password: 'DemoAdmin2024!',
    role: 'admin',
    displayName: 'Demo Administrator'
  }
} as const;

// Use test credentials by default, but allow override for demo environment
export const getTestCredentials = (useDemo = false) => {
  return useDemo ? DEMO_CREDENTIALS : TEST_CREDENTIALS;
};