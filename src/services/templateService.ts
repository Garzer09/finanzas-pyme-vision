// Template service for dynamic CSV template management
import { supabase } from '@/integrations/supabase/client';
import type {
  TemplateSchema,
  CompanyTemplateCustomization,
  TemplateSchemaDefinition,
  ValidationRule,
  GenerateTemplateRequest,
  GenerateTemplateResponse,
  TemplateServiceResponse,
  TemplateVersion,
  TemplateMatch,
  FileMetadata
} from '@/types/templates';

export class TemplateService {
  /**
   * Get all active template schemas
   */
  static async getTemplateSchemas(category?: string): Promise<TemplateServiceResponse<TemplateSchema[]>> {
    try {
      let query = supabase
        .from('template_schemas')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get a specific template schema by name
   */
  static async getTemplateSchema(name: string): Promise<TemplateServiceResponse<TemplateSchema>> {
    try {
      const { data, error } = await supabase
        .from('template_schemas')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get template schemas that are required
   */
  static async getRequiredTemplates(): Promise<TemplateServiceResponse<TemplateSchema[]>> {
    try {
      const { data, error } = await supabase
        .from('template_schemas')
        .select('*')
        .eq('is_active', true)
        .eq('is_required', true)
        .order('name');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get company-specific template customizations
   */
  static async getCompanyCustomizations(
    companyId: string,
    templateSchemaId?: string
  ): Promise<TemplateServiceResponse<CompanyTemplateCustomization[]>> {
    try {
      let query = supabase
        .from('company_template_customizations')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (templateSchemaId) {
        query = query.eq('template_schema_id', templateSchemaId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create or update company template customization
   */
  static async saveCompanyCustomization(
    customization: Omit<CompanyTemplateCustomization, 'id' | 'created_at' | 'updated_at'>
  ): Promise<TemplateServiceResponse<CompanyTemplateCustomization>> {
    try {
      const { data, error } = await supabase
        .from('company_template_customizations')
        .upsert(customization, {
          onConflict: 'company_id,template_schema_id'
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get the effective template schema for a company (with customizations applied)
   */
  static async getEffectiveTemplateSchema(
    templateName: string,
    companyId?: string
  ): Promise<TemplateServiceResponse<TemplateSchema>> {
    try {
      // Get base template
      const templateResult = await this.getTemplateSchema(templateName);
      if (!templateResult.success || !templateResult.data) {
        return templateResult;
      }

      let effectiveSchema = { ...templateResult.data };

      // Apply company customizations if available
      if (companyId) {
        const customizationResult = await this.getCompanyCustomizations(
          companyId,
          templateResult.data.id
        );

        if (customizationResult.success && customizationResult.data?.[0]) {
          const customization = customizationResult.data[0];
          
          // Apply custom schema definition
          if (customization.custom_schema) {
            effectiveSchema.schema_definition = {
              ...effectiveSchema.schema_definition,
              ...customization.custom_schema
            };
          }

          // Apply custom validations
          if (customization.custom_validations) {
            effectiveSchema.validation_rules = [
              ...effectiveSchema.validation_rules,
              ...customization.custom_validations
            ];
          }

          // Apply custom display name
          if (customization.custom_display_name) {
            effectiveSchema.display_name = customization.custom_display_name;
          }
        }
      }

      return { success: true, data: effectiveSchema };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate a CSV template dynamically based on schema
   */
  static async generateTemplate(
    request: GenerateTemplateRequest
  ): Promise<GenerateTemplateResponse> {
    try {
      const { template_name, company_id, years, customizations, format = 'csv', delimiter = ',' } = request;

      // Get effective template schema
      const schemaResult = await this.getEffectiveTemplateSchema(template_name, company_id);
      if (!schemaResult.success || !schemaResult.data) {
        return {
          success: false,
          filename: '',
          error: schemaResult.error || 'Template not found'
        };
      }

      const schema = schemaResult.data;
      let definition = schema.schema_definition;

      // Apply request-specific customizations
      if (customizations) {
        definition = { ...definition, ...customizations };
      }

      // Generate headers
      const headers: string[] = [];
      const sampleRow: string[] = [];

      definition.columns.forEach(column => {
        headers.push(column.name);
        sampleRow.push(column.description || '');
      });

      // Add year columns if template supports them
      if (definition.variableYearColumns && years && years.length > 0) {
        const yearPattern = new RegExp(definition.yearColumnPattern || '^[0-9]{4}$');
        
        // Remove existing year columns
        const nonYearHeaders = headers.filter(h => !yearPattern.test(h));
        const nonYearSamples = sampleRow.filter((_, i) => !yearPattern.test(headers[i]));
        
        // Insert year columns at appropriate position
        const insertIndex = nonYearHeaders.findIndex(h => h === 'Notas');
        const targetIndex = insertIndex === -1 ? nonYearHeaders.length : insertIndex;
        
        years.sort().forEach((year, index) => {
          nonYearHeaders.splice(targetIndex + index, 0, year.toString());
          nonYearSamples.splice(targetIndex + index, 0, `Values for year ${year}`);
        });

        headers.length = 0;
        headers.push(...nonYearHeaders);
        sampleRow.length = 0;
        sampleRow.push(...nonYearSamples);
      }

      // Generate CSV content
      const csvLines = [
        headers.join(delimiter),
        sampleRow.join(delimiter)
      ];

      // Add expected concepts if available
      if (definition.expectedConcepts) {
        definition.expectedConcepts.forEach(concept => {
          const row = new Array(headers.length).fill('');
          row[0] = concept; // Assuming first column is always 'Concepto'
          csvLines.push(row.join(delimiter));
        });
      }

      const content = csvLines.join('\n');
      const filename = `${template_name}_template_${Date.now()}.${format}`;

      return {
        success: true,
        template_content: content,
        filename
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Detect the most likely template for a given file
   */
  static async detectTemplate(
    headers: string[],
    sampleData?: any[][]
  ): Promise<TemplateServiceResponse<TemplateMatch[]>> {
    try {
      const schemasResult = await this.getTemplateSchemas();
      if (!schemasResult.success || !schemasResult.data) {
        return { success: false, error: 'Could not load templates' };
      }

      const matches: TemplateMatch[] = [];

      for (const schema of schemasResult.data) {
        const match = this.calculateTemplateMatch(schema, headers, sampleData);
        if (match.confidence > 0.3) { // Only include reasonable matches
          matches.push(match);
        }
      }

      // Sort by confidence descending
      matches.sort((a, b) => b.confidence - a.confidence);

      return { success: true, data: matches };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Calculate how well a template matches file headers
   */
  private static calculateTemplateMatch(
    schema: TemplateSchema,
    fileHeaders: string[],
    sampleData?: any[][]
  ): TemplateMatch {
    const templateColumns = schema.schema_definition.columns.map(col => col.name);
    const normalizedFileHeaders = fileHeaders.map(h => h.trim().toLowerCase());
    const normalizedTemplateColumns = templateColumns.map(col => col.toLowerCase());

    let matchedColumns: string[] = [];
    let missingColumns: string[] = [];
    let extraColumns = [...fileHeaders];

    // Check for exact matches
    templateColumns.forEach(templateCol => {
      const normalizedTemplateCol = templateCol.toLowerCase();
      const fileHeaderIndex = normalizedFileHeaders.indexOf(normalizedTemplateCol);
      
      if (fileHeaderIndex !== -1) {
        matchedColumns.push(templateCol);
        extraColumns = extraColumns.filter(h => h.toLowerCase() !== normalizedTemplateCol);
      } else {
        missingColumns.push(templateCol);
      }
    });

    // Handle variable year columns
    if (schema.schema_definition.variableYearColumns) {
      const yearPattern = new RegExp(schema.schema_definition.yearColumnPattern || '^[0-9]{4}$');
      const yearColumns = fileHeaders.filter(h => yearPattern.test(h.trim()));
      
      yearColumns.forEach(yearCol => {
        matchedColumns.push(yearCol);
        extraColumns = extraColumns.filter(h => h !== yearCol);
        // Remove placeholder year columns from missing
        missingColumns = missingColumns.filter(col => !yearPattern.test(col));
      });
    }

    // Calculate confidence score
    const totalTemplateColumns = templateColumns.length;
    const requiredColumns = schema.schema_definition.columns.filter(col => col.required).length;
    const matchedRequired = schema.schema_definition.columns
      .filter(col => col.required && matchedColumns.includes(col.name)).length;

    let confidence = 0;
    
    if (totalTemplateColumns > 0) {
      // Base score from column matches
      confidence = matchedColumns.length / totalTemplateColumns;
      
      // Boost for required column matches
      if (requiredColumns > 0) {
        const requiredBoost = (matchedRequired / requiredColumns) * 0.3;
        confidence += requiredBoost;
      }
      
      // Penalty for many extra columns
      if (extraColumns.length > templateColumns.length) {
        confidence *= 0.7;
      }
      
      // Boost if template name appears in filename or specific patterns
      // This could be enhanced with more sophisticated matching
    }

    confidence = Math.min(confidence, 1.0);

    return {
      template_name: schema.name,
      confidence,
      matched_columns: matchedColumns,
      missing_columns: missingColumns,
      extra_columns: extraColumns
    };
  }

  /**
   * Get template versions for a specific template
   */
  static async getTemplateVersions(
    templateSchemaId: string
  ): Promise<TemplateServiceResponse<TemplateVersion[]>> {
    try {
      const { data, error } = await supabase
        .from('template_versions')
        .select('*')
        .eq('template_schema_id', templateSchemaId)
        .order('version_number', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Validate file metadata against template requirements
   */
  static validateFileMetadata(
    schema: TemplateSchema,
    metadata: FileMetadata
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required columns
    const requiredColumns = schema.schema_definition.columns
      .filter(col => col.required)
      .map(col => col.name);

    const missingRequired = requiredColumns.filter(
      reqCol => !metadata.headers.includes(reqCol)
    );

    if (missingRequired.length > 0) {
      errors.push(`Missing required columns: ${missingRequired.join(', ')}`);
    }

    // Check file size limits (example: 40MB)
    if (metadata.file_size > 40 * 1024 * 1024) {
      errors.push('File size exceeds 40MB limit');
    }

    // Check for empty file
    if (metadata.row_count === 0) {
      errors.push('File appears to be empty');
    }

    // Check encoding
    if (metadata.encoding && !['utf-8', 'iso-8859-1', 'windows-1252'].includes(metadata.encoding.toLowerCase())) {
      warnings.push(`Unusual file encoding detected: ${metadata.encoding}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}