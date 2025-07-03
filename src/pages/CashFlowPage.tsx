import React, { useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, LineChart } from 'recharts';
import { 
  Calendar, FileDown, Plus, TrendingUp, TrendingDown, 
  Activity, DollarSign, Target, AlertTriangle, CheckCircle, 
  Info, Eye, ChevronDown, ChevronUp, Calculator,
  Zap, Gauge as GaugeIcon, Building2, CreditCard
} from 'lucide-react';
import { Gauge } from '@/components/ui/gauge';

export default function CashFlowPage() {
  // Estado para controlar el comportamiento adaptativo
  const [selectedPeriods, setSelectedPeriods] = useState(['2023']); // Simular que solo hay un período
  const [activeTab, setActiveTab] = useState('operativo');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorValues, setSimulatorValues] = useState({
    diasCobro: 0,
    diasPago: 0,
    inventario: 0
  });

  // Mock data - en producción vendría de una API
  const availablePeriods = ['2023', '2022', '2021'];
  const hasSinglePeriod = selectedPeriods.length === 1;
  const hasMultiplePeriods = selectedPeriods.length > 1;

  // Datos de flujos de caja
  const cashFlowData = {
    '2023': {
      beneficioNeto: 180000,
      amortizaciones: 120000,
      provisiones: 15000,
      deltaExistencias: -25000,
      deltaClientes: -35000,
      deltaProveedores: 20000,
      flujoOperativo: 275000,
      inversiones: -150000,
      desinversiones: 10000,
      flujoInversion: -140000,
      nuevaFinanciacion: 80000,
      amortizacionDeuda: -45000,
      dividendos: -30000,
      flujoFinanciacion: 5000,
      flujoNeto: 140000
    },
    '2022': {
      beneficioNeto: 165000,
      amortizaciones: 110000,
      provisiones: 12000,
      deltaExistencias: -15000,
      deltaClientes: -25000,
      deltaProveedores: 15000,
      flujoOperativo: 262000,
      inversiones: -120000,
      desinversiones: 5000,
      flujoInversion: -115000,
      nuevaFinanciacion: 50000,
      amortizacionDeuda: -40000,
      dividendos: -25000,
      flujoFinanciacion: -15000,
      flujoNeto: 132000
    }
  };

  const currentData = cashFlowData[selectedPeriods[0] as keyof typeof cashFlowData];

  // Cálculos dinámicos
  const calculations = useMemo(() => {
    const flujoOperativoPctVentas = (currentData.flujoOperativo / 2400000) * 100; // Asumiendo ventas de 2.4M
    const flujoInversionPctActivos = (Math.abs(currentData.flujoInversion) / 2100000) * 100; // Asumiendo activos 2.1M
    const calidadFCO = ((currentData.flujoOperativo - currentData.beneficioNeto) / currentData.beneficioNeto) * 100;
    const autofinanciacion = (currentData.flujoOperativo / Math.abs(currentData.inversiones)) * 100;
    const coberturaDeuda = currentData.flujoOperativo / 85000; // Asumiendo servicio deuda 85K

    return {
      flujoOperativoPctVentas,
      flujoInversionPctActivos,
      calidadFCO,
      autofinanciacion,
      coberturaDeuda
    };
  }, [currentData, selectedPeriods]);

  // KPIs adaptativos
  const kpiData = [
    {
      title: 'Flujo Operativo',
      value: `€${(currentData.flujoOperativo / 1000).toFixed(0)}K`,
      subtitle: `${calculations.flujoOperativoPctVentas.toFixed(1)}% sobre ventas`,
      trend: 'up' as const,
      trendValue: hasMultiplePeriods ? '+5.0%' : '',
      icon: Activity,
      variant: 'success' as const
    },
    {
      title: 'Flujo Inversión',
      value: `€${(currentData.flujoInversion / 1000).toFixed(0)}K`,
      subtitle: `${calculations.flujoInversionPctActivos.toFixed(1)}% sobre activos`,
      trend: 'down' as const,
      trendValue: hasMultiplePeriods ? '+21.7%' : '',
      icon: Building2,
      variant: 'warning' as const
    },
    {
      title: 'Flujo Financiación',
      value: `€${(currentData.flujoFinanciacion / 1000).toFixed(0)}K`,
      subtitle: 'Estructura equilibrada',
      trend: currentData.flujoFinanciacion > 0 ? 'up' as const : 'down' as const,
      trendValue: hasMultiplePeriods ? '+133%' : '',
      icon: CreditCard,
      variant: 'default' as const
    },
    {
      title: 'Flujo Neto',
      value: `€${(currentData.flujoNeto / 1000).toFixed(0)}K`,
      subtitle: 'Impacto tesorería',
      trend: 'up' as const,
      trendValue: hasMultiplePeriods ? '+6.1%' : '',
      icon: Target,
      variant: 'success' as const
    }
  ];

  // KPIs adicionales para múltiples períodos
  const multiPeriodKpis = hasMultiplePeriods ? [
    {
      title: 'Free Cash Flow',
      value: `€${((currentData.flujoOperativo + currentData.flujoInversion) / 1000).toFixed(0)}K`,
      subtitle: 'FCO + Inversión',
      trend: 'up' as const,
      trendValue: '+17.5%',
      icon: TrendingUp,
      variant: 'success' as const
    },
    {
      title: 'Cash Conversion',
      value: '42 días',
      subtitle: 'Ciclo de conversión',
      trend: 'down' as const,
      trendValue: '-5 días',
      icon: Zap,
      variant: 'success' as const
    }
  ] : [];

  const qualityKpis = [
    {
      title: 'Calidad FCO',
      value: `${calculations.calidadFCO.toFixed(1)}%`,
      subtitle: '(FCO - Result.) / Result.',
      trend: 'up' as const,
      trendValue: hasMultiplePeriods ? '+8%' : '',
      icon: CheckCircle,
      variant: calculations.calidadFCO > 50 ? 'success' as const : 'warning' as const
    },
    {
      title: 'Autofinanciación',
      value: `${calculations.autofinanciacion.toFixed(0)}%`,
      subtitle: 'FCO / Inversiones',
      trend: calculations.autofinanciacion > 100 ? 'up' as const : 'down' as const,
      trendValue: hasMultiplePeriods ? '+12%' : '',
      icon: DollarSign,
      variant: calculations.autofinanciacion > 100 ? 'success' as const : 'warning' as const
    },
    {
      title: 'Cobertura Deuda',
      value: `${calculations.coberturaDeuda.toFixed(1)}x`,
      subtitle: 'FCO / Servicio deuda',
      trend: 'up' as const,
      trendValue: hasMultiplePeriods ? '+0.3x' : '',
      icon: Target,
      variant: calculations.coberturaDeuda > 1.5 ? 'success' as const : 'warning' as const
    }
  ];

  // Datos para el gráfico waterfall
  const waterfallData = [
    { name: 'Beneficio Neto', value: currentData.beneficioNeto, cumulative: currentData.beneficioNeto, type: 'base' },
    { name: '+ Amortizaciones', value: currentData.amortizaciones, cumulative: currentData.beneficioNeto + currentData.amortizaciones, type: 'positive' },
    { name: '+ Provisiones', value: currentData.provisiones, cumulative: currentData.beneficioNeto + currentData.amortizaciones + currentData.provisiones, type: 'positive' },
    { name: '- Δ Existencias', value: currentData.deltaExistencias, cumulative: currentData.beneficioNeto + currentData.amortizaciones + currentData.provisiones + currentData.deltaExistencias, type: 'negative' },
    { name: '- Δ Clientes', value: currentData.deltaClientes, cumulative: currentData.beneficioNeto + currentData.amortizaciones + currentData.provisiones + currentData.deltaExistencias + currentData.deltaClientes, type: 'negative' },
    { name: '+ Δ Proveedores', value: currentData.deltaProveedores, cumulative: currentData.flujoOperativo, type: 'positive' },
    { name: 'FLUJO OPERATIVO', value: currentData.flujoOperativo, cumulative: currentData.flujoOperativo, type: 'subtotal' },
    { name: '- Inversiones', value: currentData.inversiones, cumulative: currentData.flujoOperativo + currentData.inversiones, type: 'negative' },
    { name: '+ Desinversiones', value: currentData.desinversiones, cumulative: currentData.flujoOperativo + currentData.flujoInversion, type: 'positive' },
    { name: 'FLUJO INVERSIÓN', value: currentData.flujoInversion, cumulative: currentData.flujoOperativo + currentData.flujoInversion, type: 'subtotal' },
    { name: '+ Nueva Financ.', value: currentData.nuevaFinanciacion, cumulative: currentData.flujoOperativo + currentData.flujoInversion + currentData.nuevaFinanciacion, type: 'positive' },
    { name: '- Amort. Deuda', value: currentData.amortizacionDeuda, cumulative: currentData.flujoOperativo + currentData.flujoInversion + currentData.nuevaFinanciacion + currentData.amortizacionDeuda, type: 'negative' },
    { name: '- Dividendos', value: currentData.dividendos, cumulative: currentData.flujoNeto, type: 'negative' },
    { name: 'FLUJO NETO', value: currentData.flujoNeto, cumulative: currentData.flujoNeto, type: 'total' }
  ];

  // Datos para gráficos de composición
  const origenFondos = [
    { name: 'Flujo Operativo', value: Math.abs(currentData.flujoOperativo), color: '#10B981' },
    { name: 'Nueva Financiación', value: Math.abs(currentData.nuevaFinanciacion), color: '#3B82F6' },
    { name: 'Desinversiones', value: Math.abs(currentData.desinversiones), color: '#F59E0B' }
  ];

  const aplicacionFondos = [
    { name: 'Inversiones', value: Math.abs(currentData.inversiones), color: '#EF4444' },
    { name: 'Amort. Deuda', value: Math.abs(currentData.amortizacionDeuda), color: '#8B5CF6' },
    { name: 'Dividendos', value: Math.abs(currentData.dividendos), color: '#F97316' },
    { name: 'Incremento Caja', value: Math.abs(currentData.flujoNeto), color: '#10B981' }
  ];

  // Insights automáticos
  const insights = [
    {
      type: hasSinglePeriod ? 'info' : 'success',
      icon: hasSinglePeriod ? Info : TrendingUp,
      title: hasSinglePeriod ? 'El NOF consume el 14.5% del flujo operativo' : 'FCO mejora 5% por optimización NOF',
      description: hasSinglePeriod ? 
        'La variación del capital circulante impacta moderadamente la generación de caja' :
        'La mejora en la gestión del capital circulante aumenta la eficiencia'
    },
    {
      type: calculations.autofinanciacion > 100 ? 'success' : 'warning',
      icon: calculations.autofinanciacion > 100 ? CheckCircle : AlertTriangle,
      title: calculations.autofinanciacion > 100 ? 'Autofinanciación sólida' : 'Inversiones superan capacidad de generación',
      description: calculations.autofinanciacion > 100 ? 
        'La empresa puede financiar sus inversiones con flujo propio' :
        'Se requiere financiación externa para sostener el nivel de inversión'
    }
  ];

  // Calcular impacto del simulador
  const simulatorImpact = useMemo(() => {
    const ventasAnuales = 2400000;
    const impactoCobro = (simulatorValues.diasCobro * ventasAnuales) / 365;
    const impactoPago = (simulatorValues.diasPago * ventasAnuales * 0.6) / 365; // 60% de ventas son compras
    const impactoInventario = (simulatorValues.inventario * 300000) / 100; // Inventario actual 300K
    
    return impactoCobro + impactoPago + impactoInventario;
  }, [simulatorValues]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getBarColor = (type: string) => {
    switch(type) {
      case 'positive': return '#10B981';
      case 'negative': return '#EF4444';
      case 'subtotal': return '#3B82F6';
      case 'total': return '#6B7280';
      default: return '#4682B4';
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-8 overflow-auto">
          {/* Header Inteligente */}
          <section className="relative">
            <div className="relative bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel/5 via-cadet/3 to-slate-100/5 rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-steel-600 to-steel-800 bg-clip-text text-transparent">
                      Estado de Flujos de Efectivo
                    </h1>
                    <div className="flex items-center gap-3">
                      <Badge variant={hasSinglePeriod ? "secondary" : "default"} className={
                        hasSinglePeriod ? "bg-warning-50 text-warning-700 border-warning-200" : "bg-success-50 text-success-700 border-success-200"
                      }>
                        {hasSinglePeriod ? `Período único: ${selectedPeriods[0]}` : `Comparativa ${selectedPeriods.join('-')}`}
                      </Badge>
                      {hasSinglePeriod && (
                        <Badge variant="outline" className="bg-info-50 text-info-700 border-info-200">
                          <Info className="h-3 w-3 mr-1" />
                          Sube más períodos para ver evolución
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex gap-2">
                      <Select 
                        value={selectedPeriods[0]} 
                        onValueChange={(value) => setSelectedPeriods([value])}
                        disabled={availablePeriods.length === 1}
                      >
                        <SelectTrigger className="w-32">
                          <Calendar className="h-4 w-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePeriods.map(period => (
                            <SelectItem key={period} value={period}>{period}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                      <Button 
                        variant={hasSinglePeriod ? "default" : "outline"} 
                        size="sm"
                        className={hasSinglePeriod ? "bg-steel-600 hover:bg-steel-700" : ""}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir período
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={hasSinglePeriod}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Proyecciones
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* KPIs Principales */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {kpiData.map((kpi, index) => (
                <ModernKPICard key={index} {...kpi} />
              ))}
            </div>
            
            {/* KPIs adicionales para múltiples períodos */}
            {hasMultiplePeriods && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {multiPeriodKpis.map((kpi, index) => (
                  <ModernKPICard key={`multi-${index}`} {...kpi} />
                ))}
              </div>
            )}
            
            {/* Indicadores de Calidad */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {qualityKpis.map((kpi, index) => (
                <ModernKPICard key={`quality-${index}`} {...kpi} />
              ))}
            </div>
          </section>

          {/* Visualización Principal */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              {/* Izquierda (70%) - Gráfico Waterfall */}
              <div className="lg:col-span-7">
                <Card className="h-full bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-steel-50/80 to-cadet-50/60 border-b border-white/20">
                    <CardTitle className="text-slate-900 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-steel/20 backdrop-blur-sm">
                        <Activity className="h-5 w-5 text-steel-700" />
                      </div>
                      Análisis Waterfall - Generación y Aplicación de Fondos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={500}>
                      <BarChart
                        data={waterfallData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={10}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis 
                          tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`}
                          fontSize={12}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(Number(value)), 'Valor']}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="cumulative" radius={[4, 4, 0, 0]}>
                          {waterfallData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Derecha (30%) - Paneles de Calidad e Insights */}
              <div className="lg:col-span-3 space-y-6">
                {/* Panel de Calidad FCO */}
                <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
                      <GaugeIcon className="h-5 w-5 text-steel-600" />
                      Calidad del FCO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-center">
                      <Gauge
                        value={Math.max(0, Math.min(100, calculations.calidadFCO))}
                        max={100}
                        label="Calidad"
                        unit="%"
                        ranges={[
                          { min: 0, max: 30, color: '#EF4444', label: 'Baja' },
                          { min: 30, max: 70, color: '#F59E0B', label: 'Media' },
                          { min: 70, max: 100, color: '#10B981', label: 'Alta' }
                        ]}
                        size="md"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Composición - Origen de Fondos */}
                <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-success-600" />
                      Origen de Fondos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={origenFondos}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                          fontSize={10}
                        >
                          {origenFondos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Composición - Aplicación de Fondos */}
                <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
                      <TrendingDown className="h-5 w-5 text-danger-600" />
                      Aplicación de Fondos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={aplicacionFondos}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                          fontSize={10}
                        >
                          {aplicacionFondos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Insights Automáticos */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cadet/20 backdrop-blur-sm">
                    <Target className="h-5 w-5 text-cadet-700" />
                  </div>
                  Insights Automáticos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {insights.map((insight, index) => {
                    const Icon = insight.icon;
                    return (
                      <div 
                        key={index}
                        className={`p-4 rounded-2xl border-l-4 ${
                          insight.type === 'success' 
                            ? 'bg-success-50/50 border-success-500' 
                            : insight.type === 'warning'
                            ? 'bg-warning-50/50 border-warning-500'
                            : 'bg-slate-50/50 border-slate-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${
                            insight.type === 'success' 
                              ? 'text-success-600' 
                              : insight.type === 'warning'
                              ? 'text-warning-600'
                              : 'text-slate-600'
                          }`} />
                          <div>
                            <h4 className="font-bold text-slate-900 mb-1">{insight.title}</h4>
                            <p className="text-slate-700 text-sm">{insight.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Simulador What-If */}
          <section>
            <Collapsible open={isSimulatorOpen} onOpenChange={setIsSimulatorOpen}>
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-slate-50/50 transition-colors">
                    <CardTitle className="text-slate-900 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-steel/20 backdrop-blur-sm">
                          <Calculator className="h-5 w-5 text-steel-700" />
                        </div>
                        Simulador What-If
                      </div>
                      {isSimulatorOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Reducir días de cobro
                        </label>
                        <Slider
                          value={[simulatorValues.diasCobro]}
                          onValueChange={(value) => setSimulatorValues(prev => ({ ...prev, diasCobro: value[0] }))}
                          max={30}
                          min={-30}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-xs text-slate-500 mt-1">{simulatorValues.diasCobro} días</div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Aumentar días de pago
                        </label>
                        <Slider
                          value={[simulatorValues.diasPago]}
                          onValueChange={(value) => setSimulatorValues(prev => ({ ...prev, diasPago: value[0] }))}
                          max={30}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-xs text-slate-500 mt-1">+{simulatorValues.diasPago} días</div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Reducir inventario
                        </label>
                        <Slider
                          value={[simulatorValues.inventario]}
                          onValueChange={(value) => setSimulatorValues(prev => ({ ...prev, inventario: value[0] }))}
                          max={50}
                          min={-50}
                          step={5}
                          className="w-full"
                        />
                        <div className="text-xs text-slate-500 mt-1">{simulatorValues.inventario}%</div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-success-50 to-success-100 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-success-800">Impacto estimado</h4>
                          <p className="text-success-700">{formatCurrency(simulatorImpact)} en FCO</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Ver detalle</Button>
                          <Button size="sm" className="bg-success-600 hover:bg-success-700">Aplicar escenario</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </section>

          {/* Análisis Detallado por Tabs */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-900">Análisis Detallado</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 p-1 m-6 mb-0">
                    <TabsTrigger value="operativo">Flujo Operativo</TabsTrigger>
                    <TabsTrigger value="inversion">Flujo Inversión</TabsTrigger>
                    <TabsTrigger value="financiacion">Flujo Financiación</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="operativo" className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800">Conciliación Resultado → Flujo</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <div className="text-sm text-slate-600">Días inventario</div>
                          <div className="text-xl font-bold text-slate-800">45</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <div className="text-sm text-slate-600">Días cobro</div>
                          <div className="text-xl font-bold text-slate-800">52</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <div className="text-sm text-slate-600">Días pago</div>
                          <div className="text-xl font-bold text-slate-800">38</div>
                        </div>
                        <div className="p-4 bg-steel-50 rounded-xl">
                          <div className="text-sm text-steel-600">Ciclo conversión</div>
                          <div className="text-xl font-bold text-steel-800">59 días</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="inversion" className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800">Detalle de Inversiones</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <div className="text-sm text-slate-600">CAPEX Total</div>
                          <div className="text-xl font-bold text-slate-800">{formatCurrency(Math.abs(currentData.inversiones))}</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <div className="text-sm text-slate-600">vs Amortizaciones</div>
                          <div className="text-xl font-bold text-steel-800">{((Math.abs(currentData.inversiones) / currentData.amortizaciones) * 100).toFixed(0)}%</div>
                        </div>
                        <div className="p-4 bg-cadet-50 rounded-xl">
                          <div className="text-sm text-cadet-600">Tasa reposición</div>
                          <div className="text-xl font-bold text-cadet-800">125%</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="financiacion" className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800">Movimientos de Financiación</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <div className="text-sm text-slate-600">Nueva financiación</div>
                          <div className="text-xl font-bold text-success-800">{formatCurrency(currentData.nuevaFinanciacion)}</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <div className="text-sm text-slate-600">Amort. deuda</div>
                          <div className="text-xl font-bold text-danger-800">{formatCurrency(Math.abs(currentData.amortizacionDeuda))}</div>
                        </div>
                        <div className="p-4 bg-warning-50 rounded-xl">
                          <div className="text-sm text-warning-600">Coste implícito</div>
                          <div className="text-xl font-bold text-warning-800">4.2%</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}