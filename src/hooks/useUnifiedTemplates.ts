import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface UnifiedTemplateParams {
  template_type: 'financial_series' | 'company_profile';
  company_id?: string;
  external_id?: string;
  years?: number[];
  frequencies?: string[];
  include_sample_data?: boolean;
}

export interface ProcessFileParams {
  file: File;
  company_id?: string;
  template_type?: string;
  dry_run?: boolean;
}

export interface MetricDictionary {
  id: string;
  metric_code: string;
  metric_name: string;
  category: string;
  value_kind: string;
  default_unit: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface ProcessingResult {
  success: boolean;
  template_type: string;
  rows_processed: number;
  inserted_count?: number;
  errors: string[];
  details?: any;
  preview?: any[];
  dry_run?: boolean;
}

export const useUnifiedTemplates = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricDictionary[]>([]);

  // Fetch metrics dictionary
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('metrics_dictionary')
        .select('*')
        .eq('is_active', true)
        .order('category, metric_code');

      if (error) throw error;
      setMetrics(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate unified template
  const generateTemplate = useCallback(async (params: UnifiedTemplateParams) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('dynamic-template-generator', {
        body: params
      });

      if (error) throw error;

      if (data?.success) {
        // Create and download file
        const blob = new Blob([data.content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Plantilla generada",
          description: `Se ha descargado ${data.filename}`,
        });
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate template';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Process file with unified format
  const processFile = useCallback(async (params: ProcessFileParams): Promise<ProcessingResult> => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', params.file);
      if (params.company_id) formData.append('company_id', params.company_id);
      if (params.template_type) formData.append('template_type', params.template_type);
      if (params.dry_run) formData.append('dry_run', 'true');

      const { data, error } = await supabase.functions.invoke('unified-template-processor-v3', {
        body: formData
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: params.dry_run ? "Validación completada" : "Archivo procesado",
          description: `${data.rows_processed} filas procesadas${data.inserted_count ? `, ${data.inserted_count} registros insertados` : ''}`,
        });
      } else if (data?.errors?.length > 0) {
        toast({
          title: "Errores encontrados",
          description: `${data.errors.length} errores de validación`,
          variant: "destructive",
        });
      }

      return data as ProcessingResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search metrics by alias
  const searchMetrics = useCallback(async (searchTerm: string): Promise<MetricDictionary[]> => {
    try {
      // First search in metrics dictionary
      const { data: directMatches } = await supabase
        .from('metrics_dictionary')
        .select('*')
        .or(`metric_code.ilike.%${searchTerm}%,metric_name.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(10);

      // Then search in aliases
      const { data: aliasMatches } = await supabase
        .from('metric_aliases')
        .select(`
          confidence_score,
          metrics_dictionary (
            metric_code,
            metric_name,
            category,
            value_kind,
            default_unit,
            description
          )
        `)
        .ilike('alias', `%${searchTerm}%`)
        .limit(10);

      const results = [...(directMatches || [])];
      
      // Add metrics found through aliases
      aliasMatches?.forEach(alias => {
        if (alias.metrics_dictionary && !results.some(r => r.metric_code === alias.metrics_dictionary.metric_code)) {
          results.push(alias.metrics_dictionary as MetricDictionary);
        }
      });

      return results;
    } catch (err) {
      console.error('Error searching metrics:', err);
      return [];
    }
  }, []);

  // Get processing statistics
  const getProcessingStats = useCallback(async (companyId: string) => {
    try {
      const { data: financialStats } = await supabase
        .from('financial_series_unified')
        .select('metric_code, frequency, period')
        .eq('company_id', companyId);

      const { data: profileStats } = await supabase
        .from('company_profile_unified')
        .select('record_type, field_name')
        .eq('company_id', companyId);

      return {
        financial_series: {
          total_records: financialStats?.length || 0,
          unique_metrics: new Set(financialStats?.map(s => s.metric_code)).size,
          periods_covered: new Set(financialStats?.map(s => s.period)).size
        },
        company_profile: {
          total_records: profileStats?.length || 0,
          record_types: new Set(profileStats?.map(s => s.record_type)).size,
          unique_fields: new Set(profileStats?.map(s => s.field_name)).size
        }
      };
    } catch (err) {
      console.error('Error getting processing stats:', err);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    metrics,
    fetchMetrics,
    generateTemplate,
    processFile,
    searchMetrics,
    getProcessingStats
  };
};