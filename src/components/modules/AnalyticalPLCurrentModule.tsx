
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useAnalyticalPLData } from '@/hooks/useAnalyticalPLData';
import { MissingFinancialData } from '@/components/ui/missing-financial-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { Calculator, TrendingUp, TrendingDown, BarChart3, Percent } from 'lucide-react';

interface AnalyticalPLItem {
  concept: string;
  currentPeriod: number;
  previousPeriod: number;
  marginPercent: number;
  variationPercent: number;
  sparklineData: number[];
  category: 'revenue' | 'variable_costs' | 'fixed_costs' | 'margin';
  level: number;
}

export const AnalyticalPLCurrentModule = () => {
  const [viewMode, setViewMode] = useState<'table' | 'margins' | 'waterfall'>('table');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const { analyticalData, hasRealData } = useAnalyticalPLData();

  // Show missing data indicator if no real data
  if (!hasRealData) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="max-w-lg w-full">
              <MissingFinancialData 
                dataType="pyg"
                onUploadClick={() => console.log('Navigate to upload')}
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Use real analytical data from hook
    {
      concept: '  - Materias Primas',
      currentPeriod: -950000,
      previousPeriod: -850000,
      marginPercent: -38.0,
      variationPercent: 11.8,
      sparklineData: [-820, -830, -850, -880, -920, -940, -945, -950],
      category: 'variable_costs',
      level: 2
    },
    {
      concept: '  - Mano de Obra Directa',
      currentPeriod: -280000,
      previousPeriod: -260000,
      marginPercent: -11.2,
      variationPercent: 7.7,
      sparklineData: [-250, -255, -260, -265, -270, -275, -278, -280],
      category: 'variable_costs',
      level: 2
    },
    {
      concept: '  - Otros Costes Variables',
      currentPeriod: -150000,
      previousPeriod: -140000,
      marginPercent: -6.0,
      variationPercent: 7.1,
      sparklineData: [-135, -138, -140, -145, -147, -148, -149, -150],
      category: 'variable_costs',
      level: 2
    },
    {
      concept: 'MARGEN DE CONTRIBUCIÓN',
      currentPeriod: 1120000,
      previousPeriod: 980000,
      marginPercent: 44.8,
      variationPercent: 14.3,
      sparklineData: [900, 920, 950, 1000, 1050, 1080, 1100, 1120],
      category: 'margin',
      level: 1
    },
    {
      concept: 'Costes Fijos',
      currentPeriod: -795000,
      previousPeriod: -688000,
      marginPercent: -31.8,
      variationPercent: 15.6,
      sparklineData: [-670, -675, -688, -720, -750, -770, -785, -795],
      category: 'fixed_costs',
      level: 1
    },
    {
      concept: '  - Personal Fijo',
      currentPeriod: -400000,
      previousPeriod: -330000,
      marginPercent: -16.0,
      variationPercent: 21.2,
      sparklineData: [-320, -325, -330, -350, -370, -385, -395, -400],
      category: 'fixed_costs',
      level: 2
    },
    {
      concept: '  - Alquileres',
      currentPeriod: -120000,
      previousPeriod: -115000,
      marginPercent: -4.8,
      variationPercent: 4.3,
      sparklineData: [-110, -112, -115, -116, -117, -118, -119, -120],
      category: 'fixed_costs',
      level: 2
    },
    {
      concept: '  - Amortizaciones',
      currentPeriod: -125000,
      previousPeriod: -115000,
      marginPercent: -5.0,
      variationPercent: 8.7,
      sparklineData: [-110, -112, -115, -118, -120, -122, -123, -125],
      category: 'fixed_costs',
      level: 2
    },
    {
      concept: '  - Otros Gastos Fijos',
      currentPeriod: -150000,
      previousPeriod: -128000,
      marginPercent: -6.0,
      variationPercent: 17.2,
      sparklineData: [-125, -126, -128, -135, -142, -145, -148, -150],
      category: 'fixed_costs',
      level: 2
    },
    {
      concept: 'RESULTADO OPERATIVO (EBIT)',
      currentPeriod: 325000,
      previousPeriod: 292000,
      marginPercent: 13.0,
      variationPercent: 11.3,
      sparklineData: [280, 285, 290, 295, 305, 315, 320, 325],
      category: 'margin',
      level: 1
    }
  // Generate waterfall data from real analytical data
  const waterfallData = analyticalData.length > 0 ? [
    { name: 'Ventas', value: Math.round(analyticalData[0]?.currentPeriod / 1000) || 2500, cumulative: Math.round(analyticalData[0]?.currentPeriod / 1000) || 2500 },
    { name: 'Costes Variables', value: Math.round((analyticalData[1]?.currentPeriod || -1380000) / 1000), cumulative: Math.round(((analyticalData[0]?.currentPeriod || 0) + (analyticalData[1]?.currentPeriod || 0)) / 1000) },
    { name: 'Margen Contribución', value: Math.round((analyticalData[2]?.currentPeriod || 1120000) / 1000), cumulative: Math.round((analyticalData[2]?.currentPeriod || 1120000) / 1000) },
    { name: 'Costes Fijos', value: Math.round((analyticalData[3]?.currentPeriod || -795000) / 1000), cumulative: Math.round((analyticalData[4]?.currentPeriod || 325000) / 1000) },
    { name: 'EBIT', value: Math.round((analyticalData[4]?.currentPeriod || 325000) / 1000), cumulative: Math.round((analyticalData[4]?.currentPeriod || 325000) / 1000) }
  ] : [];

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K€`;
    }
    return `${value.toLocaleString()}€`;
  };

  const getRowStyle = (category: string, level: number) => {
    const baseStyle = level === 2 ? 'pl-8 ' : '';
    switch (category) {
      case 'revenue': return baseStyle + 'bg-success-50 border-l-4 border-success-400';
      case 'variable_costs': return baseStyle + 'bg-warning-50 border-l-4 border-warning-400';
      case 'fixed_costs': return baseStyle + 'bg-danger-50 border-l-4 border-danger-400';
      case 'margin': return baseStyle + 'bg-steel-50 border-l-4 border-steel-400 font-semibold';
      default: return baseStyle;
    }
  };

  const getHeatmapColor = (value: number, category: string) => {
    if (category === 'margin') {
      if (value >= 20) return 'bg-success-200/50';
      if (value >= 10) return 'bg-warning-200/50';
      return 'bg-danger-200/50';
    }
    return '';
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-8 overflow-auto">
          {/* Header Section */}
          <section className="relative">
            <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel/5 via-cadet/3 to-slate-100/5 rounded-3xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-steel/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-cadet/8 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-steel-800 bg-clip-text text-transparent">
                    P&G Analítico - Situación Actual
                  </h1>
                  <p className="text-slate-700 text-lg font-medium">Análisis de márgenes y estructura de costes variables vs fijos</p>
                </div>
              
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    onClick={() => setViewMode('table')}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Tabla
                  </Button>
                  <Button
                    variant={viewMode === 'margins' ? 'default' : 'outline'}
                    onClick={() => setViewMode('margins')}
                  >
                    <Percent className="h-4 w-4 mr-2" />
                    Márgenes
                  </Button>
                  <Button
                    variant={viewMode === 'waterfall' ? 'default' : 'outline'}
                    onClick={() => setViewMode('waterfall')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Cascada
                  </Button>
                  <Button
                    variant={showHeatmap ? 'default' : 'outline'}
                    onClick={() => setShowHeatmap(!showHeatmap)}
                  >
                    Heatmap
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Vista de Tabla */}
          {viewMode === 'table' && (
            <section>
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 shadow-2xl shadow-steel/10">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-steel-600" />
                    P&G Analítico Detallado
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-slate-800 font-semibold">Concepto</TableHead>
                          <TableHead className="text-slate-800 font-semibold text-right">Periodo Actual</TableHead>
                          <TableHead className="text-slate-800 font-semibold text-right">Periodo Anterior</TableHead>
                          <TableHead className="text-slate-800 font-semibold text-right">% s/Ventas</TableHead>
                          <TableHead className="text-slate-800 font-semibold text-right">% Variación</TableHead>
                          <TableHead className="text-slate-800 font-semibold text-center">Tendencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticalData.map((item, index) => (
                          <TableRow 
                            key={index} 
                            className={`hover:bg-slate-50/50 ${getRowStyle(item.category, item.level)} ${
                              showHeatmap ? getHeatmapColor(item.marginPercent, item.category) : ''
                            }`}
                          >
                            <TableCell className="text-slate-800 font-medium">{item.concept}</TableCell>
                            <TableCell className="text-right text-slate-800 font-mono">
                              {formatCurrency(item.currentPeriod)}
                            </TableCell>
                            <TableCell className="text-right text-slate-600 font-mono">
                              {formatCurrency(item.previousPeriod)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="text-steel-600 border-steel-400">
                                {item.marginPercent.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant="outline" 
                                className={item.variationPercent >= 0 
                                  ? 'text-success-600 border-success-400' 
                                  : 'text-danger-600 border-danger-400'
                                }
                              >
                                {item.variationPercent >= 0 ? '+' : ''}{item.variationPercent.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="h-8 w-16 mx-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={item.sparklineData.map(value => ({ value }))}>
                                   <Area 
                                      type="monotone" 
                                      dataKey="value" 
                                      stroke={item.category === 'revenue' || item.category === 'margin' ? 'hsl(var(--success))' : 'hsl(var(--danger))'}
                                      fill={item.category === 'revenue' || item.category === 'margin' ? 'hsl(var(--success))' : 'hsl(var(--danger))'}
                                      fillOpacity={0.3}
                                      strokeWidth={1}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* Vista de Márgenes */}
          {viewMode === 'margins' && (
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 shadow-xl shadow-steel/10 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-steel-600" />
                    Evolución de Márgenes
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={[
                        { periodo: 'Ene', margenBruto: 42.5, margenContribucion: 43.8, margenOperativo: 12.5 },
                        { periodo: 'Feb', margenBruto: 43.1, margenContribucion: 44.2, margenOperativo: 12.8 },
                        { periodo: 'Mar', margenBruto: 43.8, margenContribucion: 44.5, margenOperativo: 13.1 },
                        { periodo: 'Abr', margenBruto: 44.2, margenContribucion: 44.8, margenOperativo: 13.0 }
                      ]}>
                        <XAxis dataKey="periodo" tick={{ fill: '#334155' }} />
                        <YAxis tick={{ fill: '#334155' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '12px',
                            color: '#334155',
                            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.2)'
                          }} 
                        />
                        <Line type="monotone" dataKey="margenContribucion" stroke="hsl(var(--success))" name="Margen Contribución" strokeWidth={3} />
                        <Line type="monotone" dataKey="margenOperativo" stroke="hsl(var(--steel))" name="Margen Operativo" strokeWidth={3} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 shadow-xl shadow-steel/10 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <Percent className="h-5 w-5 text-steel-600" />
                    Estructura de Costes
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800 font-medium">Costes Variables</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="w-[55%] h-full bg-warning-500"></div>
                        </div>
                        <span className="text-warning-600 font-semibold">55.2%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800 font-medium">Costes Fijos</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="w-[32%] h-full bg-danger-500"></div>
                        </div>
                        <span className="text-danger-600 font-semibold">31.8%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800 font-medium">Margen Operativo</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="w-[13%] h-full bg-success-500"></div>
                        </div>
                        <span className="text-success-600 font-semibold">13.0%</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </section>
          )}

          {/* Vista Waterfall */}
          {viewMode === 'waterfall' && (
            <section>
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 shadow-xl shadow-steel/10 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-steel-600" />
                  Análisis de Cascada Analítico
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={waterfallData}>
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#334155', fontSize: 12 }} 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                      <YAxis tick={{ fill: '#334155' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          borderRadius: '12px',
                          color: '#334155',
                          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.2)'
                        }} 
                        formatter={(value: any) => [`${value}K€`, 'Valor']}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(var(--success))"
                        stroke="hsl(var(--border))"
                        strokeWidth={1}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke="hsl(var(--steel))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--steel))', strokeWidth: 2, r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
