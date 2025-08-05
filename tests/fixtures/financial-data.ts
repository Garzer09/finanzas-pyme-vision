/**
 * Financial Data Test Fixtures
 * 
 * Sample financial data for testing financial modules
 */

export const mockFinancialEntry = {
  account: '1100 - Caja',
  debit: 1000,
  credit: 0,
  description: 'Venta de contado',
  date: new Date('2024-01-15'),
  reference: 'FAC-001',
  category: 'Ingresos',
};

export const mockBalanceSheet = {
  assets: {
    current: 150000,
    nonCurrent: 350000,
    total: 500000,
  },
  liabilities: {
    current: 75000,
    nonCurrent: 225000,
    total: 300000,
  },
  equity: {
    capital: 150000,
    retainedEarnings: 50000,
    total: 200000,
  },
};

export const mockIncomeStatement = {
  revenue: {
    sales: 1200000,
    otherIncome: 50000,
    total: 1250000,
  },
  expenses: {
    costOfGoodsSold: 720000,
    operatingExpenses: 350000,
    financialExpenses: 30000,
    total: 1100000,
  },
  netIncome: 150000,
};

export const mockCashFlow = {
  operatingActivities: {
    netIncome: 150000,
    depreciation: 50000,
    changesInWorkingCapital: -25000,
    total: 175000,
  },
  investingActivities: {
    equipmentPurchases: -75000,
    total: -75000,
  },
  financingActivities: {
    loanProceeds: 100000,
    dividendsPaid: -25000,
    total: 75000,
  },
  netCashFlow: 175000,
};

export const mockExcelData = [
  ['Cuenta', 'Débito', 'Crédito', 'Descripción', 'Fecha'],
  ['1100 - Caja', '1000', '', 'Venta de contado', '2024-01-15'],
  ['4100 - Ventas', '', '1000', 'Venta de contado', '2024-01-15'],
  ['2100 - Cuentas por pagar', '500', '', 'Compra de mercancía', '2024-01-16'],
  ['1200 - Inventario', '', '500', 'Compra de mercancía', '2024-01-16'],
];

export const mockInvalidExcelData = [
  ['Cuenta', 'Débito', 'Crédito'], // Missing required columns
  ['1100', 'abc', ''], // Invalid numeric data
  ['', '1000', '500'], // Missing account
];

export const mockRatios = {
  liquidity: {
    currentRatio: 2.0,
    quickRatio: 1.5,
    cashRatio: 0.8,
  },
  profitability: {
    grossMargin: 0.4,
    netMargin: 0.12,
    roe: 0.75,
    roa: 0.3,
  },
  leverage: {
    debtToEquity: 1.5,
    debtToAssets: 0.6,
    interestCoverage: 5.0,
  },
  efficiency: {
    assetTurnover: 2.5,
    inventoryTurnover: 12,
    receivablesTurnover: 8,
  },
};

export const mockCompanyProfile = {
  id: 'test-company-001',
  name: 'Empresa Test S.A.',
  taxId: '12345678-9',
  industry: 'Comercio',
  size: 'Pequeña',
  foundedYear: 2020,
  currency: 'CLP',
  fiscalYearEnd: '12-31',
};

export const mockUserProfile = {
  id: 'test-user-001',
  email: 'test@finanzas-pyme.com',
  role: 'admin',
  companyId: 'test-company-001',
  permissions: ['read', 'write', 'delete'],
};

export const mockTemplateConfig = {
  id: 'template-001',
  name: 'Balance General Estándar',
  type: 'balance_sheet',
  columns: [
    { name: 'Cuenta', required: true, type: 'string' },
    { name: 'Débito', required: false, type: 'number' },
    { name: 'Crédito', required: false, type: 'number' },
    { name: 'Descripción', required: true, type: 'string' },
    { name: 'Fecha', required: true, type: 'date' },
  ],
  validationRules: {
    accountingEquation: true,
    balanceCheck: true,
    debitCreditValidation: true,
  },
};

export const mockInvalidBalanceSheet = {
  assets: {
    current: 150000,
    nonCurrent: 350000,
    total: 500000,
  },
  liabilities: {
    current: 75000,
    nonCurrent: 225000,
    total: 300000,
  },
  equity: {
    capital: 150000,
    retainedEarnings: 100000, // This will make the equation not balance
    total: 250000,
  },
};

export const mockFileUploadResult = {
  success: true,
  fileId: 'file-001',
  message: 'Archivo procesado exitosamente',
  templateDetection: {
    templateId: 'template-001',
    confidence: 0.95,
  },
};

export const mockProcessingError = {
  success: false,
  message: 'Error al procesar archivo',
  error: 'INVALID_FORMAT',
};

// Helper functions for creating test data
export const createMockFinancialEntry = (overrides = {}) => ({
  ...mockFinancialEntry,
  ...overrides,
});

export const createMockBalanceSheet = (overrides = {}) => ({
  ...mockBalanceSheet,
  ...overrides,
});

export const createMockCompany = (overrides = {}) => ({
  ...mockCompanyProfile,
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  ...mockUserProfile,
  ...overrides,
});