import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { ValuationData } from '@/hooks/useValuation';

interface ValuationMethodsChartProps {
  valuationData: ValuationData;
  onGrowthRateUpdate: (rate: number) => void;
}

export const ValuationMethodsChart = ({ valuationData, onGrowthRateUpdate }: ValuationMethodsChartProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const { methods } = valuationData;

  const chartData = methods.map((method, index) => ({
    name: method.name,
    value: method.value / 1000000, // Convert to millions for better readability
    fill: getMethodColor(index),
    id: method.id
  }));

  function getMethodColor(index: number): string {
    const colors = ['#005E8A', '#6BD1FF', '#94A3B8']; // Corporate colors for 3 methods
    return colors[index % colors.length];
  }

  const handleBarClick = (data: any) => {
    const method = methods.find(m => m.id === data.id);
    if (method) {
      setSelectedMethod(method.id);
      setEditValues(getMethodDefaults(method.id));
    }
  };

  const getMethodDefaults = (methodId: string) => {
    const { dcfParameters, financialData } = valuationData;
    
    switch (methodId) {
      case 'dcf':
        return {
          wacc: dcfParameters.wacc,
          growthRate: dcfParameters.growthRate,
          horizon: dcfParameters.horizon,
          netDebt: dcfParameters.netDebt,
          fcfProjections: dcfParameters.fcfProjections,
          currentYear: 0
        };
      case 'book_value':
        return {
          equity: financialData.equity[0],
          revaluationAdjustment: financialData.fixedAssets[0] * 0.1,
          totalBookValue: financialData.equity[0] + (financialData.fixedAssets[0] * 0.1)
        };
      case 'liquidation':
        return {
          currentAssets: financialData.currentAssets[0],
          fixedAssets: financialData.fixedAssets[0],
          totalDebt: financialData.totalDebt[0],
          currentAssetsCoeff: 80,
          fixedAssetsCoeff: 60,
          liquidationCosts: 15
        };
      default:
        return {};
    }
  };

  const getMethodInputs = (methodId: string) => {
    switch (methodId) {
      case 'dcf':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="wacc">WACC (%)</Label>
              <Input
                id="wacc"
                type="number"
                value={editValues.wacc || 8.5}
                onChange={(e) => setEditValues(prev => ({ ...prev, wacc: parseFloat(e.target.value) }))}
                min={5}
                max={20}
                step={0.1}
              />
            </div>
            <div>
              <Label htmlFor="growthRate">Crecimiento (%)</Label>
              <Input
                id="growthRate"
                type="number"
                value={editValues.growthRate || 2.5}
                onChange={(e) => setEditValues(prev => ({ ...prev, growthRate: parseFloat(e.target.value) }))}
                min={0}
                max={5}
                step={0.1}
              />
            </div>
            <div>
              <Label htmlFor="horizon">Horizonte (años)</Label>
              <Input
                id="horizon"
                type="number"
                value={editValues.horizon || 5}
                onChange={(e) => setEditValues(prev => ({ ...prev, horizon: parseInt(e.target.value) }))}
                min={3}
                max={10}
              />
            </div>
            <div>
              <Label htmlFor="terminalValue">Valor Terminal (€M)</Label>
              <Input
                id="terminalValue"
                type="number"
                value={editValues.terminalValue || 0}
                onChange={(e) => setEditValues(prev => ({ ...prev, terminalValue: parseFloat(e.target.value) * 1000000 }))}
                step={0.1}
              />
            </div>
          </div>
        );
      case 'multiples':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ebitdaMultiple">Múltiplo EV/EBITDA</Label>
              <Input
                id="ebitdaMultiple"
                type="number"
                value={editValues.ebitdaMultiple || 8.5}
                onChange={(e) => setEditValues(prev => ({ ...prev, ebitdaMultiple: parseFloat(e.target.value) }))}
                min={3}
                max={20}
                step={0.1}
              />
            </div>
            <div>
              <Label htmlFor="currentEbitda">EBITDA Actual (€M)</Label>
              <Input
                id="currentEbitda"
                type="number"
                value={editValues.currentEbitda || 0}
                onChange={(e) => setEditValues(prev => ({ ...prev, currentEbitda: parseFloat(e.target.value) }))}
                step={0.1}
              />
            </div>
          </div>
        );
      case 'assets':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bookValue">Valor Libros (€M)</Label>
              <Input
                id="bookValue"
                type="number"
                value={editValues.bookValue || 0}
                onChange={(e) => setEditValues(prev => ({ ...prev, bookValue: parseFloat(e.target.value) * 1000000 }))}
                step={0.1}
              />
            </div>
            <div>
              <Label htmlFor="adjustments">Ajustes (€M)</Label>
              <Input
                id="adjustments"
                type="number"
                value={editValues.adjustments || 0}
                onChange={(e) => setEditValues(prev => ({ ...prev, adjustments: parseFloat(e.target.value) * 1000000 }))}
                step={0.1}
              />
            </div>
          </div>
        );
      case 'liquidation':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assetValue">Valor Activos (€M)</Label>
              <Input
                id="assetValue"
                type="number"
                value={editValues.assetValue || 0}
                onChange={(e) => setEditValues(prev => ({ ...prev, assetValue: parseFloat(e.target.value) * 1000000 }))}
                step={0.1}
              />
            </div>
            <div>
              <Label htmlFor="liquidationCosts">Costes Liquidación (%)</Label>
              <Input
                id="liquidationCosts"
                type="number"
                value={editValues.liquidationCosts || 15}
                onChange={(e) => setEditValues(prev => ({ ...prev, liquidationCosts: parseFloat(e.target.value) }))}
                min={5}
                max={30}
                step={1}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSave = () => {
    if (selectedMethod) {
      // Update growth rate if DCF method
      if (selectedMethod === 'dcf' && editValues.growthRate !== undefined) {
        onGrowthRateUpdate(editValues.growthRate);
      }
      // For other methods, values are calculated automatically based on financial data
      setSelectedMethod(null);
    }
  };

  const selectedMethodData = methods.find(m => m.id === selectedMethod);

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            Valoración por Método
          </CardTitle>
          <p className="text-sm text-slate-600">
            Haz click en una barra para editar los parámetros del método
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} onClick={handleBarClick}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#005E8A" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#6BD1FF" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  label={{ value: 'Valor (€M)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid rgba(0, 94, 138, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(8px)'
                  }}
                  formatter={(value: number) => [`€${value.toFixed(1)}M`, 'Valoración']}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Method Details Dialog */}
      <Dialog open={!!selectedMethod} onOpenChange={() => setSelectedMethod(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Parámetros: {selectedMethodData?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMethod && getMethodInputs(selectedMethod)}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                Actualizar Valoración
              </Button>
              <Button onClick={() => setSelectedMethod(null)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};