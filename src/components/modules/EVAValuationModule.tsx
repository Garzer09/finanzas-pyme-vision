
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ComposedChart, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Info, Calculator, Target, DollarSign, BarChart3, ThumbsUp, ThumbsDown, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const EVAValuationModule = () => {
  const [showEVAInfo, setShowEVAInfo] = useState(false);
  const [showComparisonInfo, setShowComparisonInfo] = useState(false);
  const [activeView, setActiveView] = useState<'table' | 'chart' | 'components'>('table');

  // Datos del EVA calculado
  const evaData = [
    {
      year: 'Año 0',
      ebit: 425000,
      taxRate: 25.0,
      nopat: 318750,
      capitalInvertido: 2800000,
      wacc: 8.5,
      cargoPorCapital: 238000,
      eva: 80750,
      roic: 11.4,
      spread: 2.9
    },
    {
      year: 'Año 1',
      ebit: 516000,
      taxRate: 25.0,
      nopat: 387000,
      capitalInvertido: 3275000,
      wacc: 8.5,
      cargoPorCapital: 278375,
      eva: 108625,
      roic: 11.8,
      spread: 3.3
    },
    {
      year: 'Año 2',
      ebit: 618000,
      taxRate: 25.0,
      nopat: 463500,
      capitalInvertido: 3824000,
      wacc: 8.5,
      cargoPorCapital: 325040,
      eva: 138460,
      roic: 12.1,
      spread: 3.6
    },
    {
      year: 'Año 3',
      ebit: 735000,
      taxRate: 25.0,
      nopat: 551250,
      capitalInvertido: 4458000,
      wacc: 8.5,
      cargoPorCapital: 378930,
      eva: 172320,
      roic: 12.4,
      spread: 3.9
    },
    {
      year: 'Año 4',
      ebit: 867000,
      taxRate: 25.0,
      nopat: 650250,
      capitalInvertido: 5189000,
      wacc: 8.5,
      cargoPorCapital: 441065,
      eva: 209185,
      roic: 12.5,
      spread: 4.0
    },
    {
      year: 'Año 5',
      ebit: 1015000,
      taxRate: 25.0,
      nopat: 761250,
      capitalInvertido: 6030000,
      wacc: 8.5,
      cargoPorCapital: 512550,
      eva: 248700,
      roic: 12.6,
      spread: 4.1
    }
  ];

  // Datos para el gráfico de componentes
  const componentData = evaData.map(item => ({
    year: item.year,
    nopat: item.nopat / 1000,
    cargoPorCapital: -item.cargoPorCapital / 1000,
    eva: item.eva / 1000
  }));

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K€`;
    }
    return `${value.toLocaleString()}€`;
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getEVAIndicator = (eva: number) => {
    if (eva > 0) {
      return {
        icon: ThumbsUp,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-400/30',
        label: 'Creación de Valor'
      };
    } else {
      return {
        icon: ThumbsDown,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-400/30',
        label: 'Destrucción de Valor'
      };
    }
  };

  const summaryCards = [
    {
      title: 'EVA Año Actual',
      value: formatCurrency(evaData[0].eva),
      subtitle: 'Creación de Valor',
      icon: DollarSign,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/30 to-cyan-500/30',
      borderColor: 'border-blue-400/50'
    },
    {
      title: 'EVA Proyectado (Año 5)',
      value: formatCurrency(evaData[5].eva),
      subtitle: 'Crecimiento 208%',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-500/30 to-teal-500/30',
      borderColor: 'border-emerald-400/50'
    },
    {
      title: 'ROIC Actual',
      value: formatPercentage(evaData[0].roic),
      subtitle: `vs WACC ${formatPercentage(evaData[0].wacc)}`,
      icon: Target,
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/30 to-pink-500/30',
      borderColor: 'border-purple-400/50'
    },
    {
      title: 'Spread Promedio',
      value: formatPercentage(evaData.reduce((acc, curr) => acc + curr.spread, 0) / evaData.length),
      subtitle: 'ROIC - WACC',
      icon: BarChart3,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/30 to-red-500/30',
      borderColor: 'border-orange-400/50'
    }
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
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-400/30">
                  <Calculator className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">Valoración EVA (Valor Económico Añadido)</h1>
                  <p className="text-gray-400">Análisis del valor creado por encima del coste de capital</p>
                </div>
                <Dialog open={showEVAInfo} onOpenChange={setShowEVAInfo}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-gray-600">
                      <Info className="h-4 w-4 mr-2" />
                      ¿Qué es el EVA?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-gray-600 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-blue-400">Valor Económico Añadido (EVA)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-300 leading-relaxed">
                        El Valor Económico Añadido (EVA) es una métrica del rendimiento financiero de una empresa 
                        que estima su verdadera ganancia económica. Mide el valor creado por encima del rendimiento 
                        mínimo requerido por los inversores (accionistas y acreedores).
                      </p>
                      <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                        <p className="text-blue-300 font-medium">
                          <strong>EVA positivo</strong> → Creación de valor<br />
                          <strong>EVA negativo</strong> → Destrucción de valor
                        </p>
                      </div>
                      <p className="text-sm text-gray-400">
                        Fórmula: EVA = NOPAT - (Capital Invertido × WACC)
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={activeView === 'table' ? 'default' : 'outline'}
                  onClick={() => setActiveView('table')}
                  className="border-gray-600"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Tabla
                </Button>
                <Button
                  variant={activeView === 'chart' ? 'default' : 'outline'}
                  onClick={() => setActiveView('chart')}
                  className="border-gray-600"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Evolución
                </Button>
                <Button
                  variant={activeView === 'components' ? 'default' : 'outline'}
                  onClick={() => setActiveView('components')}
                  className="border-gray-600"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Componentes
                </Button>
              </div>
            </div>
          </section>

          {/* Summary Cards */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {summaryCards.map((card, index) => {
                const Icon = card.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`bg-gradient-to-br ${card.bgGradient} backdrop-blur-sm border ${card.borderColor} hover:scale-105 transition-all duration-300 animate-fade-in group p-6`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                          <Icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm">{card.title}</h3>
                          <p className="text-xs text-gray-300">{card.subtitle}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-2xl font-bold text-white">
                        {card.value}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* EVA Table View */}
          {activeView === 'table' && (
            <section className="relative z-10">
              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Cálculo Detallado del EVA</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-white font-semibold">Periodo</TableHead>
                        <TableHead className="text-white font-semibold text-right">EBIT</TableHead>
                        <TableHead className="text-white font-semibold text-right">NOPAT</TableHead>
                        <TableHead className="text-white font-semibold text-right">Capital Invertido</TableHead>
                        <TableHead className="text-white font-semibold text-right">WACC</TableHead>
                        <TableHead className="text-white font-semibold text-right">Cargo por Capital</TableHead>
                        <TableHead className="text-white font-semibold text-right">EVA</TableHead>
                        <TableHead className="text-white font-semibold text-center">Indicador</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaData.map((item, index) => {
                        const indicator = getEVAIndicator(item.eva);
                        const Icon = indicator.icon;
                        
                        return (
                          <TableRow key={index} className="border-gray-600 hover:bg-white/5">
                            <TableCell className="text-white font-medium">{item.year}</TableCell>
                            <TableCell className="text-right text-blue-400">{formatCurrency(item.ebit)}</TableCell>
                            <TableCell className="text-right text-emerald-400">{formatCurrency(item.nopat)}</TableCell>
                            <TableCell className="text-right text-purple-400">{formatCurrency(item.capitalInvertido)}</TableCell>
                            <TableCell className="text-right text-orange-400">{formatPercentage(item.wacc)}</TableCell>
                            <TableCell className="text-right text-red-400">{formatCurrency(item.cargoPorCapital)}</TableCell>
                            <TableCell className={`text-right font-bold ${item.eva > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {formatCurrency(item.eva)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${indicator.bgColor} ${indicator.borderColor} border`}>
                                <Icon className={`h-4 w-4 ${indicator.color}`} />
                                <span className={`text-xs font-medium ${indicator.color}`}>
                                  {item.eva > 0 ? '+' : ''}
                                </span>
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

          {/* EVA Chart View */}
          {activeView === 'chart' && (
            <section className="relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-400/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Evolución del EVA</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={evaData}>
                        <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                        <YAxis 
                          tick={{ fill: '#d1d5db' }} 
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K€`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                          formatter={(value: any) => [formatCurrency(value), 'EVA']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="eva" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">ROIC vs WACC</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evaData}>
                        <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                        <YAxis tick={{ fill: '#d1d5db' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                          formatter={(value: any, name) => [formatPercentage(value), name]}
                        />
                        <Line type="monotone" dataKey="roic" stroke="#60a5fa" strokeWidth={3} name="ROIC" />
                        <Line type="monotone" dataKey="wacc" stroke="#f87171" strokeWidth={3} name="WACC" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </section>
          )}

          {/* Components View */}
          {activeView === 'components' && (
            <section className="relative z-10">
              <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Composición del EVA</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={componentData}>
                      <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                      <YAxis tick={{ fill: '#d1d5db' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                        formatter={(value: any, name) => [`${value}K€`, name]}
                      />
                      <Bar dataKey="nopat" fill="#34d399" name="NOPAT" />
                      <Bar dataKey="cargoPorCapital" fill="#ef4444" name="Cargo por Capital" />
                      <Line type="monotone" dataKey="eva" stroke="#a855f7" strokeWidth={4} name="EVA Resultante" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </section>
          )}

          {/* EVA vs Other Valuation Methods */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-orange-500/30 to-red-500/30 backdrop-blur-sm border border-orange-400/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">EVA vs. Otros Métodos de Valoración</h3>
                <Dialog open={showComparisonInfo} onOpenChange={setShowComparisonInfo}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-gray-600">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Más información
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-gray-600 text-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-orange-400">EVA en el Contexto de Valoración</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-300 leading-relaxed">
                        El EVA es un pilar fundamental en la valoración de empresas basada en valor (Value Based Management). 
                        La suma de los EVAs futuros descontados, más el capital invertido inicial, puede aproximar el valor 
                        de mercado de la empresa (MVA - Market Value Added).
                      </p>
                      <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                        <h4 className="text-blue-300 font-medium mb-2">Relación con DCF:</h4>
                        <p className="text-gray-300 text-sm">
                          Se relaciona conceptualmente con el método de Flujo de Caja Descontado (DCF), ya que ambos 
                          se centran en la capacidad de generar flujos por encima del coste de capital.
                        </p>
                      </div>
                      <div className="p-4 bg-emerald-500/10 border border-emerald-400/30 rounded-lg">
                        <h4 className="text-emerald-300 font-medium mb-2">Ventajas del EVA:</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Considera el coste del capital</li>
                          <li>• Fácil interpretación</li>
                          <li>• Alineado con creación de valor</li>
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-orange-300 font-medium mb-2">DCF (Flujo de Caja Descontado)</h4>
                  <p className="text-gray-300 text-sm">
                    Similar al EVA, se basa en flujos futuros descontados al coste de capital.
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-orange-300 font-medium mb-2">MVA (Market Value Added)</h4>
                  <p className="text-gray-300 text-sm">
                    Suma de EVAs futuros descontados representa el valor añadido al mercado.
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-orange-300 font-medium mb-2">Múltiplos</h4>
                  <p className="text-gray-300 text-sm">
                    El EVA ayuda a justificar las primas o descuentos en valoraciones por múltiplos.
                  </p>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
