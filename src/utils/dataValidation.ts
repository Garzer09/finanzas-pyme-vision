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
      // Only comma present, assume decimal separator
      cleaned = cleaned.replace(',', '.');
    }
    
    const amount = parseFloat(cleaned);
    if (isNaN(amount)) {
      throw new Error(`Monto inválido: "${input}" no es un número válido`);
    }
    
    return Math.round(amount * 100) / 100;
  }

  /**
   * Sanitize text input (XSS protection)
   */
  static sanitizeText(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/[<>]/g, '');
  }

  /**
   * Sanitize account code
   */
  static sanitizeAccountCode(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/[^\w\s\-\.]/g, '')
      .substring(0, 50); // Limit length
  }
}

// Validation Error Class
export class ValidationError extends Error {
  code: string;

  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

// Main validation functions
export async function validateAccountingEntry(entries: any[]): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!entries || entries.length === 0) {
    errors.push('No hay entradas para validar');
    return { isValid: false, errors, warnings };
  }

  // Check if entries are balanced
  let totalDebits = 0;
  let totalCredits = 0;

  for (const entry of entries) {
    if (entry.debit) totalDebits += entry.debit;
    if (entry.credit) totalCredits += entry.credit;
  }

  const tolerance = 0.01;
  if (Math.abs(totalDebits - totalCredits) > tolerance) {
    errors.push('Entradas no balanceadas: débitos y créditos no coinciden');
  }

  // Validate individual entries
  for (const entry of entries) {
    const result = FinancialEntrySchema.safeParse(entry);
    if (!result.success) {
      errors.push(`Error en entrada: ${result.error.issues[0].message}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateBalanceSheet(balanceSheet: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = BalanceSheetSchema.safeParse(balanceSheet);
  
  if (result.success) {
    return { isValid: true, errors: [], warnings: [] };
  }

  return {
    isValid: false,
    errors: result.error.issues.map(issue => issue.message),
    warnings: [],
  };
}

export function sanitizeFinancialInput(input: any): any {
  if (!input || typeof input !== 'object') {
    return input;
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) {
      sanitized[key] = key.includes('amount') || key === 'debit' || key === 'credit' ? 0 : '';
      continue;
    }

    if (typeof value === 'string') {
      if (key.includes('amount') || key === 'debit' || key === 'credit') {
        try {
          sanitized[key] = DataSanitizer.sanitizeAmount(value);
        } catch {
          sanitized[key] = 0;
        }
      } else if (key === 'account') {
        sanitized[key] = DataSanitizer.sanitizeAccountCode(value);
      } else {
        sanitized[key] = DataSanitizer.sanitizeText(value);
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function checkAccountingCoherence(data: any): {
  isCoherent: boolean;
  warnings: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>;
} {
  const warnings: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
  }> = [];

  // Check balance sheet coherence
  if (data.balanceSheet) {
    const balanceResult = validateBalanceSheet(data.balanceSheet);
    if (!balanceResult.isValid) {
      warnings.push({
        type: 'BALANCE_MISMATCH',
        severity: 'high',
        message: 'Balance general no cuadra según ecuación contable',
      });
    }
  }

  // Check entries coherence
  if (data.entries) {
    // Check currency consistency
    const currencies = new Set();
    for (const entry of data.entries) {
      if (entry.currency) {
        currencies.add(entry.currency);
      }
    }
    
    if (currencies.size > 1) {
      warnings.push({
        type: 'CURRENCY_MISMATCH',
        severity: 'medium',
        message: 'Se detectaron múltiples monedas en las entradas',
      });
    }
  }

  return {
    isCoherent: warnings.filter(w => w.severity === 'high').length === 0,
    warnings,
  };
}