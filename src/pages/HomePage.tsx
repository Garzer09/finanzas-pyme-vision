import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPICardsSection } from '@/components/dashboard/KPICardsSection';
import { EvolutionChartsSection } from '@/components/dashboard/EvolutionChartsSection';
import PhysicalUnitsKPICards from '@/components/PhysicalUnitsKPICards';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Settings,
  Clock,
  Activity,
  Calendar,
  Percent,
  Users,
  Building,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { user } = useAuth();
  const [realKPIs, setRealKPIs] = useState<any[]>([]);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRealData();
    }
  }, [user]);

  // Refrescar datos cuando la página regaina focus (útil tras upload)
  useEffect(() => {
    const handleFocus = () => {
      if (user && !loading) {
        fetchRealData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, loading]);

  const fetchRealData = async () => {
    try {
      // Fetch user KPIs
      const { data: kpisData } = await supabase
        .from('user_kpis')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('display_order');

      // Fetch recent files
      const { data: filesData } = await supabase
        .from('excel_files')
        .select('*')
        .eq('user_id', user?.id)
        .order('upload_date', { ascending: false })
        .limit(5);

      // Fetch recent financial data
      const { data: financialData } = await supabase
        .from('financial_data')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

       setRealKPIs(kpisData || []);
       setRecentFiles(filesData || demoFiles);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Demo data (fallback when no real data available)
  const healthScore = 72;
  const kpis = [
    {
      title: 'Cash Runway',
      value: '8.2',
      unit: 'meses',
      trend: 5.2,
      status: 'good',
      icon: Clock,
      description: 'Meses de supervivencia con cash actual'
    },
    {
      title: 'Burn Rate',
      value: '45.8',
      unit: 'K€/mes',
      trend: -2.1,
      status: 'good',
      icon: TrendingDown,
      description: 'Gasto operativo promedio mensual'
    },
    {
      title: 'Quick Ratio',
      value: '1.67',
      unit: '',
      trend: 8.3,
      status: 'good',
      icon: Activity,
      description: 'Ratio de liquidez inmediata'
    },
    {
      title: 'Días de Cobro',
      value: '42',
      unit: 'días',
      trend: -5.1,
      status: 'warning',
      icon: Calendar,
      description: 'Promedio días cobro a clientes'
    },
    {
      title: 'Margen EBITDA',
      value: '12.8',
      unit: '%',
      trend: 2.4,
      status: 'good',
      icon: Percent,
      description: '% sobre ventas'
    },
    {
      title: 'Revenue Growth',
      value: '18.5',
      unit: '% YoY',
      trend: 3.2,
      status: 'excellent',
      icon: TrendingUp,
      description: 'Crecimiento anual'
    }
  ];

  const demoFiles = [
    {
      id: '1',
      file_name: 'Estados_Financieros_2024.xlsx',
      upload_date: '2024-12-01T10:30:00Z',
      file_size: 1248576,
      processing_status: 'completed'
    },
    {
      id: '2',
      file_name: 'Balance_Q3_2024.xlsx',
      upload_date: '2024-11-15T14:22:00Z',
      file_size: 856432,
      processing_status: 'completed'
    },
    {
      id: '3',
      file_name: 'Cash_Flow_Proyecciones.xlsx',
      upload_date: '2024-11-08T09:15:00Z',
      file_size: 2104832,
      processing_status: 'processing'
    }
  ];

  const demoFinancialData = [
    {
      period: 'Q4 2024',
      revenue: 2840000,
      ebitda: 364200,
      netIncome: 185600,
      cashFlow: 245800
    },
    {
      period: 'Q3 2024',
      revenue: 2650000,
      ebitda: 318000,
      netIncome: 162400,
      cashFlow: 212300
    },
    {
      period: 'Q2 2024',
      revenue: 2420000,
      ebitda: 290400,
      netIncome: 148200,
      cashFlow: 198700
    }
  ];

  const alerts = [
    {
      type: 'critical',
      title: 'NOF aumentó 22% último mes',
      description: 'Revisar gestión de inventarios y cobros',
      action: 'Ver análisis NOF'
    },
    {
      type: 'warning',
      title: 'Concentración cliente 45%',
      description: 'Alto riesgo de dependencia comercial',
      action: 'Diversificar cartera'
    },
    {
      type: 'opportunity',
      title: 'DSCR permite financiación adicional',
      description: 'Capacidad para nuevas inversiones',
      action: 'Ver opciones'
    }
  ];

  const companies = [
    {
      name: 'TechSolutions SL',
      sector: 'Tecnología',
      lastUpdate: '2 días',
      revenue: '2.4M €',
      ebitda: '12.8%',
      liquidity: 1.67,
      status: 'good'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'opportunity': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-light-gray-bg flex">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-steel-blue-dark">
              ¡Bienvenido/a, {user?.user_metadata?.full_name || 'Usuario'}!
            </h1>
            <p className="text-professional text-lg">
              Resumen Ejecutivo - Dashboard FinSight Pro
            </p>
          </div>

          {/* Sección diferenciada por roles */}
          
          {/* Panel de KPIs - Solo para usuarios normales */}
          <RoleBasedAccess allowedRoles={['user']}>
            <section className="space-y-6">
              {/* Panel de KPIs Principales */}
              <KPICardsSection />
              
              {/* Panel de KPIs de Unidades Físicas */}
              <PhysicalUnitsKPICards />
              
              {/* Comentado temporalmente hasta resolver valores NaN en gráficos
              <EvolutionChartsSection />
              */}
            </section>
          </RoleBasedAccess>

          {/* Panel de Administración - Solo para administradores */}
          <RoleBasedAccess allowedRoles={['admin']}>
            <section className="space-y-6">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-steel-blue-dark">
                    <Users className="h-5 w-5" />
                    Panel de Administración
                  </CardTitle>
                  <CardDescription>
                    Gestión de usuarios y control del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/admin/users" className="block">
                      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-blue-200">
                        <CardContent className="p-6 text-center space-y-3">
                          <Users className="h-8 w-8 text-blue-600 mx-auto" />
                          <h3 className="font-semibold text-steel-blue-dark">Gestión de Usuarios</h3>
                          <p className="text-sm text-professional">Administrar usuarios y sus datos</p>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link to="/admin/settings" className="block">
                      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-green-200">
                        <CardContent className="p-6 text-center space-y-3">
                          <Settings className="h-8 w-8 text-green-600 mx-auto" />
                          <h3 className="font-semibold text-steel-blue-dark">Configuración</h3>
                          <p className="text-sm text-professional">Configuración del sistema</p>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link to="/files-dashboard" className="block">
                      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-purple-200">
                        <CardContent className="p-6 text-center space-y-3">
                          <FileText className="h-8 w-8 text-purple-600 mx-auto" />
                          <h3 className="font-semibold text-steel-blue-dark">Gestión de Archivos</h3>
                          <p className="text-sm text-professional">Control de datos financieros</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Resumen del Sistema para Admins */}
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-steel-blue-dark">
                    <Building className="h-5 w-5" />
                    Estado del Sistema
                  </CardTitle>
                  <CardDescription>
                    Métricas generales del sistema FinSight Pro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-sm text-blue-700">Usuarios Activos</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <Building className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">8</div>
                      <div className="text-sm text-green-700">Empresas Analizadas</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <FileText className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">47</div>
                      <div className="text-sm text-purple-700">Archivos Procesados</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-600">98%</div>
                      <div className="text-sm text-orange-700">Uptime Sistema</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </RoleBasedAccess>

          {/* Quick Actions */}
          <section>
            <h3 className="text-xl font-semibold text-steel-blue-dark mb-6">Acceso Rápido a Análisis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link to="/cuenta-pyg" className="block">
                <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6 text-center space-y-3">
                    <BarChart3 className="h-8 w-8 text-steel-blue mx-auto" />
                    <h3 className="font-semibold text-steel-blue-dark">Análisis P&G</h3>
                    <p className="text-sm text-professional">Cuenta de Pérdidas y Ganancias</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/balance-situacion" className="block">
                <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6 text-center space-y-3">
                    <PieChart className="h-8 w-8 text-steel-blue mx-auto" />
                    <h3 className="font-semibold text-steel-blue-dark">Balance</h3>
                    <p className="text-sm text-professional">Situación patrimonial</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/ratios-financieros" className="block">
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

          {/* Navegación a Secciones Principales */}
          <section>
            <h3 className="text-xl font-semibold text-steel-blue-dark mb-6">Secciones del Análisis Financiero</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center space-y-3">
                  <BarChart3 className="h-8 w-8 text-cadet-blue mx-auto" />
                  <h3 className="font-semibold text-steel-blue-dark">2. Descripción Empresa</h3>
                  <p className="text-sm text-professional">Información general y contexto</p>
                </CardContent>
              </Card>

              <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center space-y-3">
                  <LineChart className="h-8 w-8 text-steel-blue mx-auto" />
                  <h3 className="font-semibold text-steel-blue-dark">3. Situación Actual</h3>
                  <p className="text-sm text-professional">Estados financieros y análisis</p>
                </CardContent>
              </Card>

              <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center space-y-3">
                  <Settings className="h-8 w-8 text-cadet-blue mx-auto" />
                  <h3 className="font-semibold text-steel-blue-dark">4. Supuestos</h3>
                  <p className="text-sm text-professional">Premisas y plan de inversiones</p>
                </CardContent>
              </Card>

              <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center space-y-3">
                  <TrendingUp className="h-8 w-8 text-steel-blue mx-auto" />
                  <h3 className="font-semibold text-steel-blue-dark">5. Proyecciones</h3>
                  <p className="text-sm text-professional">Análisis prospectivo 1-3 años</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Alertas Inteligentes */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-steel-blue-dark">
                <AlertTriangle className="h-5 w-5" />
                Centro de Alertas Inteligentes
              </CardTitle>
              <CardDescription>Indicadores automáticos basados en el análisis de datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getAlertStyle(alert.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-steel-blue-dark">{alert.title}</h4>
                      <p className="text-sm text-professional">{alert.description}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      {alert.action}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;