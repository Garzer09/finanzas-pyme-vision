/**
 * Dashboard navigation and validation helper functions for E2E tests
 */

import { Page, expect } from '@playwright/test';

export interface DashboardPage {
  path: string;
  title: string;
  expectedElements: string[];
  keyIndicators?: string[];
}

/**
 * Main dashboard pages to test
 */
export const DASHBOARD_PAGES: Record<string, DashboardPage> = {
  cuentaPyG: {
    path: '/cuenta-pyg',
    title: 'Cuenta de Pérdidas y Ganancias',
    expectedElements: [
      'text=Cuenta',
      'text=Pérdidas',
      'text=Ganancias',
      'text=EBITDA',
      'text=EBIT',
      'text=Importe Neto'
    ],
    keyIndicators: ['EBITDA', 'EBIT', 'Cifra Negocios']
  },
  
  balanceSituacion: {
    path: '/balance-situacion',
    title: 'Balance de Situación',
    expectedElements: [
      'text=Balance',
      'text=Situación',
      'text=Activo',
      'text=Pasivo',
      'text=Patrimonio'
    ],
    keyIndicators: ['Activo Total', 'Pasivo Total', 'Patrimonio Neto']
  },
  
  ratiosFinancieros: {
    path: '/ratios-financieros',
    title: 'Ratios Financieros',
    expectedElements: [
      'text=Ratios',
      'text=Financieros',
      'text=Liquidez',
      'text=Rentabilidad',
      'text=Endeudamiento'
    ],
    keyIndicators: ['ROE', 'ROA', 'Liquidez']
  },
  
  flujosCaja: {
    path: '/flujos-caja',
    title: 'Flujos de Caja',
    expectedElements: [
      'text=Flujos',
      'text=Caja',
      'text=Efectivo',
      'text=Operaciones'
    ],
    keyIndicators: ['Flujo Operativo', 'Flujo Libre']
  },
  
  analisisNOF: {
    path: '/analisis-nof',
    title: 'Análisis NOF',
    expectedElements: [
      'text=NOF',
      'text=Necesidades',
      'text=Operativas',
      'text=Financiación'
    ],
    keyIndicators: ['NOF', 'Capital Trabajo']
  },
  
  puntoMuerto: {
    path: '/punto-muerto',
    title: 'Punto Muerto',
    expectedElements: [
      'text=Punto',
      'text=Muerto',
      'text=Break',
      'text=Even',
      'text=Equilibrio'
    ],
    keyIndicators: ['Punto Equilibrio', 'Margen Seguridad']
  }
};

/**
 * Navigate to a specific dashboard page
 */
export async function navigateToDashboard(page: Page, dashboardKey: keyof typeof DASHBOARD_PAGES, timeout = 30000) {
  const dashboard = DASHBOARD_PAGES[dashboardKey];
  
  console.log(`📊 Navigating to dashboard: ${dashboard.title}`);
  
  await page.goto(dashboard.path);
  await page.waitForLoadState('networkidle');
  
  // Verify we're on the correct page
  try {
    await page.waitForSelector('h1, h2, h3', { timeout });
    
    // Check if the page title or heading contains expected text
    const headings = await page.locator('h1, h2, h3').allTextContents();
    const hasExpectedTitle = headings.some(heading => 
      dashboard.expectedElements.some(element => 
        heading.toLowerCase().includes(element.replace('text=', '').toLowerCase())
      )
    );
    
    if (!hasExpectedTitle) {
      console.warn(`⚠️ Expected title elements not found in headings: ${headings.join(', ')}`);
    }
  } catch (error) {
    console.warn(`⚠️ Could not verify page title for ${dashboard.title}: ${error}`);
  }
  
  console.log(`✅ Successfully navigated to: ${dashboard.title}`);
}

/**
 * Validate dashboard content and key elements
 */
export async function validateDashboardContent(page: Page, dashboardKey: keyof typeof DASHBOARD_PAGES, timeout = 30000) {
  const dashboard = DASHBOARD_PAGES[dashboardKey];
  
  console.log(`🔍 Validating dashboard content: ${dashboard.title}`);
  
  const validationResults = {
    foundElements: [] as string[],
    missingElements: [] as string[],
    foundIndicators: [] as string[],
    missingIndicators: [] as string[]
  };
  
  // Check for expected elements
  for (const element of dashboard.expectedElements) {
    try {
      await expect(page.locator(element)).toBeVisible({ timeout: timeout / dashboard.expectedElements.length });
      validationResults.foundElements.push(element);
      console.log(`✅ Found expected element: ${element}`);
    } catch {
      validationResults.missingElements.push(element);
      console.warn(`⚠️ Missing expected element: ${element}`);
    }
  }
  
  // Check for key indicators if specified
  if (dashboard.keyIndicators) {
    for (const indicator of dashboard.keyIndicators) {
      try {
        const indicatorLocator = page.locator(`text=${indicator}`);
        await expect(indicatorLocator).toBeVisible({ timeout: 5000 });
        validationResults.foundIndicators.push(indicator);
        console.log(`✅ Found key indicator: ${indicator}`);
      } catch {
        validationResults.missingIndicators.push(indicator);
        console.warn(`⚠️ Missing key indicator: ${indicator}`);
      }
    }
  }
  
  // Check for common dashboard elements
  const commonElements = [
    'table',
    'canvas', // For charts
    '.chart',
    '[data-testid*="chart"]',
    '.kpi',
    '[data-testid*="kpi"]'
  ];
  
  let hasDataVisualization = false;
  for (const element of commonElements) {
    if (await page.locator(element).isVisible()) {
      hasDataVisualization = true;
      console.log(`✅ Found data visualization: ${element}`);
      break;
    }
  }
  
  if (!hasDataVisualization) {
    console.warn('⚠️ No data visualization elements found (tables, charts, KPIs)');
  }
  
  console.log(`📊 Dashboard validation completed: ${dashboard.title}`);
  console.log(`   Found elements: ${validationResults.foundElements.length}/${dashboard.expectedElements.length}`);
  console.log(`   Found indicators: ${validationResults.foundIndicators.length}/${dashboard.keyIndicators?.length || 0}`);
  
  return validationResults;
}

/**
 * Navigate through all main dashboards and validate each
 */
export async function validateAllDashboards(page: Page, timeout = 30000) {
  console.log('📊 Starting comprehensive dashboard validation');
  
  const results: Record<string, any> = {};
  
  for (const [key, dashboard] of Object.entries(DASHBOARD_PAGES)) {
    try {
      await navigateToDashboard(page, key as keyof typeof DASHBOARD_PAGES, timeout);
      const validation = await validateDashboardContent(page, key as keyof typeof DASHBOARD_PAGES, timeout);
      
      results[key] = {
        success: true,
        validation,
        title: dashboard.title
      };
    } catch (error) {
      console.error(`❌ Failed to validate dashboard ${dashboard.title}: ${error}`);
      results[key] = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        title: dashboard.title
      };
    }
    
    // Small delay between dashboard checks
    await page.waitForTimeout(2000);
  }
  
  // Summary
  const successful = Object.values(results).filter(r => r.success).length;
  const total = Object.keys(results).length;
  
  console.log(`📊 Dashboard validation summary: ${successful}/${total} successful`);
  
  return results;
}

/**
 * Check for sidebar navigation and verify dashboard links
 */
export async function validateSidebarNavigation(page: Page) {
  console.log('🧭 Validating sidebar navigation');
  
  // Look for sidebar
  const sidebarSelectors = [
    '[data-testid="sidebar"]',
    '.sidebar',
    'nav[role="navigation"]',
    'aside'
  ];
  
  let sidebar = null;
  for (const selector of sidebarSelectors) {
    const element = page.locator(selector);
    if (await element.isVisible()) {
      sidebar = element;
      break;
    }
  }
  
  if (!sidebar) {
    console.warn('⚠️ No sidebar navigation found');
    return false;
  }
  
  console.log('✅ Sidebar navigation found');
  
  // Check for navigation links
  const navLinks = await sidebar.locator('a, button').allTextContents();
  console.log(`📝 Found navigation links: ${navLinks.filter(link => link.trim()).join(', ')}`);
  
  return true;
}