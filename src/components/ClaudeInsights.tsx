import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useClaudeAnalysis, AnalysisType } from '@/hooks/useClaudeAnalysis';
import { useFinancialData } from '@/hooks/useFinancialData';
import { RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface ClaudeInsightsProps {
  analysisType: AnalysisType;
  title: string;
  description?: string;
  className?: string;
  autoAnalyze?: boolean;
  showHeader?: boolean;
  showMetrics?: boolean;
  showRecommendations?: boolean;
  companyInfo?: {
    name?: string;
    sector?: string;
    size?: string;
  };
}

export const ClaudeInsights = ({
  analysisType,
  title,
  description,
  className = "",
  autoAnalyze = true,
  showHeader = true,
  showMetrics = true,
  showRecommendations = true,
  companyInfo
}: ClaudeInsightsProps) => {
  const { data: financialData, loading: dataLoading, hasRealData, getProcessedDataForAnalysis } = useFinancialData();
  const { 
    analysisResult, 
    isAnalyzing, 
    error, 
    analyzeData, 
    hasAnalysis,
    getCriticalAlerts,
    hasPositiveTrends 
  } = useClaudeAnalysis();

  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    if (autoAnalyze && hasRealData && !hasAnalyzed && !isAnalyzing) {
      handleAnalyze();
      setHasAnalyzed(true);
    }
  }, [hasRealData, hasAnalyzed, isAnalyzing, autoAnalyze]);

  const handleAnalyze = async () => {
    const processedData = getProcessedDataForAnalysis();
    if (processedData && Object.keys(processedData).length > 0) {
      await analyzeData(processedData, analysisType, {
        context: `Análisis ${analysisType} para dashboard financiero`,
        companyInfo
      });
    }
  };

  const getTrendIcon = (trend?: 'positive' | 'negative' | 'neutral') => {
    switch (trend) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendBadgeVariant = (trend?: 'positive' | 'negative' | 'neutral') => {
    switch (trend) {
      case 'positive':
        return 'default';
      case 'negative':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  if (!hasRealData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {title}
          </CardTitle>
          <CardDescription>
            No hay datos financieros disponibles para realizar el análisis.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (dataLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {title}
              </CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analizando...' : hasAnalysis ? 'Actualizar' : 'Analizar'}
            </Button>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isAnalyzing && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Claude está analizando los datos financieros...
              </p>
            </div>
          </div>
        )}

        {analysisResult && !isAnalyzing && (
          <div className="space-y-6">
            {/* Resumen Ejecutivo */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Resumen Ejecutivo
              </h3>
              <p className="text-gray-700">{analysisResult.summary}</p>
            </div>

            {/* Alertas Críticas */}
            {getCriticalAlerts().length > 0 && (
              <Alert variant={hasPositiveTrends() ? "default" : "destructive"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {getCriticalAlerts().map((alert, index) => (
                      <div key={index} className="text-sm">{alert}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* KPIs Calculados */}
            {showMetrics && analysisResult.insights.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4">Métricas Clave</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.insights.slice(0, 6).map((insight, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{insight.kpi}</h4>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(insight.trend)}
                            <Badge variant={getTrendBadgeVariant(insight.trend)} className="text-xs">
                              {formatValue(insight.value)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{insight.formula}</p>
                        <p className="text-sm text-gray-700">{insight.interpretation}</p>
                        {insight.benchmark && (
                          <div className="mt-2 text-xs text-gray-500">
                            Benchmark: {formatValue(insight.benchmark)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            {showRecommendations && (
              <div>
                <h3 className="font-semibold text-lg mb-4">Recomendaciones Principales</h3>
                <div className="space-y-3">
                  {analysisResult.insights
                    .flatMap(insight => insight.recommendations || [])
                    .slice(0, 5)
                    .map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-500 pt-4 border-t">
              Análisis generado por Claude • {new Date().toLocaleString('es-ES')}
            </div>
          </div>
        )}

        {!hasAnalysis && !isAnalyzing && !error && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Análisis Inteligente Disponible
            </h3>
            <p className="text-gray-500 mb-4">
              Inicia el análisis con Claude para obtener insights automáticos
            </p>
            <Button onClick={handleAnalyze}>
              <Target className="h-4 w-4 mr-2" />
              Iniciar Análisis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};