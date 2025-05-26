
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Gauge } from 'lucide-react';

interface CashFlowItem {
  concept: string;
  currentPeriod: number;
  previousPeriod: number;
  variationPercent: number;
  sparklineData: number[];
  category: 'operating' | 'investing' | 'financing' | 'total';
  level: number;
}

export const CashFlowCurrentModule = () => {
  const [viewMode, setViewMode] = useState<'table' | 'waterfall' | 'evolution'>('table');

  const cashFlowData: CashFlowItem[] = [
    {
      concept: 'FLUJOS DE EFECTIVO DE LAS ACTIVIDADES DE EXPLOTACIÓN',
      currentPeriod: 485000,
      previousPeriod: 412000,
      variationPercent: 17.7,
      sparklineData: [380, 390, 412, 430, 450, 465, 475, 485],
      category: 'operating',
      level: 1
    },
    {
      concept: 'Resultado del ejercicio antes de impuestos',
      currentPeriod: 280000,
      previousPeriod: 254000,
      variationPercent: 10.2,
      sparklineData: [245, 250, 254, 260, 265, 270, 275, 280],
      category: 'operating',
      level: 2
    },
    {
      concept: 'Ajustes del resultado',
      currentPeriod: 135000,
      previousPeriod: 125000,
      variationPercent: 8.0,
      sparklineData: [120, 122, 125, 128, 130, 132, 133, 135],
      category: 'operating',
      level: 2
    },
    {
      concept: '  Amortización del inmovilizado',
      currentPeriod: 125000,
      previousPeriod: 115000,
      variationPercent: 8.7,
      sparklineData: [110, 112, 115, 118, 120, 122, 123, 125],
      category: 'operating',
      level: 3
    },
    {
      concept: '  Provisiones',
      currentPeriod: 10000,
      previousPeriod: 10000,
      variationPercent: 0.0,
      sparklineData: [10, 10, 10, 10, 10, 10, 10, 10],
      category: 'operating',
      level: 3
    },
    {
      concept: 'Cambios en el capital corriente',
      currentPeriod: -45000,
      previousPeriod: -52000,
      variationPercent: -13.5,
      sparklineData: [-60, -58, -52, -50, -48, -46, -45, -45],
      category: 'operating',
      level: 2
    },
    {
      concept: 'Otros flujos de efectivo de las actividades de explotación',
      currentPeriod: 115000,
      previousPeriod: 85000,
      variationPercent: 35.3,
      sparklineData: [75, 78, 85, 95, 105, 110, 112, 115],
      category: 'operating',
      level: 2
    },
    {
      concept: 'FLUJOS DE EFECTIVO DE LAS ACTIVIDADES DE INVERSIÓN',
      currentPeriod: -185000,
      previousPeriod: -95000,
      variationPercent: 94.7,
      sparklineData: [-80, -85, -95, -120, -150, -170, -180, -185],
      category: 'investing',
      level: 1
    },
    {
      concept: 'Pagos por inversiones',
      currentPeriod: -200000,
      previousPeriod: -100000,
      variationPercent: 100.0,
      sparklineData: [-85, -90, -100, -125, -155, -175, -190, -200],
      category: 'investing',
      level: 2
    },
    {
      concept: 'Cobros por desinversiones',
      currentPeriod: 15000,
      previousPeriod: 5000,
      variationPercent: 200.0,
      sparklineData: [3, 4, 5, 8, 10, 12, 14, 15],
      category: 'investing',
      level: 2
    },
    {
      concept: 'FLUJOS DE EFECTIVO DE LAS ACTIVIDADES DE FINANCIACIÓN',
      currentPeriod: -125000,
      previousPeriod: -180000,
      variationPercent: -30.6,
      sparklineData: [-200, -195, -180, -165, -150, -135, -130, -125],
      category: 'financing',
      level: 1
    },
    {
      concept: 'Cobros y pagos por instrumentos de patrimonio',
      currentPeriod: 50000,
      previousPeriod: 0,
      variationPercent: 0,
      sparklineData: [0, 0, 0, 10, 25, 35, 45, 50],
      category: 'financing',
      level: 2
    },
    {
      concept: 'Cobros y pagos por instrumentos de pasivo financiero',
      currentPeriod: -105000,
      previousPeriod: -120000,
      variationPercent: -12.5,
      sparklineData: [-130, -128, -120, -115, -110, -107, -106, -105],
      category: 'financing',
      level: 2
    },
    {
      concept: 'Pagos por dividendos y remuneraciones',
      currentPeriod: -70000,
      previousPeriod: -60000,
      variationPercent: 16.7,
      sparklineData: [-55, -57, -60, -62, -65, -67, -68, -70],
      category: 'financing',
      level: 2
    },
    {
      concept: 'AUMENTO/DISMINUCIÓN NETA DEL EFECTIVO',
      currentPeriod: 175000,
      previousPeriod: 137000,
      variationPercent: 27.7,
      sparklineData: [100, 110, 137, 145, 155, 165, 170, 175],
      category: 'total',
      level: 1
    },
    {
      concept: 'Efectivo al comienzo del ejercicio',
      currentPeriod: 89000,
      previousPeriod: 52000,
      variationPercent: 71.2,
      sparklineData: [30, 35, 52, 60, 70, 80, 85, 89],
      category: 'total',
      level: 2
    },
    {
      concept: 'EFECTIVO AL FINAL DEL EJERCICIO',
      currentPeriod: 264000,
      previousPeriod: 189000,
      variationPercent: 39.7,
      sparklineData: [130, 145, 189, 205, 225, 245, 255, 264],
      category: 'total',
      level: 1
    }
  ];

  const waterfallData = [
    { name: 'Efectivo Inicial', value: 89, cumulative: 89 },
    { name: 'Flujo Operativo', value: 485, cumulative: 574 },
    { name: 'Flujo Inversión', value: -185, cumulative: 389 },
    { name: 'Flujo Financiación', value: -125, cumulative: 264 },
    { name: 'Efectivo Final', value: 264, cumulative: 264 }
  ];

  const evolutionData = [
    { periodo: 'T1', operativo: 95, inversion: -15, financiacion: -35, neto: 45 },
    { periodo: 'T2', operativo: 110, inversion: -25, financiacion: -40, neto: 45 },
    { periodo: 'T3', operativo: 125, inversion: -35, financiacion: -45, neto: 45 },
    { periodo: 'T4', operativo: 155, inversion: -110, financiacion: -5, neto: 40 }
  ];

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K€`;
    }
    return `${value.toLocaleString()}€`;
  };

  const getRowStyle = (category: string, level: number) => {
    const baseStyle = level === 2 ? 'pl-8 ' : level === 3 ? 'pl-16 ' : '';
    switch (category) {
      case 'operating': return baseStyle + 'bg-emerald-500/10 border-l-4 border-emerald-400';
      case 'investing': return baseStyle + 'bg-orange-500/10 border-l-4 border-orange-400';
      case 'financing': return baseStyle + 'bg-purple-500/10 border-l-4 border-purple-400';
      case 'total': return baseStyle + 'bg-blue-500/10 border-l-4 border-blue-400 font-semibold';
      default: return baseStyle;
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
                    <TrendingUp className="h-6 w-6 text-teal-400" />
                  </div>
                  Estado de Flujos de Efectivo - Situación Actual
                </h1>
                <p className="text-gray-400">Análisis del Estado de Flujos de Efectivo según Plan General Contable (ICAC)</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  onClick={() => setViewMode('table')}
                  className="border-gray-600"
                >
                  <Gauge className="h-4 w-4 mr-2" />
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
                  variant={viewMode === 'evolution' ? 'default' : 'outline'}
                  onClick={() => setViewMode('evolution')}
                  className="border-gray-600"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Evolución
                </Button>
              </div>
            </div>
          </section>

          {/* Vista de Tabla */}
          {viewMode === 'table' && (
            <section className="relative z-10">
              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Estado de Flujos de Efectivo Detallado</h3>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-600">
                          <TableHead className="text-white font-semibold">Concepto</TableHead>
                          <TableHead className="text-white font-semibold text-right">Periodo Actual</TableHead>
                          <TableHead className="text-white font-semibold text-right">Periodo Anterior</TableHead>
                          <TableHead className="text-white font-semibold text-right">% Variación</TableHead>
                          <TableHead className="text-white font-semibold text-center">Tendencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashFlowData.map((item, index) => (
                          <TableRow 
                            key={index} 
                            className={`border-gray-600 hover:bg-white/5 ${getRowStyle(item.category, item.level)}`}
                          >
                            <TableCell className="text-white font-medium">{item.concept}</TableCell>
                            <TableCell className="text-right text-white">
                              {formatCurrency(item.currentPeriod)}
                            </TableCell>
                            <TableCell className="text-right text-gray-300">
                              {formatCurrency(item.previousPeriod)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant="outline" 
                                className={item.variationPercent >= 0 
                                  ? 'text-emerald-400 border-emerald-400' 
                                  : 'text-red-400 border-red-400'
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
                                      stroke={item.category === 'operating' || item.category === 'total' ? '#10b981' : 
                                              item.category === 'investing' ? '#f97316' : '#a855f7'}
                                      fill={item.category === 'operating' || item.category === 'total' ? '#10b981' : 
                                            item.category === 'investing' ? '#f97316' : '#a855f7'}
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
                <h3 className="text-lg font-semibold text-white mb-6">Cascada de Flujos de Efectivo</h3>
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

          {/* Vista Evolución */}
          {viewMode === 'evolution' && (
            <section className="relative z-10">
              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Evolución Trimestral de Flujos</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={evolutionData}>
                      <XAxis dataKey="periodo" tick={{ fill: '#d1d5db' }} />
                      <YAxis tick={{ fill: '#d1d5db' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                        formatter={(value: any) => [`${value}K€`, '']}
                      />
                      <Bar dataKey="operativo" fill="#10b981" name="Flujo Operativo" />
                      <Bar dataKey="inversion" fill="#f97316" name="Flujo Inversión" />
                      <Bar dataKey="financiacion" fill="#a855f7" name="Flujo Financiación" />
                      <Line 
                        type="monotone" 
                        dataKey="neto" 
                        stroke="#60a5fa" 
                        strokeWidth={3}
                        name="Flujo Neto"
                        dot={{ fill: '#60a5fa', strokeWidth: 2, r: 4 }}
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
