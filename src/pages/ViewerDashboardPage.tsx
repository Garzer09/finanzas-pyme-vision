import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft, BarChart3, TrendingUp, PieChart, DollarSign, Percent, Target, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/DashboardHeader';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useCompanyContext } from '@/contexts/CompanyContext';

interface Company {
  id: string;
  name: string;
  currency_code: string;
  sector?: string;
}

interface KPIData {
  title: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  icon: any;
  variant: 'success' | 'warning' | 'danger' | 'default';
}

const ViewerDashboardPage = () => {
  const params = useParams();
  const companyId = params.companyId;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { companyId: contextCompanyId } = useCompanyContext();
  
  // Use financial data hooks to get real KPIs
  const effectiveCompanyId = companyId || contextCompanyId;
  const { data: pygData, hasRealData: hasPygData } = useFinancialData('estado_pyg', effectiveCompanyId);
  const { data: balanceData, hasRealData: hasBalanceData } = useFinancialData('balance_situacion', effectiveCompanyId);
  const { data: ratiosData, hasRealData: hasRatiosData } = useFinancialData('ratios_financieros', effectiveCompanyId);

  const verifyAccess = async () => {
    if (!user || !companyId) {
      navigate('/app/mis-empresas');
      return;
    }

    try {
      setLoading(true);

      // Verify user has membership to this company
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (membershipError || !membership) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para acceder a esta empresa",
          variant: "destructive"
        });
        navigate('/app/mis-empresas');
        return;
      }

      setHasAccess(true);

      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, currency_code, sector')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      setCompany(companyData);

    } catch (error) {
      console.error('Error verifying access:', error);
      toast({
        title: "Error",
        description: "Error al verificar el acceso a la empresa",
        variant: "destructive"
      });
      navigate('/app/mis-empresas');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get latest data from a dataset
  const getLatestData = (dataType: string) => {
    const dataset = dataType === 'estado_pyg' ? pygData : 
                   dataType === 'balance_situacion' ? balanceData :
                   dataType === 'ratios_financieros' ? ratiosData : [];
    
    if (!dataset || dataset.length === 0) return null;
    
    // Sort by period_date descending and get the latest
    const sorted = [...dataset].sort((a: any, b: any) => {
      const aTime = new Date(a.period_date).getTime();
      const bTime = new Date(b.period_date).getTime();
      return bTime - aTime;
    });
    return sorted[0];
  };

  // Helper function to calculate KPIs from real data
  const getKPIData = (): KPIData[] => {
    const formatCurrency = (value: number) => {
      if (value >= 1000000) {
        return `€${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `€${(value / 1000).toFixed(0)}K`;
      } else {
        return `€${value.toFixed(0)}`;
      }
    };

    const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

    // Get latest data
    const latestPyg = getLatestData('estado_pyg');
    const latestBalance = getLatestData('balance_situacion');
    const latestRatios = getLatestData('ratios_financieros');

    // Default fallback KPIs
    const defaultKPIs: KPIData[] = [
      {
        title: 'Facturación',
        value: 'Sin datos',
        subtitle: 'Carga estados financieros',
        trend: 'neutral',
        trendValue: '0%',
        icon: DollarSign,
        variant: 'default'
      },
      {
        title: 'Margen EBITDA',
        value: 'Sin datos',
        subtitle: 'Carga estados financieros',
        trend: 'neutral',
        trendValue: '0%',
        icon: Percent,
        variant: 'default'
      },
      {
        title: 'Ratio Liquidez',
        value: 'Sin datos',
        subtitle: 'Carga estados financieros',
        trend: 'neutral',
        trendValue: '0%',
        icon: Target,
        variant: 'default'
      },
      {
        title: 'Solvencia',
        value: 'Sin datos',
        subtitle: 'Carga estados financieros',
        trend: 'neutral',
        trendValue: '0%',
        icon: TrendingUp,
        variant: 'default'
      }
    ];

    // If no real data, return defaults
    if (!latestPyg && !latestBalance && !latestRatios) {
      return defaultKPIs;
    }

    // Extract values from real data
    const pygContent = latestPyg?.data_content || {};
    const balanceContent = latestBalance?.data_content || {};
    const ratiosContent = latestRatios?.data_content || {};

    // Helper to find value by multiple possible keys
    const findValue = (content: any, keys: string[]) => {
      for (const key of keys) {
        const value = content[key] || content[key.toLowerCase()] || content[key.replace(/_/g, ' ')];
        if (value !== undefined && value !== null) {
          return Number(value) || 0;
        }
      }
      return 0;
    };

    // Calculate KPIs from real data
    const revenue = findValue(pygContent, ['importe_neto_cifra_negocios', 'ventas', 'ingresos', 'facturacion']);
    const ebitda = findValue(pygContent, ['ebitda', 'resultado_bruto_explotacion']);
    const netIncome = findValue(pygContent, ['resultado_neto', 'beneficio_neto', 'resultado_del_ejercicio']);
    
    const totalAssets = findValue(balanceContent, ['activo_total', 'total_activo']);
    const currentAssets = findValue(balanceContent, ['activo_corriente', 'activo_circulante']);
    const currentLiabilities = findValue(balanceContent, ['pasivo_corriente', 'pasivo_circulante']);
    const totalDebt = findValue(balanceContent, ['deudas_totales', 'pasivo_total']);
    
    const liquidityRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const solvencyRatio = totalDebt > 0 ? totalAssets / totalDebt : 0;
    const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

    return [
      {
        title: 'Facturación',
        value: revenue > 0 ? formatCurrency(revenue) : 'Sin datos',
        subtitle: revenue > 0 ? `Margen neto: ${formatPercentage(netMargin)}` : 'Carga P&G',
        trend: netMargin > 10 ? 'up' : netMargin > 0 ? 'neutral' : 'down',
        trendValue: revenue > 0 ? `${formatPercentage(netMargin)}` : '0%',
        icon: DollarSign,
        variant: revenue > 0 ? 'success' : 'default'
      },
      {
        title: 'Margen EBITDA',
        value: ebitda > 0 ? formatPercentage(ebitdaMargin) : 'Sin datos',
        subtitle: ebitda > 0 ? formatCurrency(ebitda) : 'Carga P&G',
        trend: ebitdaMargin > 15 ? 'up' : ebitdaMargin > 5 ? 'neutral' : 'down',
        trendValue: ebitda > 0 ? `${formatPercentage(ebitdaMargin)}` : '0%',
        icon: Percent,
        variant: ebitdaMargin > 5 ? 'success' : ebitdaMargin > 0 ? 'warning' : 'default'
      },
      {
        title: 'Ratio Liquidez',
        value: liquidityRatio > 0 ? liquidityRatio.toFixed(2) : 'Sin datos',
        subtitle: liquidityRatio > 0 ? 'Activo/Pasivo corriente' : 'Carga Balance',
        trend: liquidityRatio > 1.5 ? 'up' : liquidityRatio > 1 ? 'neutral' : 'down',
        trendValue: liquidityRatio > 0 ? `${liquidityRatio.toFixed(2)}x` : '0x',
        icon: Target,
        variant: liquidityRatio > 1.2 ? 'success' : liquidityRatio > 1 ? 'warning' : liquidityRatio > 0 ? 'danger' : 'default'
      },
      {
        title: 'Solvencia',
        value: solvencyRatio > 0 ? solvencyRatio.toFixed(2) : 'Sin datos',
        subtitle: solvencyRatio > 0 ? 'Activo/Pasivo total' : 'Carga Balance',
        trend: solvencyRatio > 2 ? 'up' : solvencyRatio > 1.5 ? 'neutral' : 'down',
        trendValue: solvencyRatio > 0 ? `${solvencyRatio.toFixed(2)}x` : '0x',
        icon: TrendingUp,
        variant: solvencyRatio > 1.8 ? 'success' : solvencyRatio > 1.2 ? 'warning' : solvencyRatio > 0 ? 'danger' : 'default'
      }
    ];
  };

  useEffect(() => {
    verifyAccess();
  }, [user, companyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!hasAccess || !company) {
    return null; // Redirect already handled
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/mis-empresas')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Empresas
          </Button>
        </div>

        {/* Company Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
          </div>
          <p className="text-muted-foreground">
            Dashboard financiero - {company.currency_code}
            {company.sector && ` • ${company.sector}`}
          </p>
        </div>

        {/* KPIs Financieros Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getKPIData().map((kpi, index) => (
            <ModernKPICard key={index} {...kpi} />
          ))}
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/app/${companyId}/cuenta-pyg`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Estados Financieros</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Consulta balance, cuenta de PyG y flujos de caja
              </p>
              <Button variant="outline" className="w-full">
                Ver Estados
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/app/${companyId}/ratios-financieros`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">Análisis de Ratios</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Ratios de liquidez, solvencia y rentabilidad
              </p>
              <Button variant="outline" className="w-full">
                Ver Ratios
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/app/${companyId}/proyecciones`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PieChart className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Proyecciones</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Escenarios futuros y análisis de sensibilidad
              </p>
              <Button variant="outline" className="w-full">
                Ver Proyecciones
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Note */}
        <Card className={`${(hasPygData || hasBalanceData || hasRatiosData) ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className={`p-1 rounded ${(hasPygData || hasBalanceData || hasRatiosData) ? 'bg-green-100' : 'bg-amber-100'}`}>
                {(hasPygData || hasBalanceData || hasRatiosData) ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
              </div>
              <div>
                <h3 className={`font-semibold mb-1 ${(hasPygData || hasBalanceData || hasRatiosData) ? 'text-green-900' : 'text-amber-900'}`}>
                  {(hasPygData || hasBalanceData || hasRatiosData) ? 'Datos Disponibles' : 'Datos Pendientes'}
                </h3>
                <p className={`text-sm ${(hasPygData || hasBalanceData || hasRatiosData) ? 'text-green-700' : 'text-amber-700'}`}>
                  {(hasPygData || hasBalanceData || hasRatiosData) 
                    ? `Dashboard con datos reales de ${company.name}. Los KPIs mostrados se calculan desde tus estados financieros cargados.`
                    : `Para ver KPIs reales de ${company.name}, sube los estados financieros desde el panel de administración.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ViewerDashboardPage;