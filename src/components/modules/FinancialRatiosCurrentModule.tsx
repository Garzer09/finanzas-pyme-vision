
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, ResponsiveContainer, RadialBarChart, RadialBar, Legend, Cell } from 'recharts';
import { Calculator, Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface FinancialRatio {
  id: string;
  name: string;
  formula: string;
  currentValue: number;
  previousValue: number;
  threshold: { optimal: [number, number]; warning: [number, number] };
  sparklineData: number[];
  category: 'liquidity' | 'solvency' | 'efficiency' | 'profitability';
  unit: string;
}

export const FinancialRatiosCurrentModule = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'gauges' | 'heatmap'>('table');

  const ratiosData: FinancialRatio[] = [
    // Ratios de Liquidez
    {
      id: 'current_ratio',
      name: 'Ratio de Liquidez',
      formula: 'Activo Corriente / Pasivo Corriente',
      currentValue: 1.95,
      previousValue: 1.85,
      threshold: { optimal: [1.2, 2.0], warning: [1.0, 2.5] },
      sparklineData: [1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95],
      category: 'liquidity',
      unit: 'x'
    },
    {
      id: 'quick_ratio',
      name: 'Ratio de Liquidez Inmediata',
      formula: '(Activo Corriente - Existencias) / Pasivo Corriente',
      currentValue: 1.31,
      previousValue: 1.22,
      threshold: { optimal: [0.8, 1.5], warning: [0.6, 2.0] },
      sparklineData: [1.1, 1.15, 1.2, 1.25, 1.28, 1.3, 1.31, 1.31],
      category: 'liquidity',
      unit: 'x'
    },
    {
      id: 'cash_ratio',
      name: 'Ratio de Tesorería',
      formula: 'Tesorería / Pasivo Corriente',
      currentValue: 0.59,
      previousValue: 0.53,
      threshold: { optimal: [0.2, 0.8], warning: [0.1, 1.0] },
      sparklineData: [0.45, 0.48, 0.5, 0.52, 0.55, 0.57, 0.58, 0.59],
      category: 'liquidity',
      unit: 'x'
    },
    // Ratios de Solvencia
    {
      id: 'debt_equity',
      name: 'Ratio Deuda/Patrimonio',
      formula: 'Pasivo Total / Patrimonio Neto',
      currentValue: 1.5,
      previousValue: 1.59,
      threshold: { optimal: [0.5, 1.0], warning: [0.3, 1.5] },
      sparklineData: [1.7, 1.68, 1.65, 1.62, 1.6, 1.58, 1.55, 1.5],
      category: 'solvency',
      unit: 'x'
    },
    {
      id: 'debt_assets',
      name: 'Ratio de Endeudamiento',
      formula: 'Pasivo Total / Activo Total',
      currentValue: 0.6,
      previousValue: 0.61,
      threshold: { optimal: [0.3, 0.6], warning: [0.2, 0.7] },
      sparklineData: [0.63, 0.625, 0.62, 0.615, 0.61, 0.608, 0.605, 0.6],
      category: 'solvency',
      unit: '%'
    },
    // Ratios de Eficiencia
    {
      id: 'receivables_turnover',
      name: 'Rotación de Clientes',
      formula: 'Ventas / Clientes',
      currentValue: 5.95,
      previousValue: 5.87,
      threshold: { optimal: [4.0, 8.0], warning: [3.0, 10.0] },
      sparklineData: [5.6, 5.65, 5.7, 5.75, 5.8, 5.85, 5.9, 5.95],
      category: 'efficiency',
      unit: 'x'
    },
    {
      id: 'inventory_turnover',
      name: 'Rotación de Existencias',
      formula: 'Coste de Ventas / Existencias',
      currentValue: 3.16,
      previousValue: 3.06,
      threshold: { optimal: [3.0, 6.0], warning: [2.0, 8.0] },
      sparklineData: [2.9, 2.95, 3.0, 3.05, 3.08, 3.1, 3.13, 3.16],
      category: 'efficiency',
      unit: 'x'
    },
    // Ratios de Rentabilidad
    {
      id: 'roe',
      name: 'Rentabilidad sobre Patrimonio (ROE)',
      formula: 'Beneficio Neto / Patrimonio Neto',
      currentValue: 21.9,
      previousValue: 22.4,
      threshold: { optimal: [15.0, 25.0], warning: [10.0, 30.0] },
      sparklineData: [21.5, 21.8, 22.0, 22.2, 22.1, 21.9, 21.8, 21.9],
      category: 'profitability',
      unit: '%'
    },
    {
      id: 'roa',
      name: 'Rentabilidad sobre Activos (ROA)',
      formula: 'Beneficio Neto / Activo Total',
      currentValue: 8.75,
      previousValue: 8.64,
      threshold: { optimal: [5.0, 12.0], warning: [3.0, 15.0] },
      sparklineData: [8.2, 8.3, 8.4, 8.5, 8.6, 8.65, 8.7, 8.75],
      category: 'profitability',
      unit: '%'
    }
  ];

  const getStatusIcon = (value: number, threshold: any) => {
    if (value >= threshold.optimal[0] && value <= threshold.optimal[1]) {
      return <CheckCircle className="h-5 w-5 text-emerald-400" />;
    } else if (value >= threshold.warning[0] && value <= threshold.warning[1]) {
      return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-400" />;
    }
  };

  const getStatusColor = (value: number, threshold: any) => {
    if (value >= threshold.optimal[0] && value <= threshold.optimal[1]) {
      return 'text-emerald-400 border-emerald-400';
    } else if (value >= threshold.warning[0] && value <= threshold.warning[1]) {
      return 'text-yellow-400 border-yellow-400';
    } else {
      return 'text-red-400 border-red-400';
    }
  };

  const getGaugeData = (ratio: FinancialRatio) => {
    const max = Math.max(ratio.threshold.warning[1], ratio.currentValue * 1.2);
    const percentage = (ratio.currentValue / max) * 100;
    
    return [
      {
        name: ratio.name,
        value: percentage,
        fill: ratio.currentValue >= ratio.threshold.optimal[0] && ratio.currentValue <= ratio.threshold.optimal[1] 
          ? '#10b981' 
          : ratio.currentValue >= ratio.threshold.warning[0] && ratio.currentValue <= ratio.threshold.warning[1]
          ? '#f59e0b' 
          : '#ef4444'
      }
    ];
  };

  const filteredRatios = selectedCategory === 'all' 
    ? ratiosData 
    : ratiosData.filter(ratio => ratio.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'Todos', color: 'bg-gray-600' },
    { id: 'liquidity', name: 'Liquidez', color: 'bg-blue-600' },
    { id: 'solvency', name: 'Solvencia', color: 'bg-purple-600' },
    { id: 'efficiency', name: 'Eficiencia', color: 'bg-green-600' },
    { id: 'profitability', name: 'Rentabilidad', color: 'bg-yellow-600' }
  ];

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
                  <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-400/30">
                    <Calculator className="h-6 w-6 text-purple-400" />
                  </div>
                  Análisis de Ratios Financieros - Situación Actual
                </h1>
                <p className="text-gray-400">Indicadores clave de liquidez, solvencia, eficiencia y rentabilidad</p>
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
                  variant={viewMode === 'gauges' ? 'default' : 'outline'}
                  onClick={() => setViewMode('gauges')}
                  className="border-gray-600"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Velocímetros
                </Button>
              </div>
            </div>
          </section>

          {/* Filtros por categoría */}
          <section className="relative z-10">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`border-gray-600 ${selectedCategory === category.id ? category.color : ''}`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </section>

          {/* Vista de Tabla */}
          {viewMode === 'table' && (
            <section className="relative z-10">
              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Análisis Detallado de Ratios</h3>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-600">
                          <TableHead className="text-white font-semibold">Ratio</TableHead>
                          <TableHead className="text-white font-semibold">Fórmula</TableHead>
                          <TableHead className="text-white font-semibold text-right">Valor Actual</TableHead>
                          <TableHead className="text-white font-semibold text-right">Anterior</TableHead>
                          <TableHead className="text-white font-semibold text-center">Estado</TableHead>
                          <TableHead className="text-white font-semibold text-center">Tendencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRatios.map((ratio) => (
                          <TableRow key={ratio.id} className="border-gray-600 hover:bg-white/5">
                            <TableCell className="text-white font-medium">{ratio.name}</TableCell>
                            <TableCell className="text-gray-300 text-sm font-mono">{ratio.formula}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className={getStatusColor(ratio.currentValue, ratio.threshold)}>
                                {ratio.currentValue.toFixed(2)}{ratio.unit}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-gray-300">
                              {ratio.previousValue.toFixed(2)}{ratio.unit}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusIcon(ratio.currentValue, ratio.threshold)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="h-8 w-16 mx-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={ratio.sparklineData.map(value => ({ value }))}>
                                    <Line 
                                      type="monotone" 
                                      dataKey="value" 
                                      stroke={ratio.currentValue > ratio.previousValue ? '#10b981' : '#ef4444'}
                                      strokeWidth={2}
                                      dot={false}
                                    />
                                  </LineChart>
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

          {/* Vista de Velocímetros */}
          {viewMode === 'gauges' && (
            <section className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRatios.map((ratio) => (
                  <Card key={ratio.id} className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-2">{ratio.name}</h3>
                      <div className="h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart 
                            cx="50%" 
                            cy="50%" 
                            innerRadius="60%" 
                            outerRadius="90%" 
                            data={getGaugeData(ratio)}
                            startAngle={180} 
                            endAngle={0}
                          >
                            <RadialBar 
                              dataKey="value" 
                              cornerRadius={10} 
                              fill={getGaugeData(ratio)[0].fill}
                            />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center mt-12">
                            <div className="text-2xl font-bold text-white">
                              {ratio.currentValue.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-400">{ratio.unit}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Óptimo:</span>
                          <span className="text-emerald-400">
                            {ratio.threshold.optimal[0]} - {ratio.threshold.optimal[1]}{ratio.unit}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Anterior:</span>
                          <span className="text-gray-300">
                            {ratio.previousValue.toFixed(2)}{ratio.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-3">
                          {getStatusIcon(ratio.currentValue, ratio.threshold)}
                          <span className={`text-sm font-medium ${getStatusColor(ratio.currentValue, ratio.threshold).split(' ')[0]}`}>
                            {ratio.currentValue >= ratio.threshold.optimal[0] && ratio.currentValue <= ratio.threshold.optimal[1] 
                              ? 'Óptimo' 
                              : ratio.currentValue >= ratio.threshold.warning[0] && ratio.currentValue <= ratio.threshold.warning[1]
                              ? 'Aceptable'
                              : 'Crítico'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
