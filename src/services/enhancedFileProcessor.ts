// Enhanced file processor with dynamic validation and template support
import type {
  TemplateSchema,
  ValidationResults,
  ValidationError,
  FileMetadata,
  FilePreview,
  TemplateValidationContext,
  ColumnMappingResult,
  ProcessFileRequest,
  ProcessFileResponse,
  UploadHistory,
  TemplateMatch
} from '@/types/templates';
import { TemplateService } from './templateService';
import { supabase } from '@/integrations/supabase/client';

export class EnhancedFileProcessor {
  
  /**
   * Analyze a file and provide preview with template detection
   */
  static async analyzeFile(file: File): Promise<FilePreview> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('File is empty');
      }

      // Detect delimiter
      const delimiter = this.detectDelimiter(lines[0]);
      
      // Parse headers
      const headers = this.parseCSVLine(lines[0], delimiter);
      
      // Parse sample rows
      const sampleRows: any[][] = [];
      const maxSampleRows = Math.min(10, lines.length - 1);
      
      for (let i = 1; i <= maxSampleRows; i++) {
        if (lines[i]) {
          const row = this.parseCSVLine(lines[i], delimiter);
          sampleRows.push(row);
        }
      }

      // Create file metadata
      const metadata: FileMetadata = {
        delimiter,
        encoding: 'utf-8', // Simplified for now
        headers,
        row_count: lines.length - 1, // Excluding header
        column_count: headers.length,
        file_size: file.size,
        mime_type: file.type
      };

      // Detect potential templates
      const templateMatches = await TemplateService.detectTemplate(headers, sampleRows);
      const detectedTemplate = templateMatches.success && templateMatches.data && templateMatches.data.length > 0 
        ? templateMatches.data[0].template_name 
        : undefined;

      // Detect years in headers
      const detectedYears = this.detectYears(headers);

      // Generate suggestions and issues
      const suggestions: string[] = [];
      const issues: ValidationError[] = [];

      if (detectedTemplate) {
        suggestions.push(`Detected template: ${detectedTemplate}`);
      } else {
        suggestions.push('No template automatically detected. Please select manually.');
      }

      if (detectedYears.length > 0) {
        suggestions.push(`Detected years: ${detectedYears.join(', ')}`);
      }

      // Check for common issues
      if (headers.some(h => h.trim() === '')) {
        issues.push({
          column: 'headers',
          message: 'Some column headers are empty',
          type: 'format',
          severity: 'warning'
        });
      }

      if (sampleRows.some(row => row.length !== headers.length)) {
        issues.push({
          message: 'Some rows have different number of columns than headers',
          type: 'format',
          severity: 'error'
        });
      }

      return {
        headers,
        sample_rows: sampleRows,
        detected_template: detectedTemplate,
        detected_years: detectedYears,
        file_metadata: metadata,
        suggestions,
        issues
      };

    } catch (error) {
      throw new Error(`Failed to analyze file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process and validate a file against a template schema
   */
  static async processFile(request: ProcessFileRequest): Promise<ProcessFileResponse> {
    try {
      const { file, template_name, company_id, selected_years, dry_run = false } = request;

      // First analyze the file
      const preview = await this.analyzeFile(file);

      // Get template schema
      let templateSchema: TemplateSchema | undefined;
      if (template_name) {
        const schemaResult = await TemplateService.getEffectiveTemplateSchema(template_name, company_id);
        if (!schemaResult.success) {
          return {
            success: false,
            error: `Failed to load template: ${schemaResult.error}`
          };
        }
        templateSchema = schemaResult.data;
      } else {
        // Try to auto-detect template
        if (preview.detected_template) {
          const schemaResult = await TemplateService.getEffectiveTemplateSchema(preview.detected_template, company_id);
          if (schemaResult.success) {
            templateSchema = schemaResult.data;
          }
        }
      }

      if (!templateSchema) {
        return {
          success: false,
          error: 'No template specified and could not auto-detect template'
        };
      }

      // Parse the full file
      const fileText = await file.text();
      const fileData = this.parseCSVFile(fileText, preview.file_metadata.delimiter);

      // Validate against template
      const validationResults = await this.validateAgainstTemplate(
        templateSchema,
        fileData,
        preview.file_metadata,
        request.custom_validations
      );

      // Create upload history record
      const uploadRecord: Partial<UploadHistory> = {
        template_schema_id: templateSchema.id,
        template_name: templateSchema.name,
        original_filename: file.name,
        file_size: file.size,
        upload_status: dry_run ? 'completed' : 'pending',
        detected_years: preview.detected_years,
        selected_years: selected_years || preview.detected_years,
        validation_results: validationResults,
        file_metadata: preview.file_metadata,
        company_id,
        user_id: (await supabase.auth.getUser()).data.user?.id
      };

      const { data: uploadData, error: uploadError } = await supabase
        .from('excel_files')
        .insert({
          file_name: file.name,
          file_path: `/uploads/${file.name}`,
          user_id: (await supabase.auth.getUser()).data.user?.id || '',
          processing_status: 'processing'
        })
        .select()
        .single();

      if (uploadError) {
        console.warn('Failed to create upload history record:', uploadError);
      }

      return {
        success: true,
        upload_id: uploadData?.id,
        validation_results: validationResults,
        detected_years: preview.detected_years,
        preview_data: fileData.slice(0, 10) // First 10 rows for preview
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during file processing'
      };
    }
  }

  /**
   * Validate file data against template schema
   */
  static async validateAgainstTemplate(
    schema: TemplateSchema,
    fileData: any[][],
    metadata: FileMetadata,
    customValidations?: any[]
  ): Promise<ValidationResults> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    if (fileData.length === 0) {
      errors.push({
        message: 'File has no data rows',
        type: 'required',
        severity: 'error'
      });
      
      return {
        is_valid: false,
        errors,
        warnings,
        statistics: {
          total_rows: 0,
          valid_rows: 0,
          invalid_rows: 0,
          warnings_count: 0,
          errors_count: 1
        }
      };
    }

    const headers = fileData[0];
    const dataRows = fileData.slice(1);

    // Map columns
    const columnMapping = this.mapColumns(schema, headers);
    
    // Check for missing required columns
    if (columnMapping.unmapped.length > 0) {
      const requiredMissing = columnMapping.unmapped.filter(colName => {
        const colDef = schema.schema_definition.columns.find(c => c.name === colName);
        return colDef?.required;
      });
      
      if (requiredMissing.length > 0) {
        errors.push({
          message: `Missing required columns: ${requiredMissing.join(', ')}`,
          type: 'required',
          severity: 'error'
        });
      }
    }

    // Validate each row
    let validRows = 0;
    let invalidRows = 0;

    dataRows.forEach((row, rowIndex) => {
      const rowErrors = this.validateRow(schema, row, headers, columnMapping, rowIndex + 2); // +2 for header and 1-based indexing
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        invalidRows++;
      } else {
        validRows++;
      }
    });

    // Apply template-specific validation rules
    const templateValidationErrors = this.applyTemplateValidations(
      schema.validation_rules,
      dataRows,
      headers,
      columnMapping
    );
    errors.push(...templateValidationErrors);

    // Apply custom validations if provided
    if (customValidations) {
      const customValidationErrors = this.applyTemplateValidations(
        customValidations,
        dataRows,
        headers,
        columnMapping
      );
      errors.push(...customValidationErrors);
    }

    // Calculate statistics
    const statistics = {
      total_rows: dataRows.length,
      valid_rows: validRows,
      invalid_rows: invalidRows,
      warnings_count: warnings.length,
      errors_count: errors.length
    };

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      statistics
    };
  }

  /**
   * Map file columns to template columns
   */
  private static mapColumns(schema: TemplateSchema, fileHeaders: string[]): ColumnMappingResult {
    const mapped: Record<string, number> = {};
    const unmapped: string[] = [];
    const extra = [...fileHeaders];

    schema.schema_definition.columns.forEach(column => {
      const headerIndex = fileHeaders.findIndex(h => 
        h.trim().toLowerCase() === column.name.toLowerCase()
      );
      
      if (headerIndex !== -1) {
        mapped[column.name] = headerIndex;
        extra.splice(extra.indexOf(fileHeaders[headerIndex]), 1);
      } else {
        unmapped.push(column.name);
      }
    });

    // Handle variable year columns
    if (schema.schema_definition.variableYearColumns) {
      const yearPattern = new RegExp(schema.schema_definition.yearColumnPattern || '^[0-9]{4}$');
      fileHeaders.forEach((header, index) => {
        if (yearPattern.test(header.trim())) {
          mapped[header] = index;
          const extraIndex = extra.indexOf(header);
          if (extraIndex !== -1) {
            extra.splice(extraIndex, 1);
          }
        }
      });
    }

    const confidence = Object.keys(mapped).length / schema.schema_definition.columns.length;

    return { mapped, unmapped, extra, confidence };
  }

  /**
   * Validate a single row against template schema
   */
  private static validateRow(
    schema: TemplateSchema,
    row: any[],
    headers: string[],
    columnMapping: ColumnMappingResult,
    rowNumber: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    schema.schema_definition.columns.forEach(column => {
      const columnIndex = columnMapping.mapped[column.name];
      
      if (columnIndex === undefined) {
        if (column.required) {
          errors.push({
            row: rowNumber,
            column: column.name,
            message: `Required column '${column.name}' is missing`,
            type: 'required',
            severity: 'error'
          });
        }
        return;
      }

      const value = row[columnIndex];

      // Check required fields
      if (column.required && (value === undefined || value === null || value === '')) {
        errors.push({
          row: rowNumber,
          column: column.name,
          value,
          message: `Required field '${column.name}' is empty`,
          type: 'required',
          severity: 'error'
        });
        return;
      }

      // Skip validation for empty optional fields
      if (!column.required && (value === undefined || value === null || value === '')) {
        return;
      }

      // Type validation
      const typeError = this.validateFieldType(column, value, rowNumber);
      if (typeError) {
        errors.push(typeError);
      }

      // Column-specific validations
      if (column.validations) {
        column.validations.forEach(validation => {
          const validationError = this.validateFieldRule(column, value, validation, rowNumber);
          if (validationError) {
            errors.push(validationError);
          }
        });
      }
    });

    return errors;
  }

  /**
   * Validate field type
   */
  private static validateFieldType(column: any, value: any, rowNumber: number): ValidationError | null {
    const stringValue = String(value).trim();
    
    switch (column.type) {
      case 'number':
        if (stringValue && isNaN(Number(stringValue))) {
          return {
            row: rowNumber,
            column: column.name,
            value,
            message: `'${column.name}' must be a number`,
            type: 'format',
            severity: 'error'
          };
        }
        break;
      
      case 'date':
        if (stringValue && isNaN(Date.parse(stringValue))) {
          return {
            row: rowNumber,
            column: column.name,
            value,
            message: `'${column.name}' must be a valid date`,
            type: 'format',
            severity: 'error'
          };
        }
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (stringValue && !emailRegex.test(stringValue)) {
          return {
            row: rowNumber,
            column: column.name,
            value,
            message: `'${column.name}' must be a valid email address`,
            type: 'format',
            severity: 'error'
          };
        }
        break;
    }

    return null;
  }

  /**
   * Validate field against specific validation rule
   */
  private static validateFieldRule(column: any, value: any, validation: any, rowNumber: number): ValidationError | null {
    const numValue = Number(value);
    
    switch (validation.type) {
      case 'range':
        if (!isNaN(numValue)) {
          if (validation.min !== undefined && numValue < validation.min) {
            return {
              row: rowNumber,
              column: column.name,
              value,
              message: validation.message || `'${column.name}' must be at least ${validation.min}`,
              type: 'range',
              severity: 'error'
            };
          }
          if (validation.max !== undefined && numValue > validation.max) {
            return {
              row: rowNumber,
              column: column.name,
              value,
              message: validation.message || `'${column.name}' must be at most ${validation.max}`,
              type: 'range',
              severity: 'error'
            };
          }
        }
        break;
      
      case 'format':
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(String(value))) {
            return {
              row: rowNumber,
              column: column.name,
              value,
              message: validation.message || `'${column.name}' format is invalid`,
              type: 'format',
              severity: 'error'
            };
          }
        }
        break;
    }

    return null;
  }

  /**
   * Apply template-level validation rules
   */
  private static applyTemplateValidations(
    validationRules: any[],
    dataRows: any[][],
    headers: string[],
    columnMapping: ColumnMappingResult
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    validationRules.forEach(rule => {
      switch (rule.type) {
        case 'balance_check':
          // Implementation would depend on specific balance check logic
          // This is a placeholder for complex business rule validation
          break;
        
        case 'calculation':
          // Implementation for calculation validation
          // This would verify formulas and calculations
          break;
        
        default:
          // Handle other validation types
          break;
      }
    });

    return errors;
  }

  /**
   * Detect delimiter in CSV content
   */
  private static detectDelimiter(firstLine: string): string {
    const delimiters = [',', ';', '\t', '|'];
    let bestDelimiter = ',';
    let maxCount = 0;

    delimiters.forEach(delimiter => {
      const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    });

    return bestDelimiter;
  }

  /**
   * Parse a CSV line respecting quotes
   */
  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Parse entire CSV file
   */
  private static parseCSVFile(content: string, delimiter: string): any[][] {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map(line => this.parseCSVLine(line, delimiter));
  }

  /**
   * Detect years in headers
   */
  private static detectYears(headers: string[]): number[] {
    const years: number[] = [];
    const yearPattern = /^(19|20)\d{2}$/;

    headers.forEach(header => {
      const trimmed = header.trim();
      if (yearPattern.test(trimmed)) {
        years.push(parseInt(trimmed, 10));
      }
    });

    return years.sort();
  }
}