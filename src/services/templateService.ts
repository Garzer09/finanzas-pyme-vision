/**
 * Template Service
 * Provides template management functionality using mock data
 * (No database tables exist for templates yet)
 */

export interface TemplateSchema {
  id: string;
  name: string;
  display_name: string;
  category: string;
  version: string;
  fields: any[];
  validations: any[];
  description?: string;
  is_active: boolean;
  created_at: string;
}

// Mock templates data
const MOCK_TEMPLATES: TemplateSchema[] = [
  {
    id: '1',
    name: 'balance-sheet',
    display_name: 'Balance Sheet',
    category: 'financial',
    version: '1.0',
    fields: [
      { name: 'activo_corriente', type: 'number', required: true },
      { name: 'activo_no_corriente', type: 'number', required: true },
      { name: 'pasivo_corriente', type: 'number', required: true },
      { name: 'pasivo_no_corriente', type: 'number', required: true },
      { name: 'patrimonio_neto', type: 'number', required: true }
    ],
    validations: [
      { rule: 'balance_check', message: 'Activo debe igual Pasivo + Patrimonio' }
    ],
    description: 'Standard balance sheet template',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'profit-loss',
    display_name: 'Profit & Loss',
    category: 'financial',
    version: '1.0',
    fields: [
      { name: 'ingresos', type: 'number', required: true },
      { name: 'costes_ventas', type: 'number', required: true },
      { name: 'gastos_operativos', type: 'number', required: true },
      { name: 'gastos_financieros', type: 'number', required: false },
      { name: 'impuestos', type: 'number', required: false }
    ],
    validations: [
      { rule: 'positive_revenues', message: 'Ingresos deben ser positivos' }
    ],
    description: 'Standard profit and loss template',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'cash-flow',
    display_name: 'Cash Flow',
    category: 'financial',
    version: '1.0',
    fields: [
      { name: 'flujo_operativo', type: 'number', required: true },
      { name: 'flujo_inversion', type: 'number', required: true },
      { name: 'flujo_financiacion', type: 'number', required: true }
    ],
    validations: [],
    description: 'Standard cash flow template',
    is_active: true,
    created_at: new Date().toISOString()
  }
];

export class TemplateService {
  async getTemplates(): Promise<TemplateSchema[]> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return MOCK_TEMPLATES.filter(t => t.is_active);
  }

  async getTemplate(id: string): Promise<TemplateSchema | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return MOCK_TEMPLATES.find(t => t.id === id) || null;
  }

  async getTemplatesByCategory(category: string): Promise<TemplateSchema[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return MOCK_TEMPLATES.filter(t => t.category === category && t.is_active);
  }

  async createTemplate(template: Omit<TemplateSchema, 'id' | 'created_at'>): Promise<TemplateSchema> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newTemplate: TemplateSchema = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    
    // In a real implementation, this would be saved to database
    MOCK_TEMPLATES.push(newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<TemplateSchema>): Promise<TemplateSchema | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const templateIndex = MOCK_TEMPLATES.findIndex(t => t.id === id);
    if (templateIndex === -1) return null;
    
    MOCK_TEMPLATES[templateIndex] = {
      ...MOCK_TEMPLATES[templateIndex],
      ...updates
    };
    
    return MOCK_TEMPLATES[templateIndex];
  }

  async deleteTemplate(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const templateIndex = MOCK_TEMPLATES.findIndex(t => t.id === id);
    if (templateIndex === -1) return false;
    
    // Soft delete - mark as inactive
    MOCK_TEMPLATES[templateIndex].is_active = false;
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

    // Mock validation logic
    template.fields.forEach(field => {
      if (field.required && !fileData[field.name]) {
        errors.push(`Required field '${field.name}' is missing`);
      }
      if (fileData[field.name] && field.type === 'number' && isNaN(Number(fileData[field.name]))) {
        errors.push(`Field '${field.name}' must be a number`);
      }
    });

    // Mock warnings
    if (Object.keys(fileData).length > template.fields.length) {
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
    return MOCK_TEMPLATES.filter(t => t.is_active);
  }

  async generateTemplate(data: any): Promise<TemplateSchema> {
    return this.createTemplate({
      name: data.name || 'generated-template',
      display_name: data.displayName || 'Generated Template',
      category: data.category || 'custom',
      version: '1.0',
      fields: data.fields || [],
      validations: data.validations || [],
      description: data.description,
      is_active: true
    });
  }

  async getCompanyCustomizations(companyId: string): Promise<any[]> {
    // Mock customizations
    return [{
      id: '1',
      company_id: companyId,
      template_id: '1',
      customizations: {},
      created_at: new Date().toISOString()
    }];
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
    // Mock template detection
    const fieldNames = Object.keys(fileData);
    
    for (const template of MOCK_TEMPLATES) {
      const matchedFields = template.fields.filter(field => 
        fieldNames.some(fn => fn.toLowerCase().includes(field.name.toLowerCase()))
      );
      
      if (matchedFields.length > 0) {
        return {
          templateId: template.id,
          confidence: matchedFields.length / template.fields.length
        };
      }
    }
    
    return null;
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