import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Clock, Calendar, TrendingDown } from 'lucide-react';

interface DebtKPICardsProps {
  deudaCorto: number;
  deudaLargo: number;
  deudaActivoPercentage: number;
}

export const DebtKPICards = ({ 
  deudaCorto, 
  deudaLargo, 
  deudaActivoPercentage 
}: DebtKPICardsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDebtVariant = (percentage: number) => {
    if (percentage > 60) return 'danger' as const;
    if (percentage > 40) return 'warning' as const;
    return 'success' as const;
  };

  const kpiData = [
    {
      title: 'Deuda CP',
      value: formatCurrency(deudaCorto),
      subtitle: 'Corto plazo',
      trend: 'neutral' as const,
      icon: Clock,
      variant: 'warning' as const
    },
    {
      title: 'Deuda LP',
      value: formatCurrency(deudaLargo),
      subtitle: 'Largo plazo',
      trend: 'neutral' as const,
      icon: Calendar,
      variant: 'default' as const
    },
    {
      title: 'Deuda/Activo',
      value: `${deudaActivoPercentage.toFixed(1)}%`,
      subtitle: 'Ratio endeudamiento',
      trend: deudaActivoPercentage > 50 ? 'down' as const : 'neutral' as const,
      trendValue: deudaActivoPercentage > 60 ? 'Alto' : deudaActivoPercentage > 40 ? 'Medio' : 'Bajo',
      icon: TrendingDown,
      variant: getDebtVariant(deudaActivoPercentage)
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {kpiData.map((kpi, index) => (
        <ModernKPICard key={index} {...kpi} />
      ))}
    </div>
  );
};