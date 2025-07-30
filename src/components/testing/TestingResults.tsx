import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Download,
  BarChart3,
  FileText,
  Target,
  Zap
} from 'lucide-react';

interface TestingResultsProps {
  results: {
    calculationAccuracy: number;
    insightQuality: number;
    dataCompleteness: number;
    dashboardAvailability: number;
  };
  testSession: any;
}

export const TestingResults = ({ results, testSession }: TestingResultsProps) => {
  const { calculationAccuracy, insightQuality, dataCompleteness, dashboardAvailability } = results;
  
  // Calcular score general
  const overallScore = (calculationAccuracy + insightQuality + dataCompleteness + dashboardAvailability) / 4;
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Bueno</Badge>;
    return <Badge variant="destructive">Necesita Mejora</Badge>;
  };

  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      testSession: testSession?.fileName || 'Sin archivo',
      results,
      overallScore,
      recommendations: getRecommendations()
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-testing-report-${Date.now()}.json`;
    a.click();
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (calculationAccuracy < 80) {
      recommendations.push({
        category: 'Cálculos',
        priority: 'Alta',
        action: 'Revisar fórmulas y datos de entrada para mejorar precisión de cálculos'
      });
    }
    
    if (insightQuality < 70) {
      recommendations.push({
        category: 'Insights',
        priority: 'Media',
        action: 'Mejorar prompts para generar insights más relevantes y accionables'
      });
    }
    
    if (dataCompleteness < 75) {
      recommendations.push({
        category: 'Datos',
        priority: 'Alta',
        action: 'Completar campos faltantes para permitir análisis más completos'
      });
    }
    
    if (dashboardAvailability < 80) {
      recommendations.push({
        category: 'Dashboards',
        priority: 'Media',
        action: 'Proporcionar datos adicionales para habilitar más módulos de dashboard'
      });
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  if (!testSession) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No hay sesión de testing activa. Primero carga un archivo para comenzar las pruebas.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen ejecutivo */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Resumen Ejecutivo - Claude Testing
            </CardTitle>
            <div className="flex items-center gap-3">
              {getScoreBadge(overallScore)}
              <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Archivo Analizado</h4>
              <p className="text-sm text-muted-foreground">{testSession.fileName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(testSession.uploadedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Estado General</h4>
              <Progress value={overallScore} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {overallScore >= 85 && "Claude está funcionando excelentemente para análisis financiero"}
                {overallScore >= 70 && overallScore < 85 && "Claude tiene un buen rendimiento con margen de mejora"}
                {overallScore < 70 && "Claude necesita ajustes significativos para análisis financiero"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas detalladas */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Precisión de Cálculos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-2xl font-bold ${getScoreColor(calculationAccuracy)}`}>
                  {calculationAccuracy.toFixed(1)}%
                </span>
                {getScoreBadge(calculationAccuracy)}
              </div>
              <Progress value={calculationAccuracy} />
              <p className="text-xs text-muted-foreground">
                Exactitud en cálculo de KPIs financieros
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Calidad de Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-2xl font-bold ${getScoreColor(insightQuality)}`}>
                  {insightQuality.toFixed(1)}%
                </span>
                {getScoreBadge(insightQuality)}
              </div>
              <Progress value={insightQuality} />
              <p className="text-xs text-muted-foreground">
                Relevancia y utilidad de recomendaciones
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Completitud de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-2xl font-bold ${getScoreColor(dataCompleteness)}`}>
                  {dataCompleteness.toFixed(1)}%
                </span>
                {getScoreBadge(dataCompleteness)}
              </div>
              <Progress value={dataCompleteness} />
              <p className="text-xs text-muted-foreground">
                Nivel de datos disponibles para análisis
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Disponibilidad Dashboards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-2xl font-bold ${getScoreColor(dashboardAvailability)}`}>
                  {dashboardAvailability.toFixed(1)}%
                </span>
                {getScoreBadge(dashboardAvailability)}
              </div>
              <Progress value={dashboardAvailability} />
              <p className="text-xs text-muted-foreground">
                Módulos de dashboard funcionalmente completos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recomendaciones de Mejora
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <Alert key={index} className={
                  rec.priority === 'Alta' ? 'border-red-200 bg-red-50' :
                  rec.priority === 'Media' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium">{rec.category}:</span> {rec.action}
                      </div>
                      <Badge variant={
                        rec.priority === 'Alta' ? 'destructive' :
                        rec.priority === 'Media' ? 'default' : 'secondary'
                      } className="ml-2">
                        {rec.priority}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ¡Excelente! Claude está funcionando óptimamente para análisis financiero.
                No se requieren mejoras inmediatas.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex justify-center gap-4">
        <Button onClick={generateReport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Descargar Reporte
        </Button>
        <Button variant="outline" disabled>
          <FileText className="h-4 w-4 mr-2" />
          Generar Informe PDF
        </Button>
      </div>

      {/* Comparación histórica (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Esta sección mostrará la evolución de las métricas de Claude a lo largo del tiempo
              una vez que se acumulen más sesiones de testing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};