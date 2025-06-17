
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, DollarSign, Percent, BarChart3, Droplets, Target, Settings, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface KPIData {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'percentage' | 'absolute';
  trend: 'up' | 'down' | 'neutral';
  target?: number;
  threshold: { min: number; max: number };
  sparklineData: number[];
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  isVisible: boolean;
  category: 'revenue' | 'profitability' | 'liquidity' | 'efficiency' | 'debt';
}

export const ExecutiveSummaryKPIs = () => {
  const [kpis, setKpis] = useState<KPIData[]>([
    {
      id: 'revenue',
      name: 'Ingresos Totales',
      value: 2500000,
      unit: '€',
      change: 12,
      changeType: 'percentage',
      trend: 'up',
      target: 2800000,
      threshold: { min: 2000000, max: 3000000 },
      sparklineData: [2100, 2150, 2200, 2300, 2350, 2400, 2450, 2500],
      icon: DollarSign,
      color: 'text-steel-blue-dark',
      bgColor: 'bg-steel-blue-light',
      borderColor: 'border-steel-blue/30',
      isVisible: true,
      category: 'revenue'
    },
    {
      id: 'ebitda',
      name: 'EBITDA',
      value: 450000,
      unit: '€',
      change: -5,
      changeType: 'percentage',
      trend: 'down',
      target: 500000,
      threshold: { min: 400000, max: 600000 },
      sparklineData: [480, 475, 470, 465, 460, 455, 450, 450],
      icon: BarChart3,
      color: 'text-steel-blue-dark',
      bgColor: 'bg-light-gray-100',
      borderColor: 'border-light-gray-200',
      isVisible: true,
      category: 'profitability'
    },
    {
      id: 'margin',
      name: 'Margen EBITDA',
      value: 18,
      unit: '%',
      change: -2.5,
      changeType: 'absolute',
      trend: 'down',
      target: 20,
      threshold: { min: 15, max: 25 },
      sparklineData: [20.5, 20, 19.5, 19, 18.5, 18.2, 18, 18],
      icon: Percent,
      color: 'text-steel-blue-dark',
      bgColor: 'bg-steel-blue-light',
      borderColor: 'border-steel-blue/30',
      isVisible: true,
      category: 'profitability'
    },
    {
      id: 'liquidity',
      name: 'Ratio Liquidez',
      value: 1.35,
      unit: 'x',
      change: 8,
      changeType: 'percentage',
      trend: 'up',
      target: 1.5,
      threshold: { min: 1.2, max: 2.0 },
      sparklineData: [1.25, 1.27, 1.29, 1.31, 1.33, 1.34, 1.35, 1.35],
      icon: Droplets,
      color: 'text-steel-blue-dark',
      bgColor: 'bg-light-gray-100',
      borderColor: 'border-light-gray-200',
      isVisible: true,
      category: 'liquidity'
    },
    {
      id: 'debt_ratio',
      name: 'Ratio Deuda/EBITDA',
      value: 2.1,
      unit: 'x',
      change: 0.3,
      changeType: 'absolute',
      trend: 'up',
      target: 1.8,
      threshold: { min: 0, max: 2.5 },
      sparklineData: [1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.1],
      icon: Target,
      color: 'text-steel-blue-dark',
      bgColor: 'bg-steel-blue-light',
      borderColor: 'border-steel-blue/30',
      isVisible: true,
      category: 'debt'
    },
    {
      id: 'free_cash_flow',
      name: 'Flujo Caja Libre',
      value: 285000,
      unit: '€',
      change: 15,
      changeType: 'percentage',
      trend: 'up',
      target: 300000,
      threshold: { min: 200000, max: 400000 },
      sparklineData: [250, 255, 260, 265, 270, 275, 280, 285],
      icon: TrendingUp,
      color: 'text-steel-blue-dark',
      bgColor: 'bg-light-gray-100',
      borderColor: 'border-light-gray-200',
      isVisible: false,
      category: 'efficiency'
    }
  ]);

  const [isCustomizing, setIsCustomizing] = useState(false);

  const formatValue = (value: number, unit: string) => {
    if (unit === '€') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M€`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K€`;
      }
      return `${value.toLocaleString()}€`;
    }
    return `${value.toFixed(unit === '%' ? 1 : 2)}${unit}`;
  };

  const getStatusColor = (value: number, threshold: { min: number; max: number }) => {
    if (value < threshold.min) return 'text-red-600';
    if (value > threshold.max) return 'text-orange-600';
    return 'text-green-700';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-700" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const toggleKPIVisibility = (id: string) => {
    setKpis(prev => prev.map(kpi => 
      kpi.id === id ? { ...kpi, isVisible: !kpi.isVisible } : kpi
    ));
  };

  const visibleKpis = kpis.filter(kpi => kpi.isVisible).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header con botón de personalización */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">KPIs Principales</h2>
          <p className="text-gray-600">Métricas clave de rendimiento financiero</p>
        </div>
        <Button
          onClick={() => setIsCustomizing(!isCustomizing)}
          variant="outline"
          className="border-steel-blue hover:border-steel-blue-dark hover:bg-steel-blue-light"
        >
          <Settings className="h-4 w-4 mr-2" />
          Personalizar
        </Button>
      </div>

      {/* Panel de personalización */}
      {isCustomizing && (
        <Card className="bg-white border border-light-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurar KPIs Visibles (máximo 6)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="flex items-center gap-3">
                <Button
                  onClick={() => toggleKPIVisibility(kpi.id)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-gray-700 hover:bg-steel-blue-light hover:text-steel-blue-dark"
                >
                  {kpi.isVisible ? (
                    <Eye className="h-4 w-4 text-steel-blue" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm">{kpi.name}</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleKpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const progressPercentage = kpi.target ? (kpi.value / kpi.target) * 100 : 0;
          
          return (
            <Card 
              key={kpi.id}
              className={`${kpi.bgColor} border ${kpi.borderColor} hover:border-steel-blue hover:shadow-lg transition-all duration-300 p-6 cursor-pointer`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Header del KPI */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/80 border border-steel-blue/20">
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{kpi.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getTrendIcon(kpi.trend)}
                      <span className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-green-700' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        {kpi.changeType === 'percentage' ? '+' : ''}{kpi.change}{kpi.changeType === 'percentage' ? '%' : kpi.unit}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(kpi.value, kpi.threshold)} border-current bg-white`}
                >
                  {kpi.value < kpi.threshold.min ? 'Bajo' : 
                   kpi.value > kpi.threshold.max ? 'Alto' : 'Normal'}
                </Badge>
              </div>

              {/* Valor principal */}
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatValue(kpi.value, kpi.unit)}
                  </span>
                  {kpi.target && (
                    <span className="text-sm text-gray-600">
                      / {formatValue(kpi.target, kpi.unit)}
                    </span>
                  )}
                </div>

                {/* Barra de progreso hacia objetivo */}
                {kpi.target && (
                  <div className="relative">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-steel-blue transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${Math.min(progressPercentage, 100)}%`,
                          animationDelay: `${index * 200}ms`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>0</span>
                      <span>Meta: {formatValue(kpi.target, kpi.unit)}</span>
                    </div>
                  </div>
                )}

                {/* Sparkline */}
                <div className="h-12 opacity-80 hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpi.sparklineData.map(value => ({ value }))}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--steel-blue))"
                        fill="hsl(var(--steel-blue))"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
