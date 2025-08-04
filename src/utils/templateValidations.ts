// Template validation utilities
import type {
  ValidationRule,
  ValidationError,
  TemplateSchema,
  ColumnMappingResult
} from '@/types/templates';

export class TemplateValidations {
  
  /**
   * Validate balance check rule
   * Ensures that assets = liabilities + equity within tolerance
   */
  static validateBalanceCheck(
    rule: ValidationRule,
    dataRows: any[][],
    headers: string[],
    columnMapping: ColumnMappingResult
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const tolerance = rule.tolerance || 0.01;

    // Define typical balance sheet categories
    const assetPatterns = [
      /inmovilizado/i, /activo/i, /existencias/i, /deudores/i, /inversiones/i,
      /efectivo/i, /cash/i, /assets/i, /inventory/i, /receivables/i
    ];
    
    const liabilityPatterns = [
      /pasivo/i, /deuda/i, /acreedores/i, /liability/i, /debt/i, /payable/i
    ];
    
    const equityPatterns = [
      /patrimonio/i, /capital/i, /reservas/i, /equity/i, /retained/i
    ];

    // Get year columns
    const yearColumns = Object.keys(columnMapping.mapped).filter(col => /^\d{4}$/.test(col));

    yearColumns.forEach(yearCol => {
      const yearIndex = columnMapping.mapped[yearCol];
      if (yearIndex === undefined) return;

      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;
      let hasBalanceItems = false;

      dataRows.forEach((row, rowIndex) => {
        const concept = row[0]?.toString().toLowerCase() || '';
        const value = parseFloat(row[yearIndex]) || 0;

        if (value === 0) return; // Skip zero values

        hasBalanceItems = true;

        // Categorize the concept
        if (assetPatterns.some(pattern => pattern.test(concept))) {
          totalAssets += value;
        } else if (liabilityPatterns.some(pattern => pattern.test(concept))) {
          totalLiabilities += value;
        } else if (equityPatterns.some(pattern => pattern.test(concept))) {
          totalEquity += value;
        }
      });

      if (hasBalanceItems) {
        const difference = Math.abs(totalAssets - (totalLiabilities + totalEquity));
        const relativeTolerance = Math.max(Math.abs(totalAssets), Math.abs(totalLiabilities + totalEquity)) * tolerance;

        if (difference > relativeTolerance) {
          errors.push({
            column: yearCol,
            message: rule.message || `Balance check failed for ${yearCol}: Assets (${totalAssets.toFixed(2)}) ≠ Liabilities + Equity (${(totalLiabilities + totalEquity).toFixed(2)})`,
            type: 'calculation',
            severity: 'error'
          });
        }
      }
    });

    return errors;
  }

  /**
   * Validate calculation rule
   * Verifies that calculated fields match expected formulas
   */
  static validateCalculation(
    rule: ValidationRule,
    dataRows: any[][],
    headers: string[],
    columnMapping: ColumnMappingResult
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!rule.formula || !rule.target_field) {
      return errors;
    }

    const tolerance = rule.tolerance || 0.01;
    const targetIndex = columnMapping.mapped[rule.target_field];
    
    if (targetIndex === undefined) {
      return errors; // Target field not found, skip validation
    }

    // This is a simplified implementation
    // In a real system, you'd want a more sophisticated formula parser
    dataRows.forEach((row, rowIndex) => {
      try {
        const calculatedValue = this.evaluateFormula(rule.formula!, row, headers, columnMapping);
        const actualValue = parseFloat(row[targetIndex]) || 0;
        
        if (Math.abs(calculatedValue - actualValue) > tolerance) {
          errors.push({
            row: rowIndex + 2, // +2 for header and 1-based indexing
            column: rule.target_field,
            value: actualValue,
            message: rule.message || `Calculation mismatch: expected ${calculatedValue.toFixed(2)}, got ${actualValue.toFixed(2)}`,
            type: 'calculation',
            severity: 'error'
          });
        }
      } catch (error) {
        // Skip rows where calculation cannot be performed
      }
    });

    return errors;
  }

  /**
   * Validate required fields rule
   */
  static validateRequiredFields(
    rule: ValidationRule,
    dataRows: any[][],
    headers: string[],
    columnMapping: ColumnMappingResult
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!rule.fields) {
      return errors;
    }

    rule.fields.forEach(fieldName => {
      const fieldIndex = columnMapping.mapped[fieldName];
      
      if (fieldIndex === undefined) {
        errors.push({
          column: fieldName,
          message: rule.message || `Required field '${fieldName}' is missing from the file`,
          type: 'required',
          severity: 'error'
        });
        return;
      }

      dataRows.forEach((row, rowIndex) => {
        const value = row[fieldIndex];
        
        if (value === undefined || value === null || value === '') {
          errors.push({
            row: rowIndex + 2,
            column: fieldName,
            value,
            message: rule.message || `Required field '${fieldName}' is empty`,
            type: 'required',
            severity: 'error'
          });
        }
      });
    });

    return errors;
  }

  /**
   * Validate format rule
   */
  static validateFormat(
    rule: ValidationRule,
    dataRows: any[][],
    headers: string[],
    columnMapping: ColumnMappingResult
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!rule.field) {
      return errors;
    }

    const fieldIndex = columnMapping.mapped[rule.field];
    
    if (fieldIndex === undefined) {
      return errors;
    }

    dataRows.forEach((row, rowIndex) => {
      const value = row[fieldIndex];
      
      if (value === undefined || value === null || value === '') {
        return; // Skip empty values unless specifically checking for them
      }

      switch (rule.rule) {
        case 'no_empty':
          if (value.toString().trim() === '') {
            errors.push({
              row: rowIndex + 2,
              column: rule.field,
              value,
              message: rule.message || `Field '${rule.field}' cannot be empty`,
              type: 'format',
              severity: 'error'
            });
          }
          break;

        case 'numeric':
          if (isNaN(Number(value))) {
            errors.push({
              row: rowIndex + 2,
              column: rule.field,
              value,
              message: rule.message || `Field '${rule.field}' must be numeric`,
              type: 'format',
              severity: 'error'
            });
          }
          break;

        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.toString())) {
            errors.push({
              row: rowIndex + 2,
              column: rule.field,
              value,
              message: rule.message || `Field '${rule.field}' must be a valid email`,
              type: 'format',
              severity: 'error'
            });
          }
          break;

        case 'date':
          if (isNaN(Date.parse(value.toString()))) {
            errors.push({
              row: rowIndex + 2,
              column: rule.field,
              value,
              message: rule.message || `Field '${rule.field}' must be a valid date`,
              type: 'format',
              severity: 'error'
            });
          }
          break;

        default:
          // Custom regex or pattern validation
          if (rule.rule && rule.rule.startsWith('/')) {
            try {
              const regex = new RegExp(rule.rule.slice(1, -1));
              if (!regex.test(value.toString())) {
                errors.push({
                  row: rowIndex + 2,
                  column: rule.field,
                  value,
                  message: rule.message || `Field '${rule.field}' format is invalid`,
                  type: 'format',
                  severity: 'error'
                });
              }
            } catch (regexError) {
              // Invalid regex, skip validation
            }
          }
          break;
      }
    });

    return errors;
  }

  /**
   * Validate calculation check rule (for P&L specific validations)
   */
  static validateCalculationCheck(
    rule: ValidationRule,
    dataRows: any[][],
    headers: string[],
    columnMapping: ColumnMappingResult
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for EBIT/EBITDA/BAI patterns that shouldn't be included
    const forbiddenPatterns = [
      /ebit/i, /ebitda/i, /\bbai\b/i, /beneficio.*antes.*impuesto/i,
      /margen/i, /ratio/i, /percentage/i, /%/
    ];

    dataRows.forEach((row, rowIndex) => {
      const concept = row[0]?.toString().toLowerCase() || '';
      
      if (forbiddenPatterns.some(pattern => pattern.test(concept))) {
        errors.push({
          row: rowIndex + 2,
          column: 'Concepto',
          value: row[0],
          message: rule.message || 'No incluir EBIT/EBITDA/BAI/márgenes. Solo incluir cuentas base.',
          type: 'calculation',
          severity: 'warning'
        });
      }
    });

    return errors;
  }

  /**
   * Apply all validation rules to data
   */
  static applyValidationRules(
    rules: ValidationRule[],
    dataRows: any[][],
    headers: string[],
    columnMapping: ColumnMappingResult
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    rules.forEach(rule => {
      let ruleErrors: ValidationError[] = [];

      switch (rule.type) {
        case 'balance_check':
          ruleErrors = this.validateBalanceCheck(rule, dataRows, headers, columnMapping);
          break;
        
        case 'calculation':
          ruleErrors = this.validateCalculation(rule, dataRows, headers, columnMapping);
          break;
        
        case 'required_fields':
          ruleErrors = this.validateRequiredFields(rule, dataRows, headers, columnMapping);
          break;
        
        case 'format':
          ruleErrors = this.validateFormat(rule, dataRows, headers, columnMapping);
          break;
        
        case 'calculation_check':
          ruleErrors = this.validateCalculationCheck(rule, dataRows, headers, columnMapping);
          break;
        
        default:
          // Handle custom validation types
          break;
      }

      errors.push(...ruleErrors);
    });

    return errors;
  }

  /**
   * Simple formula evaluator (simplified implementation)
   * In production, you'd want a more robust formula parser
   */
  private static evaluateFormula(
    formula: string,
    row: any[],
    headers: string[],
    columnMapping: ColumnMappingResult
  ): number {
    // This is a very basic implementation
    // Replace column names with values
    let expression = formula;
    
    Object.entries(columnMapping.mapped).forEach(([columnName, index]) => {
      const value = parseFloat(row[index]) || 0;
      expression = expression.replace(new RegExp(`\\b${columnName}\\b`, 'g'), value.toString());
    });

    // Basic arithmetic evaluation (very simplified)
    try {
      // Remove any non-numeric/operator characters for safety
      expression = expression.replace(/[^0-9+\-*/.() ]/g, '');
      // Use Function constructor for safe evaluation
      return new Function('return ' + expression)();
    } catch {
      throw new Error('Invalid formula');
    }
  }

  /**
   * Get validation rule description for UI display
   */
  static getValidationRuleDescription(rule: ValidationRule): string {
    switch (rule.type) {
      case 'balance_check':
        return 'Verifies that assets equal liabilities plus equity';
      
      case 'calculation':
        return `Checks calculation: ${rule.formula}`;
      
      case 'required_fields':
        return `Required fields: ${rule.fields?.join(', ') || 'none'}`;
      
      case 'format':
        return `Format validation for ${rule.field}`;
      
      case 'calculation_check':
        return 'Checks for prohibited calculated fields';
      
      default:
        return rule.description || 'Custom validation rule';
    }
  }

  /**
   * Validate template schema itself
   */
  static validateTemplateSchema(schema: TemplateSchema): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for duplicate column names
    const columnNames = schema.schema_definition.columns.map(col => col.name);
    const duplicates = columnNames.filter((name, index) => columnNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      errors.push({
        message: `Duplicate column names found: ${duplicates.join(', ')}`,
        type: 'format',
        severity: 'error'
      });
    }

    // Check for at least one required column
    const hasRequiredColumns = schema.schema_definition.columns.some(col => col.required);
    if (!hasRequiredColumns) {
      errors.push({
        message: 'Template should have at least one required column',
        type: 'required',
        severity: 'warning'
      });
    }

    // Validate validation rules reference existing columns
    schema.validation_rules.forEach(rule => {
      if (rule.field && !columnNames.includes(rule.field)) {
        errors.push({
          message: `Validation rule references non-existent column: ${rule.field}`,
          type: 'format',
          severity: 'error'
        });
      }
      
      if (rule.fields) {
        const missingFields = rule.fields.filter(field => !columnNames.includes(field));
        if (missingFields.length > 0) {
          errors.push({
            message: `Validation rule references non-existent columns: ${missingFields.join(', ')}`,
            type: 'format',
            severity: 'error'
          });
        }
      }
    });

    return errors;
  }
}