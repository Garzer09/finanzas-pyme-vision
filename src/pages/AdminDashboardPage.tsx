import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, History, BarChart3, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { FinancialKPISection } from '@/components/dashboard/FinancialKPISection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  currency_code: string;
}

interface FinancialData {
  revenue: number;
  ebitda: number;
  net_income: number;
  total_assets: number;
  total_equity: number;
  total_debt: number;
}

interface KPI {
  name: string;
  value: number;
  unit: string;
  period: string;
  trend?: number;
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const companyId = searchParams.get('companyId');
  const periodParam = searchParams.get('period');
  
  const [company, setCompany] = useState<Company | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(periodParam || '');
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      loadCompanyAndData();
    }
  }, [companyId, selectedPeriod]);

  const loadCompanyAndData = async () => {
    if (!companyId) return;

    try {
      // Load company info
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, currency_code')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Load available periods
      const { data: periodData, error: periodError } = await supabase
        .from('fs_pyg_lines')
        .select('period_year, period_quarter, period_month, period_type')
        .eq('company_id', companyId)
        .order('period_year', { ascending: false });

      if (periodError) throw periodError;

      const periods = [...new Set(periodData?.map(p => {
        if (p.period_type === 'annual') return `${p.period_year}`;
        if (p.period_type === 'quarterly') return `T${p.period_quarter}/${p.period_year}`;
        if (p.period_type === 'monthly') {
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          return `${monthNames[p.period_month - 1]}/${p.period_year}`;
        }
        return `${p.period_year}`;
      }) || [])];

      setAvailablePeriods(periods);
      if (!selectedPeriod && periods.length > 0) {
        setSelectedPeriod(periods[0]);
      }

      // Load financial data for selected period
      if (selectedPeriod) {
        await loadFinancialData(companyData, selectedPeriod);
      } else if (periods.length === 0) {
        // No data available
        setFinancialData(null);
        setKpis([]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialData = async (companyData: Company, period: string) => {
    try {
      // Parse period to get year, quarter, month
      let year: number;
      let quarter: number | null = null;
      let month: number | null = null;

      if (period.includes('T')) {
        // Quarterly: "T1/2024"
        const [q, y] = period.split('/');
        year = parseInt(y);
        quarter = parseInt(q.replace('T', ''));
      } else if (period.includes('/') && period.length > 4) {
        // Monthly: "Ene/2024"
        const [monthName, y] = period.split('/');
        year = parseInt(y);
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        month = monthNames.indexOf(monthName) + 1;
      } else {
        // Annual: "2024"
        year = parseInt(period);
      }

      // Load P&L data
      let pygQuery = supabase
        .from('fs_pyg_lines')
        .select('concept, amount')
        .eq('company_id', companyData.id)
        .eq('period_year', year);

      if (quarter) pygQuery = pygQuery.eq('period_quarter', quarter);
      if (month) pygQuery = pygQuery.eq('period_month', month);

      const { data: pygData, error: pygError } = await pygQuery;
      if (pygError) throw pygError;

      // Load Balance data
      let balanceQuery = supabase
        .from('fs_balance_lines')
        .select('concept, amount')
        .eq('company_id', companyData.id)
        .eq('period_year', year);

      if (quarter) balanceQuery = balanceQuery.eq('period_quarter', quarter);
      if (month) balanceQuery = balanceQuery.eq('period_month', month);

      const { data: balanceData, error: balanceError } = await balanceQuery;
      if (balanceError) throw balanceError;

      // Process financial data
      const pygMap = new Map(pygData?.map(item => [item.concept, item.amount]) || []);
      const balanceMap = new Map(balanceData?.map(item => [item.concept, item.amount]) || []);

      const revenue = pygMap.get('Cifra de negocios') || 0;
      const financialCosts = pygMap.get('Gastos financieros') || 0;
      const ebitda = revenue - (pygMap.get('Gastos de personal') || 0) - (pygMap.get('Otros gastos de explotación') || 0);
      const netIncome = pygMap.get('Resultado del ejercicio') || 0;
      
      const totalAssets = balanceMap.get('TOTAL ACTIVO') || 0;
      const totalEquity = balanceMap.get('TOTAL PATRIMONIO NETO') || 0;
      const totalDebt = balanceMap.get('TOTAL PASIVO') || 0;

      setFinancialData({
        revenue,
        ebitda,
        net_income: netIncome,
        total_assets: totalAssets,
        total_equity: totalEquity,
        total_debt: totalDebt
      });

      // Calculate KPIs
      const calculatedKPIs: KPI[] = [
        {
          name: 'Ingresos',
          value: revenue,
          unit: companyData.currency_code,
          period: period
        },
        {
          name: 'EBITDA',
          value: ebitda,
          unit: companyData.currency_code,
          period: period
        },
        {
          name: 'Margen EBITDA',
          value: revenue > 0 ? (ebitda / revenue) * 100 : 0,
          unit: '%',
          period: period
        },
        {
          name: 'ROE',
          value: totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0,
          unit: '%',
          period: period
        },
        {
          name: 'ROA',
          value: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
          unit: '%',
          period: period
        },
        {
          name: 'Ratio de Endeudamiento',
          value: totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0,
          unit: '%',
          period: period
        }
      ];

      setKpis(calculatedKPIs);

    } catch (error) {
      console.error('Error loading financial data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos financieros",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (!companyId) {
    return (
      <RoleBasedAccess allowedRoles={['admin']}>
        <div className="flex h-screen bg-background">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto text-center py-12">
                <h1 className="text-2xl font-bold text-foreground">ID de empresa no especificado</h1>
                <p className="text-muted-foreground mt-2">
                  Selecciona una empresa desde la página de empresas
                </p>
                <Button onClick={() => navigate('/admin/empresas')} className="mt-4">
                  Volver a Empresas
                </Button>
              </div>
            </main>
          </div>
        </div>
      </RoleBasedAccess>
    );
  }

  if (loading) {
    return (
      <RoleBasedAccess allowedRoles={['admin']}>
        <div className="flex h-screen bg-background">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-auto p-6">
              <div className="max-w-6xl mx-auto">
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Cargando dashboard...</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </RoleBasedAccess>
    );
  }

  return (
    <RoleBasedAccess allowedRoles={['admin']}>
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/admin/empresas')}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      Dashboard Financiero
                    </h1>
                    <p className="text-muted-foreground">
                      {company?.name || 'Empresa no encontrada'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePeriods.map(period => (
                        <SelectItem key={period} value={period}>
                          {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/admin/carga-plantillas?companyId=${companyId}`)}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Cargar Datos
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/admin/cargas?companyId=${companyId}`)}
                    className="gap-2"
                  >
                    <History className="h-4 w-4" />
                    Histórico
                  </Button>
                </div>
              </div>

              {/* KPI Cards with Modern Design */}
              {financialData ? (
                <FinancialKPISection 
                  financialData={financialData}
                  currencyCode={company?.currency_code || 'EUR'}
                  period={selectedPeriod}
                />
              ) : (
                <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25">
                  <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay datos financieros disponibles</h3>
                  <p className="text-muted-foreground mb-4">
                    Carga los archivos financieros para ver los KPIs de la empresa
                  </p>
                  <Button 
                    onClick={() => navigate(`/admin/carga-plantillas?companyId=${companyId}`)}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Cargar Datos
                  </Button>
                </div>
              )}

              {/* Financial Summary */}
              {financialData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Resumen Financiero - {selectedPeriod}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">CUENTA DE RESULTADOS</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Ingresos:</span>
                            <span className="font-medium">
                              {formatCurrency(financialData.revenue, company?.currency_code || 'EUR')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>EBITDA:</span>
                            <span className="font-medium">
                              {formatCurrency(financialData.ebitda, company?.currency_code || 'EUR')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Resultado Neto:</span>
                            <span className="font-medium">
                              {formatCurrency(financialData.net_income, company?.currency_code || 'EUR')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">BALANCE</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Activo Total:</span>
                            <span className="font-medium">
                              {formatCurrency(financialData.total_assets, company?.currency_code || 'EUR')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Patrimonio Neto:</span>
                            <span className="font-medium">
                              {formatCurrency(financialData.total_equity, company?.currency_code || 'EUR')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pasivo Total:</span>
                            <span className="font-medium">
                              {formatCurrency(financialData.total_debt, company?.currency_code || 'EUR')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">RATIOS PRINCIPALES</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Margen EBITDA:</span>
                            <span className="font-medium">
                              {formatPercentage(financialData.revenue > 0 ? (financialData.ebitda / financialData.revenue) * 100 : 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>ROE:</span>
                            <span className="font-medium">
                              {formatPercentage(financialData.total_equity > 0 ? (financialData.net_income / financialData.total_equity) * 100 : 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ratio Endeudamiento:</span>
                            <span className="font-medium">
                              {formatPercentage(financialData.total_assets > 0 ? (financialData.total_debt / financialData.total_assets) * 100 : 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Data Message */}
              {!financialData && !loading && (
                <Card className="text-center py-12">
                  <CardContent className="space-y-4">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">No hay datos financieros</h3>
                      <p className="text-muted-foreground">
                        Carga datos financieros para ver el dashboard de esta empresa
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate(`/admin/carga-plantillas?companyId=${companyId}`)}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Cargar Plantillas CSV
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleBasedAccess>
  );
};

export default AdminDashboardPage;