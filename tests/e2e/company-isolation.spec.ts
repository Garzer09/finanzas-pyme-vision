import { test, expect } from '@playwright/test';
import { loginAsViewer, clearAuthState } from './helpers/auth-helpers';

// Utility to generate a random UUID-like string (not guaranteed UUID)
function randomUUIDLike() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Minimal set of dashboard paths to probe isolation quickly
const DASHBOARD_PATHS = [
  'cuenta-pyg',
  'balance-situacion',
  'ratios-financieros',
  'flujos-caja',
  'analisis-nof',
  'punto-muerto',
  'endeudamiento',
  'servicio-deuda',
  'situacion-actual',
  'supuestos-financieros',
];

test.describe('Company Data Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('User cannot access data of a random unauthorized company', async ({ page }) => {
    await loginAsViewer(page);

    const randomCompanyId = randomUUIDLike();

    for (const subpath of DASHBOARD_PATHS) {
      const url = `/app/${randomCompanyId}/${subpath}`;
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Expect page to render without crashing but not expose key financial indicators
      const forbiddenIndicators = [
        'EBITDA',
        'Ingresos',
        'Deuda',
        'Flujo Operativo',
        'Servicio de Deuda',
      ];

      let indicatorFound = false;
      for (const text of forbiddenIndicators) {
        const visible = await page.locator(`text=${text}`).first().isVisible().catch(() => false);
        if (visible) {
          indicatorFound = true;
          break;
        }
      }

      // We assert that no obvious financial indicators are shown for unauthorized company
      expect(indicatorFound, `Unexpected financial indicator visible on ${url}`).toBe(false);
    }
  });
});
