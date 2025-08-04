// React hooks for template management
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TemplateService } from '@/services/templateService';
import type {
  TemplateSchema,
  CompanyTemplateCustomization,
  TemplateServiceResponse,
  GenerateTemplateRequest,
  GenerateTemplateResponse
} from '@/types/templates';

export function useTemplates(category?: string) {
  const [templates, setTemplates] = useState<TemplateSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await TemplateService.getTemplateSchemas(category);
      
      if (result.success && result.data) {
        setTemplates(result.data);
      } else {
        setError(result.error || 'Failed to load templates');
        toast({
          title: "Error",
          description: result.error || 'Failed to load templates',
          variant: "destructive"
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [category, toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const getTemplate = useCallback(async (name: string): Promise<TemplateSchema | null> => {
    try {
      const result = await TemplateService.getTemplateSchema(name);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }, []);

  const getRequiredTemplates = useCallback(async (): Promise<TemplateSchema[]> => {
    try {
      const result = await TemplateService.getRequiredTemplates();
      return result.success ? result.data || [] : [];
    } catch {
      return [];
    }
  }, []);

  const generateTemplate = useCallback(async (request: GenerateTemplateRequest): Promise<GenerateTemplateResponse> => {
    return await TemplateService.generateTemplate(request);
  }, []);

  return {
    templates,
    loading,
    error,
    loadTemplates,
    getTemplate,
    getRequiredTemplates,
    generateTemplate
  };
}

export function useCompanyTemplateCustomizations(companyId: string) {
  const [customizations, setCustomizations] = useState<CompanyTemplateCustomization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadCustomizations = useCallback(async () => {
    if (!companyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await TemplateService.getCompanyCustomizations(companyId);
      
      if (result.success && result.data) {
        setCustomizations(result.data);
      } else {
        setError(result.error || 'Failed to load customizations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadCustomizations();
  }, [loadCustomizations]);

  const saveCustomization = useCallback(async (
    customization: Omit<CompanyTemplateCustomization, 'id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> => {
    try {
      const result = await TemplateService.saveCompanyCustomization(customization);
      
      if (result.success) {
        await loadCustomizations(); // Reload after save
        toast({
          title: "Success",
          description: "Template customization saved successfully"
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to save customization',
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [loadCustomizations, toast]);

  const getCustomization = useCallback((templateSchemaId: string): CompanyTemplateCustomization | undefined => {
    return customizations.find(c => c.template_schema_id === templateSchemaId && c.is_active);
  }, [customizations]);

  const getEffectiveTemplate = useCallback(async (templateName: string): Promise<TemplateSchema | null> => {
    try {
      const result = await TemplateService.getEffectiveTemplateSchema(templateName, companyId);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }, [companyId]);

  return {
    customizations,
    loading,
    error,
    loadCustomizations,
    saveCustomization,
    getCustomization,
    getEffectiveTemplate
  };
}

export function useTemplateDetection() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  const detectTemplate = useCallback(async (headers: string[], sampleData?: any[][]): Promise<{
    template_name: string;
    confidence: number;
    matched_columns: string[];
    missing_columns: string[];
    extra_columns: string[];
  }[]> => {
    setIsDetecting(true);
    setDetectionError(null);
    
    try {
      const result = await TemplateService.detectTemplate(headers, sampleData);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        setDetectionError(result.error || 'Failed to detect template');
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setDetectionError(errorMessage);
      return [];
    } finally {
      setIsDetecting(false);
    }
  }, []);

  return {
    detectTemplate,
    isDetecting,
    detectionError
  };
}

export function useTemplateGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateAndDownload = useCallback(async (request: GenerateTemplateRequest): Promise<boolean> => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const result = await TemplateService.generateTemplate(request);
      
      if (result.success && result.template_content) {
        // Create and trigger download
        const blob = new Blob([result.template_content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: `Template ${result.filename} downloaded successfully`
        });
        
        return true;
      } else {
        setGenerationError(result.error || 'Failed to generate template');
        toast({
          title: "Error",
          description: result.error || 'Failed to generate template',
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setGenerationError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  return {
    generateAndDownload,
    isGenerating,
    generationError
  };
}