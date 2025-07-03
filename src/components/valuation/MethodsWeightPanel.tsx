import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ValuationData } from '@/hooks/useValuation';
import { useState, useEffect } from 'react';

interface MethodsWeightPanelProps {
  valuationData: ValuationData;
  onWeightsChange: (weights: number[]) => void;
}

export const MethodsWeightPanel = ({ valuationData, onWeightsChange }: MethodsWeightPanelProps) => {
  const { methods } = valuationData;
  const [localWeights, setLocalWeights] = useState(methods.map(m => m.weight));

  useEffect(() => {
    setLocalWeights(methods.map(m => m.weight));
  }, [methods]);

  const chartData = methods.map((method, index) => ({
    name: method.name,
    value: method.weight,
    fill: getMethodColor(index),
    absoluteValue: method.value
  }));

  function getMethodColor(index: number): string {
    const colors = ['#005E8A', '#6BD1FF', '#16a34a', '#dc2626'];
    return colors[index % colors.length];
  }

  const handleWeightChange = (index: number, newWeight: number[]) => {
    const newWeights = [...localWeights];
    newWeights[index] = newWeight[0];
    
    // Ensure total doesn't exceed 100%
    const total = newWeights.reduce((sum, weight) => sum + weight, 0);
    if (total <= 100) {
      setLocalWeights(newWeights);
      onWeightsChange(newWeights);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    return `€${(value / 1000).toFixed(0)}K`;
  };

  const currentTotal = localWeights.reduce((sum, weight) => sum + weight, 0);

  return (
    <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
            <PieChartIcon className="h-5 w-5 text-primary" />
          </div>
          Métodos de Valoración
        </CardTitle>
        <p className="text-sm text-slate-600">
          Ajusta los pesos de cada método (Total: {currentTotal.toFixed(0)}%)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pie Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => [
                  `${value.toFixed(1)}% (${formatCurrency(props.payload.absoluteValue)})`,
                  name
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weight Sliders */}
        <div className="space-y-4">
          {methods.map((method, index) => (
            <div key={method.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label 
                  htmlFor={`weight-${method.id}`}
                  className="text-sm font-medium text-slate-700"
                >
                  {method.name}
                </Label>
                <span className="text-sm font-semibold text-slate-900">
                  {localWeights[index].toFixed(0)}%
                </span>
              </div>
              <Slider
                id={`weight-${method.id}`}
                value={[localWeights[index]]}
                onValueChange={(value) => handleWeightChange(index, value)}
                max={100}
                min={0}
                step={1}
                className="w-full"
                aria-label={`Peso del método ${method.name}: ${localWeights[index].toFixed(0)}%`}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>0%</span>
                <span className="text-slate-700 font-medium">
                  {formatCurrency(method.value)}
                </span>
                <span>100%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total Warning */}
        {currentTotal !== 100 && (
          <div className={`p-3 rounded-lg border text-sm ${
            currentTotal > 100 
              ? 'bg-destructive/10 border-destructive/30 text-destructive-foreground' 
              : 'bg-warning/10 border-warning/30 text-warning-foreground'
          }`}>
            {currentTotal > 100 
              ? `Los pesos suman ${currentTotal.toFixed(0)}%. Ajuste para que sumen 100%.`
              : `Los pesos suman ${currentTotal.toFixed(0)}%. Faltan ${(100 - currentTotal).toFixed(0)}%.`
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};