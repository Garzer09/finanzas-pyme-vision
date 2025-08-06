import { useState, useEffect } from 'react';
import { realTemplateService } from '@/services/realTemplateService';
import type { DatabaseTemplateSchema } from '@/services/realTemplateService';
import { toast } from 'sonner';

export const useRealTemplates = (companyId?: string) => {
  const [templates, setTemplates] = useState<DatabaseTemplateSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [customizations, setCustomizations] = useState<any[]>([]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await realTemplateService.getTemplates();
      setTemplates(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading templates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadHistory = async () => {
    try {
      const data = await realTemplateService.getUploadHistory(companyId);
      setUploadHistory(data);
    } catch (err) {
      console.error('Error loading upload history:', err);
    }
  };

  const fetchCustomizations = async () => {
    if (!companyId) return;
    
    try {
      const data = await realTemplateService.getCompanyCustomizations(companyId);
      setCustomizations(data);
    } catch (err) {
      console.error('Error loading customizations:', err);
    }
  };

  const generateTemplate = async (params: {
    template_name: string;
    years?: number[];
    format?: 'csv' | 'xlsx';
    include_sample_data?: boolean;
  }) => {
    try {
      setLoading(true);
      const result = await realTemplateService.generateTemplate({
        ...params,
        company_id: companyId
      });

      // Create download link
      if (result.template_content) {
        const blob = new Blob([result.template_content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || `${params.template_name}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success(`Template ${result.template_display_name} descargado correctamente`);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error generating template';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (params: {
    file: File;
    template_name?: string;
    selected_years?: number[];
    dry_run?: boolean;
  }) => {
    try {
      setLoading(true);
      const result = await realTemplateService.processFile({
        ...params,
        company_id: companyId
      });

      if (result.success) {
        toast.success('Archivo procesado correctamente');
        await fetchUploadHistory(); // Refresh history
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error processing file';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const validateFile = async (file: File, templateName: string) => {
    try {
      const content = await file.text();
      return await realTemplateService.validateFileAgainstTemplate(
        templateName, 
        content, 
        companyId
      );
    } catch (err) {
      console.error('Error validating file:', err);
      return {
        isValid: false,
        errors: ['Error validating file'],
        warnings: []
      };
    }
  };

  const saveCustomization = async (params: {
    template_schema_id: string;
    custom_display_name?: string;
    custom_schema?: any;
    custom_validations?: any;
  }) => {
    if (!companyId) throw new Error('Company ID required for customizations');

    try {
      setLoading(true);
      const result = await realTemplateService.saveCompanyCustomization({
        ...params,
        company_id: companyId
      });

      await fetchCustomizations(); // Refresh customizations
      toast.success('Personalización guardada correctamente');
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error saving customization';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    if (companyId) {
      fetchUploadHistory();
      fetchCustomizations();
    }
  }, [companyId]);

  return {
    templates,
    loading,
    error,
    uploadHistory,
    customizations,
    
    // Actions
    fetchTemplates,
    fetchUploadHistory,
    fetchCustomizations,
    generateTemplate,
    processFile,
    validateFile,
    saveCustomization,
    
    // Computed values
    hasRealData: templates.length > 0,
    requiredTemplates: templates.filter(t => t.is_required),
    optionalTemplates: templates.filter(t => !t.is_required),
    templatesByCategory: templates.reduce((acc, template) => {
      if (!acc[template.category]) acc[template.category] = [];
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, DatabaseTemplateSchema[]>)
  };
};