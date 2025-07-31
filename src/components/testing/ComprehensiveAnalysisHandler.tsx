import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useComprehensiveAnalysis } from '@/hooks/useComprehensiveAnalysis';

interface ComprehensiveAnalysisHandlerProps {
  sessionId: string;
  edaResults: any;
  onAnalysisComplete?: (results: any) => void;
  onContinue?: () => void;
}

export const ComprehensiveAnalysisHandler = ({ 
  sessionId, 
  edaResults, 
  onAnalysisComplete, 
  onContinue 
}: ComprehensiveAnalysisHandlerProps) => {
  const [isStarted, setIsStarted] = useState(false);
  const { isAnalyzing, analysisResults, error, startComprehensiveAnalysis } = useComprehensiveAnalysis({
    sessionId,
    edaResults
  });

  const handleStartAnalysis = async () => {
    setIsStarted(true);
    try {
      const results = await startComprehensiveAnalysis();
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }
    } catch (err) {
      console.error('Error starting comprehensive analysis:', err);
    }
  };

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Error en el Análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={() => setIsStarted(false)}>
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analysisResults) {
    return (
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Análisis Completo
          </CardTitle>
          <CardDescription>
            Claude ha completado el análisis financiero comprehensivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analysisResults.metadata?.variables_calculated || 0}
              </div>
              <div className="text-sm text-muted-foreground">Variables Calculadas</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analysisResults.insights?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Insights Generados</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((analysisResults.data_quality?.overall_score || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Calidad de Datos</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((analysisResults.metadata?.confidence || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Confianza</div>
            </div>
          </div>

          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-700">
              El análisis financiero se ha completado exitosamente. Claude ha calculado todas las variables necesarias,
              generado insights profundos y guardado los datos en la base de datos.
            </AlertDescription>
          </Alert>

          {onContinue && (
            <div className="flex justify-end">
              <Button onClick={onContinue} size="lg" className="flex items-center gap-2">
                Ver Cálculos Detallados
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            Análisis en Progreso
          </CardTitle>
          <CardDescription>
            Claude está realizando el análisis financiero comprehensivo...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="flex-1">
              <div className="text-sm font-medium">Analizando datos financieros</div>
              <div className="text-xs text-muted-foreground">
                Calculando variables, generando insights y guardando resultados...
              </div>
            </div>
          </div>
          
          <Progress value={75} className="w-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Datos procesados</span>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span>Calculando variables</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-muted" />
              <span>Generando insights</span>
            </div>
          </div>

          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              Este proceso puede tomar 1-2 minutos. Claude está analizando profundamente los datos
              para generar cálculos precisos e insights valiosos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análisis Financiero Comprehensivo
          </CardTitle>
          <CardDescription>
            Inicia el análisis avanzado con Claude para calcular variables faltantes y generar insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">¿Qué hará Claude?</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Identificar variables financieras faltantes</li>
              <li>• Calcular automáticamente ratios y KPIs</li>
              <li>• Estimar datos no disponibles usando relaciones financieras</li>
              <li>• Generar insights profundos y recomendaciones</li>
              <li>• Guardar todos los datos calculados en la base de datos</li>
              <li>• Preparar el dashboard completo para visualización</li>
            </ul>
          </div>

          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              Claude utilizará el modelo más avanzado (Claude Opus 4) para realizar cálculos precisos
              y generar insights de alta calidad basados en los datos del EDA.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Button 
              onClick={handleStartAnalysis} 
              size="lg" 
              className="flex items-center gap-2"
            >
              <Brain className="h-5 w-5" />
              Iniciar Análisis Comprehensivo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};