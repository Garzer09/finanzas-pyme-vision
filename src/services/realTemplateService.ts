/**
 * Real Template Service using existing database tables
 */
import { supabase } from '@/integrations/supabase/client';

export interface DataPreviewRow {
  [key: string]: any;
  _rowId: string;
  _errors: string[];
  _warnings: string[];
  _isValid: boolean;
}

export interface DataPreview {
  fileName: string;
  fileType: string;
  headers: string[];
  rows: DataPreviewRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  criticalErrors: string[];
  warnings: string[];
}

export class RealTemplateService {
  /**
   * Validate and preview file data for editing
   */
  async validateAndPreviewData(fileData: any[], fileName: string): Promise<DataPreview> {
    const fileType = this.detectFileType(fileName);
    const headers = this.extractHeaders(fileData);
    const validationRules = await this.getValidationRules(fileType);
    
    const previewRows: DataPreviewRow[] = [];
    let validRows = 0;
    let invalidRows = 0;
    const criticalErrors: string[] = [];
    const warnings: string[] = [];

    // Process each row
    for (let i = 0; i < Math.min(fileData.length, 100); i++) { // Preview first 100 rows
      const row = fileData[i];
      const rowData: DataPreviewRow = {
        _rowId: `row_${i}`,
        _errors: [],
        _warnings: [],
        _isValid: true,
        ...row
      };

      // Apply validation rules
      for (const rule of validationRules) {
        const validationResult = this.validateRowAgainstRule(rowData, rule);
        if (validationResult.errors.length > 0) {
          rowData._errors.push(...validationResult.errors);
          rowData._isValid = false;
        }
        if (validationResult.warnings.length > 0) {
          rowData._warnings.push(...validationResult.warnings);
        }
      }

      // Collect global errors and warnings
      if (rowData._errors.length > 0) {
        invalidRows++;
        criticalErrors.push(...rowData._errors.map(e => `Fila ${i + 1}: ${e}`));
      } else {
        validRows++;
      }

      if (rowData._warnings.length > 0) {
        warnings.push(...rowData._warnings.map(w => `Fila ${i + 1}: ${w}`));
      }

      previewRows.push(rowData);
    }

    return {
      fileName,
      fileType,
      headers,
      rows: previewRows,
      totalRows: fileData.length,
      validRows,
      invalidRows,
      criticalErrors: [...new Set(criticalErrors)], // Remove duplicates
      warnings: [...new Set(warnings)]
    };
  }

  /**
   * Save validated data to database
   */
  async saveValidatedData(companyId: string, preview: DataPreview, modifiedRows: DataPreviewRow[]): Promise<void> {
    const { fileType } = preview;
    
    try {
      // Prepare data for saving based on file type
      const dataToSave = this.prepareDataForSaving(modifiedRows, fileType);
      
      // Save to appropriate tables
      await this.saveToDatabase(companyId, fileType, dataToSave);
      
      // Log processing step
      await this.logProcessingStep(companyId, fileType, {
        totalRows: modifiedRows.length,
        validRows: modifiedRows.filter(r => r._isValid).length,
        invalidRows: modifiedRows.filter(r => !r._isValid).length
      });
      
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  private detectFileType(fileName: string): string {
    const name = fileName.toLowerCase();
    
    if (name.includes('pyg') || name.includes('cuenta')) return 'pyg';
    if (name.includes('balance') || name.includes('situacion')) return 'balance';
    if (name.includes('cashflow') || name.includes('flujos')) return 'cashflow';
    if (name.includes('operativ') || name.includes('datos')) return 'operational';
    if (name.includes('supuesto') || name.includes('financiero')) return 'financial_assumptions';
    if (name.includes('pool') && name.includes('deuda')) return 'debt_pool';
    
    return 'financial';
  }

  private extractHeaders(data: any[]): string[] {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }

  private async getValidationRules(fileType: string): Promise<any[]> {
    const rules: Record<string, any[]> = {
      pyg: [
        { field: 'Concepto', required: true, type: 'string' },
        { field: 'Importe', required: true, type: 'number' },
        { field: 'Periodo', required: true, type: 'date' }
      ],
      balance: [
        { field: 'Concepto', required: true, type: 'string' },
        { field: 'Seccion', required: true, type: 'string' },
        { field: 'Importe', required: true, type: 'number' },
        { field: 'Periodo', required: true, type: 'date' }
      ],
      cashflow: [
        { field: 'Concepto', required: true, type: 'string' },
        { field: 'Categoria', required: true, type: 'string' },
        { field: 'Importe', required: true, type: 'number' },
        { field: 'Periodo', required: true, type: 'date' }
      ],
      operational: [
        { field: 'Metrica', required: true, type: 'string' },
        { field: 'Valor', required: true, type: 'number' },
        { field: 'Unidad', required: false, type: 'string' }
      ],
      financial_assumptions: [
        { field: 'Concepto', required: true, type: 'string' },
        { field: 'Valor', required: true, type: 'number' },
        { field: 'Unidad', required: false, type: 'string' }
      ]
    };

    return rules[fileType] || [];
  }

  private validateRowAgainstRule(row: any, rule: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const value = row[rule.field];

    // Required field validation
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push(`Campo requerido '${rule.field}' está vacío`);
    }

    // Type validation
    if (value !== null && value !== undefined && value !== '') {
      switch (rule.type) {
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`'${rule.field}' debe ser un número`);
          } else if (Number(value) === 0) {
            warnings.push(`'${rule.field}' es cero`);
          }
          break;
        case 'date':
          if (!this.isValidDate(value)) {
            errors.push(`'${rule.field}' debe ser una fecha válida`);
          }
          break;
        case 'string':
          if (typeof value !== 'string' || value.trim().length === 0) {
            errors.push(`'${rule.field}' debe ser texto válido`);
          }
          break;
      }
    }

    return { errors, warnings };
  }

  private isValidDate(value: any): boolean {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private prepareDataForSaving(rows: DataPreviewRow[], fileType: string): any[] {
    return rows
      .filter(row => row._isValid) // Only save valid rows
      .map(row => {
        const cleanRow = { ...row };
        // Remove internal fields
        delete cleanRow._rowId;
        delete cleanRow._errors;
        delete cleanRow._warnings;
        delete cleanRow._isValid;
        return cleanRow;
      });
  }

  private async saveToDatabase(companyId: string, fileType: string, data: any[]): Promise<void> {
    const currentDate = new Date().toISOString();
    const currentUser = (await supabase.auth.getUser()).data.user;
    
    switch (fileType) {
      case 'pyg':
        const pygData = data.map(row => ({
          company_id: companyId,
          concept: row.Concepto || row.concepto,
          amount: parseFloat(row.Importe || row.importe || '0'),
          period_date: row.Periodo || row.periodo,
          period_year: new Date(row.Periodo || row.periodo).getFullYear(),
          period_type: 'monthly',
          currency_code: 'EUR',
          uploaded_by: currentUser?.id,
          created_at: currentDate
        }));
        
        const { error: pygError } = await supabase
          .from('fs_pyg_lines')
          .insert(pygData);
        
        if (pygError) throw pygError;
        break;

      case 'balance':
        const balanceData = data.map(row => ({
          company_id: companyId,
          concept: row.Concepto || row.concepto,
          section: row.Seccion || row.seccion,
          amount: parseFloat(row.Importe || row.importe || '0'),
          period_date: row.Periodo || row.periodo,
          period_year: new Date(row.Periodo || row.periodo).getFullYear(),
          period_type: 'monthly',
          currency_code: 'EUR',
          uploaded_by: currentUser?.id,
          created_at: currentDate
        }));
        
        const { error: balanceError } = await supabase
          .from('fs_balance_lines')
          .insert(balanceData);
        
        if (balanceError) throw balanceError;
        break;

      case 'operational':
        const operationalData = data.map(row => ({
          company_id: companyId,
          metric_name: row.Metrica || row.metrica,
          value: parseFloat(row.Valor || row.valor || '0'),
          unit: row.Unidad || row.unidad || 'units',
          period_date: new Date().toISOString().split('T')[0],
          period_year: new Date().getFullYear(),
          period_type: 'annual',
          uploaded_by: currentUser?.id,
          created_at: currentDate
        }));
        
        const { error: opError } = await supabase
          .from('operational_metrics')
          .insert(operationalData);
        
        if (opError) throw opError;
        break;

      case 'financial_assumptions':
        const assumptionData = data.map(row => ({
          company_id: companyId,
          assumption_category: 'general',
          assumption_name: row.Concepto || row.concepto,
          assumption_value: parseFloat(row.Valor || row.valor || '0'),
          unit: row.Unidad || row.unidad || 'percentage',
          period_year: new Date().getFullYear(),
          period_type: 'annual',
          uploaded_by: currentUser?.id,
          created_at: currentDate
        }));
        
        const { error: assError } = await supabase
          .from('financial_assumptions_normalized')
          .insert(assumptionData);
        
        if (assError) throw assError;
        break;
    }
  }

  private async logProcessingStep(companyId: string, fileType: string, metrics: any): Promise<void> {
    await supabase.functions.invoke('log-processing-step', {
      body: {
        session_id: crypto.randomUUID(),
        company_id: companyId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        step_name: `upload_${fileType}`,
        step_status: 'completed',
        performance_metrics: metrics
      }
    });
  }
}

export const realTemplateService = new RealTemplateService();