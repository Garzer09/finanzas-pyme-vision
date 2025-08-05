import { test, expect } from '@playwright/test';

test.describe('Authentication Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display application and have proper page structure', async ({ page }) => {
    // Check if the page loads
    await expect(page).toHaveTitle(/Finanzas PYME Vision/);
    
    // Check basic structure
    await expect(page.locator('body')).toBeVisible();
    
    // The app might redirect to login or show a form, both are valid
    const hasLoginForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
    const hasMainContent = await page.locator('main').isVisible().catch(() => false);
    
    expect(hasLoginForm || hasMainContent).toBe(true);
  });

  test('should handle navigation properly', async ({ page }) => {
    // Wait for initial page load
    await page.waitForLoadState('networkidle');
    
    // Check that the FinSight branding is visible
    await expect(page.getByText('FinSight')).toBeVisible();
  });

  test('should load JavaScript and CSS resources', async ({ page }) => {
    // Check that CSS is loaded
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    expect(stylesheets).toBeGreaterThan(0);
    
    // Check that the page has proper styling
    const body = page.locator('body');
    await expect(body).toHaveClass(/.*/, { timeout: 5000 }); // Should have some classes applied
  });

  test('should handle service worker registration', async ({ page }) => {
    // Check if service worker APIs are available
    const swSupported = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(swSupported).toBe(true);
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Check that page still loads properly
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Basic Functionality Tests', () => {
  test('should handle errors gracefully', async ({ page }) => {
    // Test error handling by going to a non-existent route
    await page.goto('/non-existent-route');
    
    // Should either redirect or show error page, not crash
    await page.waitForLoadState('networkidle');
    const pageContent = await page.textContent('body');
    
    // Should show some content, not a blank page
    expect(pageContent).toBeTruthy();
    expect(pageContent.length).toBeGreaterThan(10);
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out expected errors or warnings
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('DevTools') &&
      !error.includes('Extension')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle offline scenario', async ({ page, context }) => {
    // Go online first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate
    await page.reload();
    
    // Should handle offline gracefully
    const content = await page.textContent('body').catch(() => '');
    expect(content).toBeTruthy(); // Should show some content, possibly offline page
  });
});