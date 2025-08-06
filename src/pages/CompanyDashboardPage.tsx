import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft, BarChart3, TrendingUp, PieChart, Upload, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Badge } from '@/components/ui/badge';

interface Company {
  id: string;
  name: string;
  currency_code: string;
  sector?: string;
  accounting_standard?: string;
}

interface DataCoverage {
  pyg_years: string[];
  balance_years: string[];
  totalRecords: number;
}

const CompanyDashboardPage = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [dataCoverage, setDataCoverage] = useState<DataCoverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { toast } = useToast();

  const verifyAccessAndLoadData = async () => {
    if (!user || !companyId) {
      navigate('/app/mis-empresas');
      return;
    }

    try {
      setLoading(true);

      // Admin users have access to all companies
      if (userRole === 'admin') {
        setHasAccess(true);
      } else {
        // Regular users need membership verification
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
      }

      // Load company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Load data coverage
      const [pygData, balanceData] = await Promise.all([
        supabase
          .from('fs_pyg_lines')
          .select('period_year')
          .eq('company_id', companyId),
        supabase
          .from('fs_balance_lines')
          .select('period_year')
          .eq('company_id', companyId)
      ]);

      const pygYears = [...new Set(pygData.data?.map(d => d.period_year.toString()) || [])];
      const balanceYears = [...new Set(balanceData.data?.map(d => d.period_year.toString()) || [])];
      
      setDataCoverage({
        pyg_years: pygYears.sort(),
        balance_years: balanceYears.sort(),
        totalRecords: (pygData.data?.length || 0) + (balanceData.data?.length || 0)
      });

    } catch (error) {
      console.error('Error loading company data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos de la empresa",
        variant: "destructive"
      });
      navigate('/app/mis-empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyAccessAndLoadData();
  }, [user, companyId]);

  const handleNavigateToModule = (module: string) => {
    // Navigate to the specific module with company context
    navigate(`/dashboard/company/${companyId}${module}`);
  };

  const handleManageData = () => {
    // Navigate to admin data management for this company
    navigate(`/admin/empresas?companyId=${companyId}`);
  };

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

  const formatDataRange = (years: string[]) => {
    if (years.length === 0) return 'Sin datos';
    if (years.length === 1) return years[0];
    return `${years[0]} - ${years[years.length - 1]}`;
  };

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{company.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline">{company.currency_code}</Badge>
                  {company.sector && <Badge variant="secondary">{company.sector}</Badge>}
                  {company.accounting_standard && (
                    <Badge variant="outline">{company.accounting_standard}</Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Button variant="outline" onClick={handleManageData} className="gap-2">
              <Settings className="h-4 w-4" />
              Gestionar Datos
            </Button>
          </div>
        </div>

        {/* Data Coverage Summary */}
        {dataCoverage && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Cobertura de Datos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Cuenta P&G:</span>
                  <span className="ml-2 text-muted-foreground">
                    {formatDataRange(dataCoverage.pyg_years)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Balance:</span>
                  <span className="ml-2 text-muted-foreground">
                    {formatDataRange(dataCoverage.balance_years)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Total registros:</span>
                  <span className="ml-2 text-muted-foreground">
                    {dataCoverage.totalRecords.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Module Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigateToModule('/cuenta-pyg')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Cuenta P&G</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Analiza la cuenta de pérdidas y ganancias
              </p>
              <Badge variant="outline" className="text-xs">
                {dataCoverage?.pyg_years.length || 0} años disponibles
              </Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigateToModule('/balance-situacion')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">Balance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Consulta el balance de situación
              </p>
              <Badge variant="outline" className="text-xs">
                {dataCoverage?.balance_years.length || 0} años disponibles
              </Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigateToModule('/ratios-financieros')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PieChart className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Ratios Financieros</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Análisis de ratios de liquidez, solvencia y rentabilidad
              </p>
              <Badge variant="outline" className="text-xs">
                Análisis automático
              </Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigateToModule('/flujos-caja')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Flujos de Caja</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Estado de flujos de efectivo
              </p>
              <Badge variant="outline" className="text-xs">
                Análisis de liquidez
              </Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigateToModule('/endeudamiento')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle className="text-lg">Análisis de Deuda</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Estructura y servicio de deuda
              </p>
              <Badge variant="outline" className="text-xs">
                Solvencia y apalancamiento
              </Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigateToModule('/proyecciones')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <PieChart className="h-5 w-5 text-indigo-600" />
                </div>
                <CardTitle className="text-lg">Proyecciones</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Escenarios futuros y análisis de sensibilidad
              </p>
              <Badge variant="outline" className="text-xs">
                Modelado financiero
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Information Note */}
        {dataCoverage && dataCoverage.totalRecords === 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded">
                  <Upload className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Sin datos financieros
                  </h3>
                  <p className="text-sm text-blue-700">
                    Esta empresa no tiene datos financieros cargados. Contacta con el administrador 
                    para cargar los estados financieros de {company.name}.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default CompanyDashboardPage;