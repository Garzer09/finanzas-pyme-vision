
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { FileUploader } from '@/components/FileUploader';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, LineChart, Area, AreaChart } from 'recharts';
import { Building2, Scale, TrendingUp, AlertTriangle, Calendar, FileDown, Eye, CheckCircle, AlertCircle, Zap, Target, DollarSign, TrendingDown, Info, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DebtAnalysisSection } from '@/components/debt-analysis/DebtAnalysisSection';
import { PercentageBadge } from '@/components/ui/percentage-badge';

export const BalanceSituacionPage = () => {
  const [hasData, setHasData] = useState(true); // Start with demo data
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState('2023');
  const [comparisonPeriod, setComparisonPeriod] = useState('2022');
  const [detailLevel, setDetailLevel] = useState('summary');
  const [isDetailsOpen, setIsDetailsOpen] = useState<{[key: string]: boolean}>({
    'ACTIVO NO CORRIENTE': false,
    'ACTIVO CORRIENTE': false,
    'PATRIMONIO NETO': false,
    'PASIVO NO CORRIENTE': false,
    'PASIVO CORRIENTE': false
  });

  // Datos financieros calculados
  const financialData = {
    activo_total: 2100000,
    patrimonio_neto: 840000,
    deuda_corto: 540000,
    deuda_largo: 720000,
    activo_corriente: 900000,
    activo_no_corriente: 1200000,
    ebitda: 450000,
    gastos_financieros: 85000
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const calculatePercentages = (item: number, total: number) => (item / total) * 100;

  // Legacy compatibility - this ensures no runtime errors for any remaining references
  const balanceData = financialData;

  // Enhanced KPI data with patrimonio neto included
  const enhancedKpiData = [
    {
      title: 'Total Activo',
      value: formatCurrency(financialData.activo_total),
      subtitle: 'Recursos Totales',
      trend: 'up' as const,
      trendValue: '+5.3%',
      icon: Building2,
      variant: 'default' as const
    },
    {
      title: 'Patrimonio Neto',
      value: formatCurrency(financialData.patrimonio_neto),
      subtitle: `${calculatePercentages(financialData.patrimonio_neto, financialData.activo_total).toFixed(1)}% del activo`,
      trend: 'up' as const,
      trendValue: '+5.2%',
      icon: Shield,
      variant: 'success' as const
    },
    {
      title: 'Fondo de Maniobra',
      value: '€360K',
      subtitle: '45 días de ventas',
      trend: 'up' as const,
      trendValue: '+12.5%',
      icon: Zap,
      variant: 'success' as const
    },
    {
      title: 'Ratio de Liquidez',
      value: '1.67',
      subtitle: 'Óptimo (>1.5)',
      trend: 'up' as const,
      trendValue: '+0.15',
      icon: CheckCircle,
      variant: 'success' as const
    },
    {
      title: 'Ratio de Solvencia',
      value: '1.67',
      subtitle: 'Benchmark: 1.5',
      trend: 'up' as const,
      trendValue: '+0.08',
      icon: Scale,
      variant: 'success' as const
    },
    {
      title: 'ROA',
      value: '4.3%',
      subtitle: 'Return on Assets',
      trend: 'up' as const,
      trendValue: '+0.8%',
      icon: Target,
      variant: 'success' as const
    }
  ];

  // Waterfall chart data for balance comparison
  const waterfallData = [
    { name: 'Inmovilizado Material', value: 800000, category: 'activo' },
    { name: 'Inmovilizado Intangible', value: 300000, category: 'activo' },
    { name: 'Inversiones Financieras', value: 100000, category: 'activo' },
    { name: 'Existencias', value: 300000, category: 'activo' },
    { name: 'Deudores Comerciales', value: 400000, category: 'activo' },
    { name: 'Tesorería', value: 120000, category: 'activo' },
    { name: 'Patrimonio Neto', value: -840000, category: 'patrimonio' },
    { name: 'Deuda L/P', value: -720000, category: 'deuda' },
    { name: 'Deuda C/P', value: -540000, category: 'deuda' }
  ];

  // Pie chart data for asset structure with percentages
  const assetStructureData = [
    { 
      name: 'Inmovilizado', 
      value: 1200000, 
      percentage: calculatePercentages(1200000, financialData.activo_total),
      color: '#4682B4' 
    },
    { 
      name: 'Existencias', 
      value: 300000, 
      percentage: calculatePercentages(300000, financialData.activo_total),
      color: '#5F9EA0' 
    },
    { 
      name: 'Deudores', 
      value: 480000, 
      percentage: calculatePercentages(480000, financialData.activo_total),
      color: '#87CEEB' 
    },
    { 
      name: 'Tesorería', 
      value: 120000, 
      percentage: calculatePercentages(120000, financialData.activo_total),
      color: '#10B981' 
    }
  ];

  // Pie chart data for financing structure with percentages
  const financingStructureData = [
    { 
      name: 'Patrimonio Neto', 
      value: financialData.patrimonio_neto, 
      percentage: calculatePercentages(financialData.patrimonio_neto, financialData.activo_total),
      color: '#10B981' 
    },
    { 
      name: 'Deuda L/P', 
      value: financialData.deuda_largo, 
      percentage: calculatePercentages(financialData.deuda_largo, financialData.activo_total),
      color: '#F59E0B' 
    },
    { 
      name: 'Deuda C/P', 
      value: financialData.deuda_corto, 
      percentage: calculatePercentages(financialData.deuda_corto, financialData.activo_total),
      color: '#EF4444' 
    }
  ];

  // Working capital evolution data
  const workingCapitalData = [
    { period: 'T1-22', value: 280000 },
    { period: 'T2-22', value: 295000 },
    { period: 'T3-22', value: 310000 },
    { period: 'T4-22', value: 320000 },
    { period: 'T1-23', value: 335000 },
    { period: 'T2-23', value: 345000 },
    { period: 'T3-23', value: 350000 },
    { period: 'T4-23', value: 360000 }
  ];

  // Detailed balance data for expandable table with percentages
  const detailedBalanceData = [
    {
      grupo: 'ACTIVO NO CORRIENTE',
      items: [
        { 
          concepto: 'Inmovilizado Material', 
          actual: 800000, 
          anterior: 750000, 
          variacion: 50000, 
          variacionPct: 6.7,
          porcentaje: calculatePercentages(800000, financialData.activo_total)
        },
        { 
          concepto: 'Inmovilizado Intangible', 
          actual: 300000, 
          anterior: 280000, 
          variacion: 20000, 
          variacionPct: 7.1,
          porcentaje: calculatePercentages(300000, financialData.activo_total)
        },
        { 
          concepto: 'Inversiones Financieras L/P', 
          actual: 100000, 
          anterior: 90000, 
          variacion: 10000, 
          variacionPct: 11.1,
          porcentaje: calculatePercentages(100000, financialData.activo_total)
        }
      ]
    },
    {
      grupo: 'ACTIVO CORRIENTE',
      items: [
        { 
          concepto: 'Existencias', 
          actual: 300000, 
          anterior: 280000, 
          variacion: 20000, 
          variacionPct: 7.1,
          porcentaje: calculatePercentages(300000, financialData.activo_total)
        },
        { 
          concepto: 'Deudores Comerciales', 
          actual: 400000, 
          anterior: 350000, 
          variacion: 50000, 
          variacionPct: 14.3,
          porcentaje: calculatePercentages(400000, financialData.activo_total)
        },
        { 
          concepto: 'Otros Créditos', 
          actual: 80000, 
          anterior: 70000, 
          variacion: 10000, 
          variacionPct: 14.3,
          porcentaje: calculatePercentages(80000, financialData.activo_total)
        },
        { 
          concepto: 'Tesorería', 
          actual: 120000, 
          anterior: 130000, 
          variacion: -10000, 
          variacionPct: -7.7,
          porcentaje: calculatePercentages(120000, financialData.activo_total)
        }
      ]
    },
    {
      grupo: 'PATRIMONIO NETO',
      items: [
        { 
          concepto: 'Capital Social', 
          actual: 300000, 
          anterior: 300000, 
          variacion: 0, 
          variacionPct: 0,
          porcentaje: calculatePercentages(300000, financialData.activo_total)
        },
        { 
          concepto: 'Reservas', 
          actual: 450000, 
          anterior: 400000, 
          variacion: 50000, 
          variacionPct: 12.5,
          porcentaje: calculatePercentages(450000, financialData.activo_total)
        },
        { 
          concepto: 'Resultado del Ejercicio', 
          actual: 90000, 
          anterior: 70000, 
          variacion: 20000, 
          variacionPct: 28.6,
          porcentaje: calculatePercentages(90000, financialData.activo_total)
        }
      ]
    },
    {
      grupo: 'PASIVO NO CORRIENTE',
      items: [
        { 
          concepto: 'Deudas L/P con Entidades Crédito', 
          actual: 600000, 
          anterior: 650000, 
          variacion: -50000, 
          variacionPct: -7.7,
          porcentaje: calculatePercentages(600000, financialData.activo_total)
        },
        { 
          concepto: 'Otras Deudas L/P', 
          actual: 120000, 
          anterior: 100000, 
          variacion: 20000, 
          variacionPct: 20,
          porcentaje: calculatePercentages(120000, financialData.activo_total)
        }
      ]
    },
    {
      grupo: 'PASIVO CORRIENTE',
      items: [
        { 
          concepto: 'Deudas C/P con Entidades Crédito', 
          actual: 240000, 
          anterior: 220000, 
          variacion: 20000, 
          variacionPct: 9.1,
          porcentaje: calculatePercentages(240000, financialData.activo_total)
        },
        { 
          concepto: 'Acreedores Comerciales', 
          actual: 250000, 
          anterior: 230000, 
          variacion: 20000, 
          variacionPct: 8.7,
          porcentaje: calculatePercentages(250000, financialData.activo_total)
        },
        { 
          concepto: 'Otras Deudas C/P', 
          actual: 50000, 
          anterior: 80000, 
          variacion: -30000, 
          variacionPct: -37.5,
          porcentaje: calculatePercentages(50000, financialData.activo_total)
        }
      ]
    }
  ];

  // Analysis insights
  const analysisInsights = [
    { type: 'positive', title: 'Liquidez Mejorada', description: 'El ratio de liquidez ha aumentado a 1.67, superando el benchmark sectorial de 1.5', icon: CheckCircle },
    { type: 'warning', title: 'Crecimiento de Deudores', description: 'Los deudores comerciales han crecido un 14.3%, requiere seguimiento de la cartera', icon: AlertCircle },
    { type: 'positive', title: 'Resultado Positivo', description: 'El resultado del ejercicio muestra un crecimiento del 28.6% respecto al año anterior', icon: TrendingUp },
    { type: 'neutral', title: 'Estructura Patrimonial', description: 'La proporción patrimonio/deuda se mantiene estable en 40/60', icon: Info }
  ];

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('Archivo de balance procesado correctamente.');
      setHasData(true);
    } catch (err) {
      setError('Error al procesar el archivo de balance.');
    } finally {
      setIsLoading(false);
    }
  };


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800">{label}</p>
          {data.activo > 0 && (
            <p className="text-steel-600">
              Activo: <span className="font-medium">{formatCurrency(data.activo)}</span>
            </p>
          )}
          {data.pasivo < 0 && (
            <p className="text-cadet-600">
              Pasivo: <span className="font-medium">{formatCurrency(data.pasivo)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-600">Valor:</span>
              <span className="text-sm font-medium">{formatCurrency(data.value)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-600">Porcentaje:</span>
              <span className="text-sm font-medium">{data.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-8 overflow-auto">
          {/* Enhanced Header with Controls */}
          <section className="relative">
            <div className="relative bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel/5 via-cadet/3 to-slate-100/5 rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-steel-600 to-steel-800 bg-clip-text text-transparent">
                      Balance de Situación
                    </h1>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-success-50 text-success-700 border-success-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Datos actualizados
                      </Badge>
                      <span className="text-slate-600 text-sm">Última actualización: 15 nov 2023</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex gap-2">
                      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-32">
                          <Calendar className="h-4 w-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2023">2023</SelectItem>
                          <SelectItem value="2022">2022</SelectItem>
                          <SelectItem value="2021">2021</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Comparar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2022">vs 2022</SelectItem>
                          <SelectItem value="2021">vs 2021</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* File Upload Section */}
          {!hasData && (
            <section>
              <FileUploader
                title="Cargar Balance de Situación"
                description="Sube tu archivo de Balance siguiendo la estructura PGC-ICAC"
                acceptedFormats={['.xlsx', '.csv']}
                onFileUpload={handleFileUpload}
                isLoading={isLoading}
                error={error}
                success={success}
              />
            </section>
          )}

          {/* Enhanced KPIs Section - 6 cards in 2x3 grid */}
          {hasData && (
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enhancedKpiData.map((kpi, index) => (
                  <ModernKPICard key={index} {...kpi} />
                ))}
              </div>
            </section>
          )}

          {/* Main Visualization Section */}
          {hasData && (
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column: Balance Waterfall (60%) */}
                <div className="lg:col-span-3">
                  <Card className="h-full bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-steel-50/80 to-cadet-50/60 border-b border-white/20">
                      <CardTitle className="text-slate-900 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-steel/20 backdrop-blur-sm">
                          <Scale className="h-5 w-5 text-steel-700" />
                        </div>
                        Balance Comparativo - Estructura Cascada
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ResponsiveContainer width="100%" height={500}>
                        <BarChart
                          data={waterfallData}
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                          <XAxis 
                            type="number"
                            tickFormatter={(value) => `€${(Math.abs(value) / 1000).toFixed(0)}K`}
                            fontSize={12}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis 
                            type="category"
                            dataKey="name"
                            fontSize={12}
                            stroke="hsl(var(--muted-foreground))"
                            width={120}
                          />
                          <Tooltip 
                            formatter={(value) => [formatCurrency(Math.abs(Number(value))), 'Valor']}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {waterfallData.map((entry, index) => {
                              let color = '#4682B4'; // Default steel blue
                              if (entry.category === 'activo') {
                                color = index % 2 === 0 ? '#4682B4' : '#5F9EA0'; // Steel variations
                              } else if (entry.category === 'patrimonio') {
                                color = '#10B981'; // Success green
                              } else if (entry.category === 'deuda') {
                                color = '#F59E0B'; // Warning amber
                              }
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Structure Charts (40%) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Asset Structure */}
                  <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5 text-steel-600" />
                        Estructura de Activos
                      </CardTitle>
                    </CardHeader>
                     <CardContent>
                       <ResponsiveContainer width="100%" height={180}>
                         <PieChart>
                           <Pie
                             data={assetStructureData}
                             cx="50%"
                             cy="50%"
                             outerRadius={75}
                             dataKey="value"
                           >
                             {assetStructureData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                           </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                         </PieChart>
                       </ResponsiveContainer>
                       
                       {/* Custom Legend */}
                       <div className="grid grid-cols-2 gap-2 mt-4">
                         {assetStructureData.map((entry, index) => (
                           <div key={index} className="flex items-center gap-2">
                             <div 
                               className="w-3 h-3 rounded-sm flex-shrink-0" 
                               style={{ backgroundColor: entry.color }}
                             />
                             <div className="min-w-0 flex-1">
                               <p className="text-xs font-medium text-slate-700">{entry.name}</p>
                               <p className="text-xs text-slate-500">{entry.percentage.toFixed(1)}%</p>
                             </div>
                           </div>
                         ))}
                       </div>
                     </CardContent>
                  </Card>

                  {/* Financing Structure */}
                  <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
                        <DollarSign className="h-5 w-5 text-cadet-600" />
                        Estructura de Financiación
                      </CardTitle>
                    </CardHeader>
                     <CardContent>
                       <ResponsiveContainer width="100%" height={180}>
                         <PieChart>
                           <Pie
                             data={financingStructureData}
                             cx="50%"
                             cy="50%"
                             outerRadius={75}
                             dataKey="value"
                           >
                             {financingStructureData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                           </Pie>
                           <Tooltip content={<CustomPieTooltip />} />
                         </PieChart>
                       </ResponsiveContainer>
                       
                       {/* Custom Legend */}
                       <div className="space-y-2 mt-4">
                         {financingStructureData.map((entry, index) => (
                           <div key={index} className="flex items-center gap-2">
                             <div 
                               className="w-3 h-3 rounded-sm flex-shrink-0" 
                               style={{ backgroundColor: entry.color }}
                             />
                             <div className="min-w-0 flex-1">
                               <p className="text-xs font-medium text-slate-700">{entry.name}</p>
                               <p className="text-xs text-slate-500">{entry.percentage.toFixed(1)}%</p>
                             </div>
                           </div>
                         ))}
                       </div>
                     </CardContent>
                  </Card>

                  {/* Working Capital Evolution */}
                  <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-success-600" />
                        Evolución Fondo Maniobra
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={workingCapitalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                          <XAxis 
                            dataKey="period" 
                            fontSize={10}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis 
                            fontSize={10}
                            stroke="hsl(var(--muted-foreground))"
                            tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`}
                          />
                          <Tooltip 
                            formatter={(value) => [formatCurrency(Number(value)), 'Fondo Maniobra']}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#10B981" 
                            fill="#D1FAE5"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                 </div>
               </div>
             </section>
           )}

           {/* Debt Analysis Section */}
           {hasData && (
             <section>
               <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl">
                 <CardHeader>
                   <CardTitle className="text-slate-900 flex items-center gap-3">
                     <div className="p-2 rounded-xl bg-red-100/80 backdrop-blur-sm">
                       <TrendingDown className="h-5 w-5 text-red-600" />
                     </div>
                     Análisis de Endeudamiento
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <DebtAnalysisSection
                      deudaCorto={financialData.deuda_corto}
                      deudaLargo={financialData.deuda_largo}
                      activoTotal={financialData.activo_total}
                      ebitda={financialData.ebitda}
                      gastosFinancieros={financialData.gastos_financieros}
                    />
                 </CardContent>
               </Card>
             </section>
           )}

           {/* Balance Comparison Chart */}
           {hasData && (
             <section>
               <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl">
                 <CardHeader>
                   <CardTitle className="text-slate-900 flex items-center gap-3">
                     <div className="p-2 rounded-xl bg-steel/20 backdrop-blur-sm">
                       <BarChart className="h-5 w-5 text-steel-700" />
                     </div>
                     Balance Comparativo Visual
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="h-96">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart 
                         data={[
                           {
                             categoria: 'Activo No Corriente',
                             '2023': detailedBalanceData[0].items.reduce((sum, item) => sum + item.actual, 0),
                             '2022': detailedBalanceData[0].items.reduce((sum, item) => sum + item.anterior, 0)
                           },
                           {
                             categoria: 'Activo Corriente',
                             '2023': detailedBalanceData[1].items.reduce((sum, item) => sum + item.actual, 0),
                             '2022': detailedBalanceData[1].items.reduce((sum, item) => sum + item.anterior, 0)
                           },
                           {
                             categoria: 'Patrimonio Neto',
                             '2023': detailedBalanceData[2].items.reduce((sum, item) => sum + item.actual, 0),
                             '2022': detailedBalanceData[2].items.reduce((sum, item) => sum + item.anterior, 0)
                           },
                           {
                             categoria: 'Pasivo No Corriente',
                             '2023': detailedBalanceData[3].items.reduce((sum, item) => sum + item.actual, 0),
                             '2022': detailedBalanceData[3].items.reduce((sum, item) => sum + item.anterior, 0)
                           },
                           {
                             categoria: 'Pasivo Corriente',
                             '2023': detailedBalanceData[4].items.reduce((sum, item) => sum + item.actual, 0),
                             '2022': detailedBalanceData[4].items.reduce((sum, item) => sum + item.anterior, 0)
                           }
                         ]}
                         margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                       >
                         <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                         <XAxis 
                           dataKey="categoria"
                           className="text-xs fill-gray-600"
                           angle={-45}
                           textAnchor="end"
                           height={80}
                         />
                         <YAxis 
                           className="text-xs fill-gray-600"
                           tickFormatter={formatCurrency}
                         />
                         <Tooltip 
                           formatter={(value: number) => [formatCurrency(value), '']}
                           labelStyle={{ color: '#1f2937' }}
                           contentStyle={{ 
                             backgroundColor: 'white', 
                             border: '1px solid #e5e7eb',
                             borderRadius: '8px'
                           }}
                         />
                         <Bar 
                           dataKey="2023" 
                           name="2023"
                           fill="hsl(var(--primary))" 
                           radius={[4, 4, 0, 0]}
                         />
                         <Bar 
                           dataKey="2022" 
                           name="2022"
                           fill="hsl(var(--secondary))" 
                           radius={[4, 4, 0, 0]}
                         />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                   
                   {/* Summary insights */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
                     <div className="text-center">
                       <p className="text-sm text-slate-600">Mayor Crecimiento</p>
                       <p className="text-lg font-bold text-success-600">Deudores Comerciales</p>
                       <p className="text-xs text-slate-500">+14.3%</p>
                     </div>
                     <div className="text-center">
                       <p className="text-sm text-slate-600">Total Activo</p>
                       <p className="text-lg font-bold text-slate-800">{formatCurrency(financialData.activo_total)}</p>
                       <p className="text-xs text-success-600">+5.3% vs 2022</p>
                     </div>
                     <div className="text-center">
                       <p className="text-sm text-slate-600">Ratio Patrimonio</p>
                       <p className="text-lg font-bold text-primary-600">{((financialData.patrimonio_neto / financialData.activo_total) * 100).toFixed(1)}%</p>
                       <p className="text-xs text-slate-500">del total activo</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </section>
           )}

           {/* Detailed Expandable Table */}
           {hasData && (
             <section>
               <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl">
                 <CardHeader>
                   <CardTitle className="text-slate-900 flex items-center gap-3">
                     <div className="p-2 rounded-xl bg-steel/20 backdrop-blur-sm">
                       <Eye className="h-5 w-5 text-steel-700" />
                     </div>
                     Balance Detallado Comparativo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-steel-50/50 to-cadet-50/30">
                          <TableHead className="font-bold text-slate-800">Concepto</TableHead>
                          <TableHead className="text-right font-bold text-slate-800">2023</TableHead>
                          <TableHead className="text-right font-bold text-slate-800">2022</TableHead>
                          <TableHead className="text-right font-bold text-slate-800">Var €</TableHead>
                          <TableHead className="text-right font-bold text-slate-800">Var %</TableHead>
                          <TableHead className="text-right font-bold text-slate-800">% Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailedBalanceData.map((grupo, groupIndex) => (
                          <Collapsible key={groupIndex} open={isDetailsOpen[grupo.grupo as keyof typeof isDetailsOpen]}>
                            <CollapsibleTrigger 
                              className="w-full"
                              onClick={() => setIsDetailsOpen(prev => ({
                                ...prev,
                                [grupo.grupo]: !prev[grupo.grupo as keyof typeof isDetailsOpen]
                              }))}
                            >
                              <TableRow className="bg-gradient-to-r from-steel-100/70 to-cadet-100/50 hover:from-steel-150/80 hover:to-cadet-150/60 cursor-pointer">
                                <TableCell className="font-bold text-slate-800 flex items-center gap-2">
                                  {isDetailsOpen[grupo.grupo as keyof typeof isDetailsOpen] ? 
                                    <ChevronDown className="h-4 w-4" /> : 
                                    <ChevronRight className="h-4 w-4" />
                                  }
                                  {grupo.grupo}
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-800">
                                  {formatCurrency(grupo.items.reduce((sum, item) => sum + item.actual, 0))}
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-600">
                                  {formatCurrency(grupo.items.reduce((sum, item) => sum + item.anterior, 0))}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  <span className={grupo.items.reduce((sum, item) => sum + item.variacion, 0) >= 0 ? 'text-success-600' : 'text-danger-600'}>
                                    {formatCurrency(grupo.items.reduce((sum, item) => sum + item.variacion, 0))}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  <span className={grupo.items.reduce((sum, item) => sum + item.variacionPct, 0) >= 0 ? 'text-success-600' : 'text-danger-600'}>
                                    {grupo.items.reduce((sum, item) => sum + item.variacionPct, 0).toFixed(1)}%
                                  </span>
                                </TableCell>
                                 <TableCell className="text-right font-bold">
                                   <PercentageBadge percentage={((grupo.items.reduce((sum, item) => sum + item.actual, 0) / financialData.activo_total) * 100)} />
                                 </TableCell>
                              </TableRow>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              {grupo.items.map((item, itemIndex) => (
                                <TableRow key={itemIndex} className="hover:bg-slate-50/50">
                                  <TableCell className="pl-8 text-slate-700">{item.concepto}</TableCell>
                                  <TableCell className="text-right font-mono text-slate-800">
                                    {formatCurrency(item.actual)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-slate-600">
                                    {formatCurrency(item.anterior)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    <span className={item.variacion >= 0 ? 'text-success-600' : 'text-danger-600'}>
                                      {formatCurrency(item.variacion)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    <span className={item.variacionPct >= 0 ? 'text-success-600' : 'text-danger-600'}>
                                      {item.variacionPct.toFixed(1)}%
                                    </span>
                                  </TableCell>
                                   <TableCell className="text-right">
                                     <PercentageBadge percentage={item.porcentaje} />
                                   </TableCell>
                                </TableRow>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Analysis Panel */}
          {hasData && (
            <section>
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-slate-900 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cadet/20 backdrop-blur-sm">
                      <Target className="h-5 w-5 text-cadet-700" />
                    </div>
                    Análisis y Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analysisInsights.map((insight, index) => {
                      const Icon = insight.icon;
                      return (
                        <div 
                          key={index}
                          className={`p-4 rounded-2xl border-l-4 ${
                            insight.type === 'positive' 
                              ? 'bg-success-50/50 border-success-500' 
                              : insight.type === 'warning'
                              ? 'bg-warning-50/50 border-warning-500'
                              : 'bg-slate-50/50 border-slate-400'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`h-5 w-5 mt-0.5 ${
                              insight.type === 'positive' 
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
          )}
        </main>
      </div>
    </div>
  );
};
