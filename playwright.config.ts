import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for expect assertions
  },
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000, // 10 seconds for actions
    navigationTimeout: 15000, // 15 seconds for navigation
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
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start server
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://demo.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'demo-key',
    },
  },
});