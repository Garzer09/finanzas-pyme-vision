/**
 * 🔐 Enhanced Data Validation and Accounting Coherence
 * 
 * Provides robust validation for financial data, accounting coherence checks,
 * and improved input sanitization for production use.
 */

import { z } from 'zod';

// Financial Data Schemas
export const FinancialEntrySchema = z.object({
  account: z.string().min(1, 'Cuenta requerida'),
  debit: z.number().min(0, 'Débito debe ser positivo').optional(),
  credit: z.number().min(0, 'Crédito debe ser positivo').optional(),
  description: z.string().min(1, 'Descripción requerida'),
  date: z.date(),
  reference: z.string().optional(),
  category: z.string().optional(),
}).refine(data => {
  // Either debit or credit must be present, but not both
  const hasDebit = data.debit !== undefined && data.debit > 0;
  const hasCredit = data.credit !== undefined && data.credit > 0;
  return hasDebit !== hasCredit; // XOR logic
}, {
  message: 'Debe especificar débito O crédito, no ambos',
});

export const BalanceSheetSchema = z.object({
  assets: z.object({
    current: z.number().min(0),
    nonCurrent: z.number().min(0),
    total: z.number().min(0),
  }),
  liabilities: z.object({
    current: z.number().min(0),
    nonCurrent: z.number().min(0),
    total: z.number().min(0),
  }),
  equity: z.object({
    capital: z.number(),
    retainedEarnings: z.number(),
    total: z.number(),
  }),
}).refine(data => {
  // Accounting equation: Assets = Liabilities + Equity
  const assetsTotal = data.assets.total;
  const liabilitiesEquityTotal = data.liabilities.total + data.equity.total;
  const tolerance = 0.01; // Allow for rounding differences
  
  return Math.abs(assetsTotal - liabilitiesEquityTotal) <= tolerance;
}, {
  message: 'Error en ecuación contable: Activos debe igual Pasivos + Patrimonio',
});

export const IncomeStatementSchema = z.object({
  revenue: z.number().min(0),
  costOfGoodsSold: z.number().min(0),
  grossProfit: z.number(),
  operatingExpenses: z.number().min(0),
  operatingIncome: z.number(),
  netIncome: z.number(),
}).refine(data => {
  // Validate income statement calculations
  const calculatedGrossProfit = data.revenue - data.costOfGoodsSold;
  const calculatedOperatingIncome = calculatedGrossProfit - data.operatingExpenses;
  
  const tolerance = 0.01;
  return Math.abs(data.grossProfit - calculatedGrossProfit) <= tolerance &&
         Math.abs(data.operatingIncome - calculatedOperatingIncome) <= tolerance;
}, {
  message: 'Error en cálculos del estado de resultados',
});

// Enhanced Input Sanitization
export class DataSanitizer {
  /**
   * Sanitize financial amount input
   */
  static sanitizeAmount(input: string | number): number {
    if (typeof input === 'number') {
      if (!Number.isFinite(input)) {
        throw new Error('Monto inválido: debe ser un número finito');
      }
      return Math.round(input * 100) / 100; // Round to 2 decimal places
    }

    // Remove currency symbols
    let cleaned = input.replace(/[$€£¥₹]/g, '').trim();
    
    // Handle European format (1.234,56) vs US format (1,234.56)
    const commaIndex = cleaned.lastIndexOf(',');
    const dotIndex = cleaned.lastIndexOf('.');
    
    if (commaIndex > dotIndex) {
      // European format: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (dotIndex > commaIndex) {
      // US format: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    } else if (commaIndex !== -1 && dotIndex === -1) {
      // Only comma: 123,45 (treat as decimal)
      cleaned = cleaned.replace(',', '.');
    }
    
    // Remove any remaining non-numeric characters except decimal point and minus
    cleaned = cleaned.replace(/[^0-9.-]/g, '');

    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed) || !Number.isFinite(parsed)) {
      throw new Error(`Monto inválido: "${input}"`);
    }

    return Math.round(parsed * 100) / 100;
  }

  /**
   * Sanitize account name
   */
  static sanitizeAccountName(input: string): string {
    return input
      .trim()
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .substring(0, 100); // Limit length
  }

  /**
   * Sanitize text description
   */
  static sanitizeDescription(input: string): string {
    return input
      .trim()
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 500); // Limit length
  }

  /**
   * Validate and sanitize date input
   */
  static sanitizeDate(input: string | Date): Date {
    let date: Date;
    
    if (input instanceof Date) {
      date = input;
    } else {
      date = new Date(input);
    }

    if (isNaN(date.getTime())) {
      throw new Error(`Fecha inválida: "${input}"`);
    }

    // Check reasonable date range (1900 to 2100)
    const year = date.getFullYear();
    if (year < 1900 || year > 2100) {
      throw new Error(`Fecha fuera de rango: ${year}`);
    }

    return date;
  }
}

// Accounting Coherence Validator
export class AccountingValidator {
  /**
   * Validate journal entry for accounting coherence
   */
  static validateJournalEntry(entries: Array<{
    account: string;
    debit?: number;
    credit?: number;
    description: string;
  }>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (entries.length === 0) {
      errors.push('Al menos una entrada es requerida');
      return { isValid: false, errors };
    }

    let totalDebits = 0;
    let totalCredits = 0;

    entries.forEach((entry, index) => {
      // Validate each entry
      try {
        FinancialEntrySchema.parse({
          ...entry,
          date: new Date(),
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors.push(`Entrada ${index + 1}: ${err.message}`);
          });
        }
      }

      // Accumulate totals
      if (entry.debit) totalDebits += entry.debit;
      if (entry.credit) totalCredits += entry.credit;
    });

    // Check accounting equation balance
    const tolerance = 0.01;
    if (Math.abs(totalDebits - totalCredits) > tolerance) {
      errors.push(
        `Asientos desbalanceados: Débitos (${totalDebits}) ≠ Créditos (${totalCredits})`
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate trial balance
   */
  static validateTrialBalance(accounts: Array<{
    account: string;
    debit: number;
    credit: number;
  }>): { isValid: boolean; errors: string[]; summary: any } {
    const errors: string[] = [];
    
    let totalDebits = 0;
    let totalCredits = 0;
    const accountSummary = new Map();

    accounts.forEach(entry => {
      // Sanitize amounts
      try {
        const debit = DataSanitizer.sanitizeAmount(entry.debit);
        const credit = DataSanitizer.sanitizeAmount(entry.credit);
        
        totalDebits += debit;
        totalCredits += credit;

        // Track by account
        const accountName = DataSanitizer.sanitizeAccountName(entry.account);
        if (!accountSummary.has(accountName)) {
          accountSummary.set(accountName, { debit: 0, credit: 0 });
        }
        const summary = accountSummary.get(accountName);
        summary.debit += debit;
        summary.credit += credit;

      } catch (error) {
        errors.push(`Error en cuenta "${entry.account}": ${(error as Error).message}`);
      }
    });

    // Check balance
    const tolerance = 0.01;
    if (Math.abs(totalDebits - totalCredits) > tolerance) {
      errors.push(
        `Balance de comprobación desbalanceado: Total débitos (${totalDebits}) ≠ Total créditos (${totalCredits})`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      summary: {
        totalDebits,
        totalCredits,
        difference: totalDebits - totalCredits,
        accountCount: accountSummary.size,
        accounts: Object.fromEntries(accountSummary),
      },
    };
  }

  /**
   * Validate financial ratios for reasonableness
   */
  static validateFinancialRatios(data: {
    currentAssets: number;
    currentLiabilities: number;
    totalAssets: number;
    totalLiabilities: number;
    revenue: number;
    netIncome: number;
  }): { isValid: boolean; warnings: string[]; ratios: any } {
    const warnings: string[] = [];
    
    // Calculate ratios
    const currentRatio = data.currentLiabilities > 0 ? 
      data.currentAssets / data.currentLiabilities : Infinity;
    
    const debtToAssets = data.totalAssets > 0 ? 
      data.totalLiabilities / data.totalAssets : 0;
    
    const profitMargin = data.revenue > 0 ? 
      data.netIncome / data.revenue : 0;

    // Check ratio reasonableness
    if (currentRatio < 0.5) {
      warnings.push('Ratio de liquidez muy bajo (< 0.5)');
    } else if (currentRatio > 10) {
      warnings.push('Ratio de liquidez muy alto (> 10) - posible error');
    }

    if (debtToAssets > 0.9) {
      warnings.push('Ratio de endeudamiento muy alto (> 90%)');
    }

    if (profitMargin < -0.5 || profitMargin > 0.5) {
      warnings.push('Margen de beneficio fuera de rango normal');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      ratios: {
        currentRatio,
        debtToAssets,
        profitMargin,
      },
    };
  }
}

// Data Validation Pipeline
export class DataValidationPipeline {
  /**
   * Comprehensive validation for uploaded financial data
   */
  static async validateFinancialFile(data: any[]): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    processedData: any[];
    summary: any;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const processedData: any[] = [];

    if (!Array.isArray(data) || data.length === 0) {
      errors.push('Archivo vacío o formato inválido');
      return { isValid: false, errors, warnings, processedData, summary: null };
    }

    // Process each row
    data.forEach((row, index) => {
      try {
        const processedRow = {
          ...row,
          account: DataSanitizer.sanitizeAccountName(row.account || ''),
          description: DataSanitizer.sanitizeDescription(row.description || ''),
          debit: row.debit ? DataSanitizer.sanitizeAmount(row.debit) : undefined,
          credit: row.credit ? DataSanitizer.sanitizeAmount(row.credit) : undefined,
          date: row.date ? DataSanitizer.sanitizeDate(row.date) : new Date(),
        };

        // Validate individual entry
        FinancialEntrySchema.parse(processedRow);
        processedData.push(processedRow);

      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors.push(`Fila ${index + 1}: ${err.message}`);
          });
        } else {
          errors.push(`Fila ${index + 1}: ${(error as Error).message}`);
        }
      }
    });

    // Validate accounting coherence
    if (processedData.length > 0) {
      const journalValidation = AccountingValidator.validateJournalEntry(processedData);
      if (!journalValidation.isValid) {
        errors.push(...journalValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      processedData,
      summary: {
        totalRows: data.length,
        validRows: processedData.length,
        errorCount: errors.length,
        warningCount: warnings.length,
      },
    };
  }
}
