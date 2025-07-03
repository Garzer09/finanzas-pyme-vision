import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFinancialData } from '@/hooks/useFinancialData';
import { 
  Upload,
  DollarSign,
  Percent,
  TrendingUp,
  TrendingDown,
  Activity,
  Building,
  BarChart3,
  PieChart,
  Target,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Calculator,
  LineChart,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, Tooltip, Cell } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, getLatestData, calculateGrowth, getPeriodComparison, safeNumber } = useFinancialData();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario';
  const lastUpdateDate = new Date('2024-12-01'); // Simulated for demo
  const daysAgo = formatDistanceToNow(lastUpdateDate, { addSuffix: true, locale: es });

  // Get financial data
  const ratiosData = getLatestData('ratios_financieros');
  const pygData = getLatestData('estado_pyg');
  const balanceData = getLatestData('estado_balance');

  // KPI Data with sparklines
  const kpiData = [
    {
      id: 'ingresos',
      title: 'Ingresos',
      value: pygData?.data_content?.ingresos_explotacion 
        ? (safeNumber(pygData.data_content.ingresos_explotacion, 0) / 1000000).toFixed(1)
        : '2.84',
      unit: 'M€',
      trend: calculateGrowth(
        getPeriodComparison('estado_pyg')[0]?.data_content,
        getPeriodComparison('estado_pyg')[1]?.data_content,
        'ingresos_explotacion'
      ) || 15.9,
      icon: DollarSign,
      sparkline: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.85, 2.84, 2.84],
      color: '#005E8A'
    },
    {
      id: 'ebitda',
      title: 'Margen EBITDA',
      value: pygData?.data_content?.resultado_explotacion && pygData?.data_content?.ingresos_explotacion
        ? ((safeNumber(pygData.data_content.resultado_explotacion, 0) / safeNumber(pygData.data_content.ingresos_explotacion, 1)) * 100).toFixed(1)
        : '26.1',
      unit: '%',
      trend: 2.4,
      icon: Percent,
      sparkline: [22, 23, 24, 25, 24.5, 25.2, 26, 26.5, 26.2, 26.0, 26.1, 26.1],
      color: '#16a34a'
    },
    {
      id: 'beneficio',
      title: 'Beneficio Neto',
      value: pygData?.data_content?.resultado_neto 
        ? (safeNumber(pygData.data_content.resultado_neto, 0) / 1000).toFixed(0)
        : '520',
      unit: 'K€',
      trend: calculateGrowth(
        getPeriodComparison('estado_pyg')[0]?.data_content,
        getPeriodComparison('estado_pyg')[1]?.data_content,
        'resultado_neto'
      ) || 23.8,
      icon: TrendingUp,
      sparkline: [320, 340, 380, 420, 450, 480, 500, 510, 515, 518, 520, 520],
      color: '#16a34a'
    },
    {
      id: 'liquidez',
      title: 'Liquidez',
      value: ratiosData?.data_content?.liquidez?.ratio_corriente 
        ? safeNumber(ratiosData.data_content.liquidez.ratio_corriente, 0).toFixed(2)
        : '1.92',
      unit: 'x',
      trend: 8.3,
      icon: Activity,
      sparkline: [1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.85, 1.9, 1.91, 1.92, 1.92],
      color: '#6BD1FF'
    },
    {
      id: 'endeudamiento',
      title: 'Endeudamiento',
      value: ratiosData?.data_content?.endeudamiento?.ratio_endeudamiento 
        ? safeNumber(ratiosData.data_content.endeudamiento.ratio_endeudamiento, 0).toFixed(1)
        : '52.5',
      unit: '%',
      trend: -5.1,
      icon: Building,
      sparkline: [65, 63, 61, 58, 56, 55, 54, 53, 52.8, 52.6, 52.5, 52.5],
      color: '#dc2626'
    },
    {
      id: 'fondo',
      title: 'Fondo Maniobra',
      value: balanceData?.data_content?.activo_corriente && balanceData?.data_content?.pasivo_corriente
        ? ((safeNumber(balanceData.data_content.activo_corriente, 0) - safeNumber(balanceData.data_content.pasivo_corriente, 0)) / 1000).toFixed(0)
        : '600',
      unit: 'K€',
      trend: 12.5,
      icon: DollarSign,
      sparkline: [450, 480, 510, 530, 550, 570, 580, 590, 595, 598, 600, 600],
      color: '#005E8A'
    }
  ];

  // Performance vs Goals data
  const performanceData = [
    { name: 'Ingresos', value: 95, goal: 100, fill: '#005E8A' },
    { name: 'EBITDA', value: 87, goal: 100, fill: '#16a34a' },
    { name: 'ROE', value: 78, goal: 100, fill: '#6BD1FF' }
  ];

  // Quick Actions
  const quickActions = [
    { title: 'Cargar Datos', icon: Upload, route: '/subir-excel', description: 'Sube archivos Excel' },
    { title: 'Analizar P&G', icon: BarChart3, route: '/cuenta-pyg', description: 'Cuenta Resultados' },
    { title: 'Balance', icon: PieChart, route: '/balance-situacion', description: 'Situación patrimonial' },
    { title: 'Ratios', icon: Target, route: '/ratios-financieros', description: 'Análisis ratios' },
    { title: 'Supuestos', icon: Settings, route: '/supuestos-financieros', description: 'Premisas clave' },
    { title: 'Proyecciones', icon: LineChart, route: '/proyecciones', description: 'Análisis prospectivo' }
  ];

  // Alerts
  const alerts = [
    {
      id: 1,
      type: 'critical',
      title: 'NOF aumentó 22% último mes',
      description: 'Revisar gestión de inventarios y política de cobros',
      action: 'Ver análisis NOF',
      route: '/analisis-nof',
      count: 2
    },
    {
      id: 2,
      type: 'warning', 
      title: 'Concentración cliente 45%',
      description: 'Alto riesgo de dependencia comercial detectado',
      action: 'Diversificar cartera',
      route: '/segmentos-actual',
      count: 1
    },
    {
      id: 3,
      type: 'opportunity',
      title: 'DSCR permite financiación adicional',
      description: 'Capacidad de endeudamiento disponible para inversiones',
      action: 'Ver opciones',
      route: '/servicio-deuda',
      count: 1
    }
  ];

  const totalAlerts = alerts.reduce((sum, alert) => sum + alert.count, 0);

  // Progress roadmap
  const roadmapSteps = [
    { title: 'Descripción Empresa', completed: true, route: '/descripcion-empresa' },
    { title: 'Situación Actual', completed: true, route: '/situacion-actual' },
    { title: 'Supuestos Financieros', completed: false, route: '/supuestos-financieros' },
    { title: 'Proyecciones', completed: false, route: '/proyecciones' },
    { title: 'Análisis Sensibilidad', completed: false, route: '/escenarios' },
    { title: 'Valoración', completed: false, route: '/valoracion-eva' }
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'opportunity': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const Sparkline = ({ data, color }: { data: number[], color: string }) => (
    <div className="w-full h-8 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.map((value, index) => ({ value, index }))}>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fill={color}
            fillOpacity={0.1}
            strokeWidth={2}
            dot={false}
          />
          <Tooltip 
            content={({ active, payload }) => 
              active && payload?.[0] ? (
                <div className="bg-white p-2 border rounded-lg shadow-lg">
                  <p className="text-sm font-medium">{payload[0].value}</p>
                </div>
              ) : null
            }
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <div className="space-y-6 animate-pulse">
              <div className="h-32 bg-muted rounded-lg"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-8">
          {/* Hero Executive Snapshot */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl bg-gradient-to-r from-[#005E8A] to-[#6BD1FF] p-8 text-white overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">¡Bienvenido/a, {firstName}!</h1>
                <p className="text-xl opacity-90">Dashboard Ejecutivo - FinSight Pro</p>
                <div className="flex items-center gap-3 mt-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Clock className="w-3 h-3 mr-1" />
                    Actualizado {daysAgo}
                  </Badge>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => navigate('/subir-excel')}
                  className="bg-white text-[#005E8A] hover:bg-white/90"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Subir nuevos datos
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* KPI Carousel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-foreground">Indicadores Clave</h2>
            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4 snap-x snap-mandatory min-w-max lg:grid lg:grid-cols-3 xl:grid-cols-6">
                {kpiData.map((kpi, index) => {
                  const IconComponent = kpi.icon;
                  return (
                    <motion.div
                      key={kpi.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="snap-start flex-shrink-0 w-80 lg:w-auto"
                    >
                      <Card className="h-full hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                <IconComponent className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-3xl font-bold text-foreground">{kpi.value}</span>
                                  <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                                </div>
                              </div>
                            </div>
                            <Badge 
                              variant={kpi.trend >= 0 ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {kpi.trend >= 0 ? '+' : ''}{kpi.trend.toFixed(1)}%
                            </Badge>
                          </div>
                          <Sparkline data={kpi.sparkline} color={kpi.color} />
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Performance vs Goals */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Rendimiento vs Objetivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={performanceData}>
                      <RadialBar dataKey="value" cornerRadius={10}>
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </RadialBar>
                      <Tooltip 
                        content={({ active, payload }) => 
                          active && payload?.[0] ? (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-medium">{payload[0].payload.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {payload[0].value}% de {payload[0].payload.goal}%
                              </p>
                            </div>
                          ) : null
                        }
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Progress Roadmap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Progreso del Análisis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roadmapSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                        step.completed ? 'bg-success' : index === 2 ? 'bg-primary' : 'bg-muted'
                      }`}>
                        {step.completed && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <Link 
                        to={step.route}
                        className={`text-sm hover:underline ${
                          step.completed ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {step.title}
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-foreground">Acceso Rápido</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to={action.route} className="block">
                      <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer aspect-[4/3] lg:aspect-auto">
                        <CardContent className="p-6 text-center space-y-4 h-full flex flex-col justify-center">
                          <IconComponent className="h-8 w-8 text-primary mx-auto" />
                          <div>
                            <h3 className="font-semibold text-foreground">{action.title}</h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Alert Center 2.0 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    Centro de Alertas Inteligentes
                  </CardTitle>
                  {totalAlerts > 0 && (
                    <Badge variant="destructive" className="rounded-full">
                      {totalAlerts}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {alerts.map((alert) => (
                    <AccordionItem key={alert.id} value={`alert-${alert.id}`}>
                      <AccordionTrigger className={`hover:no-underline px-4 py-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-3 h-3 rounded-full ${
                            alert.type === 'critical' ? 'bg-red-500' :
                            alert.type === 'warning' ? 'bg-amber-500' : 'bg-green-500'
                          }`} />
                          <div className="flex-1 text-left">
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-sm opacity-75">{alert.description}</p>
                          </div>
                          {alert.count > 1 && (
                            <Badge variant="outline" className="rounded-full">
                              {alert.count}
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(alert.route)}
                          className="mt-2"
                        >
                          {alert.action}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;