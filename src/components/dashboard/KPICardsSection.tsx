import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Percent, Activity, Building } from 'lucide-react';
import { usePeriodFilteredData } from '@/hooks/usePeriodFilteredData';
import { useCompany } from '@/contexts/CompanyContext';
import { NoDataAvailable } from '@/components/ui/no-data-available';

interface KPIData {
  title: string;
  value: string | number;
  unit: string;
  trend?: number;
  status: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<any>;
  description: string;
}

const KPICardsSectionComponent: React.FC = () => {
  const { selectedCompany } = useCompany();
  const { data: pygData, loading: pygLoading } = usePeriodFilteredData('pyg');
  const { data: balanceData, loading: balanceLoading } = usePeriodFilteredData('balance');
  const loading = pygLoading || balanceLoading;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Si no hay datos reales, mostrar mensaje informativo
  if (!selectedCompany || (!pygData.length && !balanceData.length)) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">
            Indicadores Clave de Rendimiento
          </h3>
          <Badge variant="outline">
            Sin datos disponibles
          </Badge>
        </div>
        <NoDataAvailable
          type="upload"
          title="No hay datos financieros"
          description={`No hay datos financieros cargados para ${selectedCompany?.name || 'esta empresa'}. Carga los estados financieros para ver los indicadores clave.`}
          actionText="Ir a Gestión de Datos"
          onAction={() => window.location.href = `/admin/empresas?companyId=${selectedCompany?.id}`}
        />
      </div>
    );
  }

  // Memoized data calculation
  const latestData = useMemo(() => {
    // Get latest data for KPIs
    const getLatestByYear = (data: any[], concept: string) => {
      if (!data.length) return null;
      
      // Group by year and get the latest record for the concept
      const conceptData = data.filter(item => 
        item.concept && item.concept.toLowerCase().includes(concept.toLowerCase())
      );
      
      if (!conceptData.length) return null;
      
      // Sort by year descending and get the latest
      return conceptData.sort((a, b) => b.period_year - a.period_year)[0];
    };

    return {
      revenue: getLatestByYear(pygData, 'importe neto'),
      ebitda: getLatestByYear(pygData, 'resultado de explotación'),
      netProfit: getLatestByYear(pygData, 'resultado del ejercicio'),
      currentAssets: getLatestByYear(balanceData, 'activo corriente'),
      currentLiabilities: getLatestByYear(balanceData, 'pasivo corriente'),
      totalAssets: getLatestByYear(balanceData, 'activo'),
      totalDebt: getLatestByYear(balanceData, 'pasivo')
    };
  }, [pygData, balanceData]);

  // Memoized KPIs calculation
  const currentKPIs = useMemo((): KPIData[] => [
    {
      title: 'Ingresos Totales',
      value: latestData.revenue 
        ? (latestData.revenue.amount / 1000000).toFixed(1)
        : 'N/A',
      unit: `M${selectedCompany?.currency_code || 'EUR'}`,
      status: 'good',
      icon: DollarSign,
      description: 'Facturación del último período'
    },
    {
      title: 'EBITDA',
      value: latestData.ebitda 
        ? (latestData.ebitda.amount / 1000000).toFixed(1)
        : 'N/A',
      unit: `M${selectedCompany?.currency_code || 'EUR'}`,
      status: latestData.ebitda?.amount > 0 ? 'good' : 'warning',
      icon: TrendingUp,
      description: 'Resultado operativo'
    },
    {
      title: 'Beneficio Neto',
      value: latestData.netProfit 
        ? (latestData.netProfit.amount / 1000).toFixed(0)
        : 'N/A',
      unit: `K${selectedCompany?.currency_code || 'EUR'}`,
      status: latestData.netProfit?.amount > 0 ? 'good' : 'warning',
      icon: Percent,
      description: 'Resultado final del ejercicio'
    },
    {
      title: 'Activo Total',
      value: latestData.totalAssets 
        ? (latestData.totalAssets.amount / 1000000).toFixed(1)
        : 'N/A',
      unit: `M${selectedCompany?.currency_code || 'EUR'}`,
      status: 'good',
      icon: Building,
      description: 'Total de recursos'
    },
    {
      title: 'Ratio Liquidez',
      value: latestData.currentAssets && latestData.currentLiabilities 
        ? (latestData.currentAssets.amount / latestData.currentLiabilities.amount).toFixed(2)
        : 'N/A',
      unit: 'x',
      status: latestData.currentAssets && latestData.currentLiabilities 
        ? (latestData.currentAssets.amount / latestData.currentLiabilities.amount) > 1.2 ? 'good' : 'warning'
        : 'good',
      icon: Activity,
      description: 'Activo corriente / Pasivo corriente'
    },
    {
      title: 'Fondo de Maniobra',
      value: latestData.currentAssets && latestData.currentLiabilities
        ? ((latestData.currentAssets.amount - latestData.currentLiabilities.amount) / 1000).toFixed(0)
        : 'N/A',
      unit: `K${selectedCompany?.currency_code || 'EUR'}`,
      status: latestData.currentAssets && latestData.currentLiabilities
        ? (latestData.currentAssets.amount - latestData.currentLiabilities.amount) > 0 ? 'good' : 'warning'
        : 'good',
      icon: DollarSign,
      description: 'Capital de trabajo disponible'
    }
  ], [latestData, selectedCompany?.currency_code]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">
          Indicadores Clave de Rendimiento
        </h3>
        <Badge variant="default" className="text-xs">
          📊 Datos de {selectedCompany?.name}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentKPIs.map((kpi, index) => {
          const IconComponent = kpi.icon;
          const hasData = kpi.value !== 'N/A';
          
          return (
            <Card key={index} className={`hover:shadow-lg transition-all duration-300 ${!hasData ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  </div>
                  {hasData && kpi.status === 'good' && (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      ✓
                    </Badge>
                  )}
                  {hasData && kpi.status === 'warning' && (
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                      ⚠
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{kpi.value}</span>
                    <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                  {!hasData && (
                    <p className="text-xs text-muted-foreground">Sin datos disponibles</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export const KPICardsSection = memo(KPICardsSectionComponent);