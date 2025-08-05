import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1, // Single worker to avoid auth conflicts
  reporter: process.env.CI ? [['json', { outputFile: 'test-results/e2e-results.json' }], ['html']] : 'html',
  timeout: 60000, // 60 seconds per test for comprehensive workflows
  expect: {
    timeout: 15000, // 15 seconds for expect assertions
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000, // 15 seconds for actions
    navigationTimeout: 20000, // 20 seconds for navigation
    // Increase timeouts for file uploads and processing
    launchOptions: {
      slowMo: process.env.CI ? 0 : 100, // Slow down in local development
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // Temporarily disable webkit tests as they're failing in CI
    // Re-enable once browser installation is stable
    ...(process.env.CI ? [] : [{
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }]),
  ],

  webServer: {
    command: 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    reuseExistingServer: true, // Always reuse existing server
    timeout: 120 * 1000, // 2 minutes to start server
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://demo.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'demo-key',
      VITE_DEBUG_MODE: 'false', // Disable debug mode for cleaner test output
      VITE_ENABLE_LOGGING: 'false',
    },
  },

  // Global setup and teardown
  globalSetup: './tests/e2e/global-setup.ts',
});