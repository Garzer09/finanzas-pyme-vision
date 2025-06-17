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

  const categories = [
    { id: 'all', label: 'Todos', color: 'steel-blue' },
    { id: 'liquidity', label: 'Liquidez', color: 'steel-blue-light' },
    { id: 'solvency', label: 'Solvencia', color: 'steel-blue-dark' },
    { id: 'efficiency', label: 'Eficiencia', color: 'gray-600' },
    { id: 'profitability', label: 'Rentabilidad', color: 'gray-700' }
  ];

  const getStatusIcon = (ratio: FinancialRatio) => {
    const { currentValue, threshold } = ratio;
    if (currentValue >= threshold.optimal[0] && currentValue <= threshold.optimal[1]) {
      return <CheckCircle className="h-4 w-4 text-steel-blue" />;
    }
    if (currentValue >= threshold.warning[0] && currentValue <= threshold.warning[1]) {
      return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
    return <XCircle className="h-4 w-4 text-steel-blue-dark" />;
  };

  const getStatusColor = (ratio: FinancialRatio) => {
    const { currentValue, threshold } = ratio;
    if (currentValue >= threshold.optimal[0] && currentValue <= threshold.optimal[1]) {
      return 'bg-steel-blue/10 text-steel-blue border-steel-blue/30';
    }
    if (currentValue >= threshold.warning[0] && currentValue <= threshold.warning[1]) {
      return 'bg-gray-100 text-gray-700 border-gray-300';
    }
    return 'bg-steel-blue-dark/10 text-steel-blue-dark border-steel-blue-dark/30';
  };

  const filteredRatios = selectedCategory === 'all' 
    ? ratiosData 
    : ratiosData.filter(ratio => ratio.category === selectedCategory);

  return (
    <div className="flex min-h-screen bg-white" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto bg-light-gray-50">
          <section>
            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Ratios Financieros Actualizados</h1>
                <p className="text-gray-600">Análisis en tiempo real de los principales indicadores financieros</p>
              </div>
              
              <div className="flex gap-3">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={selectedCategory === category.id 
                      ? 'bg-steel-blue hover:bg-steel-blue-dark text-white border-steel-blue'
                      : 'bg-white hover:bg-steel-blue/10 border-light-gray-200 text-gray-700 hover:text-steel-blue'
                    }
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="flex gap-3 mb-6">
              {['table', 'gauges', 'heatmap'].map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(mode as any)}
                  className={viewMode === mode 
                    ? 'bg-steel-blue hover:bg-steel-blue-dark text-white'
                    : 'bg-white hover:bg-steel-blue/10 border-light-gray-200 text-gray-700'
                  }
                >
                  {mode === 'table' ? 'Tabla' : mode === 'gauges' ? 'Medidores' : 'Mapa de Calor'}
                </Button>
              ))}
            </div>
          </section>

          {viewMode === 'table' && (
            <section>
              <Card className="bg-white border border-light-gray-200 shadow-sm">
                <div className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-900 font-semibold">Ratio</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Valor Actual</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Valor Anterior</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Cambio</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Estado</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Tendencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRatios.map((ratio) => {
                        const change = ratio.currentValue - ratio.previousValue;
                        const changePercent = ((change / ratio.previousValue) * 100).toFixed(1);
                        
                        return (
                          <TableRow key={ratio.id} className="hover:bg-light-gray-50">
                            <TableCell>
                              <div>
                                <div className="font-medium text-gray-900">{ratio.name}</div>
                                <div className="text-sm text-gray-600">{ratio.formula}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-gray-900">
                                {ratio.currentValue.toFixed(2)}{ratio.unit}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-gray-600">
                                {ratio.previousValue.toFixed(2)}{ratio.unit}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1 ${
                                change >= 0 ? 'text-steel-blue' : 'text-steel-blue-dark'
                              }`}>
                                <TrendingUp className={`h-3 w-3 ${change < 0 ? 'rotate-180' : ''}`} />
                                <span className="font-medium">
                                  {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent}%)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(ratio)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(ratio)}
                                  <span className="text-xs">
                                    {(() => {
                                      const { currentValue, threshold } = ratio;
                                      if (currentValue >= threshold.optimal[0] && currentValue <= threshold.optimal[1]) {
                                        return 'Óptimo';
                                      }
                                      if (currentValue >= threshold.warning[0] && currentValue <= threshold.warning[1]) {
                                        return 'Aceptable';
                                      }
                                      return 'Atención';
                                    })()}
                                  </span>
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="w-20 h-8">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={ratio.sparklineData.map((value, index) => ({ value, index }))}>
                                    <Line 
                                      type="monotone" 
                                      dataKey="value" 
                                      stroke="#4682B4" 
                                      strokeWidth={2}
                                      dot={false}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </section>
          )}

          {viewMode === 'gauges' && (
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRatios.map((ratio) => (
                  <Card key={ratio.id} className="bg-white border border-light-gray-200 p-6 shadow-sm">
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900 mb-2">{ratio.name}</h3>
                      <div className="h-32 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" 
                            data={[{ value: (ratio.currentValue / ratio.threshold.optimal[1]) * 100 }]}>
                            <RadialBar dataKey="value" cornerRadius={10} fill="#4682B4" />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {ratio.currentValue.toFixed(2)}{ratio.unit}
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(ratio)}
                        <Badge className={getStatusColor(ratio)}>
                          {(() => {
                            const { currentValue, threshold } = ratio;
                            if (currentValue >= threshold.optimal[0] && currentValue <= threshold.optimal[1]) {
                              return 'Óptimo';
                            }
                            if (currentValue >= threshold.warning[0] && currentValue <= threshold.warning[1]) {
                              return 'Aceptable';
                            }
                            return 'Atención';
                          })()}
                        </Badge>
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
