
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Treemap, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Building2, TrendingUp, Layers, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface BalanceItem {
  concept: string;
  currentYear: number;
  previousYear: number;
  verticalPercent: number;
  horizontalPercent: number;
  category: 'asset' | 'liability' | 'equity';
  subCategory: string;
}

export const BalanceSheetCurrentModule = () => {
  const [viewMode, setViewMode] = useState<'table' | 'structure' | 'treemap'>('table');
  const [showPercentages, setShowPercentages] = useState<'vertical' | 'horizontal'>('vertical');

  const balanceData: BalanceItem[] = [
    // ACTIVO
    {
      concept: 'ACTIVO NO CORRIENTE',
      currentYear: 1250000,
      previousYear: 1180000,
      verticalPercent: 52.1,
      horizontalPercent: 5.9,
      category: 'asset',
      subCategory: 'non_current'
    },
    {
      concept: 'Inmovilizado Material',
      currentYear: 980000,
      previousYear: 920000,
      verticalPercent: 40.8,
      horizontalPercent: 6.5,
      category: 'asset',
      subCategory: 'tangible'
    },
    {
      concept: 'Inmovilizado Intangible',
      currentYear: 150000,
      previousYear: 140000,
      verticalPercent: 6.3,
      horizontalPercent: 7.1,
      category: 'asset',
      subCategory: 'intangible'
    },
    {
      concept: 'Inversiones Financieras L/P',
      currentYear: 120000,
      previousYear: 120000,
      verticalPercent: 5.0,
      horizontalPercent: 0.0,
      category: 'asset',
      subCategory: 'financial'
    },
    {
      concept: 'ACTIVO CORRIENTE',
      currentYear: 1150000,
      previousYear: 1020000,
      verticalPercent: 47.9,
      horizontalPercent: 12.7,
      category: 'asset',
      subCategory: 'current'
    },
    {
      concept: 'Existencias',
      currentYear: 380000,
      previousYear: 350000,
      verticalPercent: 15.8,
      horizontalPercent: 8.6,
      category: 'asset',
      subCategory: 'inventory'
    },
    {
      concept: 'Deudores Comerciales',
      currentYear: 420000,
      previousYear: 380000,
      verticalPercent: 17.5,
      horizontalPercent: 10.5,
      category: 'asset',
      subCategory: 'receivables'
    },
    {
      concept: 'Tesorería',
      currentYear: 350000,
      previousYear: 290000,
      verticalPercent: 14.6,
      horizontalPercent: 20.7,
      category: 'asset',
      subCategory: 'cash'
    },
    // PASIVO
    {
      concept: 'PATRIMONIO NETO',
      currentYear: 960000,
      previousYear: 850000,
      verticalPercent: 40.0,
      horizontalPercent: 12.9,
      category: 'equity',
      subCategory: 'equity'
    },
    {
      concept: 'Capital Social',
      currentYear: 600000,
      previousYear: 600000,
      verticalPercent: 25.0,
      horizontalPercent: 0.0,
      category: 'equity',
      subCategory: 'capital'
    },
    {
      concept: 'Reservas',
      currentYear: 150000,
      previousYear: 60000,
      verticalPercent: 6.3,
      horizontalPercent: 150.0,
      category: 'equity',
      subCategory: 'reserves'
    },
    {
      concept: 'Resultado del Ejercicio',
      currentYear: 210000,
      previousYear: 190000,
      verticalPercent: 8.8,
      horizontalPercent: 10.5,
      category: 'equity',
      subCategory: 'profit'
    },
    {
      concept: 'PASIVO NO CORRIENTE',
      currentYear: 850000,
      previousYear: 800000,
      verticalPercent: 35.4,
      horizontalPercent: 6.3,
      category: 'liability',
      subCategory: 'non_current'
    },
    {
      concept: 'Deudas L/P con Entidades de Crédito',
      currentYear: 720000,
      previousYear: 680000,
      verticalPercent: 30.0,
      horizontalPercent: 5.9,
      category: 'liability',
      subCategory: 'long_debt'
    },
    {
      concept: 'Otras Deudas L/P',
      currentYear: 130000,
      previousYear: 120000,
      verticalPercent: 5.4,
      horizontalPercent: 8.3,
      category: 'liability',
      subCategory: 'other_long'
    },
    {
      concept: 'PASIVO CORRIENTE',
      currentYear: 590000,
      previousYear: 550000,
      verticalPercent: 24.6,
      horizontalPercent: 7.3,
      category: 'liability',
      subCategory: 'current'
    },
    {
      concept: 'Deudas C/P con Entidades de Crédito',
      currentYear: 280000,
      previousYear: 260000,
      verticalPercent: 11.7,
      horizontalPercent: 7.7,
      category: 'liability',
      subCategory: 'short_debt'
    },
    {
      concept: 'Acreedores Comerciales',
      currentYear: 310000,
      previousYear: 290000,
      verticalPercent: 12.9,
      horizontalPercent: 6.9,
      category: 'liability',
      subCategory: 'payables'
    }
  ];

  const treemapData = [
    { name: 'Inmovilizado Material', size: 980000, color: '#3b82f6', parent: 'Activo No Corriente' },
    { name: 'Inmovilizado Intangible', size: 150000, color: '#1d4ed8', parent: 'Activo No Corriente' },
    { name: 'Inversiones Financieras', size: 120000, color: '#1e40af', parent: 'Activo No Corriente' },
    { name: 'Existencias', size: 380000, color: '#10b981', parent: 'Activo Corriente' },
    { name: 'Deudores', size: 420000, color: '#059669', parent: 'Activo Corriente' },
    { name: 'Tesorería', size: 350000, color: '#047857', parent: 'Activo Corriente' }
  ];

  const structureData = [
    { name: 'Patrimonio Neto', value: 960000, percentage: 40.0, color: '#10b981' },
    { name: 'Pasivo No Corriente', value: 850000, percentage: 35.4, color: '#f59e0b' },
    { name: 'Pasivo Corriente', value: 590000, percentage: 24.6, color: '#ef4444' }
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
      case 'asset': return 'bg-blue-500/10 border-l-4 border-blue-400';
      case 'liability': return 'bg-red-500/10 border-l-4 border-red-400';
      case 'equity': return 'bg-emerald-500/10 border-l-4 border-emerald-400';
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
                  <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30">
                    <Building2 className="h-6 w-6 text-blue-400" />
                  </div>
                  Balance de Situación - Actual
                </h1>
                <p className="text-gray-400">Análisis de la estructura patrimonial según Plan General Contable</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  onClick={() => setViewMode('table')}
                  className="border-gray-600"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Tabla
                </Button>
                <Button
                  variant={viewMode === 'structure' ? 'default' : 'outline'}
                  onClick={() => setViewMode('structure')}
                  className="border-gray-600"
                >
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Estructura
                </Button>
                <Button
                  variant={viewMode === 'treemap' ? 'default' : 'outline'}
                  onClick={() => setViewMode('treemap')}
                  className="border-gray-600"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Treemap
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
                    <h3 className="text-lg font-semibold text-white">Balance de Situación Detallado</h3>
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
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-600">
                          <TableHead className="text-white font-semibold">Concepto</TableHead>
                          <TableHead className="text-white font-semibold text-right">Año Actual</TableHead>
                          <TableHead className="text-white font-semibold text-right">Año Anterior</TableHead>
                          <TableHead className="text-white font-semibold text-right">
                            {showPercentages === 'vertical' ? '% s/Total' : '% Variación'}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balanceData.map((item, index) => (
                          <TableRow key={index} className={`border-gray-600 hover:bg-white/5 ${getRowStyle(item.category)}`}>
                            <TableCell className="text-white font-medium">{item.concept}</TableCell>
                            <TableCell className="text-right text-white">
                              {formatCurrency(item.currentYear)}
                            </TableCell>
                            <TableCell className="text-right text-gray-300">
                              {formatCurrency(item.previousYear)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-semibold ${
                                showPercentages === 'vertical' 
                                  ? 'text-blue-400' 
                                  : item.horizontalPercent >= 0 
                                    ? 'text-emerald-400' 
                                    : 'text-red-400'
                              }`}>
                                {showPercentages === 'vertical' 
                                  ? `${item.verticalPercent.toFixed(1)}%`
                                  : `${item.horizontalPercent >= 0 ? '+' : ''}${item.horizontalPercent.toFixed(1)}%`
                                }
                              </span>
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

          {/* Vista de Estructura */}
          {viewMode === 'structure' && (
            <section className="relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Estructura de Financiación</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={structureData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {structureData.map((entry, index) => (
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
                          formatter={(value: any) => [`${formatCurrency(value)} (${structureData.find(s => s.value === value)?.percentage}%)`, 'Importe']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Ratios de Estructura</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Ratio de Autonomía</span>
                        <span className="text-white font-semibold">40.0%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full">
                        <div className="h-2 bg-emerald-400 rounded-full" style={{width: '40%'}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Ratio de Endeudamiento</span>
                        <span className="text-white font-semibold">60.0%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full">
                        <div className="h-2 bg-orange-400 rounded-full" style={{width: '60%'}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Ratio de Liquidez</span>
                        <span className="text-white font-semibold">1.95x</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full">
                        <div className="h-2 bg-blue-400 rounded-full" style={{width: '95%'}}></div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </section>
          )}

          {/* Vista Treemap */}
          {viewMode === 'treemap' && (
            <section className="relative z-10">
              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Composición del Activo (Treemap)</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={treemapData}
                      dataKey="size"
                      ratio={4/3}
                      stroke="#fff"
                      strokeWidth={2}
                      content={({ x, y, width, height, name, size }) => (
                        <g>
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={treemapData.find(item => item.name === name)?.color}
                            fillOpacity={0.8}
                          />
                          {width > 100 && height > 50 && (
                            <>
                              <text
                                x={x + width / 2}
                                y={y + height / 2 - 10}
                                textAnchor="middle"
                                fill="#fff"
                                fontSize="12"
                                fontWeight="bold"
                              >
                                {name}
                              </text>
                              <text
                                x={x + width / 2}
                                y={y + height / 2 + 10}
                                textAnchor="middle"
                                fill="#fff"
                                fontSize="10"
                              >
                                {formatCurrency(size)}
                              </text>
                            </>
                          )}
                        </g>
                      )}
                    />
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
