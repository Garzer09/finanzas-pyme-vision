import { test, expect } from '@playwright/test';
import { loginAsAdmin, clearAuthState } from './helpers/auth-helpers';

const COMPANY1_ID = process.env.COMPANY1_ID;
const COMPANY2_ID = process.env.COMPANY2_ID;

// Minimal set of key dashboards
const KEY_DASHBOARDS = ['cuenta-pyg', 'balance-situacion', 'flujos-caja'];

test.describe('Company switching filters all data', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test.skip(!COMPANY1_ID || !COMPANY2_ID, 'Requires COMPANY1_ID and COMPANY2_ID env vars with accessible memberships and data');

  test('Switching companyId updates dashboards across pages', async ({ page }) => {
    await loginAsAdmin(page);

    for (const dashboard of KEY_DASHBOARDS) {
      // Navigate to company 1
      await page.goto(`/app/${COMPANY1_ID}/${dashboard}`);
      await page.waitForLoadState('networkidle');
      const snapshot1 = await page.textContent('body');

      // Navigate to company 2
      await page.goto(`/app/${COMPANY2_ID}/${dashboard}`);
      await page.waitForLoadState('networkidle');
      const snapshot2 = await page.textContent('body');

      // Expect content to differ to some extent (heuristic)
      expect(snapshot1).not.toEqual(snapshot2);
    }
  });
});
