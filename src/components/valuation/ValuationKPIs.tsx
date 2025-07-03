import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building2, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { ValuationData } from '@/hooks/useValuation';

interface ValuationKPIsProps {
  valuationData: ValuationData;
}

export const ValuationKPIs = ({ valuationData }: ValuationKPIsProps) => {
  const {
    weightedValue,
    valuePerShare,
    sectorPremium,
    confidenceInterval
  } = valuationData;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    return `€${(value / 1000).toFixed(0)}K`;
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getPremiumVariant = () => {
    if (sectorPremium > 15) return 'success' as const;
    if (sectorPremium < -15) return 'danger' as const;
    return 'default' as const;
  };

  const kpiData = [
    {
      title: 'Valor Empresa',
      value: formatCurrency(weightedValue),
      subtitle: 'DCF ponderado',
      trend: 'neutral' as const,
      trendValue: 'Valoración base',
      icon: Building2,
      variant: 'default' as const,
      className: 'border-t-4 border-t-primary shadow-md',
      tooltip: 'Valor = Σ(Método × Peso) / 100'
    },
    {
      title: 'Valor por Acción',
      value: `€${valuePerShare.toFixed(2)}`,
      subtitle: `${valuationData.sharesOutstanding.toLocaleString()} acciones`,
      trend: 'up' as const,
      trendValue: 'Por acción',
      icon: TrendingUp,
      variant: 'success' as const,
      className: 'border-t-4 border-t-primary shadow-md',
      tooltip: 'Valor por Acción = Valor Empresa / Nº Acciones'
    },
    {
      title: 'Prima vs. Sector',
      value: formatPercentage(sectorPremium),
      subtitle: 'Comparación sectorial',
      trend: sectorPremium > 0 ? 'up' as const : sectorPremium < 0 ? 'down' as const : 'neutral' as const,
      trendValue: sectorPremium > 0 ? 'Sobrevalorada' : sectorPremium < 0 ? 'Infravalorada' : 'En línea',
      icon: AlertCircle,
      variant: getPremiumVariant(),
      className: 'border-t-4 border-t-primary shadow-md',
      tooltip: 'Prima = (Valor - Promedio Sector) / Promedio Sector'
    },
    {
      title: 'Rango Valoración',
      value: `${formatCurrency(confidenceInterval[0])} - ${formatCurrency(confidenceInterval[1])}`,
      subtitle: 'IC 80%',
      trend: 'neutral' as const,
      trendValue: 'Intervalo confianza',
      icon: BarChart3,
      variant: 'default' as const,
      className: 'border-t-4 border-t-primary shadow-md',
      tooltip: 'Rango basado en dispersión de métodos'
    }
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <div>
                <ModernKPICard {...kpi} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">{kpi.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};