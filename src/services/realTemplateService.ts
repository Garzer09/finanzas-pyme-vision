/**
 * Real Template Service
 * Provides database-backed template management with proper company_id integration
 */

import { supabase } from '@/integrations/supabase/client';

export interface DatabaseTemplateSchema {
  id: string;
  name: string;
  display_name: string;
  category: string;
  version: string;
  schema_definition: {
    columns: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }>;
    variableYearColumns?: boolean;
    yearColumnPattern?: string;
    expectedConcepts?: string[];
    allowAdditionalColumns?: boolean;
    delimiter?: string;
  };
  validation_rules: any[];
  description?: string;
  is_active: boolean;
  is_required?: boolean;
  created_at: string;
}

export class RealTemplateService {
  
  /**
   * Get all active templates from database
   */
  async getTemplates(): Promise<DatabaseTemplateSchema[]> {
    const { data, error } = await supabase
      .from('template_schemas')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }

    return (data || []).map(item => ({
      ...item,
      schema_definition: item.schema_definition as any,
      validation_rules: item.validation_rules as any
    }));
  }

  /**
   * Get template by name
   */
  async getTemplateByName(name: string): Promise<DatabaseTemplateSchema | null> {
    const { data, error } = await supabase
      .from('template_schemas')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching template:', error);
      throw error;
    }

    return {
      ...data,
      schema_definition: data.schema_definition as any,
      validation_rules: data.validation_rules as any
    };
  }

  /**
   * Generate template using edge function
   */
  async generateTemplate(params: {
    template_name: string;
    company_id?: string;
    years?: number[];
    format?: 'csv' | 'xlsx';
    include_sample_data?: boolean;
  }): Promise<any> {
    const { data, error } = await supabase.functions.invoke('template-generator', {
      body: params
    });

    if (error) {
      console.error('Template generation error:', error);
      throw error;
    }

    return data;
  }

  /**
   * Process uploaded file using enhanced processor
   */
  async processFile(params: {
    file: File;
    template_name?: string;
    company_id?: string;
    selected_years?: number[];
    dry_run?: boolean;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('file', params.file);
    
    if (params.template_name) formData.append('template_name', params.template_name);
    if (params.company_id) formData.append('company_id', params.company_id);
    if (params.selected_years) {
      params.selected_years.forEach(year => 
        formData.append('selected_years[]', year.toString())
      );
    }
    if (params.dry_run) formData.append('dry_run', 'true');

    const { data, error } = await supabase.functions.invoke('enhanced-template-processor', {
      body: formData
    });

    if (error) {
      console.error('File processing error:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get upload history for a company
   */
  async getUploadHistory(companyId?: string): Promise<any[]> {
    let query = supabase
      .from('upload_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching upload history:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get company customizations for templates
   */
  async getCompanyCustomizations(companyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('company_template_customizations')
      .select(`
        *,
        template_schemas (
          name,
          display_name,
          category
        )
      `)
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching customizations:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Save company template customization
   */
  async saveCompanyCustomization(params: {
    company_id: string;
    template_schema_id: string;
    custom_display_name?: string;
    custom_schema?: any;
    custom_validations?: any;
  }): Promise<any> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('company_template_customizations')
      .upsert({
        ...params,
        created_by: user.user?.id || '',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving customization:', error);
      throw error;
    }

    return data;
  }

  /**
   * Validate file against template schema
   */
  async validateFileAgainstTemplate(
    templateName: string, 
    fileContent: string,
    companyId?: string
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const template = await this.getTemplateByName(templateName);
    if (!template) {
      return {
        isValid: false,
        errors: ['Template not found'],
        warnings: []
      };
    }

    // Get company customizations if available
    let customizations = null;
    if (companyId) {
      const customizationData = await supabase
        .from('company_template_customizations')
        .select('*')
        .eq('company_id', companyId)
        .eq('template_schema_id', template.id)
        .eq('is_active', true)
        .single();

      if (customizationData.data) {
        customizations = customizationData.data;
      }
    }

    // Apply basic validation logic
    const lines = fileContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      return {
        isValid: false,
        errors: ['File is empty'],
        warnings: []
      };
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredColumns = template.schema_definition.columns
      .filter(col => col.required)
      .map(col => col.name);

    const missingColumns = requiredColumns.filter(req => 
      !headers.some(h => h.toLowerCase() === req.toLowerCase())
    );

    const errors: string[] = [];
    const warnings: string[] = [];

    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    if (headers.length > template.schema_definition.columns.length + 5) {
      warnings.push('File has significantly more columns than expected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const realTemplateService = new RealTemplateService();