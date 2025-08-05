/**
 * Test file configurations for E2E testing
 * References files available in public/templates/
 */

import path from 'path';

export const TEST_FILES = {
  // Core financial data files
  cuentaPyG: {
    path: path.join(process.cwd(), 'public', 'templates', 'cuenta-pyg.csv'),
    name: 'cuenta-pyg.csv',
    description: 'Profit & Loss statement data',
    expectedData: ['Importe Neto Cifra Negocios', 'EBITDA', 'EBIT']
  },
  
  balanceSituacion: {
    path: path.join(process.cwd(), 'public', 'templates', 'balance-situacion.csv'),
    name: 'balance-situacion.csv', 
    description: 'Balance sheet data',
    expectedData: ['Activo', 'Pasivo', 'Patrimonio Neto']
  },
  
  estadoFlujos: {
    path: path.join(process.cwd(), 'public', 'templates', 'estado-flujos.csv'),
    name: 'estado-flujos.csv',
    description: 'Cash flow statement data',
    expectedData: ['Flujos de efectivo']
  },
  
  // Validation test files
  validComma: {
    path: path.join(process.cwd(), 'public', 'templates', 'valid_comma.csv'),
    name: 'valid_comma.csv',
    description: 'Valid CSV with comma delimiter',
    expectedData: ['TechCorp SA', 'Tecnología']
  },
  
  validSemicolon: {
    path: path.join(process.cwd(), 'public', 'templates', 'valid_semicolon.csv'),
    name: 'valid_semicolon.csv',
    description: 'Valid CSV with semicolon delimiter',
    expectedData: ['TechCorp SA', 'Tecnología']
  },
  
  testData: {
    path: path.join(process.cwd(), 'public', 'templates', 'test-data.csv'),
    name: 'test-data.csv',
    description: 'General test data',
    expectedData: ['TechCorp SA', 'Madrid', 'Tecnología']
  },
  
  // Demo files for comprehensive testing
  demo: {
    empresaCualitativa: {
      path: path.join(process.cwd(), 'public', 'templates', 'demo', 'empresa_cualitativa.csv'),
      name: 'empresa_cualitativa.csv',
      description: 'Company qualitative data',
      expectedData: ['DEMO Tech Solutions SL']
    },
    
    cuentaPyG: {
      path: path.join(process.cwd(), 'public', 'templates', 'demo', 'cuenta-pyg.csv'),
      name: 'cuenta-pyg.csv',
      description: 'Demo P&L data',
      expectedData: ['Ventas', 'Costes']
    }
  }
} as const;

export const getTestFile = (fileKey: keyof typeof TEST_FILES) => {
  return TEST_FILES[fileKey];
};

export const getAllTestFiles = () => {
  return Object.values(TEST_FILES).filter(file => typeof file === 'object' && 'path' in file);
};