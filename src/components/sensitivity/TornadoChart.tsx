import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { BarChart3, Euro, Percent } from 'lucide-react';

interface TornadoChartProps {
  className?: string;
}

export const TornadoChart = ({ className }: TornadoChartProps) => {
  const [showPercentage, setShowPercentage] = useState(false);

  const baseData = [
    { 
      variable: 'Ventas +10%', 
      impactEuros: 250, 
      impactPercent: 55.6,
      positive: true 
    },
    { 
      variable: 'Ventas -10%', 
      impactEuros: -250, 
      impactPercent: -55.6,
      positive: false 
    },
    { 
      variable: 'Costes -5%', 
      impactEuros: 75, 
      impactPercent: 16.7,
      positive: true 
    },
    { 
      variable: 'Costes +5%', 
      impactEuros: -75, 
      impactPercent: -16.7,
      positive: false 
    },
    { 
      variable: 'Precio +3%', 
      impactEuros: 75, 
      impactPercent: 16.7,
      positive: true 
    },
    { 
      variable: 'Precio -3%', 
      impactEuros: -75, 
      impactPercent: -16.7,
      positive: false 
    },
    { 
      variable: 'Volumen +5%', 
      impactEuros: 60, 
      impactPercent: 13.3,
      positive: true 
    },
    { 
      variable: 'Volumen -5%', 
      impactEuros: -60, 
      impactPercent: -13.3,
      positive: false 
    },
  ];

  // Sort by absolute impact for tornado effect
  const sortedData = [...baseData].sort((a, b) => {
    const aValue = showPercentage ? Math.abs(a.impactPercent) : Math.abs(a.impactEuros);
    const bValue = showPercentage ? Math.abs(b.impactPercent) : Math.abs(b.impactEuros);
    return bValue - aValue;
  });

  const chartData = sortedData.map(item => ({
    variable: item.variable,
    impact: showPercentage ? item.impactPercent : item.impactEuros,
    positive: item.positive,
    fill: item.positive ? '#16a34a' : '#dc2626'
  }));

  const formatTooltip = (value: number) => {
    if (showPercentage) {
      return [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, 'Impacto EBITDA'];
    }
    return [`${value > 0 ? '+' : ''}€${Math.abs(value).toFixed(0)}K`, 'Impacto EBITDA'];
  };

  const formatYAxisLabel = (value: string) => {
    // Truncate long labels for better readability
    return value.length > 12 ? value.substring(0, 12) + '...' : value;
  };

  return (
    <div className={className}>
      <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              Análisis Tornado
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={!showPercentage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPercentage(false)}
                className="gap-2"
                aria-label="Mostrar impacto en euros"
              >
                <Euro className="h-4 w-4" />
                €
              </Button>
              <Button
                variant={showPercentage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPercentage(true)}
                className="gap-2"
                aria-label="Mostrar impacto en porcentaje"
              >
                <Percent className="h-4 w-4" />
                %
              </Button>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Impacto de variables clave ordenado por magnitud
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number" 
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => 
                    showPercentage ? `${value}%` : `€${Math.abs(value)}K`
                  }
                />
                <YAxis 
                  dataKey="variable" 
                  type="category" 
                  stroke="#64748b"
                  fontSize={11}
                  width={75}
                  tickFormatter={formatYAxisLabel}
                />
                <ReferenceLine 
                  x={0} 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="none"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid rgba(0, 94, 138, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(8px)'
                  }}
                  formatter={formatTooltip}
                  labelFormatter={(label: string) => `Variable: ${label}`}
                />
                <Bar 
                  dataKey="impact" 
                  radius={[0, 4, 4, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success rounded"></div>
              <span className="text-slate-600">Impacto Positivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive rounded"></div>
              <span className="text-slate-600">Impacto Negativo</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};