import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Target } from 'lucide-react';
import { SensitivityData } from '@/hooks/useSensitivity';

interface VariableSimulatorProps {
  sensitivityData: SensitivityData;
  onSalesChange: (value: number[]) => void;
  onCostsChange: (value: number[]) => void;
  onSalesDirectChange: (value: number) => void;
  onCostsDirectChange: (value: number) => void;
}

export const VariableSimulator = ({
  sensitivityData,
  onSalesChange,
  onCostsChange,
  onSalesDirectChange,
  onCostsDirectChange
}: VariableSimulatorProps) => {
  const { salesDelta, costsDelta, ebitdaBase, ebitdaSimulated } = sensitivityData;

  const handleSalesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    if (value >= -30 && value <= 30) {
      onSalesDirectChange(value);
    }
  };

  const handleCostsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    if (value >= -20 && value <= 20) {
      onCostsDirectChange(value);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
            <Target className="h-5 w-5 text-primary" />
          </div>
          Simulador de Variables
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="sales-slider" 
                className="text-sm font-medium text-slate-700"
              >
                Variación de Ventas
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={salesDelta}
                  onChange={handleSalesInputChange}
                  min={-30}
                  max={30}
                  step={1}
                  className="w-16 h-7 text-xs"
                  aria-label="Variación de ventas en porcentaje"
                />
                <span className="text-xs text-slate-600">%</span>
              </div>
            </div>
            <Slider
              id="sales-slider"
              value={[salesDelta]}
              onValueChange={onSalesChange}
              max={30}
              min={-30}
              step={1}
              className="w-full"
              aria-label={`Variación de ventas: ${salesDelta > 0 ? '+' : ''}${salesDelta}%`}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>-30%</span>
              <span className="font-medium text-slate-700">
                {salesDelta > 0 ? '+' : ''}{salesDelta}%
              </span>
              <span>+30%</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="costs-slider" 
                className="text-sm font-medium text-slate-700"
              >
                Variación de Costes
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={costsDelta}
                  onChange={handleCostsInputChange}
                  min={-20}
                  max={20}
                  step={1}
                  className="w-16 h-7 text-xs"
                  aria-label="Variación de costes en porcentaje"
                />
                <span className="text-xs text-slate-600">%</span>
              </div>
            </div>
            <Slider
              id="costs-slider"
              value={[costsDelta]}
              onValueChange={onCostsChange}
              max={20}
              min={-20}
              step={1}
              className="w-full"
              aria-label={`Variación de costes: ${costsDelta > 0 ? '+' : ''}${costsDelta}%`}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>-20%</span>
              <span className="font-medium text-slate-700">
                {costsDelta > 0 ? '+' : ''}{costsDelta}%
              </span>
              <span>+20%</span>
            </div>
          </div>

          <div className="bg-slate-50/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50">
            <h4 className="text-slate-900 font-semibold mb-3">Impacto Simulado</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-slate-700">
                <span>EBITDA Base:</span>
                <span className="font-semibold">€{ebitdaBase.toFixed(0)}K</span>
              </div>
              <div className="flex justify-between text-primary">
                <span>EBITDA Simulado:</span>
                <span className="font-semibold">€{ebitdaSimulated.toFixed(0)}K</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span>Variación:</span>
                  <span className={`font-semibold ${
                    ebitdaSimulated > ebitdaBase 
                      ? 'text-success' 
                      : ebitdaSimulated < ebitdaBase 
                        ? 'text-destructive' 
                        : 'text-slate-600'
                  }`}>
                    {ebitdaSimulated > ebitdaBase ? '+' : ''}
                    €{(ebitdaSimulated - ebitdaBase).toFixed(0)}K
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};