/**
 * Tests for Enhanced Data Validation and Accounting Coherence
 */

import { describe, it, expect } from 'vitest';
import {
  DataSanitizer,
  AccountingValidator,
  DataValidationPipeline,
  FinancialEntrySchema,
  BalanceSheetSchema,
  IncomeStatementSchema,
} from '../dataValidation';

describe('DataSanitizer', () => {
  describe('sanitizeAmount', () => {
    it('should handle valid numeric inputs', () => {
      expect(DataSanitizer.sanitizeAmount(123.45)).toBe(123.45);
      expect(DataSanitizer.sanitizeAmount(0)).toBe(0);
      expect(DataSanitizer.sanitizeAmount(-50.25)).toBe(-50.25);
    });

    it('should handle string inputs with currency symbols', () => {
      expect(DataSanitizer.sanitizeAmount('$123.45')).toBe(123.45);
      expect(DataSanitizer.sanitizeAmount('€1,234.56')).toBe(1234.56);
      expect(DataSanitizer.sanitizeAmount('£50')).toBe(50);
    });

    it('should normalize decimal separators', () => {
      expect(DataSanitizer.sanitizeAmount('123,45')).toBe(123.45);
      expect(DataSanitizer.sanitizeAmount('1.234,56')).toBe(1234.56);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => DataSanitizer.sanitizeAmount('invalid')).toThrow('Monto inválido');
      expect(() => DataSanitizer.sanitizeAmount(NaN)).toThrow('Monto inválido');
      expect(() => DataSanitizer.sanitizeAmount(Infinity)).toThrow('Monto inválido');
    });

    it('should round to 2 decimal places', () => {
      expect(DataSanitizer.sanitizeAmount(123.456)).toBe(123.46);
      expect(DataSanitizer.sanitizeAmount(123.454)).toBe(123.45);
    });
  });

  describe('sanitizeAccountName', () => {
    it('should clean account names', () => {
      expect(DataSanitizer.sanitizeAccountName('  Cash Account  ')).toBe('Cash Account');
      expect(DataSanitizer.sanitizeAccountName('Cash<script>alert("xss")</script>')).toBe('Cashalert(xss)');
      expect(DataSanitizer.sanitizeAccountName('Accounts "Receivable"')).toBe('Accounts Receivable');
    });

    it('should limit account name length', () => {
      const longName = 'A'.repeat(150);
      expect(DataSanitizer.sanitizeAccountName(longName)).toHaveLength(100);
    });
  });

  describe('sanitizeDescription', () => {
    it('should normalize whitespace', () => {
      expect(DataSanitizer.sanitizeDescription('  Multiple   spaces  ')).toBe('Multiple spaces');
    });

    it('should limit description length', () => {
      const longDesc = 'A'.repeat(600);
      expect(DataSanitizer.sanitizeDescription(longDesc)).toHaveLength(500);
    });
  });

  describe('sanitizeDate', () => {
    it('should handle valid date inputs', () => {
      const date = new Date('2023-01-01');
      expect(DataSanitizer.sanitizeDate(date)).toEqual(date);
      expect(DataSanitizer.sanitizeDate('2023-01-01')).toEqual(new Date('2023-01-01'));
    });

    it('should throw error for invalid dates', () => {
      expect(() => DataSanitizer.sanitizeDate('invalid-date')).toThrow('Fecha inválida');
      expect(() => DataSanitizer.sanitizeDate('1800-01-01')).toThrow('Fecha fuera de rango');
      expect(() => DataSanitizer.sanitizeDate('2200-01-01')).toThrow('Fecha fuera de rango');
    });
  });
});

describe('FinancialEntrySchema', () => {
  it('should validate correct financial entries', () => {
    const validEntry = {
      account: 'Cash',
      debit: 100,
      description: 'Initial deposit',
      date: new Date(),
    };

    expect(() => FinancialEntrySchema.parse(validEntry)).not.toThrow();
  });

  it('should reject entries with both debit and credit', () => {
    const invalidEntry = {
      account: 'Cash',
      debit: 100,
      credit: 100,
      description: 'Invalid entry',
      date: new Date(),
    };

    expect(() => FinancialEntrySchema.parse(invalidEntry)).toThrow();
  });

  it('should reject entries with neither debit nor credit', () => {
    const invalidEntry = {
      account: 'Cash',
      description: 'Invalid entry',
      date: new Date(),
    };

    expect(() => FinancialEntrySchema.parse(invalidEntry)).toThrow();
  });

  it('should reject negative amounts', () => {
    const invalidEntry = {
      account: 'Cash',
      debit: -100,
      description: 'Invalid negative amount',
      date: new Date(),
    };

    expect(() => FinancialEntrySchema.parse(invalidEntry)).toThrow();
  });
});

describe('BalanceSheetSchema', () => {
  it('should validate balanced balance sheet', () => {
    const balancedSheet = {
      assets: {
        current: 1000,
        nonCurrent: 2000,
        total: 3000,
      },
      liabilities: {
        current: 500,
        nonCurrent: 1500,
        total: 2000,
      },
      equity: {
        capital: 800,
        retainedEarnings: 200,
        total: 1000,
      },
    };

    expect(() => BalanceSheetSchema.parse(balancedSheet)).not.toThrow();
  });

  it('should reject unbalanced balance sheet', () => {
    const unbalancedSheet = {
      assets: {
        current: 1000,
        nonCurrent: 2000,
        total: 3000,
      },
      liabilities: {
        current: 500,
        nonCurrent: 1500,
        total: 2000,
      },
      equity: {
        capital: 800,
        retainedEarnings: 200,
        total: 1100, // This makes it unbalanced
      },
    };

    expect(() => BalanceSheetSchema.parse(unbalancedSheet)).toThrow();
  });

  it('should allow small rounding differences', () => {
    const nearlyBalanced = {
      assets: {
        current: 1000,
        nonCurrent: 2000,
        total: 3000.005, // Small rounding difference
      },
      liabilities: {
        current: 500,
        nonCurrent: 1500,
        total: 2000,
      },
      equity: {
        capital: 800,
        retainedEarnings: 200,
        total: 1000,
      },
    };

    expect(() => BalanceSheetSchema.parse(nearlyBalanced)).not.toThrow();
  });
});

describe('AccountingValidator', () => {
  describe('validateJournalEntry', () => {
    it('should validate balanced journal entries', () => {
      const entries = [
        {
          account: 'Cash',
          debit: 1000,
          description: 'Initial investment',
        },
        {
          account: 'Capital',
          credit: 1000,
          description: 'Initial investment',
        },
      ];

      const result = AccountingValidator.validateJournalEntry(entries);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject unbalanced journal entries', () => {
      const entries = [
        {
          account: 'Cash',
          debit: 1000,
          description: 'Unbalanced entry',
        },
        {
          account: 'Capital',
          credit: 900, // Unbalanced
          description: 'Unbalanced entry',
        },
      ];

      const result = AccountingValidator.validateJournalEntry(entries);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('desbalanceados'))).toBe(true);
    });

    it('should handle complex multi-entry transactions', () => {
      const entries = [
        {
          account: 'Cash',
          debit: 1500,
          description: 'Sales transaction',
        },
        {
          account: 'Inventory',
          credit: 1000,
          description: 'Cost of goods sold',
        },
        {
          account: 'Sales Revenue',
          credit: 500,
          description: 'Profit on sale',
        },
      ];

      const result = AccountingValidator.validateJournalEntry(entries);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateTrialBalance', () => {
    it('should validate balanced trial balance', () => {
      const accounts = [
        { account: 'Cash', debit: 1000, credit: 0 },
        { account: 'Accounts Receivable', debit: 500, credit: 0 },
        { account: 'Accounts Payable', debit: 0, credit: 300 },
        { account: 'Capital', debit: 0, credit: 1200 },
      ];

      const result = AccountingValidator.validateTrialBalance(accounts);
      expect(result.isValid).toBe(true);
      expect(result.summary.totalDebits).toBe(1500);
      expect(result.summary.totalCredits).toBe(1500);
    });

    it('should reject unbalanced trial balance', () => {
      const accounts = [
        { account: 'Cash', debit: 1000, credit: 0 },
        { account: 'Capital', debit: 0, credit: 900 }, // Unbalanced
      ];

      const result = AccountingValidator.validateTrialBalance(accounts);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('desbalanceado'))).toBe(true);
    });
  });

  describe('validateFinancialRatios', () => {
    it('should validate reasonable financial ratios', () => {
      const data = {
        currentAssets: 1000,
        currentLiabilities: 500,
        totalAssets: 2000,
        totalLiabilities: 800,
        revenue: 5000,
        netIncome: 500,
      };

      const result = AccountingValidator.validateFinancialRatios(data);
      expect(result.isValid).toBe(true);
      expect(result.ratios.currentRatio).toBe(2);
      expect(result.ratios.debtToAssets).toBe(0.4);
      expect(result.ratios.profitMargin).toBe(0.1);
    });

    it('should warn about unusual ratios', () => {
      const data = {
        currentAssets: 100,
        currentLiabilities: 500, // Very low current ratio
        totalAssets: 1000,
        totalLiabilities: 950, // Very high debt
        revenue: 1000,
        netIncome: -600, // Very negative margin
      };

      const result = AccountingValidator.validateFinancialRatios(data);
      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

describe('DataValidationPipeline', () => {
  describe('validateFinancialFile', () => {
    it('should process valid financial data', async () => {
      const data = [
        {
          account: 'Cash',
          debit: 1000,
          description: 'Initial deposit',
          date: '2023-01-01',
        },
        {
          account: 'Capital',
          credit: 1000,
          description: 'Initial capital',
          date: '2023-01-01',
        },
      ];

      const result = await DataValidationPipeline.validateFinancialFile(data);
      expect(result.isValid).toBe(true);
      expect(result.processedData).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid data gracefully', async () => {
      const data = [
        {
          account: '', // Invalid empty account
          debit: 'invalid', // Invalid amount
          description: '',
          date: 'invalid-date',
        },
      ];

      const result = await DataValidationPipeline.validateFinancialFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should sanitize data during processing', async () => {
      const data = [
        {
          account: '  Cash Account  ',
          debit: '$1,234.56',
          description: '  Multiple   spaces  ',
          date: '2023-01-01',
        },
        {
          account: 'Capital',
          credit: '€1,234.56',
          description: 'Initial capital',
          date: '2023-01-01',
        },
      ];

      const result = await DataValidationPipeline.validateFinancialFile(data);
      expect(result.isValid).toBe(true);
      expect(result.processedData[0].account).toBe('Cash Account');
      expect(result.processedData[0].debit).toBe(1234.56);
      expect(result.processedData[0].description).toBe('Multiple spaces');
    });

    it('should reject empty or invalid file data', async () => {
      const result1 = await DataValidationPipeline.validateFinancialFile([]);
      expect(result1.isValid).toBe(false);
      expect(result1.errors.some(error => error.includes('vacío'))).toBe(true);

      const result2 = await DataValidationPipeline.validateFinancialFile(null as any);
      expect(result2.isValid).toBe(false);
    });
  });
});