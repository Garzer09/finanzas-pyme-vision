import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Percent, Calendar, Activity } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';

export const RealTimeKPICards: React.FC = () => {
  const { data, loading, getLatestData, calculateGrowth, getPeriodComparison } = useFinancialData();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="dashboard-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-light-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const ratiosData = getLatestData('ratios_financieros');
  const pygData = getLatestData('estado_pyg');
  const balanceData = getLatestData('balance_situacion');

  const kpis = [
    {
      title: 'Ratio Liquidez',
      value: ratiosData?.data_content?.liquidez?.ratio_corriente || 'N/A',
      unit: 'x',
      trend: calculateGrowth(
        getPeriodComparison('ratios_financieros')[0]?.data_content?.liquidez,
        getPeriodComparison('ratios_financieros')[1]?.data_content?.liquidez,
        'ratio_corriente'
      ),
      status: ratiosData?.data_content?.liquidez?.ratio_corriente > 1.5 ? 'good' : 'warning',
      icon: Activity,
      description: 'Capacidad de pago a corto plazo'
    },
    {
      title: 'ROE',
      value: ratiosData?.data_content?.rentabilidad?.roe || 'N/A',
      unit: '%',
      trend: calculateGrowth(
        getPeriodComparison('ratios_financieros')[0]?.data_content?.rentabilidad,
        getPeriodComparison('ratios_financieros')[1]?.data_content?.rentabilidad,
        'roe'
      ),
      status: (ratiosData?.data_content?.rentabilidad?.roe || 0) > 15 ? 'excellent' : 'good',
      icon: TrendingUp,
      description: 'Rentabilidad sobre recursos propios'
    },
    {
      title: 'Margen EBITDA',
      value: pygData?.data_content?.resultado_explotacion 
        ? ((pygData.data_content.resultado_explotacion / pygData.data_content.ingresos_explotacion) * 100).toFixed(1)
        : 'N/A',
      unit: '%',
      trend: 2.4,
      status: 'good',
      icon: Percent,
      description: '% sobre ventas'
    },
    {
      title: 'Endeudamiento',
      value: ratiosData?.data_content?.endeudamiento?.ratio_endeudamiento || 'N/A',
      unit: '%',
      trend: calculateGrowth(
        getPeriodComparison('ratios_financieros')[0]?.data_content?.endeudamiento,
        getPeriodComparison('ratios_financieros')[1]?.data_content?.endeudamiento,
        'ratio_endeudamiento'
      ),
      status: (ratiosData?.data_content?.endeudamiento?.ratio_endeudamiento || 0) < 40 ? 'good' : 'warning',
      icon: DollarSign,
      description: 'Nivel de apalancamiento'
    },
    {
      title: 'Activo Total',
      value: balanceData?.data_content?.activo_total 
        ? (balanceData.data_content.activo_total / 1000000).toFixed(1)
        : 'N/A',
      unit: 'M€',
      trend: calculateGrowth(
        getPeriodComparison('balance_situacion')[0]?.data_content,
        getPeriodComparison('balance_situacion')[1]?.data_content,
        'activo_total'
      ),
      status: 'good',
      icon: TrendingUp,
      description: 'Total de activos'
    },
    {
      title: 'Resultado Neto',
      value: pygData?.data_content?.resultado_neto 
        ? (pygData.data_content.resultado_neto / 1000).toFixed(0)
        : 'N/A',
      unit: 'K€',
      trend: calculateGrowth(
        getPeriodComparison('estado_pyg')[0]?.data_content,
        getPeriodComparison('estado_pyg')[1]?.data_content,
        'resultado_neto'
      ),
      status: (pygData?.data_content?.resultado_neto || 0) > 0 ? 'good' : 'warning',
      icon: TrendingUp,
      description: 'Beneficio del período'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpis.map((kpi, index) => {
        const IconComponent = kpi.icon;
        const hasRealData = kpi.value !== 'N/A';
        
        return (
          <Card key={index} className={`dashboard-card hover:shadow-lg transition-all duration-300 ${!hasRealData ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5 text-steel-blue" />
                  <CardTitle className="text-sm font-medium text-steel-blue-dark">{kpi.title}</CardTitle>
                </div>
                {hasRealData && (
                  <Badge variant={kpi.trend > 0 ? 'default' : 'secondary'} className="text-xs">
                    {kpi.trend > 0 ? '+' : ''}{kpi.trend.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-steel-blue-dark">{kpi.value}</span>
                  <span className="text-sm text-professional">{kpi.unit}</span>
                </div>
                <p className="text-xs text-professional">{kpi.description}</p>
                {hasRealData && (
                  <div className="flex items-center gap-1">
                    {kpi.trend > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${kpi.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(kpi.trend).toFixed(1)}% vs anterior
                    </span>
                  </div>
                )}
                {!hasRealData && (
                  <p className="text-xs text-steel-blue-light">Sube archivos para ver datos reales</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};