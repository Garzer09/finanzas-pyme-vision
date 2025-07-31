import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, CheckCircle2, XCircle, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';

interface CalculationValidatorProps {
  testSession: any;
  onResultsUpdate: (accuracy: number) => void;
  onContinue?: () => void;
}

interface KPIComparison {
  name: string;
  formula: string;
  claudeValue: number | null;
  expectedValue: number | null;
  difference: number | null;
  status: 'pending' | 'correct' | 'incorrect' | 'warning';
  tolerance: number;
}

const DEFAULT_KPIS: Omit<KPIComparison, 'claudeValue' | 'expectedValue' | 'difference' | 'status'>[] = [
  { name: 'ROE', formula: 'Beneficio Neto / Patrimonio Neto', tolerance: 0.5 },
  { name: 'ROA', formula: 'Beneficio Neto / Activo Total', tolerance: 0.5 },
  { name: 'Ratio Corriente', formula: 'Activo Corriente / Pasivo Corriente', tolerance: 1.0 },
  { name: 'Ratio Rápido', formula: '(Activo Corriente - Inventarios) / Pasivo Corriente', tolerance: 1.0 },
  { name: 'Ratio de Deuda', formula: 'Pasivo Total / Activo Total', tolerance: 1.0 },
  { name: 'Margen Bruto', formula: '(Ventas - Costo Ventas) / Ventas', tolerance: 0.5 },
  { name: 'Margen Neto', formula: 'Beneficio Neto / Ventas', tolerance: 0.5 },
  { name: 'EBITDA', formula: 'Beneficio + Intereses + Impuestos + Depreciación', tolerance: 2.0 },
  { name: 'Working Capital', formula: 'Activo Corriente - Pasivo Corriente', tolerance: 5.0 },
  { name: 'Debt to Equity', formula: 'Pasivo Total / Patrimonio Neto', tolerance: 1.0 },
];

export const CalculationValidator = ({ testSession, onResultsUpdate, onContinue }: CalculationValidatorProps) => {
  const [kpiComparisons, setKpiComparisons] = useState<KPIComparison[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [overallAccuracy, setOverallAccuracy] = useState(0);

  // Support new comprehensive analysis structure
  const analysisResults = testSession?.financial_analysis_results;
  const calculations = analysisResults?.calculations;

  useEffect(() => {
    if (analysisResults || testSession?.analysisResult) {
      initializeKPIComparisons();
    }
  }, [testSession, analysisResults]);

  const initializeKPIComparisons = () => {
    // Acceso mejorado a los datos calculados por Claude
    const claudeCalculations = testSession.analysisResult?.calculations?.key_metrics || 
                              testSession.analysisResults?.calculations?.key_metrics ||
                              testSession.analysisResult?.financial_ratios ||
                              testSession.analysisResults?.financial_ratios ||
                              {};
    
    const comparisons: KPIComparison[] = DEFAULT_KPIS.map(kpi => ({
      ...kpi,
      claudeValue: claudeCalculations[kpi.name.toLowerCase().replace(/\s+/g, '_')] || 
                   claudeCalculations[kpi.name] || 
                   null,
      expectedValue: null,
      difference: null,
      status: 'pending'
    }));

    setKpiComparisons(comparisons);
  };

  const updateExpectedValue = (index: number, value: string) => {
    const numValue = parseFloat(value) || null;
    
    setKpiComparisons(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        expectedValue: numValue,
        difference: numValue && updated[index].claudeValue 
          ? Math.abs(numValue - updated[index].claudeValue!) 
          : null,
        status: calculateStatus(updated[index].claudeValue, numValue, updated[index].tolerance)
      };
      return updated;
    });
  };

  const calculateStatus = (claudeVal: number | null, expectedVal: number | null, tolerance: number): KPIComparison['status'] => {
    if (!claudeVal || !expectedVal) return 'pending';
    
    const difference = Math.abs(claudeVal - expectedVal);
    const percentDiff = (difference / Math.abs(expectedVal)) * 100;
    
    if (percentDiff <= tolerance) return 'correct';
    if (percentDiff <= tolerance * 2) return 'warning';
    return 'incorrect';
  };

  const validateAllCalculations = async () => {
    setIsValidating(true);
    
    try {
      // Aquí podrías hacer una llamada adicional a Claude para re-calcular
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular validación
      
      const validComparisons = kpiComparisons.filter(kpi => kpi.status !== 'pending');
      const correctCount = validComparisons.filter(kpi => kpi.status === 'correct').length;
      const accuracy = validComparisons.length > 0 ? (correctCount / validComparisons.length) * 100 : 0;
      
      setOverallAccuracy(accuracy);
      onResultsUpdate(accuracy);
      
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: KPIComparison['status']) => {
    switch (status) {
      case 'correct': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'incorrect': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Calculator className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: KPIComparison['status']) => {
    switch (status) {
      case 'correct': return <Badge className="bg-green-100 text-green-800">Correcto</Badge>;
      case 'incorrect': return <Badge variant="destructive">Incorrecto</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Advertencia</Badge>;
      default: return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  if (!testSession?.analysisResult && !testSession?.analysisResults) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Primero debes cargar y analizar un archivo en las pestañas "Pipeline Robusto" o "Carga Simple".
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con resumen */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Validador de Cálculos Financieros
            </CardTitle>
            <div className="flex items-center gap-4">
              {overallAccuracy > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{overallAccuracy.toFixed(1)}% Precisión</span>
                </div>
              )}
              <Button 
                onClick={validateAllCalculations}
                disabled={isValidating}
                variant={overallAccuracy > 80 ? "default" : "outline"}
              >
                {isValidating ? 'Validando...' : 'Validar Todos'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">
                {kpiComparisons.filter(k => k.status === 'correct').length}
              </p>
              <p className="text-sm text-muted-foreground">Correctos</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-yellow-600">
                {kpiComparisons.filter(k => k.status === 'warning').length}
              </p>
              <p className="text-sm text-muted-foreground">Advertencias</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-red-600">
                {kpiComparisons.filter(k => k.status === 'incorrect').length}
              </p>
              <p className="text-sm text-muted-foreground">Incorrectos</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-muted-foreground">
                {kpiComparisons.filter(k => k.status === 'pending').length}
              </p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparaciones de KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>Comparación de KPIs Calculados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kpiComparisons.map((kpi, index) => (
              <div key={kpi.name} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                {/* Nombre y fórmula */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(kpi.status)}
                    <span className="font-medium">{kpi.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{kpi.formula}</p>
                </div>
                
                {/* Valor de Claude */}
                <div className="col-span-2 text-center">
                  <Label className="text-xs text-muted-foreground">Claude</Label>
                  <p className="font-mono text-sm">
                    {kpi.claudeValue?.toFixed(2) || 'N/A'}
                  </p>
                </div>
                
                {/* Input valor esperado */}
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Esperado</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    onChange={(e) => updateExpectedValue(index, e.target.value)}
                    className="text-center font-mono"
                  />
                </div>
                
                {/* Diferencia */}
                <div className="col-span-2 text-center">
                  <Label className="text-xs text-muted-foreground">Diferencia</Label>
                  <p className="font-mono text-sm">
                    {kpi.difference ? `${kpi.difference.toFixed(2)}` : '-'}
                  </p>
                </div>
                
                {/* Estado */}
                <div className="col-span-2 text-center">
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  <div className="mt-1">
                    {getStatusBadge(kpi.status)}
                  </div>
                </div>
                
                {/* Tolerancia */}
                <div className="col-span-1 text-center">
                  <Label className="text-xs text-muted-foreground">Tolerancia</Label>
                  <p className="text-xs">±{kpi.tolerance}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resultados y recomendaciones */}
      {overallAccuracy > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className={
                overallAccuracy >= 90 ? "border-green-200 bg-green-50" :
                overallAccuracy >= 70 ? "border-yellow-200 bg-yellow-50" :
                "border-red-200 bg-red-50"
              }>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Precisión General: {overallAccuracy.toFixed(1)}%</strong>
                  <br />
              {overallAccuracy >= 90 && "Excelente precisión. Claude está calculando correctamente los KPIs financieros."}
              {overallAccuracy >= 70 && overallAccuracy < 90 && "Buena precisión con algunas áreas de mejora. Revisa los cálculos marcados con advertencia."}
              {overallAccuracy < 70 && "Precisión baja. Se requiere revisión de los datos de entrada o recalibración del modelo."}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )}

  {/* Botón de continuación */}
  {overallAccuracy > 0 && onContinue && (
    <div className="flex justify-center">
      <Button onClick={onContinue} size="lg" className="w-full max-w-md">
        <ArrowRight className="h-4 w-4 mr-2" />
        Continuar a Evaluación de Insights
      </Button>
    </div>
  )}
</div>
);
};