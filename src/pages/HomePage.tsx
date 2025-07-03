import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gauge } from '@/components/ui/gauge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Percent, 
  Calendar,
  Users,
  Building,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Zap,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { user } = useAuth();

  // Demo data
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
    <div className="min-h-screen bg-light-gray-bg">
      <DashboardHeader />
      
      <div className="container mx-auto p-6 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-steel-blue-dark">
            ¡Bienvenido/a, {user?.user_metadata?.full_name || 'Usuario'}!
          </h1>
          <p className="text-professional text-lg">
            Dashboard principal de análisis financiero para {user?.user_metadata?.company_name || 'tu empresa'}
          </p>
        </div>

        {/* Health Score */}
        <Card className="dashboard-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-steel-blue-dark">Salud Financiera Global</CardTitle>
            <CardDescription>Score integral basado en liquidez, rentabilidad, solvencia y eficiencia</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto relative">
                <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="hsl(220 13% 91%)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="hsl(210 44% 45%)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(healthScore / 100) * 314} 314`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-steel-blue">{healthScore}</div>
                    <div className="text-xs text-professional">/ 100</div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-professional">Saludable</div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpis.map((kpi, index) => {
            const IconComponent = kpi.icon;
            return (
              <Card key={index} className="dashboard-card hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-steel-blue" />
                      <CardTitle className="text-sm font-medium text-steel-blue-dark">{kpi.title}</CardTitle>
                    </div>
                    <Badge variant={kpi.trend > 0 ? 'default' : 'secondary'} className="text-xs">
                      {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-steel-blue-dark">{kpi.value}</span>
                      <span className="text-sm text-professional">{kpi.unit}</span>
                    </div>
                    <p className="text-xs text-professional">{kpi.description}</p>
                    <div className="flex items-center gap-1">
                      {kpi.trend > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`text-xs ${kpi.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.abs(kpi.trend)}% vs anterior
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Alerts Panel */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-steel-blue-dark">
              <AlertTriangle className="h-5 w-5" />
              Centro de Alertas Inteligentes
            </CardTitle>
            <CardDescription>Alertas automáticas basadas en tus datos financieros</CardDescription>
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

        {/* Companies/Projects */}
        <Card className="dashboard-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-steel-blue-dark">
                  <Building className="h-5 w-5" />
                  Empresas Analizadas
                </CardTitle>
                <CardDescription>Gestiona y analiza múltiples empresas</CardDescription>
              </div>
              <Button>
                <span className="mr-2">+</span>
                Nueva Empresa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {companies.map((company, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-light-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-steel-blue-light rounded-lg flex items-center justify-center">
                          <span className="font-semibold text-steel-blue">{company.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-steel-blue-dark">{company.name}</h3>
                          <p className="text-sm text-professional">{company.sector}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span>Facturación: <strong>{company.revenue}</strong></span>
                        <span>EBITDA: <strong>{company.ebitda}</strong></span>
                        <span>Liquidez: <strong>{company.liquidity}x</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-professional">Act. {company.lastUpdate}</span>
                      <Link to="/" className="inline-block">
                        <Button variant="outline" size="sm">Ver Análisis</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/" className="block">
            <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center space-y-3">
                <BarChart3 className="h-8 w-8 text-steel-blue mx-auto" />
                <h3 className="font-semibold text-steel-blue-dark">Dashboard Completo</h3>
                <p className="text-sm text-professional">Accede al análisis financiero completo</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardContent className="p-6 text-center space-y-3">
              <PieChart className="h-8 w-8 text-steel-blue mx-auto" />
              <h3 className="font-semibold text-steel-blue-dark">Nuevo Análisis</h3>
              <p className="text-sm text-professional">Inicia un nuevo análisis financiero</p>
            </CardContent>
          </Card>

          <Link to="/subir-excel" className="block">
            <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center space-y-3">
                <LineChart className="h-8 w-8 text-steel-blue mx-auto" />
                <h3 className="font-semibold text-steel-blue-dark">Cargar Datos</h3>
                <p className="text-sm text-professional">Sube archivos Excel o PDF</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/archivos" className="block">
            <Card className="dashboard-card hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center space-y-3">
                <Target className="h-8 w-8 text-steel-blue mx-auto" />
                <h3 className="font-semibold text-steel-blue-dark">Gestión Archivos</h3>
                <p className="text-sm text-professional">Revisa archivos procesados</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-steel-blue-dark">
              <Activity className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Análisis P&G completado', time: 'hace 2 horas', type: 'success' },
                { action: 'Archivo balance.xlsx subido', time: 'hace 1 día', type: 'info' },
                { action: 'Reporte mensual generado', time: 'hace 3 días', type: 'success' },
                { action: 'Alerta: Liquidez baja detectada', time: 'hace 1 semana', type: 'warning' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-light-gray-50">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-steel-blue-dark">{activity.action}</p>
                    <p className="text-xs text-professional">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;