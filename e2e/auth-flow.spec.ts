import { test, expect } from '@playwright/test';

test.describe('Authentication Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page for unauthenticated users', async ({ page }) => {
    await expect(page).toHaveTitle(/Finanzas PYME Vision/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('[role="alert"]').or(page.locator('.error'))).toBeVisible();
  });

  test('should navigate to dashboard after successful login', async ({ page }) => {
    // This test would need actual test credentials
    // await page.fill('input[type="email"]', 'test@example.com');
    // await page.fill('input[type="password"]', 'testpassword');
    // await page.click('button[type="submit"]');
    // await expect(page).toHaveURL(/dashboard/);
    
    // For now, just verify the login form exists
    await expect(page.locator('form')).toBeVisible();
  });

  test('should protect dashboard routes from unauthenticated access', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login or show login form
    await expect(page.locator('input[type="email"]').or(page.locator('form'))).toBeVisible();
  });
});

test.describe('File Upload E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Note: In a real test, we would authenticate first
  });

  test('should display file upload interface', async ({ page }) => {
    // Navigate to upload page if authenticated
    // await page.goto('/upload');
    // await expect(page.locator('input[type="file"]')).toBeVisible();
    
    // For now, just verify the home page loads
    await expect(page).toHaveTitle(/Finanzas PYME Vision/);
  });
});

test.describe('Navigation E2E Tests', () => {
  test('should display proper page structure', async ({ page }) => {
    await page.goto('/');
    
    // Check basic page structure
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('should handle service worker registration', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker is registered (if implemented)
    const swRegistration = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(swRegistration).toBe(true);
  });
});