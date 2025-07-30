import React, { useEffect, useState } from 'react';
import { useClaudeAnalysis, type AnalysisType } from '@/hooks/useClaudeAnalysis';
import { useFinancialData } from '@/hooks/useFinancialData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Brain, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface IntelligentInsightsProps {
  analysisType: AnalysisType;
  className?: string;
  autoAnalyze?: boolean;
  context?: string;
}

export const IntelligentInsights: React.FC<IntelligentInsightsProps> = ({
  analysisType,
  className = '',
  autoAnalyze = true,
  context
}) => {
  const { getProcessedDataForAnalysis, hasRealData, loading: dataLoading } = useFinancialData();
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
    if (autoAnalyze && hasRealData && !dataLoading && !hasAnalyzed && !isAnalyzing) {
      handleAnalyze();
      setHasAnalyzed(true);
    }
  }, [hasRealData, dataLoading, autoAnalyze, hasAnalyzed, isAnalyzing]);

  const handleAnalyze = async () => {
    const data = getProcessedDataForAnalysis();
    if (Object.keys(data).length === 0) return;

    await analyzeData(data, analysisType, {
      context: context || `Análisis de ${analysisType}`,
      forceRefresh: true
    });
  };

  const getTrendIcon = (trend?: 'positive' | 'negative' | 'neutral') => {
    switch (trend) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="w-4 h-4" />;
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

  if (!hasRealData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análisis Inteligente
          </CardTitle>
          <CardDescription>
            Sube datos financieros para obtener insights automáticos
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (dataLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análisis Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Análisis Inteligente con Claude
            </CardTitle>
            <CardDescription>
              Insights automáticos de tus datos financieros
            </CardDescription>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            variant="outline"
            size="sm"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isAnalyzing ? 'Analizando...' : 'Analizar'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isAnalyzing && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Claude está analizando tus datos financieros...
              </p>
            </div>
          </div>
        )}

        {hasAnalysis && analysisResult && (
          <div className="space-y-4">
            {/* Resumen ejecutivo */}
            {analysisResult.summary && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Resumen Ejecutivo</h4>
                <p className="text-sm">{analysisResult.summary}</p>
              </div>
            )}

            {/* Alertas críticas */}
            {getCriticalAlerts().length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {getCriticalAlerts().map((alert, index) => (
                      <div key={index}>• {alert}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* KPIs e insights */}
            {analysisResult.insights.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">KPIs Calculados</h4>
                <div className="grid gap-3">
                  {analysisResult.insights.slice(0, 6).map((insight, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{insight.kpi}</span>
                          {getTrendIcon(insight.trend)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            {typeof insight.value === 'number' 
                              ? insight.value.toLocaleString('es-ES', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })
                              : insight.value
                            }
                          </span>
                          {insight.trend && (
                            <Badge variant={getTrendBadgeVariant(insight.trend)}>
                              {insight.trend === 'positive' ? 'Positivo' : 
                               insight.trend === 'negative' ? 'Negativo' : 'Neutral'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {insight.interpretation}
                        </p>
                        {insight.formula && (
                          <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {insight.formula}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendaciones principales */}
            {analysisResult.insights.some(i => i.recommendations?.length) && (
              <div className="space-y-2">
                <h4 className="font-medium">Recomendaciones</h4>
                <div className="space-y-1">
                  {analysisResult.insights
                    .flatMap(i => i.recommendations || [])
                    .slice(0, 3)
                    .map((rec, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {rec}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Timestamp del análisis */}
            {analysisResult.metadata?.timestamp && (
              <div className="text-xs text-muted-foreground text-right">
                Análisis realizado: {new Date(analysisResult.metadata.timestamp).toLocaleString('es-ES')}
              </div>
            )}
          </div>
        )}

        {!isAnalyzing && !hasAnalysis && !error && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              Haz clic en "Analizar" para obtener insights automáticos
            </p>
            <Button onClick={handleAnalyze}>
              <Brain className="h-4 w-4 mr-2" />
              Iniciar Análisis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};