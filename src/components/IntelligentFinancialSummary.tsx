import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, RefreshCw, AlertCircle, Brain } from 'lucide-react';

interface IntelligentFinancialSummaryProps {
  companyId: string;
  period: string;
  financialData: any;
  kpis: any[];
  companyInfo?: any;
}

export const IntelligentFinancialSummary: React.FC<IntelligentFinancialSummaryProps> = ({
  companyId,
  period,
  financialData,
  kpis,
  companyInfo
}) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (companyId && period && financialData && kpis.length > 0) {
      generateAnalysis();
    }
  }, [companyId, period]);

  const generateAnalysis = async () => {
    if (!financialData || kpis.length === 0) {
      setError('Datos financieros insuficientes para generar análisis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('financial-summary-analysis', {
        body: {
          companyId,
          period,
          financialData,
          kpis,
          companyInfo
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
      setLastGenerated(new Date(data.generatedAt));
      
      toast({
        title: "Análisis generado",
        description: "El resumen financiero inteligente se ha actualizado",
        duration: 3000
      });

    } catch (err) {
      console.error('Error generating financial analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      toast({
        title: "Error al generar análisis",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAnalysis = (text: string) => {
    // Convert the analysis text to HTML with proper formatting
    return text
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '<br />';
        
        // Handle bullet points
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          return `<li class="ml-4">${trimmed.substring(1).trim()}</li>`;
        }
        
        // Handle bold headings (simple detection)
        if (trimmed.toUpperCase() === trimmed && trimmed.length < 50) {
          return `<h4 class="font-semibold text-steel-700 mt-3 mb-1">${trimmed}</h4>`;
        }
        
        return `<p class="mb-2">${trimmed}</p>`;
      })
      .join('');
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Error en Análisis Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            onClick={generateAnalysis}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-steel-700">
            <Brain className="h-5 w-5 text-blue-600" />
            Análisis Financiero Inteligente
            {lastGenerated && (
              <span className="text-xs font-normal text-slate-500 ml-2">
                Generado: {lastGenerated.toLocaleTimeString()}
              </span>
            )}
          </CardTitle>
          <Button
            onClick={generateAnalysis}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? 'Generando...' : 'Regenerar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Generando análisis inteligente...</p>
            <p className="text-sm text-slate-500 mt-1">Esto puede tardar unos segundos</p>
          </div>
        ) : analysis ? (
          <div 
            className="prose prose-sm max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis) }}
          />
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Brain className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>Haz clic en "Regenerar" para obtener un análisis inteligente de estos datos financieros</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};