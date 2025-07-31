import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseComprehensiveAnalysisProps {
  sessionId: string;
  edaResults: any;
}

export const useComprehensiveAnalysis = ({ sessionId, edaResults }: UseComprehensiveAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startComprehensiveAnalysis = async () => {
    if (!sessionId || !edaResults) {
      setError('Faltan datos requeridos para el análisis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('Starting comprehensive analysis for session:', sessionId);

      // Update session status to processing
      await supabase
        .from('test_sessions')
        .update({ 
          financial_analysis_status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Call the comprehensive analyzer function
      const { data, error: functionError } = await supabase.functions.invoke(
        'claude-comprehensive-analyzer',
        {
          body: {
            sessionId,
            edaResults
          }
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      console.log('Comprehensive analysis completed:', data);
      setAnalysisResults(data);

      // Update session status to completed
      await supabase
        .from('test_sessions')
        .update({ 
          financial_analysis_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      return data;

    } catch (err: any) {
      console.error('Error in comprehensive analysis:', err);
      setError(err.message || 'Error durante el análisis financiero');
      
      // Update session status to error
      await supabase
        .from('test_sessions')
        .update({ 
          financial_analysis_status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    analysisResults,
    error,
    startComprehensiveAnalysis
  };
};