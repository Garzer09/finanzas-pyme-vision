import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Target, TrendingUp, AlertTriangle, Calculator } from 'lucide-react';
import { SensitivityData } from '@/hooks/useSensitivity';

interface SensitivityKPICardsProps {
  sensitivityData: SensitivityData;
}

export const SensitivityKPICards = ({ sensitivityData }: SensitivityKPICardsProps) => {
  const {
    ebitdaBase,
    ebitdaSimulated,
    deltaPercentage,
    salesImpactPer1Percent,
    costsImpactPer1Percent
  } = sensitivityData;

  // Determine sensitivity badge variants based on thresholds
  const getSalesVariant = () => {
    if (salesImpactPer1Percent >= 30) return 'danger' as const;
    if (salesImpactPer1Percent >= 20) return 'warning' as const;
    return 'success' as const;
  };

  const getCostsVariant = () => {
    if (costsImpactPer1Percent >= 20) return 'danger' as const;
    if (costsImpactPer1Percent >= 15) return 'warning' as const;
    return 'success' as const;
  };

  const getSimulatedVariant = () => {
    if (ebitdaSimulated > ebitdaBase) return 'success' as const;
    if (ebitdaSimulated < ebitdaBase * 0.9) return 'danger' as const;
    return 'warning' as const;
  };

  const kpiData = [
    {
      title: 'EBITDA Base',
      value: `€${ebitdaBase.toFixed(0)}K`,
      subtitle: 'Escenario actual',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: Target,
      variant: 'default' as const,
      className: 'border-t-4 border-t-primary'
    },
    {
      title: 'Sensibilidad Ventas',
      value: `±${salesImpactPer1Percent}K`,
      subtitle: 'Por cada 1%',
      trend: 'up' as const,
      trendValue: salesImpactPer1Percent >= 25 ? 'Alto impacto' : 'Medio impacto',
      icon: TrendingUp,
      variant: getSalesVariant()
    },
    {
      title: 'Sensibilidad Costes',
      value: `±${costsImpactPer1Percent}K`,
      subtitle: 'Por cada 1%',
      trend: 'down' as const,
      trendValue: costsImpactPer1Percent >= 15 ? 'Alto impacto' : 'Medio impacto',
      icon: AlertTriangle,
      variant: getCostsVariant()
    },
    {
      title: 'EBITDA Simulado',
      value: `€${ebitdaSimulated.toFixed(0)}K`,
      subtitle: 'Con variaciones',
      trend: ebitdaSimulated > ebitdaBase ? 'up' as const : ebitdaSimulated < ebitdaBase ? 'down' as const : 'neutral' as const,
      trendValue: `${deltaPercentage > 0 ? '+' : ''}${deltaPercentage.toFixed(1)}%`,
      icon: Calculator,
      variant: getSimulatedVariant()
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((kpi, index) => (
        <ModernKPICard key={index} {...kpi} />
      ))}
    </div>
  );
};