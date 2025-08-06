import React from 'react';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { NoDataIndicator } from '@/components/ui/no-data-indicator';
import { DollarSign, TrendingUp, Activity, BarChart3, Percent, Building2 } from 'lucide-react';

interface FinancialData {
  revenue: number;
  ebitda: number;
  net_income: number;
  total_assets: number;
  total_equity: number;
  total_debt: number;
}

interface FinancialKPISectionProps {
  financialData: FinancialData | null;
  currencyCode: string;
  period: string;
}

export const FinancialKPISection: React.FC<FinancialKPISectionProps> = ({
  financialData,
  currencyCode,
  period
}) => {
  if (!financialData) {
    return (
      <NoDataIndicator
        title="No hay datos financieros disponibles"
        description="Sube las plantillas de Balance y Cuenta de Resultados para ver los KPIs financieros."
        variant="detailed"
        actionLabel="Subir datos financieros"
      />
    );
  }

  // Debug log to verify we're getting real data
  console.log('FinancialKPISection - Real data:', {
    revenue: financialData.revenue,
    ebitda: financialData.ebitda,
    net_income: financialData.net_income,
    total_assets: financialData.total_assets,
    total_equity: financialData.total_equity,
    total_debt: financialData.total_debt,
    period
  });

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  const kpis = [
    {
      title: 'Ingresos',
      value: formatCurrency(financialData.revenue),
      subtitle: `${currencyCode} • ${period}`,
      icon: DollarSign,
      variant: 'default' as const,
      trend: 'neutral' as const
    },
    {
      title: 'EBITDA',
      value: formatCurrency(financialData.ebitda),
      subtitle: `${currencyCode} • ${period}`,
      icon: TrendingUp,
      variant: financialData.ebitda > 0 ? ('success' as const) : ('warning' as const),
      trend: financialData.ebitda > 0 ? ('up' as const) : ('down' as const)
    },
    {
      title: 'Margen EBITDA',
      value: financialData.revenue > 0 ? 
        `${((financialData.ebitda / financialData.revenue) * 100).toFixed(1)}` : '0.0',
      subtitle: `% • ${period}`,
      icon: Percent,
      variant: ((financialData.ebitda / financialData.revenue) * 100) > 15 ? ('success' as const) : ('warning' as const),
      trend: 'neutral' as const
    },
    {
      title: 'Resultado Neto',
      value: formatCurrency(financialData.net_income),
      subtitle: `${currencyCode} • ${period}`,
      icon: Activity,
      variant: financialData.net_income > 0 ? ('success' as const) : ('danger' as const),
      trend: financialData.net_income > 0 ? ('up' as const) : ('down' as const)
    },
    {
      title: 'ROE',
      value: financialData.total_equity > 0 ? 
        `${((financialData.net_income / financialData.total_equity) * 100).toFixed(1)}` : '0.0',
      subtitle: `% • ${period}`,
      icon: BarChart3,
      variant: ((financialData.net_income / financialData.total_equity) * 100) > 10 ? ('success' as const) : ('warning' as const),
      trend: 'neutral' as const
    },
    {
      title: 'Ratio Endeudamiento',
      value: financialData.total_assets > 0 ? 
        `${((financialData.total_debt / financialData.total_assets) * 100).toFixed(1)}` : '0.0',
      subtitle: `% • ${period}`,
      icon: Building2,
      variant: ((financialData.total_debt / financialData.total_assets) * 100) < 60 ? ('success' as const) : ('warning' as const),
      trend: 'neutral' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpis.map((kpi, index) => (
        <ModernKPICard
          key={index}
          title={kpi.title}
          value={kpi.value}
          subtitle={kpi.subtitle}
          icon={kpi.icon}
          variant={kpi.variant}
          trend={kpi.trend}
        />
      ))}
    </div>
  );
};