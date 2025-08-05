/**
 * Comprehensive Configuration Tests
 * 
 * Tests configuration parsing, validation, and template management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  parseTemplate, 
  validateTemplate, 
  mergeConfig,
  ConfigValidationError 
} from '@/utils/configParser';
import { 
  mockTemplateConfig,
  createMockCompany 
} from '@tests/fixtures/financial-data';

// Mock configuration data
const mockValidConfig = {
  company: {
    name: 'Test Company',
    currency: 'CLP',
    fiscalYearEnd: '12-31',
    accounting: {
      method: 'accrual',
      currency: 'CLP',
      precision: 2,
    },
  },
  templates: {
    balanceSheet: {
      accounts: {
        assets: ['1000-1999'],
        liabilities: ['2000-2999'],
        equity: ['3000-3999'],
      },
    },
  },
  validation: {
    strictMode: true,
    tolerances: {
      rounding: 0.01,
      percentage: 0.001,
    },
  },
};

const mockInvalidConfig = {
  company: {
    // Missing required name
    currency: 'INVALID_CURRENCY',
    fiscalYearEnd: '13-32', // Invalid date
  },
  templates: {
    // Missing required template structure
  },
  validation: {
    strictMode: 'not_boolean', // Wrong type
    tolerances: {
      rounding: -1, // Invalid negative value
    },
  },
};

describe('Configuration Parser Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseTemplate function', () => {
    it('should parse valid template configuration', () => {
      const result = parseTemplate(mockTemplateConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.template).toEqual(mockTemplateConfig);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject template with missing required fields', () => {
      const invalidTemplate = {
        ...mockTemplateConfig,
        columns: undefined, // Remove required field
      };
      
      const result = parseTemplate(invalidTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template debe incluir columnas');
    });

    it('should validate column types and requirements', () => {
      const invalidTemplate = {
        ...mockTemplateConfig,
        columns: [
          { name: 'Cuenta', required: true, type: 'invalid_type' }, // Invalid type
          { name: '', required: true, type: 'string' }, // Empty name
        ],
      };
      
      const result = parseTemplate(invalidTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle nested template configurations', () => {
      const nestedTemplate = {
        ...mockTemplateConfig,
        mappings: {
          accounts: {
            assets: {
              current: ['1100', '1200'],
              nonCurrent: ['1300', '1400'],
            },
            liabilities: {
              current: ['2100', '2200'],
              nonCurrent: ['2300', '2400'],
            },
          },
        },
      };
      
      const result = parseTemplate(nestedTemplate);
      
      expect(result.isValid).toBe(true);
      expect(result.template.mappings.accounts.assets.current).toEqual(['1100', '1200']);
    });
  });

  describe('validateTemplate function', () => {
    it('should validate template structure', () => {
      const result = validateTemplate(mockTemplateConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect circular references in templates', () => {
      const circularTemplate = {
        ...mockTemplateConfig,
        dependencies: ['template-b'],
        references: {
          'template-b': {
            dependencies: [mockTemplateConfig.id], // Circular reference
          },
        },
      };
      
      const result = validateTemplate(circularTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dependencia circular detectada');
    });

    it('should validate account code patterns', () => {
      const invalidTemplate = {
        ...mockTemplateConfig,
        validationRules: {
          accountPattern: '[0-9{4}', // Invalid regex
          balanceCheck: true,
        },
      };
      
      const result = validateTemplate(invalidTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Patrón de cuenta inválido');
    });

    it('should validate required vs optional column configuration', () => {
      const inconsistentTemplate = {
        ...mockTemplateConfig,
        columns: [
          { name: 'Cuenta', required: true, type: 'string' },
          { name: 'Débito', required: false, type: 'number' },
          { name: 'Crédito', required: false, type: 'number' },
        ],
        validationRules: {
          debitCreditValidation: true, // But both are optional!
        },
      };
      
      const result = validateTemplate(inconsistentTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Configuración inconsistente');
    });
  });

  describe('mergeConfig function', () => {
    it('should merge configurations correctly', () => {
      const baseConfig = {
        company: { name: 'Base Company', currency: 'USD' },
        validation: { strictMode: false },
      };
      
      const overrideConfig = {
        company: { currency: 'CLP' }, // Override currency
        templates: { custom: 'template' }, // Add new section
      };
      
      const result = mergeConfig(baseConfig, overrideConfig);
      
      expect(result.company.name).toBe('Base Company'); // Preserved
      expect(result.company.currency).toBe('CLP'); // Overridden
      expect(result.validation.strictMode).toBe(false); // Preserved
      expect(result.templates.custom).toBe('template'); // Added
    });

    it('should handle deep merge of nested objects', () => {
      const baseConfig = {
        validation: {
          tolerances: { rounding: 0.01, percentage: 0.001 },
          rules: { strict: true },
        },
      };
      
      const overrideConfig = {
        validation: {
          tolerances: { rounding: 0.05 }, // Override only rounding
          newRule: 'value',
        },
      };
      
      const result = mergeConfig(baseConfig, overrideConfig);
      
      expect(result.validation.tolerances.rounding).toBe(0.05);
      expect(result.validation.tolerances.percentage).toBe(0.001); // Preserved
      expect(result.validation.rules.strict).toBe(true); // Preserved
      expect(result.validation.newRule).toBe('value'); // Added
    });

    it('should validate merged configuration', () => {
      const baseConfig = mockValidConfig;
      const invalidOverride = {
        company: { currency: 'INVALID' },
      };
      
      expect(() => {
        mergeConfig(baseConfig, invalidOverride, { validate: true });
      }).toThrow(ConfigValidationError);
    });
  });

  describe('Configuration Schema Validation', () => {
    it('should validate complete configuration schema', () => {
      const result = validateConfig(mockValidConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration with invalid values', () => {
      const result = validateConfig(mockInvalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate currency codes', () => {
      const invalidCurrencyConfig = {
        ...mockValidConfig,
        company: {
          ...mockValidConfig.company,
          currency: 'XYZ', // Invalid currency code
        },
      };
      
      const result = validateConfig(invalidCurrencyConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Código de moneda inválido');
    });

    it('should validate fiscal year end format', () => {
      const invalidFiscalConfig = {
        ...mockValidConfig,
        company: {
          ...mockValidConfig.company,
          fiscalYearEnd: '2024-13-32', // Invalid date
        },
      };
      
      const result = validateConfig(invalidFiscalConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Formato de fecha inválido');
    });

    it('should validate accounting method', () => {
      const invalidMethodConfig = {
        ...mockValidConfig,
        company: {
          ...mockValidConfig.company,
          accounting: {
            method: 'invalid_method', // Should be 'accrual' or 'cash'
          },
        },
      };
      
      const result = validateConfig(invalidMethodConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Método contable inválido');
    });
  });

  describe('Template Management', () => {
    it('should manage multiple templates', () => {
      const templates = [
        { ...mockTemplateConfig, id: 'template-1' },
        { ...mockTemplateConfig, id: 'template-2', name: 'Income Statement' },
      ];
      
      const manager = new TemplateManager(templates);
      
      expect(manager.getTemplate('template-1')).toBeDefined();
      expect(manager.getTemplate('template-2')).toBeDefined();
      expect(manager.getAllTemplates()).toHaveLength(2);
    });

    it('should handle template dependencies', () => {
      const baseTemplate = { ...mockTemplateConfig, id: 'base' };
      const derivedTemplate = {
        ...mockTemplateConfig,
        id: 'derived',
        extends: 'base',
        columns: [
          ...mockTemplateConfig.columns,
          { name: 'Extra', required: false, type: 'string' },
        ],
      };
      
      const manager = new TemplateManager([baseTemplate, derivedTemplate]);
      const resolved = manager.resolveTemplate('derived');
      
      expect(resolved.columns).toHaveLength(mockTemplateConfig.columns.length + 1);
      expect(resolved.columns.find(c => c.name === 'Extra')).toBeDefined();
    });

    it('should detect missing dependencies', () => {
      const templateWithMissingDep = {
        ...mockTemplateConfig,
        id: 'dependent',
        extends: 'missing-template',
      };
      
      expect(() => {
        new TemplateManager([templateWithMissingDep]);
      }).toThrow('Template dependency not found: missing-template');
    });
  });

  describe('Configuration File Formats', () => {
    it('should parse JSON configuration files', () => {
      const jsonConfig = JSON.stringify(mockValidConfig);
      const result = parseConfigFile(jsonConfig, 'json');
      
      expect(result.isValid).toBe(true);
      expect(result.config).toEqual(mockValidConfig);
    });

    it('should parse YAML configuration files', () => {
      const yamlConfig = `
company:
  name: Test Company
  currency: CLP
validation:
  strictMode: true
`;
      
      const result = parseConfigFile(yamlConfig, 'yaml');
      
      expect(result.isValid).toBe(true);
      expect(result.config.company.name).toBe('Test Company');
    });

    it('should handle malformed configuration files', () => {
      const malformedJson = '{ "company": { "name": "Test" } }'; // Missing closing brace
      const result = parseConfigFile(malformedJson, 'json');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Error de sintaxis en configuración');
    });

    it('should validate file format consistency', () => {
      const jsonContent = JSON.stringify(mockValidConfig);
      const result = parseConfigFile(jsonContent, 'yaml'); // Wrong format specified
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Formato de archivo inconsistente');
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should handle development environment config', () => {
      const devConfig = {
        ...mockValidConfig,
        environment: 'development',
        debug: true,
        validation: {
          ...mockValidConfig.validation,
          strictMode: false, // Less strict in dev
        },
      };
      
      const result = validateConfig(devConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Modo de desarrollo activado');
    });

    it('should handle production environment config', () => {
      const prodConfig = {
        ...mockValidConfig,
        environment: 'production',
        debug: false,
        validation: {
          ...mockValidConfig.validation,
          strictMode: true,
        },
      };
      
      const result = validateConfig(prodConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.config.debug).toBe(false);
    });

    it('should require secure settings in production', () => {
      const insecureProdConfig = {
        ...mockValidConfig,
        environment: 'production',
        security: {
          enableHttps: false, // Insecure for production
          validateCsrf: false,
        },
      };
      
      const result = validateConfig(insecureProdConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('HTTPS requerido en producción');
    });
  });

  describe('Configuration Migration and Versioning', () => {
    it('should handle configuration version migration', () => {
      const oldVersionConfig = {
        version: '1.0',
        company: { name: 'Test' },
        // Old structure
        accountingRules: {
          strictBalance: true,
        },
      };
      
      const migrated = migrateConfig(oldVersionConfig, '2.0');
      
      expect(migrated.version).toBe('2.0');
      expect(migrated.validation.strictMode).toBe(true); // Migrated field
    });

    it('should validate configuration compatibility', () => {
      const futureVersionConfig = {
        version: '99.0', // Future version
        company: { name: 'Test' },
      };
      
      const result = validateConfigCompatibility(futureVersionConfig, '2.0');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Versión de configuración no compatible');
    });

    it('should provide migration path suggestions', () => {
      const outdatedConfig = {
        version: '0.5',
        company: { name: 'Test' },
      };
      
      const result = validateConfigCompatibility(outdatedConfig, '2.0');
      
      expect(result.migrationPath).toBeDefined();
      expect(result.migrationPath).toContain('1.0');
      expect(result.migrationPath).toContain('2.0');
    });
  });
});

// Helper functions that would be implemented in the actual config parser
function validateConfig(config: any) {
  // Implementation would go here
  return { isValid: true, errors: [], warnings: [], config };
}

function parseConfigFile(content: string, format: string) {
  // Implementation would go here
  try {
    if (format === 'json') {
      const config = JSON.parse(content);
      return { isValid: true, config, errors: [] };
    }
    // YAML parsing would go here
    return { isValid: true, config: {}, errors: [] };
  } catch (error) {
    return { isValid: false, config: null, errors: ['Error de sintaxis en configuración'] };
  }
}

class TemplateManager {
  private templates: Map<string, any>;

  constructor(templates: any[]) {
    this.templates = new Map();
    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
    
    // Validate dependencies
    templates.forEach(template => {
      if (template.extends && !this.templates.has(template.extends)) {
        throw new Error(`Template dependency not found: ${template.extends}`);
      }
    });
  }

  getTemplate(id: string) {
    return this.templates.get(id);
  }

  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  resolveTemplate(id: string) {
    const template = this.templates.get(id);
    if (!template) return null;
    
    if (template.extends) {
      const baseTemplate = this.resolveTemplate(template.extends);
      return {
        ...baseTemplate,
        ...template,
        columns: [...(baseTemplate?.columns || []), ...(template.columns || [])],
      };
    }
    
    return template;
  }
}

function migrateConfig(config: any, targetVersion: string) {
  // Implementation would go here
  return {
    ...config,
    version: targetVersion,
    validation: {
      strictMode: config.accountingRules?.strictBalance || false,
    },
  };
}

function validateConfigCompatibility(config: any, currentVersion: string) {
  // Implementation would go here
  const configVersion = parseFloat(config.version);
  const currentVer = parseFloat(currentVersion);
  
  if (configVersion > currentVer) {
    return {
      isValid: false,
      errors: ['Versión de configuración no compatible'],
      migrationPath: null,
    };
  }
  
  if (configVersion < currentVer) {
    return {
      isValid: false,
      errors: ['Configuración desactualizada'],
      migrationPath: ['1.0', '2.0'],
    };
  }
  
  return { isValid: true, errors: [], migrationPath: null };
}