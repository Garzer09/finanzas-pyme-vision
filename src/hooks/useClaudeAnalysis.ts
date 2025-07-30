import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialInsight {
  kpi: string;
  value: number;
  formula: string;
  interpretation: string;
  trend?: 'positive' | 'negative' | 'neutral';
  benchmark?: number;
  recommendations?: string[];
}

export interface AnalysisResult {
  insights: FinancialInsight[];
  summary: string;
  alerts: string[];
  calculations: Record<string, any>;
  metadata?: {
    analysisType: string;
    timestamp: string;
    dataSize: number;
  };
}

export type AnalysisType = 'balance' | 'pyg' | 'ratios' | 'comprehensive';

export const useClaudeAnalysis = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, { result: AnalysisResult; timestamp: number }>>(new Map());

  const analyzeData = useCallback(async (
    data: any,
    analysisType: AnalysisType,
    options?: {
      periods?: string[];
      context?: string;
      forceRefresh?: boolean;
    }
  ) => {
    if (!data || Object.keys(data).length === 0) {
      setError('No hay datos para analizar');
      return null;
    }

    // Crear clave de cache
    const cacheKey = `${analysisType}_${JSON.stringify(data).slice(0, 100)}_${options?.periods?.join(',') || ''}`;
    
    // Verificar cache (válido por 10 minutos)
    if (!options?.forceRefresh) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < 600000) {
        setAnalysisResult(cached.result);
        return cached.result;
      }
    }

    // Cancelar análisis previo si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      setIsAnalyzing(true);
      setError(null);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout en análisis')), 30000)
      );

      const analysisPromise = supabase.functions.invoke('claude-financial-analyzer', {
        body: {
          data,
          analysisType,
          periods: options?.periods,
          context: options?.context
        }
      });

      const { data: result, error: functionError } = await Promise.race([
        analysisPromise,
        timeoutPromise
      ]) as any;

      if (functionError) {
        throw new Error(`Error en análisis: ${functionError.message}`);
      }

      // Validar estructura de resultado
      const validatedResult: AnalysisResult = {
        insights: Array.isArray(result?.insights) ? result.insights : [],
        summary: result?.summary || 'Análisis completado',
        alerts: Array.isArray(result?.alerts) ? result.alerts : [],
        calculations: result?.calculations || {},
        metadata: result?.metadata
      };

      // Guardar en cache
      cacheRef.current.set(cacheKey, {
        result: validatedResult,
        timestamp: Date.now()
      });

      // Limpiar cache viejo (mantener solo últimas 10 entradas)
      if (cacheRef.current.size > 10) {
        const oldestKey = Array.from(cacheRef.current.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
        cacheRef.current.delete(oldestKey);
      }

      setAnalysisResult(validatedResult);
      return validatedResult;

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null; // Análisis cancelado
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Error en análisis automático';
      setError(errorMessage);
      console.error('Error en análisis Claude:', err);
      return null;

    } finally {
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  }, []);

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const getInsightsByType = useCallback((type: string) => {
    return analysisResult?.insights.filter(insight => 
      insight.kpi.toLowerCase().includes(type.toLowerCase())
    ) || [];
  }, [analysisResult]);

  const getCalculatedValue = useCallback((metric: string) => {
    return analysisResult?.calculations?.key_metrics?.[metric];
  }, [analysisResult]);

  const hasPositiveTrends = useCallback(() => {
    return analysisResult?.insights.some(insight => insight.trend === 'positive') || false;
  }, [analysisResult]);

  const getCriticalAlerts = useCallback(() => {
    return analysisResult?.alerts.filter(alert => 
      alert.toLowerCase().includes('crítico') || 
      alert.toLowerCase().includes('alerta') ||
      alert.toLowerCase().includes('problema')
    ) || [];
  }, [analysisResult]);

  return {
    analysisResult,
    isAnalyzing,
    error,
    analyzeData,
    cancelAnalysis,
    clearCache,
    getInsightsByType,
    getCalculatedValue,
    hasPositiveTrends,
    getCriticalAlerts,
    hasAnalysis: !!analysisResult
  };
};