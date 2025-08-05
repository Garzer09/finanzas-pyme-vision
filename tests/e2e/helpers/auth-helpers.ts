/**
 * Authentication helper functions for E2E tests
 */

import { Page, expect } from '@playwright/test';
import { TEST_CREDENTIALS, DEMO_CREDENTIALS } from '../fixtures/test-credentials';

export interface LoginOptions {
  useDemo?: boolean;
  userType?: 'admin' | 'viewer';
  timeout?: number;
}

/**
 * Login with test credentials
 */
export async function loginAsAdmin(page: Page, options: LoginOptions = {}) {
  const { useDemo = false, timeout = 30000 } = options;
  const credentials = useDemo ? DEMO_CREDENTIALS.admin : TEST_CREDENTIALS.admin;
  
  console.log(`🔐 Logging in as admin: ${credentials.email}`);
  
  // Navigate to login page
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');
  
  // Wait for login form to be visible
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout });
  
  // Fill in credentials
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  
  // Submit login form
  const loginButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Iniciar Sesión")'));
  await loginButton.click();
  
  // Wait for successful login (redirect away from auth page)
  await page.waitForURL(/^(?!.*\/auth).*/, { timeout });
  
  // Verify we're logged in by checking for common authenticated elements
  const authenticatedElements = [
    page.locator('[data-testid="sidebar"]'),
    page.locator('.sidebar'),
    page.locator('nav'),
    page.locator('text=Dashboard'),
    page.locator('text=Análisis'),
    page.locator('text=Módulos')
  ];
  
  let authenticated = false;
  for (const element of authenticatedElements) {
    try {
      await element.waitFor({ state: 'visible', timeout: 5000 });
      authenticated = true;
      break;
    } catch {
      // Try next element
    }
  }
  
  if (!authenticated) {
    throw new Error('Failed to verify successful login - no authenticated UI elements found');
  }
  
  console.log('✅ Successfully logged in as admin');
}

/**
 * Login as viewer user
 */
export async function loginAsViewer(page: Page, options: LoginOptions = {}) {
  const { timeout = 30000 } = options;
  const credentials = TEST_CREDENTIALS.viewer;
  
  console.log(`🔐 Logging in as viewer: ${credentials.email}`);
  
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');
  
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout });
  
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  
  const loginButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Iniciar Sesión")'));
  await loginButton.click();
  
  await page.waitForURL(/^(?!.*\/auth).*/, { timeout });
  
  console.log('✅ Successfully logged in as viewer');
}

/**
 * Logout from the application
 */
export async function logout(page: Page) {
  console.log('🚪 Logging out');
  
  // Look for logout button in various common locations
  const logoutSelectors = [
    'button:has-text("Cerrar Sesión")',
    'button:has-text("Logout")',
    'button:has-text("Salir")',
    '[data-testid="logout-button"]',
    '.logout-button'
  ];
  
  for (const selector of logoutSelectors) {
    try {
      const logoutButton = page.locator(selector);
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        break;
      }
    } catch {
      // Try next selector
    }
  }
  
  // Wait to be redirected to auth page or landing page
  await page.waitForURL(/\/(auth|$)/, { timeout: 10000 });
  
  console.log('✅ Successfully logged out');
}

/**
 * Clear authentication state
 */
export async function clearAuthState(page: Page) {
  console.log('🧹 Clearing authentication state');
  
  // Clear localStorage and sessionStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Clear cookies
  await page.context().clearCookies();
  
  console.log('✅ Authentication state cleared');
}

/**
 * Verify user is logged in with correct role
 */
export async function verifyAuthenticatedState(page: Page, expectedRole: 'admin' | 'viewer' = 'admin') {
  console.log(`🔍 Verifying authenticated state with role: ${expectedRole}`);
  
  // Should not be on auth page
  await expect(page).not.toHaveURL(/\/auth/);
  
  // Should have authenticated UI elements
  const sidebarVisible = await page.locator('[data-testid="sidebar"], .sidebar, nav').first().isVisible().catch(() => false);
  
  if (!sidebarVisible) {
    throw new Error('Expected to be authenticated but no navigation elements found');
  }
  
  // For admin, verify access to admin features
  if (expectedRole === 'admin') {
    // Should be able to navigate to upload page
    await page.goto('/subir-excel');
    await expect(page.locator('h1:has-text("Subir Archivo Excel")')).toBeVisible({ timeout: 10000 });
  }
  
  console.log('✅ Authentication state verified');
}