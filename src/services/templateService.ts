/**
 * Template Service
 * Provides template management functionality using real database templates
 */

import { supabase } from '@/integrations/supabase/client';

export interface TemplateSchema {
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
      validations?: Array<any>;
    }>;
    variableYearColumns?: boolean;
    yearColumnPattern?: string;
    expectedConcepts?: string[];
    allowAdditionalColumns?: boolean;
    delimiter?: string;
    sections?: string[];
  };
  validation_rules: Array<{
    type: string;
    message: string;
    severity?: 'error' | 'warning' | 'info';
    description?: string;
  }>;
  description?: string;
  is_active: boolean;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

// Template cache for performance
let templateCache: TemplateSchema[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class TemplateService {
  private async clearCache() {
    templateCache = null;
    cacheTimestamp = 0;
  }

  private async getCachedTemplates(): Promise<TemplateSchema[]> {
    const now = Date.now();
    if (templateCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return templateCache;
    }

    const { data, error } = await supabase
      .from('template_schemas')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching templates:', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    // Transform database data to match our interface
    const transformedData = (data || []).map(item => ({
      ...item,
      schema_definition: typeof item.schema_definition === 'string' 
        ? JSON.parse(item.schema_definition) 
        : item.schema_definition,
      validation_rules: typeof item.validation_rules === 'string'
        ? JSON.parse(item.validation_rules)
        : item.validation_rules
    })) as TemplateSchema[];

    templateCache = transformedData;
    cacheTimestamp = now;
    return templateCache;
  }

  async getTemplates(): Promise<TemplateSchema[]> {
    return this.getCachedTemplates();
  }

  async getTemplate(id: string): Promise<TemplateSchema | null> {
    const { data, error } = await supabase
      .from('template_schemas')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Template not found
      }
      throw new Error(`Failed to fetch template: ${error.message}`);
    }

    // Transform database data to match our interface
    if (data) {
      return {
        ...data,
        schema_definition: typeof data.schema_definition === 'string' 
          ? JSON.parse(data.schema_definition) 
          : data.schema_definition,
        validation_rules: typeof data.validation_rules === 'string'
          ? JSON.parse(data.validation_rules)
          : data.validation_rules
      } as TemplateSchema;
    }

    return null;
  }

  async getTemplatesByCategory(category: string): Promise<TemplateSchema[]> {
    const { data, error } = await supabase
      .from('template_schemas')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch templates by category: ${error.message}`);
    }

    // Transform database data to match our interface
    return (data || []).map(item => ({
      ...item,
      schema_definition: typeof item.schema_definition === 'string' 
        ? JSON.parse(item.schema_definition) 
        : item.schema_definition,
      validation_rules: typeof item.validation_rules === 'string'
        ? JSON.parse(item.validation_rules)
        : item.validation_rules
    })) as TemplateSchema[];
  }

  async createTemplate(template: Omit<TemplateSchema, 'id' | 'created_at' | 'updated_at'>): Promise<TemplateSchema> {
    const { data, error } = await supabase
      .from('template_schemas')
      .insert({
        ...template,
        schema_definition: JSON.stringify(template.schema_definition),
        validation_rules: JSON.stringify(template.validation_rules)
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    this.clearCache(); // Clear cache after creating
    return this.getTemplate(data.id) as Promise<TemplateSchema>;
  }

  async updateTemplate(id: string, updates: Partial<TemplateSchema>): Promise<TemplateSchema | null> {
    const updateData: any = { ...updates };
    if (updateData.schema_definition) {
      updateData.schema_definition = JSON.stringify(updateData.schema_definition);
    }
    if (updateData.validation_rules) {
      updateData.validation_rules = JSON.stringify(updateData.validation_rules);
    }

    const { error } = await supabase
      .from('template_schemas')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }

    this.clearCache(); // Clear cache after updating
    return this.getTemplate(id);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('template_schemas')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      return false;
    }

    this.clearCache(); // Clear cache after deleting
    return true;
  }

  async validateFileAgainstTemplate(templateId: string, fileData: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const template = await this.getTemplate(templateId);
    if (!template) {
      return {
        isValid: false,
        errors: ['Template not found'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation logic using schema_definition
    template.schema_definition.columns.forEach(column => {
      if (column.required && !fileData[column.name]) {
        errors.push(`Required field '${column.name}' is missing`);
      }
      if (fileData[column.name] && column.type === 'numeric' && isNaN(Number(fileData[column.name]))) {
        errors.push(`Field '${column.name}' must be a number`);
      }
    });

    // Warnings
    if (Object.keys(fileData).length > template.schema_definition.columns.length) {
      warnings.push('File contains more fields than template expects');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Additional methods to match existing usage
  async getTemplateSchemas(): Promise<TemplateSchema[]> {
    return this.getTemplates();
  }

  async getTemplateSchema(id: string): Promise<TemplateSchema | null> {
    return this.getTemplate(id);
  }

  async getRequiredTemplates(): Promise<TemplateSchema[]> {
    const { data, error } = await supabase
      .from('template_schemas')
      .select('*')
      .eq('is_required', true)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching required templates:', error);
      return [];
    }

    // Transform database data to match our interface
    return (data || []).map(item => ({
      ...item,
      schema_definition: typeof item.schema_definition === 'string' 
        ? JSON.parse(item.schema_definition) 
        : item.schema_definition,
      validation_rules: typeof item.validation_rules === 'string'
        ? JSON.parse(item.validation_rules)
        : item.validation_rules
    })) as TemplateSchema[];
  }

  async generateTemplate(data: any): Promise<{ success: boolean; content?: string; filename?: string; error?: string }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('template-generator', {
        body: {
          template_name: data.template_name || data.name,
          company_id: data.company_id,
          years: data.years || [],
          customizations: data.customizations,
          format: data.format || 'csv',
          include_sample_data: data.include_sample_data !== false
        }
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        content: result.template_content,
        filename: result.filename
      };
    } catch (error) {
      console.error('Error generating template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getCompanyCustomizations(companyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('company_template_customizations')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching company customizations:', error);
      return [];
    }

    return data || [];
  }

  async saveCompanyCustomization(companyId: string, templateId: string, customizations: any): Promise<any> {
    return {
      id: Math.random().toString(36).substr(2, 9),
      company_id: companyId,
      template_id: templateId,
      customizations,
      created_at: new Date().toISOString()
    };
  }

  async getEffectiveTemplateSchema(templateId: string, companyId?: string): Promise<TemplateSchema | null> {
    // For now, just return the base template
    return this.getTemplate(templateId);
  }

  async detectTemplate(fileData: any): Promise<{ templateId: string; confidence: number } | null> {
    try {
      const templates = await this.getTemplates();
      const fieldNames = Object.keys(fileData);
      
      let bestMatch: { templateId: string; confidence: number } | null = null;
      let highestConfidence = 0;
      
      for (const template of templates) {
        const templateFields = template.schema_definition.columns.map(col => col.name);
        const matchedFields = templateFields.filter(field => 
          fieldNames.some(fn => fn.toLowerCase().includes(field.toLowerCase()))
        );
        
        if (matchedFields.length > 0) {
          const confidence = matchedFields.length / templateFields.length;
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = {
              templateId: template.id,
              confidence
            };
          }
        }
      }
      
      return bestMatch;
    } catch (error) {
      console.error('Error detecting template:', error);
      return null;
    }
  }

  async getCustomizations(): Promise<any[]> {
    return [];
  }

  async saveCustomization(data: any): Promise<void> {
    console.log('Saving customization:', data);
  }

  async getCustomization(id: string): Promise<any> {
    return {
      id,
      name: 'Default Customization',
      settings: {}
    };
  }
}

export const templateService = new TemplateService();