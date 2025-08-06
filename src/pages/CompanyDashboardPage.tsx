import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { KPICardsSection } from '@/components/dashboard/KPICardsSection';
import { EvolutionChartsSection } from '@/components/dashboard/EvolutionChartsSection';
import PhysicalUnitsKPICards from '@/components/PhysicalUnitsKPICards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Building2, 
  Calendar,
  FileText,
  BarChart3,
  PieChart,
  Target,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CompanyDashboardPage = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { companyInfo, loading, error } = useCompanyInfo(companyId);

  if (loading) {
    return (
      <div className="min-h-screen bg-light-gray-bg flex">
        <DashboardSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando información de la empresa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !companyInfo) {
    return (
      <div className="min-h-screen bg-light-gray-bg flex">
        <DashboardSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Empresa no encontrada</h2>
            <p className="text-muted-foreground mb-4">
              No se pudo cargar la información de la empresa solicitada.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-gray-bg flex">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header específico de la empresa */}
        <DashboardHeader companyInfo={companyInfo} loading={loading} />
        
        <div className="container mx-auto p-6 space-y-8">
          {/* Bienvenida específica de empresa */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-steel-blue-dark">
                Dashboard - {companyInfo.name}
              </h1>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Análisis Actualizado
              </Badge>
              {companyInfo.sector && (
                <Badge variant="secondary">
                  {companyInfo.sector}
                </Badge>
              )}
              <Badge variant="outline">
                {companyInfo.currency_code}
              </Badge>
            </div>
            <p className="text-professional text-lg">
              Análisis Financiero Integral y KPIs en Tiempo Real
            </p>
          </div>

          {/* Panel de KPIs específicos de la empresa */}
          <section className="space-y-6">
            {/* Panel de KPIs Principales */}
            <KPICardsSection />
            
            {/* Panel de KPIs de Unidades Físicas */}
            <PhysicalUnitsKPICards />
            
            {/* Gráficos de evolución */}
            <EvolutionChartsSection />
          </section>

          {/* Quick Actions específicas de empresa */}
          <section>
            <h3 className="text-xl font-semibold text-steel-blue-dark mb-6">
              Análisis Financiero - {companyInfo.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link to={`/cuenta-pyg?company=${companyId}`} className="block">
                <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6 text-center space-y-3">
                    <BarChart3 className="h-8 w-8 text-steel-blue mx-auto" />
                    <h3 className="font-semibold text-steel-blue-dark">Análisis P&G</h3>
                    <p className="text-sm text-professional">Cuenta de Pérdidas y Ganancias</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to={`/balance-situacion?company=${companyId}`} className="block">
                <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6 text-center space-y-3">
                    <PieChart className="h-8 w-8 text-steel-blue mx-auto" />
                    <h3 className="font-semibold text-steel-blue-dark">Balance</h3>
                    <p className="text-sm text-professional">Situación patrimonial</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to={`/ratios-financieros?company=${companyId}`} className="block">
                <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6 text-center space-y-3">
                    <Target className="h-8 w-8 text-steel-blue mx-auto" />
                    <h3 className="font-semibold text-steel-blue-dark">Ratios</h3>
                    <p className="text-sm text-professional">Análisis de ratios financieros</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>

          {/* Resumen de datos de la empresa */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-steel-blue-dark">
                <FileText className="h-5 w-5" />
                Información de la Empresa
              </CardTitle>
              <CardDescription>
                Datos básicos y configuración de {companyInfo.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p className="font-semibold">{companyInfo.name}</p>
                </div>
                
                {companyInfo.sector && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Sector</label>
                    <p className="font-semibold">{companyInfo.sector}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Moneda</label>
                  <p className="font-semibold">{companyInfo.currency_code}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navegación rápida */}
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard General
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboardPage;