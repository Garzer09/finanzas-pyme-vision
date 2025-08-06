import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building2, TrendingUp, BarChart3 } from 'lucide-react';
import { ValuationData } from '@/hooks/useValuation';

interface ValuationKPIsProps {
  valuationData: ValuationData;
}

export const ValuationKPIs = ({ valuationData }: ValuationKPIsProps) => {
  const {
    weightedValue,
    valuePerShare,
    valuationRange
  } = valuationData;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    return `€${(value / 1000).toFixed(0)}K`;
  };

  const kpiData = [
    {
      title: 'Valor Empresa',
      value: formatCurrency(weightedValue),
      subtitle: 'Valoración ponderada',
      trend: 'neutral' as const,
      trendValue: 'Desde estados financieros',
      icon: Building2,
      variant: 'default' as const,
      className: 'border-t-4 border-t-primary shadow-md',
      tooltip: 'Valor = ∑(Método × Peso) / 100',
      sources: 'P&G, Balance, Flujos de Caja (Año 0-5)'
    },
    {
      title: 'Valor por Acción',
      value: `€${valuePerShare.toFixed(2)}`,
      subtitle: `${valuationData.financialData.sharesOutstanding.toLocaleString()} acciones`,
      trend: 'up' as const,
      trendValue: 'Por acción ordinaria',
      icon: TrendingUp,
      variant: 'success' as const,
      className: 'border-t-4 border-t-primary shadow-md',
      tooltip: 'Valor por Acción = Valor Empresa / Nº Acciones',
      sources: 'Valor Empresa ÷ Capital social'
    },
    {
      title: 'WACC Calculado',
      value: `${valuationData.dcfParameters.wacc.toFixed(1)}%`,
      subtitle: 'Desde datos internos',
      trend: 'neutral' as const,
      trendValue: 'Costo promedio ponderado',
      icon: BarChart3,
      variant: 'default' as const,
      className: 'border-t-4 border-t-primary shadow-md',
      tooltip: 'WACC = (Kd×(1-T)×D/V) + (Ke×E/V)',
      sources: 'Gastos financieros, ROE histórico, estructura de capital'
    },
    {
      title: 'Rango Valoración',
      value: `${formatCurrency(valuationRange[0])} - ${formatCurrency(valuationRange[1])}`,
      subtitle: 'Sensibilidad ±10%',
      trend: 'neutral' as const,
      trendValue: 'WACC y crecimiento',
      icon: BarChart3,
      variant: 'default' as const,
      className: 'border-t-4 border-t-primary shadow-md',
      tooltip: 'Rango basado en sensibilidad WACC ±1% y crecimiento ±0.5%',
      sources: 'Análisis de sensibilidad interno'
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
            <TooltipContent className="max-w-xs p-4 bg-white border shadow-lg rounded-lg">
              <div className="space-y-2">
                <p className="font-semibold text-sm text-slate-900">{kpi.tooltip}</p>
                <div className="text-xs text-slate-600">
                  <p className="font-medium">Fuentes:</p>
                  <p>{kpi.sources}</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
