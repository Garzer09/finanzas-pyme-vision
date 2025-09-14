import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';

interface CashFlowStepProps {
  data: any;
  balanceSheet: any;
  profitLoss: any;
  onChange: (data: any) => void;
}

interface CashFlowData {
  // Manual inputs
  capex: number;
  dividendos: number;
  variacionDeuda: number;
  otrasInversiones: number;
  otrosOperativos: number;
  
  // Auto-calculated from other steps
  flujoOperativo?: number;
  flujoInversion?: number;
  flujoFinanciacion?: number;
  flujoEfectivoNeto?: number;
  fcf?: number; // Free Cash Flow
}

export const CashFlowStep: React.FC<CashFlowStepProps> = ({
  data,
  balanceSheet,
  profitLoss,
  onChange
}) => {
  const [cashFlow, setCashFlow] = useState<CashFlowData>({
    capex: 0,
    dividendos: 0,
    variacionDeuda: 0,
    otrasInversiones: 0,
    otrosOperativos: 0,
    ...data
  });

  const handleInputChange = (field: keyof CashFlowData, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newCashFlow = { ...cashFlow, [field]: numValue };
    setCashFlow(newCashFlow);
  };

  // Auto-calculations based on P&L and Balance
  const calculateOperativeCashFlow = () => {
    if (!profitLoss?.resultadoNeto) return 0;
    
    // Simplified: Net Income + Depreciation + Changes in Working Capital
    const netIncome = profitLoss.resultadoNeto || 0;
    const depreciation = profitLoss.amortizaciones || 0;
    const workingCapitalChange = 0; // Could be calculated from balance changes
    const otherOperative = cashFlow.otrosOperativos || 0;
    
    return netIncome + depreciation + workingCapitalChange + otherOperative;
  };

  const flujoOperativo = calculateOperativeCashFlow();
  const flujoInversion = -(cashFlow.capex + cashFlow.otrasInversiones);
  const flujoFinanciacion = cashFlow.variacionDeuda - cashFlow.dividendos;
  const flujoEfectivoNeto = flujoOperativo + flujoInversion + flujoFinanciacion;
  const fcf = flujoOperativo + flujoInversion; // Before financing activities

  // Update parent with calculated values
  useEffect(() => {
    onChange({
      ...cashFlow,
      flujoOperativo,
      flujoInversion,
      flujoFinanciacion,
      flujoEfectivoNeto,
      fcf
    });
  }, [cashFlow, flujoOperativo, flujoInversion, flujoFinanciacion, flujoEfectivoNeto, fcf]);

  const CashFlowSection = ({ 
    title, 
    amount, 
    icon, 
    color 
  }: { 
    title: string; 
    amount: number; 
    icon: React.ReactNode; 
    color: string;
  }) => (
    <div className={`p-4 rounded-lg border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        <div className={`text-lg font-bold ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {amount.toLocaleString()} €
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Datos Manuales</h3>
          
          {/* Operating Adjustments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ajustes Operativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otrosOperativos">Otros Ajustes Operativos</Label>
                <Input
                  id="otrosOperativos"
                  type="number"
                  value={cashFlow.otrosOperativos || ''}
                  onChange={(e) => handleInputChange('otrosOperativos', e.target.value)}
                  placeholder="0"
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">
                  Cambios en capital de trabajo, provisiones, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Investment Activities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actividades de Inversión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="capex">CAPEX - Inversiones (€)</Label>
                <Input
                  id="capex"
                  type="number"
                  value={cashFlow.capex || ''}
                  onChange={(e) => handleInputChange('capex', e.target.value)}
                  placeholder="0"
                  className="text-right"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otrasInversiones">Otras Inversiones (€)</Label>
                <Input
                  id="otrasInversiones"
                  type="number"
                  value={cashFlow.otrasInversiones || ''}
                  onChange={(e) => handleInputChange('otrasInversiones', e.target.value)}
                  placeholder="0"
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">
                  Adquisiciones, inversiones financieras, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financing Activities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actividades de Financiación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="variacionDeuda">Variación Deuda Neta (€)</Label>
                <Input
                  id="variacionDeuda"
                  type="number"
                  value={cashFlow.variacionDeuda || ''}
                  onChange={(e) => handleInputChange('variacionDeuda', e.target.value)}
                  placeholder="0"
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">
                  Positivo: Nueva deuda | Negativo: Amortización
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dividendos">Dividendos Pagados (€)</Label>
                <Input
                  id="dividendos"
                  type="number"
                  value={cashFlow.dividendos || ''}
                  onChange={(e) => handleInputChange('dividendos', e.target.value)}
                  placeholder="0"
                  className="text-right"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Estado de Flujos de Efectivo</h3>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Flujos Calculados
                <Calculator className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CashFlowSection
                title="Flujo de Operaciones"
                amount={flujoOperativo}
                icon={<TrendingUp className="h-4 w-4" />}
                color="border-l-blue-500"
              />
              
              <div className="text-xs text-muted-foreground ml-6 -mt-2">
                Resultado Neto + Amortizaciones + Otros Ajustes
                {profitLoss?.resultadoNeto && (
                  <div className="mt-1">
                    {profitLoss.resultadoNeto.toLocaleString()} + {(profitLoss.amortizaciones || 0).toLocaleString()} + {cashFlow.otrosOperativos.toLocaleString()}
                  </div>
                )}
              </div>

              <CashFlowSection
                title="Flujo de Inversión"
                amount={flujoInversion}
                icon={<TrendingDown className="h-4 w-4" />}
                color="border-l-orange-500"
              />
              
              <div className="text-xs text-muted-foreground ml-6 -mt-2">
                -(CAPEX + Otras Inversiones) = -({cashFlow.capex.toLocaleString()} + {cashFlow.otrasInversiones.toLocaleString()})
              </div>

              <CashFlowSection
                title="Flujo de Financiación"
                amount={flujoFinanciacion}
                icon={<Calculator className="h-4 w-4" />}
                color="border-l-purple-500"
              />
              
              <div className="text-xs text-muted-foreground ml-6 -mt-2">
                Variación Deuda - Dividendos = {cashFlow.variacionDeuda.toLocaleString()} - {cashFlow.dividendos.toLocaleString()}
              </div>

              <div className="border-t pt-4">
                <CashFlowSection
                  title="Flujo de Efectivo Neto"
                  amount={flujoEfectivoNeto}
                  icon={<Badge className="h-4 w-4">€</Badge>}
                  color={`border-l-4 ${flujoEfectivoNeto >= 0 ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Métricas Clave</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-900">Free Cash Flow (FCF):</span>
                <span className={`font-bold ${fcf >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fcf.toLocaleString()} €
                </span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                FCF = Flujo Operativo + Flujo Inversión (antes de financiación)
              </div>
              
              {profitLoss?.ingresos && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>FCF Margin:</span>
                    <span className="font-medium">
                      {((fcf / profitLoss.ingresos) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Conversion:</span>
                    <span className="font-medium">
                      {profitLoss.resultadoNeto ? ((flujoOperativo / profitLoss.resultadoNeto) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};