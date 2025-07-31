import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClaudeChatModal } from './ClaudeChatModal';
import { 
  Database, 
  FileText, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  MapPin,
  BarChart3,
  ArrowRight,
  MessageCircle
} from 'lucide-react';

interface EdaResultsProps {
  edaResults: any;
  onContinue?: () => void;
  onEdaUpdate?: (updatedEda: any) => void;
}

export const EdaResults = ({ edaResults, onContinue, onEdaUpdate }: EdaResultsProps) => {
  if (!edaResults) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No hay resultados de análisis exploratorio disponibles.
        </AlertDescription>
      </Alert>
    );
  }

  const {
    eda_summary,
    sheets_analysis = [],
    field_mapping = {},
    data_quality = {},
    insights = [],
    recommendations = {}
  } = edaResults;

  const getQualityColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (score: number) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Buena</Badge>;
    return <Badge variant="destructive">Necesita Mejora</Badge>;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getSheetTypeIcon = (type: string) => {
    switch (type) {
      case 'balance': return '🏦';
      case 'pyg': return '📊';
      case 'cash_flow': return '💰';
      case 'ratios': return '📈';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen EDA */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Análisis Exploratorio de Datos (EDA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Resumen General</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Hojas detectadas:</span>
                    <span className="font-medium">{eda_summary?.total_sheets || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Campos totales:</span>
                    <span className="font-medium">{eda_summary?.total_fields || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Calidad de Datos</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Calidad General</span>
                      <div className="flex items-center gap-2">
                        {getQualityBadge(eda_summary?.data_quality_score || 0)}
                        <span className={`font-bold ${getQualityColor(eda_summary?.data_quality_score || 0)}`}>
                          {(eda_summary?.data_quality_score || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={eda_summary?.data_quality_score || 0} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Cobertura</span>
                      <span className={`font-bold ${getQualityColor(eda_summary?.coverage_score || 0)}`}>
                        {(eda_summary?.coverage_score || 0).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={eda_summary?.coverage_score || 0} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sheets" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sheets">Hojas Detectadas</TabsTrigger>
          <TabsTrigger value="mapping">Mapeo de Campos</TabsTrigger>
          <TabsTrigger value="quality">Calidad</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="sheets" className="space-y-4">
          <div className="grid gap-4">
            {sheets_analysis.map((sheet: any, index: number) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-lg">{getSheetTypeIcon(sheet.sheet_type)}</span>
                    {sheet.sheet_name}
                    <Badge variant="outline" className="ml-auto">
                      {sheet.sheet_type === 'balance' ? 'Balance' :
                       sheet.sheet_type === 'pyg' ? 'P&G' :
                       sheet.sheet_type === 'cash_flow' ? 'Flujo Caja' :
                       sheet.sheet_type === 'ratios' ? 'Ratios' : 'Otro'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Campos</span>
                      <p className="font-medium">{sheet.fields_count}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Confianza</span>
                      <p className="font-medium">{((sheet.confidence || 0) * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Calidad</span>
                      <p className={`font-medium ${getQualityColor(sheet.data_quality || 0)}`}>
                        {(sheet.data_quality || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {sheet.coverage && sheet.coverage.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm text-muted-foreground">Conceptos cubiertos:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sheet.coverage.map((concept: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {concept}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Campos Identificados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(field_mapping.identified_concepts || {}).map(([concept, fields]: [string, any]) => (
                    <div key={concept} className="space-y-2">
                      <h4 className="font-medium text-sm capitalize">
                        {concept.replace(/_/g, ' ')}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {(fields as string[]).map((field: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {field_mapping.unmapped_fields && field_mapping.unmapped_fields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Campos Sin Mapear
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {field_mapping.unmapped_fields.map((field: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Completitud por Concepto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data_quality.completeness?.by_concept || {}).map(([concept, score]: [string, any]) => (
                    <div key={concept}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm capitalize">{concept.replace(/_/g, ' ')}</span>
                        <span className={`font-medium ${getQualityColor(score as number)}`}>
                          {(score as number).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={score as number} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {data_quality.issues && data_quality.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Problemas Identificados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data_quality.issues.map((issue: any, index: number) => (
                      <Alert key={index} className={getSeverityColor(issue.severity)}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-medium">{issue.field}:</span> {issue.description}
                            </div>
                            <Badge variant={
                              issue.severity === 'high' ? 'destructive' :
                              issue.severity === 'medium' ? 'default' : 'secondary'
                            } className="ml-2">
                              {issue.severity}
                            </Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {insights.map((insight: any, index: number) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {insight.title}
                    </span>
                    <Badge variant={
                      insight.priority === 'high' ? 'destructive' :
                      insight.priority === 'medium' ? 'default' : 'secondary'
                    }>
                      {insight.priority}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                  {insight.impact && (
                    <p className="text-xs font-medium">Impacto: {insight.impact}</p>
                  )}
                </CardContent>
              </Card>
            ))}

            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Viabilidad del Análisis</h4>
                    <Badge className={
                      recommendations.analysis_feasibility === 'excellent' ? 'bg-green-100 text-green-800' :
                      recommendations.analysis_feasibility === 'good' ? 'bg-blue-100 text-blue-800' :
                      recommendations.analysis_feasibility === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {recommendations.analysis_feasibility === 'excellent' ? 'Excelente' :
                       recommendations.analysis_feasibility === 'good' ? 'Buena' :
                       recommendations.analysis_feasibility === 'limited' ? 'Limitada' : 'Pobre'}
                    </Badge>
                  </div>

                  {recommendations.dashboard_modules && recommendations.dashboard_modules.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Módulos de Dashboard Disponibles</h4>
                      <div className="flex flex-wrap gap-1">
                        {recommendations.dashboard_modules.map((module: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {module}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendations.missing_data && recommendations.missing_data.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Datos Faltantes</h4>
                      <div className="flex flex-wrap gap-1">
                        {recommendations.missing_data.map((data: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {data}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botones de acción */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4">
            <ClaudeChatModal 
              edaResults={edaResults}
              onEdaUpdate={onEdaUpdate}
            />
            {onContinue && (
              <Button onClick={onContinue} className="flex items-center gap-2">
                Continuar Análisis Financiero
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-3">
            Si Claude no ha interpretado correctamente algún dato, usa el chat para aclararlo. Si todo está correcto, continúa con el análisis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};