import { beforeEach, vi } from 'vitest';

// Mock environment variables for testing
const originalEnv = import.meta.env;

beforeEach(() => {
  // Reset environment for each test
  vi.unstubAllEnvs();
  
  // Set up test environment variables
  vi.stubEnv('VITE_ENVIRONMENT', 'test');
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
  vi.stubEnv('VITE_ENABLE_RATE_LIMITING', 'true');
  vi.stubEnv('VITE_ENABLE_CSRF_PROTECTION', 'true');
  vi.stubEnv('VITE_ENABLE_SECURITY_LOGGING', 'true');
  vi.stubEnv('VITE_ENABLE_HEALTH_MONITORING', 'true');
  vi.stubEnv('VITE_ENABLE_PERFORMANCE_MONITORING', 'true');
  vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123456');
});

// Export helper functions for tests
export const mockProductionEnv = () => {
  vi.stubEnv('VITE_ENVIRONMENT', 'production');
};

export const mockDevelopmentEnv = () => {
  vi.stubEnv('VITE_ENVIRONMENT', 'development');
};

export const mockTestEnv = () => {
  vi.stubEnv('VITE_ENVIRONMENT', 'test');
};