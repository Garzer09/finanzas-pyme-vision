import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProcessingConfig {
  clientName?: string;
  industrySector?: string;
  requestedCharts?: string[];
}

interface ProcessingResult {
  originalData: Record<string, any>;
  mappedData: Record<string, any>;
  chartAssignments: any;
  clientConfig: ProcessingConfig;
}

export function useDataProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'mapping' | 'validation' | 'assignment' | 'complete'>('mapping');
  const [processingProgress, setProcessingProgress] = useState(0);

  const processExcelData = useCallback(async (
    excelData: Record<string, any>,
    config: ProcessingConfig = {}
  ): Promise<ProcessingResult | null> => {
    setIsProcessing(true);
    setProcessingStep('mapping');
    setProcessingProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Paso 1: Mapeo inteligente
      setProcessingProgress(25);
      const mappingResponse = await supabase.functions.invoke('intelligent-data-mapper', {
        body: {
          data: excelData,
          clientConfig: config,
          userId: user.id
        }
      });

      if (mappingResponse.error) throw mappingResponse.error;
      const mappingResult = mappingResponse.data.result;

      // Paso 2: Validación de datos
      setProcessingStep('validation');
      setProcessingProgress(50);
      
      const validationResponse = await supabase.functions.invoke('data-validator', {
        body: {
          mappedData: mappingResult.mappedData,
          userId: user.id,
          fileId: null
        }
      });

      if (validationResponse.error) throw validationResponse.error;
      const validationResult = validationResponse.data.result;

      // Paso 3: Asignación a gráficos
      setProcessingStep('assignment');
      setProcessingProgress(75);

      const assignmentResponse = await supabase.functions.invoke('chart-data-assigner', {
        body: {
          validatedData: validationResult.cleanedData,
          userId: user.id,
          requestedCharts: config.requestedCharts || [
            'profit_loss', 'balance_sheet', 'cash_flow', 'financial_ratios', 'sales_segments'
          ]
        }
      });

      if (assignmentResponse.error) throw assignmentResponse.error;
      const chartAssignments = assignmentResponse.data.result;

      // Paso 4: Guardar configuración si se especifica
      if (config.clientName) {
        await supabase.from('client_configurations').upsert({
          user_id: user.id,
          client_name: config.clientName,
          industry_sector: config.industrySector,
          field_mappings: mappingResult.mappedData,
          validation_rules: {},
          data_patterns: {}
        });
      }

      // Paso 5: Guardar datos procesados
      await supabase.from('financial_data').insert({
        user_id: user.id,
        data_type: 'processed_excel',
        period_type: 'annual',
        period_date: new Date().toISOString().split('T')[0],
        data_content: {
          original: excelData,
          mapped: mappingResult.mappedData,
          validated: validationResult.cleanedData,
          charts: chartAssignments
        }
      });

      setProcessingStep('complete');
      setProcessingProgress(100);

      toast.success('Datos procesados exitosamente');

      return {
        originalData: excelData,
        mappedData: validationResult.cleanedData,
        chartAssignments,
        clientConfig: config
      };

    } catch (error) {
      console.error('Error procesando datos:', error);
      toast.error('Error en el procesamiento de datos');
      return null;
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, []);

  const getClientConfigurations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('client_configurations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo configuraciones:', error);
      return [];
    }
  }, []);

  const getProcessingLogs = useCallback(async (limit: number = 10) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('data_quality_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo logs:', error);
      return [];
    }
  }, []);

  const saveMappingRule = useCallback(async (
    sourceField: string,
    targetField: string,
    transformationLogic: any = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase.from('data_mapping_rules').upsert({
        user_id: user.id,
        rule_name: `${sourceField}_to_${targetField}`,
        source_field: sourceField,
        target_field: targetField,
        transformation_logic: transformationLogic,
        confidence_score: 1.0 // Regla manual, confianza máxima
      });

      if (error) throw error;
      toast.success('Regla de mapeo guardada');
    } catch (error) {
      console.error('Error guardando regla:', error);
      toast.error('Error guardando regla de mapeo');
    }
  }, []);

  return {
    processExcelData,
    getClientConfigurations,
    getProcessingLogs,
    saveMappingRule,
    isProcessing,
    processingStep,
    processingProgress
  };
}