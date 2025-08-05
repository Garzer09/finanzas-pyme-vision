/**
 * Comprehensive Unit Tests for Data Validation Module
 * 
 * Tests the financial data validation, accounting coherence checks,
 * and input sanitization functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  FinancialEntrySchema, 
  BalanceSheetSchema,
  validateAccountingEntry,
  validateBalanceSheet,
  sanitizeFinancialInput,
  checkAccountingCoherence,
  ValidationError 
} from '@/utils/dataValidation';
import { 
  mockFinancialEntry, 
  mockBalanceSheet, 
  mockInvalidBalanceSheet,
  createMockFinancialEntry,
  createMockBalanceSheet 
} from '@tests/fixtures/financial-data';

describe('Data Validation Module', () => {
  describe('FinancialEntrySchema', () => {
    it('should validate a correct financial entry', () => {
      const result = FinancialEntrySchema.safeParse(mockFinancialEntry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.account).toBe('1100 - Caja');
        expect(result.data.debit).toBe(1000);
        expect(result.data.credit).toBe(0);
      }
    });

    it('should reject entry with both debit and credit', () => {
      const invalidEntry = createMockFinancialEntry({
        debit: 1000,
        credit: 500,
      });
      
      const result = FinancialEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Debe especificar débito O crédito');
      }
    });

    it('should reject entry with neither debit nor credit', () => {
      const invalidEntry = createMockFinancialEntry({
        debit: undefined,
        credit: undefined,
      });
      
      const result = FinancialEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    it('should reject entry with negative amounts', () => {
      const invalidEntry = createMockFinancialEntry({
        debit: -100,
      });
      
      const result = FinancialEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('debe ser positivo');
      }
    });

    it('should reject entry with missing required fields', () => {
      const invalidEntry = {
        debit: 1000,
        // Missing account and description
      };
      
      const result = FinancialEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });
  });

  describe('BalanceSheetSchema', () => {
    it('should validate a balanced balance sheet', () => {
      const result = BalanceSheetSchema.safeParse(mockBalanceSheet);
      expect(result.success).toBe(true);
    });

    it('should reject unbalanced balance sheet', () => {
      const result = BalanceSheetSchema.safeParse(mockInvalidBalanceSheet);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ecuación contable');
      }
    });

    it('should handle small rounding differences', () => {
      const balanceSheetWithRounding = createMockBalanceSheet({
        assets: { current: 150000, nonCurrent: 350000, total: 500000 },
        liabilities: { current: 75000, nonCurrent: 225000, total: 300000 },
        equity: { capital: 150000, retainedEarnings: 50000.005, total: 200000.005 }, // Small rounding difference
      });
      
      const result = BalanceSheetSchema.safeParse(balanceSheetWithRounding);
      expect(result.success).toBe(true);
    });

    it('should reject negative asset values', () => {
      const invalidBalance = createMockBalanceSheet({
        assets: { current: -10000, nonCurrent: 350000, total: 340000 },
      });
      
      const result = BalanceSheetSchema.safeParse(invalidBalance);
      expect(result.success).toBe(false);
    });
  });

  describe('validateAccountingEntry function', () => {
    it('should validate correct accounting entries', async () => {
      const entries = [
        createMockFinancialEntry({ debit: 1000, credit: undefined }),
        createMockFinancialEntry({ debit: undefined, credit: 1000 }),
      ];
      
      const result = await validateAccountingEntry(entries);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unbalanced entries', async () => {
      const entries = [
        createMockFinancialEntry({ debit: 1000, credit: undefined }),
        createMockFinancialEntry({ debit: undefined, credit: 500 }), // Unbalanced
      ];
      
      const result = await validateAccountingEntry(entries);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Entradas no balanceadas: débitos y créditos no coinciden');
    });

    it('should handle empty entry list', async () => {
      const result = await validateAccountingEntry([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No hay entradas para validar');
    });
  });

  describe('sanitizeFinancialInput function', () => {
    it('should sanitize and normalize financial input', () => {
      const dirtyInput = {
        account: '  1100 - Caja  ',
        amount: '1,000.50',
        description: '  <script>alert("xss")</script>Venta  ',
      };
      
      const sanitized = sanitizeFinancialInput(dirtyInput);
      expect(sanitized.account).toBe('1100 - Caja');
      expect(sanitized.amount).toBe(1000.50);
      expect(sanitized.description).toBe('Venta');
    });

    it('should handle null and undefined values', () => {
      const input = {
        account: null,
        amount: undefined,
        description: '',
      };
      
      const sanitized = sanitizeFinancialInput(input);
      expect(sanitized.account).toBe('');
      expect(sanitized.amount).toBe(0);
      expect(sanitized.description).toBe('');
    });

    it('should convert string numbers to proper numbers', () => {
      const input = {
        debit: '1,500.75',
        credit: '2.500,25', // European format
      };
      
      const sanitized = sanitizeFinancialInput(input);
      expect(sanitized.debit).toBe(1500.75);
      expect(sanitized.credit).toBe(2500.25);
    });
  });

  describe('checkAccountingCoherence function', () => {
    it('should pass coherence check for valid data', () => {
      const data = {
        entries: [mockFinancialEntry],
        balanceSheet: mockBalanceSheet,
      };
      
      const result = checkAccountingCoherence(data);
      expect(result.isCoherent).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect coherence issues', () => {
      const data = {
        entries: [mockFinancialEntry],
        balanceSheet: mockInvalidBalanceSheet,
      };
      
      const result = checkAccountingCoherence(data);
      expect(result.isCoherent).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should provide detailed warnings for specific issues', () => {
      const invalidData = {
        entries: [
          createMockFinancialEntry({ debit: 1000 }),
          createMockFinancialEntry({ credit: 500 }), // Unbalanced
        ],
        balanceSheet: mockInvalidBalanceSheet,
      };
      
      const result = checkAccountingCoherence(invalidData);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'BALANCE_MISMATCH',
          severity: 'high',
        })
      );
    });
  });

  describe('ValidationError class', () => {
    it('should create proper validation error', () => {
      const error = new ValidationError('Test validation error', 'VALIDATION_FAILED');
      expect(error.message).toBe('Test validation error');
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.name).toBe('ValidationError');
    });

    it('should be instanceof Error', () => {
      const error = new ValidationError('Test error');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed dates', () => {
      const entryWithBadDate = {
        ...mockFinancialEntry,
        date: 'invalid-date',
      };
      
      const result = FinancialEntrySchema.safeParse(entryWithBadDate);
      expect(result.success).toBe(false);
    });

    it('should handle extremely large numbers', () => {
      const entryWithLargeNumber = createMockFinancialEntry({
        debit: Number.MAX_SAFE_INTEGER + 1,
      });
      
      // Should handle gracefully without throwing
      expect(() => {
        FinancialEntrySchema.safeParse(entryWithLargeNumber);
      }).not.toThrow();
    });

    it('should handle special characters in account names', () => {
      const entryWithSpecialChars = createMockFinancialEntry({
        account: '1100 - Caja & Bancos (USD) ñáéíóú',
      });
      
      const result = FinancialEntrySchema.safeParse(entryWithSpecialChars);
      expect(result.success).toBe(true);
    });

    it('should validate currency consistency', () => {
      const mixedCurrencyData = {
        entries: [
          createMockFinancialEntry({ debit: 1000, currency: 'CLP' }),
          createMockFinancialEntry({ credit: 100, currency: 'USD' }), // Different currency
        ],
      };
      
      const result = checkAccountingCoherence(mixedCurrencyData);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'CURRENCY_MISMATCH',
        })
      );
    });
  });
});