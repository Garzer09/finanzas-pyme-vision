
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Droplets, Percent, PieChart } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export const KPICardsAnimated = () => {
  // Datos de ejemplo para sparklines
  const liquidityData = [65, 68, 62, 70, 75, 72, 78, 80, 85, 82, 88, 90, 92, 89, 95, 98, 96, 100, 102, 105, 108, 110, 115, 118, 120, 125, 128, 130, 135, 138];
  const profitabilityData = [12, 15, 18, 22, 25, 28, 30, 35, 32, 38, 40, 42, 45, 48, 50, 52, 55, 58, 60, 62, 65, 68, 70, 72, 75, 78, 80, 82, 85, 88];
  const debtData = [3.2, 3.1, 2.9, 2.8, 2.7, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];

  const kpis = [
    {
      title: 'Liquidez',
      subtitle: 'Actual vs Objetivo',
      current: 138,
      target: 120,
      unit: '%',
      trend: 'up',
      change: '+15%',
      sparklineData: liquidityData,
      icon: Droplets,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Rentabilidad Neta',
      subtitle: 'Último trimestre',
      current: 18.5,
      target: 15.0,
      unit: '%',
      trend: 'up',
      change: '+3.2%',
      sparklineData: profitabilityData,
      icon: Percent,
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: 'Endeudamiento',
      subtitle: 'Ratio D/E',
      current: 0.45,
      target: 0.60,
      unit: 'x',
      trend: 'down',
      change: '-0.15',
      sparklineData: debtData,
      icon: PieChart,
      color: 'text-coral-400',
      bgGradient: 'from-coral-500/20 to-orange-500/20',
      borderColor: 'border-coral-500/30'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-emerald-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        const progressPercentage = (kpi.current / kpi.target) * 100;
        
        return (
          <Card 
            key={index} 
            className={`kpi-card bg-gradient-to-br ${kpi.bgGradient} border ${kpi.borderColor} hover:scale-105 transition-all duration-300 animate-fade-in group`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-card/50 border border-border/50`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{kpi.title}</h3>
                  <p className="text-sm text-muted-foreground">{kpi.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(kpi.trend)}
                <span className={`text-sm font-medium ${getTrendColor(kpi.trend)}`}>
                  {kpi.change}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {kpi.current.toFixed(kpi.unit === '%' ? 1 : 2)}
                </span>
                <span className="text-lg text-muted-foreground">{kpi.unit}</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  Meta: {kpi.target}{kpi.unit}
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="relative">
                <div className="h-2 bg-card/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${kpi.bgGradient} transition-all duration-1000 ease-out`}
                    style={{ 
                      width: `${Math.min(progressPercentage, 100)}%`,
                      animationDelay: `${index * 200}ms`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span>{kpi.target}{kpi.unit}</span>
                </div>
              </div>

              {/* Sparkline */}
              <div className="h-12 opacity-70 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpi.sparklineData.map(value => ({ value }))}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={kpi.trend === 'up' ? '#10b981' : kpi.trend === 'down' ? '#ef4444' : '#6b7280'}
                      strokeWidth={2} 
                      dot={false}
                      strokeDasharray={kpi.trend === 'neutral' ? '5,5' : '0'}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
