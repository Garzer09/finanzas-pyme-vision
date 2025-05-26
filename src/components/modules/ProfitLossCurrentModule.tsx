
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, FileText, Calculator, Percent, Euro, BarChart3 } from 'lucide-react';

interface ProfitLossItem {
  concept: string;
  currentPeriod: number;
  previousPeriod: number;
  verticalPercent: number;
  horizontalPercent: number;
  sparklineData: number[];
  category: 'income' | 'costs' | 'result';
}

export const ProfitLossCurrentModule = () => {
  const [viewMode, setViewMode] = useState<'table' | 'waterfall' | 'composition'>('table');
  const [showPercentages, setShowPercentages] = useState<'vertical' | 'horizontal' | 'none'>('vertical');

  const profitLossData: ProfitLossItem[] = [
    {
      concept: 'Importe Neto de la Cifra de Negocios',
      currentPeriod: 2500000,
      previousPeriod: 2230000,
      verticalPercent: 100.0,
      horizontalPercent: 12.1,
      sparklineData: [2100, 2150, 2200, 2300, 2350, 2400, 2450, 2500],
      category: 'income'
    },
    {
      concept: 'Variación de Existencias',
      currentPeriod: 45000,
      previousPeriod: 32000,
      verticalPercent: 1.8,
      horizontalPercent: 40.6,
      sparklineData: [30, 32, 35, 38, 40, 42, 44, 45],
      category: 'income'
    },
    {
      concept: 'Aprovisionamientos',
      currentPeriod: -1200000,
      previousPeriod: -1070000,
      verticalPercent: -48.0,
      horizontalPercent: 12.1,
      sparklineData: [-1000, -1020, -1050, -1100, -1150, -1180, -1190, -1200],
      category: 'costs'
    },
    {
      concept: 'Gastos de Personal',
      currentPeriod: -680000,
      previousPeriod: -590000,
      verticalPercent: -27.2,
      horizontalPercent: 15.3,
      sparklineData: [-580, -590, -610, -630, -650, -660, -670, -680],
      category: 'costs'
    },
    {
      concept: 'Otros Gastos de Explotación',
      currentPeriod: -215000,
      previousPeriod: -195000,
      verticalPercent: -8.6,
      horizontalPercent: 10.3,
      sparklineData: [-190, -192, -200, -205, -208, -210, -212, -215],
      category: 'costs'
    },
    {
      concept: 'Amortización del Inmovilizado',
      currentPeriod: -125000,
      previousPeriod: -115000,
      verticalPercent: -5.0,
      horizontalPercent: 8.7,
      sparklineData: [-110, -112, -115, -118, -120, -122, -123, -125],
      category: 'costs'
    },
    {
      concept: 'RESULTADO DE EXPLOTACIÓN',
      currentPeriod: 325000,
      previousPeriod: 292000,
      verticalPercent: 13.0,
      horizontalPercent: 11.3,
      sparklineData: [280, 285, 290, 295, 305, 315, 320, 325],
      category: 'result'
    },
    {
      concept: 'Gastos Financieros',
      currentPeriod: -45000,
      previousPeriod: -38000,
      verticalPercent: -1.8,
      horizontalPercent: 18.4,
      sparklineData: [-35, -36, -38, -40, -42, -43, -44, -45],
      category: 'costs'
    },
    {
      concept: 'RESULTADO ANTES DE IMPUESTOS',
      currentPeriod: 280000,
      previousPeriod: 254000,
      verticalPercent: 11.2,
      horizontalPercent: 10.2,
      sparklineData: [245, 250, 252, 255, 265, 272, 275, 280],
      category: 'result'
    },
    {
      concept: 'Impuesto sobre Beneficios',
      currentPeriod: -70000,
      previousPeriod: -63500,
      verticalPercent: -2.8,
      horizontalPercent: 10.2,
      sparklineData: [-61, -62, -63, -64, -66, -68, -69, -70],
      category: 'costs'
    },
    {
      concept: 'RESULTADO DEL EJERCICIO',
      currentPeriod: 210000,
      previousPeriod: 190500,
      verticalPercent: 8.4,
      horizontalPercent: 10.2,
      sparklineData: [184, 188, 189, 191, 199, 204, 206, 210],
      category: 'result'
    }
  ];

  const waterfallData = [
    { name: 'Ventas', value: 2500, cumulative: 2500 },
    { name: 'Aprovisionamientos', value: -1200, cumulative: 1300 },
    { name: 'Personal', value: -680, cumulative: 620 },
    { name: 'Otros Gastos', value: -215, cumulative: 405 },
    { name: 'Amortizaciones', value: -125, cumulative: 280 },
    { name: 'Gastos Financieros', value: -45, cumulative: 235 },
    { name: 'Impuestos', value: -70, cumulative: 165 },
    { name: 'Beneficio Final', value: 210, cumulative: 210 }
  ];

  const expenseComposition = [
    { name: 'Aprovisionamientos', value: 1200, percentage: 55.0, color: '#ef4444' },
    { name: 'Gastos de Personal', value: 680, percentage: 31.2, color: '#f97316' },
    { name: 'Otros Gastos', value: 215, percentage: 9.9, color: '#eab308' },
    { name: 'Amortizaciones', value: 125, percentage: 5.7, color: '#22c55e' },
    { name: 'Gastos Financieros', value: 45, percentage: 2.1, color: '#3b82f6' }
  ];

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K€`;
    }
    return `${value.toLocaleString()}€`;
  };

  const getRowStyle = (category: string) => {
    switch (category) {
      case 'income': return 'bg-emerald-500/10 border-l-4 border-emerald-400';
      case 'costs': return 'bg-red-500/10 border-l-4 border-red-400';
      case 'result': return 'bg-blue-500/10 border-l-4 border-blue-400 font-semibold';
      default: return '';
    }
  };

  return (
    <div className="flex min-h-screen bg-navy-800">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          {/* Header */}
          <section className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/20 border border-teal-400/30">
                    <FileText className="h-6 w-6 text-teal-400" />
                  </div>
                  Cuenta de Pérdidas y Ganancias - Situación Actual
                </h1>
                <p className="text-gray-400">Análisis detallado del P&G según Plan General Contable (ICAC)</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  onClick={() => setViewMode('table')}
                  className="border-gray-600"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Tabla
                </Button>
                <Button
                  variant={viewMode === 'waterfall' ? 'default' : 'outline'}
                  onClick={() => setViewMode('waterfall')}
                  className="border-gray-600"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Cascada
                </Button>
                <Button
                  variant={viewMode === 'composition' ? 'default' : 'outline'}
                  onClick={() => setViewMode('composition')}
                  className="border-gray-600"
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Composición
                </Button>
              </div>
            </div>
          </section>

          {/* Vista de Tabla */}
          {viewMode === 'table' && (
            <section className="relative z-10">
              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Detalle del P&G</h3>
                    <div className="flex gap-2">
                      <Button
                        variant={showPercentages === 'vertical' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowPercentages('vertical')}
                        className="border-gray-600"
                      >
                        % Vertical
                      </Button>
                      <Button
                        variant={showPercentages === 'horizontal' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowPercentages('horizontal')}
                        className="border-gray-600"
                      >
                        % Horizontal
                      </Button>
                      <Button
                        variant={showPercentages === 'none' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowPercentages('none')}
                        className="border-gray-600"
                      >
                        Sin %
                      </Button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-600">
                          <TableHead className="text-white font-semibold">Concepto</TableHead>
                          <TableHead className="text-white font-semibold text-right">Periodo Actual</TableHead>
                          <TableHead className="text-white font-semibold text-right">Periodo Anterior</TableHead>
                          {showPercentages !== 'none' && (
                            <TableHead className="text-white font-semibold text-right">
                              {showPercentages === 'vertical' ? '% s/Ventas' : '% Variación'}
                            </TableHead>
                          )}
                          <TableHead className="text-white font-semibold text-center">Tendencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profitLossData.map((item, index) => (
                          <TableRow key={index} className={`border-gray-600 hover:bg-white/5 ${getRowStyle(item.category)}`}>
                            <TableCell className="text-white font-medium">{item.concept}</TableCell>
                            <TableCell className="text-right text-white">
                              {formatCurrency(item.currentPeriod)}
                            </TableCell>
                            <TableCell className="text-right text-gray-300">
                              {formatCurrency(item.previousPeriod)}
                            </TableCell>
                            {showPercentages !== 'none' && (
                              <TableCell className="text-right">
                                <Badge variant="outline" className={`
                                  ${showPercentages === 'vertical' 
                                    ? 'text-blue-400 border-blue-400' 
                                    : item.horizontalPercent >= 0 
                                      ? 'text-emerald-400 border-emerald-400' 
                                      : 'text-red-400 border-red-400'
                                  }
                                `}>
                                  {showPercentages === 'vertical' 
                                    ? `${item.verticalPercent.toFixed(1)}%`
                                    : `${item.horizontalPercent >= 0 ? '+' : ''}${item.horizontalPercent.toFixed(1)}%`
                                  }
                                </Badge>
                              </TableCell>
                            )}
                            <TableCell className="text-center">
                              <div className="h-8 w-16 mx-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={item.sparklineData.map(value => ({ value }))}>
                                    <Area 
                                      type="monotone" 
                                      dataKey="value" 
                                      stroke={item.category === 'income' ? '#10b981' : item.category === 'costs' ? '#ef4444' : '#3b82f6'}
                                      fill={item.category === 'income' ? '#10b981' : item.category === 'costs' ? '#ef4444' : '#3b82f6'}
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

          {/* Vista Waterfall */}
          {viewMode === 'waterfall' && (
            <section className="relative z-10">
              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Análisis de Cascada (Waterfall)</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={waterfallData}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#d1d5db', fontSize: 12 }} 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fill: '#d1d5db' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                        formatter={(value: any) => [`${value}K€`, 'Valor']}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#10b981"
                        stroke="#fff"
                        strokeWidth={1}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke="#60a5fa" 
                        strokeWidth={3}
                        dot={{ fill: '#60a5fa', strokeWidth: 2, r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </section>
          )}

          {/* Vista Composición */}
          {viewMode === 'composition' && (
            <section className="relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Composición de Gastos</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseComposition}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {expenseComposition.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                          formatter={(value: any, name) => [`${value}K€ (${expenseComposition.find(e => e.name === name)?.percentage}%)`, 'Importe']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Desglose por Categorías</h3>
                  <div className="space-y-4">
                    {expenseComposition.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-white font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{formatCurrency(item.value * 1000)}</div>
                          <div className="text-gray-400 text-sm">{item.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
