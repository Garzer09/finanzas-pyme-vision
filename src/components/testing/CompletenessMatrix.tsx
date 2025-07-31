import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertTriangle, Grid3X3, Database, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompletenessMatrixProps {
  testSession: any;
  onResultsUpdate: (results: { dataCompleteness: number; dashboardAvailability: number }) => void;
  onContinue?: () => void;
}

interface ModuleRequirement {
  module: string;
  displayName: string;
  icon: string;
  requiredFields: string[];
  optionalFields: string[];
  minimumData: number; // Porcentaje mínimo requerido
  status: 'complete' | 'partial' | 'incomplete' | 'not-applicable';
  availableFields: string[];
  completeness: number;
}

const MODULE_REQUIREMENTS: Omit<ModuleRequirement, 'status' | 'availableFields' | 'completeness'>[] = [
  {
    module: 'balance-sheet',
    displayName: 'Balance de Situación',
    icon: '📊',
    requiredFields: ['activo_corriente', 'activo_no_corriente', 'pasivo_corriente', 'pasivo_no_corriente', 'patrimonio_neto'],
    optionalFields: ['efectivo', 'cuentas_por_cobrar', 'inventarios', 'activos_fijos'],
    minimumData: 80
  },
  {
    module: 'profit-loss',
    displayName: 'Cuenta de PyG',
    icon: '💰',
    requiredFields: ['ingresos', 'costos_ventas', 'gastos_operativos', 'resultado_neto'],
    optionalFields: ['otros_ingresos', 'gastos_financieros', 'impuestos'],
    minimumData: 75
  },
  {
    module: 'cash-flow',
    displayName: 'Flujo de Efectivo',
    icon: '🔄',
    requiredFields: ['flujo_operativo', 'flujo_inversion', 'flujo_financiacion'],
    optionalFields: ['efectivo_inicial', 'efectivo_final'],
    minimumData: 70
  },
  {
    module: 'financial-ratios',
    displayName: 'Ratios Financieros',
    icon: '📈',
    requiredFields: ['activo_corriente', 'pasivo_corriente', 'patrimonio_neto', 'resultado_neto', 'ingresos'],
    optionalFields: ['deuda_total', 'ebitda'],
    minimumData: 80
  },
  {
    module: 'debt-analysis',
    displayName: 'Análisis de Deuda',
    icon: '🏦',
    requiredFields: ['deuda_cp', 'deuda_lp', 'intereses'],
    optionalFields: ['garantias', 'vencimientos'],
    minimumData: 75
  },
  {
    module: 'breakeven',
    displayName: 'Punto de Equilibrio',
    icon: '⚖️',
    requiredFields: ['costos_fijos', 'costos_variables', 'precio_venta'],
    optionalFields: ['volumen_ventas'],
    minimumData: 85
  },
  {
    module: 'sensitivity',
    displayName: 'Análisis de Sensibilidad',
    icon: '🌡️',
    requiredFields: ['variables_clave', 'escenarios'],
    optionalFields: ['correlaciones'],
    minimumData: 60
  },
  {
    module: 'valuation',
    displayName: 'Valoración',
    icon: '💎',
    requiredFields: ['flujos_futuros', 'tasa_descuento', 'valor_terminal'],
    optionalFields: ['multiples_mercado'],
    minimumData: 70
  }
];

export const CompletenessMatrix = ({ testSession, onResultsUpdate, onContinue }: CompletenessMatrixProps) => {
  const [moduleStatuses, setModuleStatuses] = useState<ModuleRequirement[]>([]);
  const [overallCompleteness, setOverallCompleteness] = useState(0);
  const [dashboardAvailability, setDashboardAvailability] = useState(0);

  useEffect(() => {
    if (testSession?.analysisResult) {
      analyzeDataCompleteness();
    }
  }, [testSession]);

  const analyzeDataCompleteness = () => {
    const availableData = testSession.detectedFields || {};
    const allAvailableFields = Object.values(availableData).flat();
    
    const statuses: ModuleRequirement[] = MODULE_REQUIREMENTS.map(module => {
      // Encontrar campos disponibles para este módulo
      const availableModuleFields = module.requiredFields.concat(module.optionalFields)
        .filter(field => allAvailableFields.some(available => 
          typeof available === 'string' && typeof field === 'string' &&
          (available.toLowerCase().includes(field.toLowerCase()) ||
          field.toLowerCase().includes(available.toLowerCase()))
        ));
      
      // Calcular completitud
      const requiredAvailable = module.requiredFields.filter(field =>
        availableModuleFields.includes(field)
      ).length;
      
      const optionalAvailable = module.optionalFields.filter(field =>
        availableModuleFields.includes(field)
      ).length;
      
      const completeness = ((requiredAvailable / module.requiredFields.length) * 0.7 + 
                          (optionalAvailable / module.optionalFields.length) * 0.3) * 100;
      
      // Determinar estado
      let status: ModuleRequirement['status'];
      if (completeness >= module.minimumData) {
        status = 'complete';
      } else if (completeness >= module.minimumData * 0.6) {
        status = 'partial';
      } else if (completeness > 0) {
        status = 'incomplete';
      } else {
        status = 'not-applicable';
      }
      
      return {
        ...module,
        availableFields: availableModuleFields,
        completeness: Math.round(completeness),
        status
      };
    });
    
    setModuleStatuses(statuses);
    
    // Calcular métricas generales
    const totalCompleteness = statuses.reduce((sum, module) => sum + module.completeness, 0) / statuses.length;
    const availableDashboards = statuses.filter(module => module.status === 'complete' || module.status === 'partial').length;
    const dashboardPercentage = (availableDashboards / statuses.length) * 100;
    
    setOverallCompleteness(Math.round(totalCompleteness));
    setDashboardAvailability(Math.round(dashboardPercentage));
    
    onResultsUpdate({
      dataCompleteness: Math.round(totalCompleteness),
      dashboardAvailability: Math.round(dashboardPercentage)
    });
  };

  const getStatusIcon = (status: ModuleRequirement['status']) => {
    switch (status) {
      case 'complete': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'incomplete': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'not-applicable': return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ModuleRequirement['status']) => {
    switch (status) {
      case 'complete': return <Badge className="bg-green-100 text-green-800">Completo</Badge>;
      case 'partial': return <Badge className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      case 'incomplete': return <Badge variant="destructive">Incompleto</Badge>;
      case 'not-applicable': return <Badge variant="outline">No Aplicable</Badge>;
    }
  };

  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 80) return 'text-green-600';
    if (completeness >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!testSession?.analysisResult) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Primero debes cargar y analizar un archivo en la pestaña "Carga de Datos".
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Matriz de Completitud de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-primary">{overallCompleteness}%</p>
              <p className="text-sm text-muted-foreground">Completitud General</p>
              <Progress value={overallCompleteness} className="w-full" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-green-600">
                {moduleStatuses.filter(m => m.status === 'complete').length}
              </p>
              <p className="text-sm text-muted-foreground">Módulos Completos</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-yellow-600">
                {moduleStatuses.filter(m => m.status === 'partial').length}
              </p>
              <p className="text-sm text-muted-foreground">Módulos Parciales</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matriz de módulos */}
      <Card>
        <CardHeader>
          <CardTitle>Estado por Módulo de Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moduleStatuses.map((module) => (
              <div key={module.module} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{module.icon}</span>
                    <div>
                      <h4 className="font-semibold">{module.displayName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Mínimo requerido: {module.minimumData}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-bold ${getCompletenessColor(module.completeness)}`}>
                      {module.completeness}%
                    </span>
                    {getStatusBadge(module.status)}
                    {getStatusIcon(module.status)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Progress value={module.completeness} className="w-full" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-green-600 mb-1">
                        Campos Disponibles ({module.availableFields.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {module.availableFields.map((field) => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium text-red-600 mb-1">
                        Campos Faltantes
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {module.requiredFields
                          .filter(field => !module.availableFields.includes(field))
                          .map((field) => (
                            <Badge key={field} variant="outline" className="text-xs text-red-600">
                              {field}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Recomendaciones de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moduleStatuses
              .filter(module => module.status === 'incomplete' || module.status === 'partial')
              .map((module) => (
                <Alert key={module.module}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{module.displayName}</strong>: Para completar este módulo, necesitas proporcionar datos de{' '}
                    {module.requiredFields
                      .filter(field => !module.availableFields.includes(field))
                      .join(', ')}.
                  </AlertDescription>
                </Alert>
              ))}
            
            {moduleStatuses.filter(m => m.status === 'incomplete' || m.status === 'partial').length === 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  ¡Excelente! Todos los módulos tienen datos suficientes para generar dashboards completos.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botón de continuación */}
      {overallCompleteness > 0 && onContinue && (
        <div className="flex justify-center">
          <Button onClick={onContinue} size="lg" className="w-full max-w-md">
            <ArrowRight className="h-4 w-4 mr-2" />
            Ver Resultados Finales
          </Button>
        </div>
      )}
    </div>
  );
};