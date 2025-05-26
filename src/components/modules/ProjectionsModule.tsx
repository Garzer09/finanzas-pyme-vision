
import { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, ComposedChart } from 'recharts';
import { TrendingUp, Calendar, Target, Zap, ArrowUp, ArrowDown, BarChart3, PieChart, Activity, DollarSign } from 'lucide-react';

export const ProjectionsModule = () => {
  const [activeSection, setActiveSection] = useState<'pyg' | 'analytical' | 'balance' | 'cashflow' | 'ratios' | 'nof' | 'debt' | 'segments'>('pyg');

  // Datos de proyección de P&G
  const pygProjectionData = [
    { year: 'Año 0', ventas: 2750, costes: -1925, ebitda: 605, ebit: 425, beneficio: 412, margenEbitda: 22.0, margenEbit: 15.5 },
    { year: 'Año 1', ventas: 3025, costes: -2100, ebitda: 696, ebit: 516, beneficio: 475, margenEbitda: 23.0, margenEbit: 17.1 },
    { year: 'Año 2', ventas: 3328, costes: -2265, ebitda: 798, ebit: 618, beneficio: 549, margenEbitda: 24.0, margenEbit: 18.6 },
    { year: 'Año 3', ventas: 3660, costes: -2438, ebitda: 915, ebit: 735, beneficio: 634, margenEbitda: 25.0, margenEbit: 20.1 },
    { year: 'Año 4', ventas: 4026, costes: -2623, ebitda: 1047, ebit: 867, beneficio: 731, margenEbitda: 26.0, margenEbit: 21.5 },
    { year: 'Año 5', ventas: 4429, costes: -2820, ebitda: 1195, ebit: 1015, beneficio: 841, margenEbitda: 27.0, margenEbit: 22.9 }
  ];

  // Datos de balance proyectado
  const balanceProjectionData = [
    { year: 'Año 0', activo: 5200, activoFijo: 3200, activoCirculante: 2000, patrimonio: 2800, deuda: 2400 },
    { year: 'Año 1', activo: 5720, activoFijo: 3400, activoCirculante: 2320, patrimonio: 3275, deuda: 2445 },
    { year: 'Año 2', activo: 6292, activoFijo: 3620, activoCirculante: 2672, patrimonio: 3824, deuda: 2468 },
    { year: 'Año 3', activo: 6921, activoFijo: 3860, activoCirculante: 3061, patrimonio: 4458, deuda: 2463 },
    { year: 'Año 4', activo: 7613, activoFijo: 4120, activoCirculante: 3493, patrimonio: 5189, deuda: 2424 },
    { year: 'Año 5', activo: 8374, activoFijo: 4400, activoCirculante: 3974, patrimonio: 6030, deuda: 2344 }
  ];

  // Datos de flujos de caja proyectados
  const cashFlowProjectionData = [
    { year: 'Año 0', operacional: 580, inversion: -120, financiacion: -85, flujoLibre: 460 },
    { year: 'Año 1', operacional: 665, inversion: -135, financiacion: -95, flujoLibre: 530 },
    { year: 'Año 2', operacional: 765, inversion: -150, financiacion: -105, flujoLibre: 615 },
    { year: 'Año 3', operacional: 880, inversion: -165, financiacion: -115, flujoLibre: 715 },
    { year: 'Año 4', operacional: 1010, inversion: -180, financiacion: -125, flujoLibre: 830 },
    { year: 'Año 5', operacional: 1155, inversion: -195, financiacion: -135, flujoLibre: 960 }
  ];

  // Datos de ratios proyectados
  const ratiosProjectionData = [
    { year: 'Año 0', roe: 14.7, roa: 7.9, liquidez: 1.4, endeudamiento: 46.2, cobertura: 7.1 },
    { year: 'Año 1', roe: 14.5, roa: 8.3, liquidez: 1.5, endeudamiento: 42.8, cobertura: 8.2 },
    { year: 'Año 2', roe: 14.4, roa: 8.7, liquidez: 1.6, endeudamiento: 39.2, cobertura: 9.5 },
    { year: 'Año 3', roe: 14.2, roa: 9.2, liquidez: 1.7, endeudamiento: 35.6, cobertura: 11.2 },
    { year: 'Año 4', roe: 14.1, roa: 9.6, liquidez: 1.8, endeudamiento: 31.8, cobertura: 13.4 },
    { year: 'Año 5', roe: 13.9, roa: 10.0, liquidez: 1.9, endeudamiento: 28.0, cobertura: 16.1 }
  ];

  // Datos de NOF proyectado
  const nofProjectionData = [
    { year: 'Año 0', nof: 485, pmm: 64, pmc: 45, pmp: 38 },
    { year: 'Año 1', nof: 534, pmm: 62, pmc: 44, pmp: 36 },
    { year: 'Año 2', nof: 587, pmm: 60, pmc: 43, pmp: 35 },
    { year: 'Año 3', nof: 646, pmm: 58, pmc: 42, pmp: 34 },
    { year: 'Año 4', nof: 710, pmm: 56, pmc: 41, pmp: 33 },
    { year: 'Año 5', nof: 781, pmm: 54, pmc: 40, pmp: 32 }
  ];

  // Datos de servicio de deuda proyectado
  const debtServiceData = [
    { year: 'Año 0', servicioDeuda: 185, flujoOperacional: 580, cobertura: 3.1 },
    { year: 'Año 1', servicioDeuda: 180, flujoOperacional: 665, cobertura: 3.7 },
    { year: 'Año 2', servicioDeuda: 175, flujoOperacional: 765, cobertura: 4.4 },
    { year: 'Año 3', servicioDeuda: 170, flujoOperacional: 880, cobertura: 5.2 },
    { year: 'Año 4', servicioDeuda: 165, flujoOperacional: 1010, cobertura: 6.1 },
    { year: 'Año 5', servicioDeuda: 160, flujoOperacional: 1155, cobertura: 7.2 }
  ];

  // Datos de ventas por segmentos proyectado
  const segmentsProjectionData = [
    { year: 'Año 0', segmentoA: 1375, segmentoB: 825, segmentoC: 550, margenA: 28, margenB: 22, margenC: 15 },
    { year: 'Año 1', segmentoA: 1513, segmentoB: 908, segmentoC: 604, margenA: 29, margenB: 23, margenC: 16 },
    { year: 'Año 2', segmentoA: 1664, segmentoB: 999, segmentoC: 665, margenA: 30, margenB: 24, margenC: 17 },
    { year: 'Año 3', segmentoA: 1830, segmentoB: 1099, segmentoC: 731, margenA: 31, margenB: 25, margenC: 18 },
    { year: 'Año 4', segmentoA: 2013, segmentoB: 1209, segmentoC: 804, margenA: 32, margenB: 26, margenC: 19 },
    { year: 'Año 5', segmentoA: 2214, segmentoB: 1330, segmentoC: 885, margenA: 33, margenB: 27, margenC: 20 }
  ];

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K€`;
    }
    return `${value.toLocaleString()}€`;
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const sections = [
    { id: 'pyg', label: 'P&G Proyectado', icon: BarChart3 },
    { id: 'analytical', label: 'P&G Analítico', icon: Activity },
    { id: 'balance', label: 'Balance Proyectado', icon: PieChart },
    { id: 'cashflow', label: 'Flujos de Caja', icon: Zap },
    { id: 'ratios', label: 'Ratios Financieros', icon: Target },
    { id: 'nof', label: 'NOF Proyectado', icon: DollarSign },
    { id: 'debt', label: 'Servicio de Deuda', icon: TrendingUp },
    { id: 'segments', label: 'Ventas por Segmentos', icon: Calendar }
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
                <h1 className="text-2xl font-bold text-white mb-2">Proyecciones Financieras (Año 1-5)</h1>
                <p className="text-gray-400">Análisis prospectivo generado automáticamente desde datos del Año 0</p>
              </div>
            </div>
          </section>

          {/* Navigation Tabs */}
          <section className="relative z-10">
            <div className="flex flex-wrap gap-2 mb-6">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? 'default' : 'outline'}
                    onClick={() => setActiveSection(section.id as any)}
                    className="border-gray-600"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {section.label}
                  </Button>
                );
              })}
            </div>
          </section>

          {/* P&G Proyectado */}
          {activeSection === 'pyg' && (
            <section className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Evolución de Ingresos y Márgenes</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={pygProjectionData}>
                        <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                        <YAxis yAxisId="left" tick={{ fill: '#d1d5db' }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#d1d5db' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Bar yAxisId="left" dataKey="ventas" fill="#60a5fa" name="Ventas (K€)" />
                        <Line yAxisId="right" type="monotone" dataKey="margenEbitda" stroke="#34d399" strokeWidth={3} name="Margen EBITDA %" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-400/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Evolución de Rentabilidad</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pygProjectionData}>
                        <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                        <YAxis tick={{ fill: '#d1d5db' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Area type="monotone" dataKey="ebitda" stackId="1" stroke="#34d399" fill="#34d399" fillOpacity={0.6} name="EBITDA" />
                        <Area type="monotone" dataKey="beneficio" stackId="2" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.6} name="Beneficio Neto" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tabla de Proyecciones P&G</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white">Concepto</TableHead>
                        {pygProjectionData.map((item) => (
                          <TableHead key={item.year} className="text-white text-center">{item.year}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-white font-medium">Ventas</TableCell>
                        {pygProjectionData.map((item) => (
                          <TableCell key={item.year} className="text-blue-400 text-center">{formatCurrency(item.ventas * 1000)}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-white font-medium">EBITDA</TableCell>
                        {pygProjectionData.map((item) => (
                          <TableCell key={item.year} className="text-emerald-400 text-center">{formatCurrency(item.ebitda * 1000)}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-white font-medium">Margen EBITDA %</TableCell>
                        {pygProjectionData.map((item) => (
                          <TableCell key={item.year} className="text-yellow-400 text-center">{formatPercentage(item.margenEbitda)}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-white font-medium">Beneficio Neto</TableCell>
                        {pygProjectionData.map((item) => (
                          <TableCell key={item.year} className="text-purple-400 text-center">{formatCurrency(item.beneficio * 1000)}</TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </section>
          )}

          {/* P&G Analítico */}
          {activeSection === 'analytical' && (
            <section className="relative z-10 space-y-6">
              <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Análisis de Márgenes de Contribución</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={pygProjectionData}>
                      <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                      <YAxis yAxisId="left" tick={{ fill: '#d1d5db' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#d1d5db' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Bar yAxisId="left" dataKey="ventas" fill="#a855f7" name="Ventas" />
                      <Bar yAxisId="left" dataKey="costes" fill="#ef4444" name="Costes Variables" />
                      <Line yAxisId="right" type="monotone" dataKey="margenEbit" stroke="#fbbf24" strokeWidth={3} name="Margen EBIT %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </section>
          )}

          {/* Balance Proyectado */}
          {activeSection === 'balance' && (
            <section className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-teal-500/30 to-cyan-500/30 backdrop-blur-sm border border-teal-400/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Evolución del Activo</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={balanceProjectionData}>
                        <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                        <YAxis tick={{ fill: '#d1d5db' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Area type="monotone" dataKey="activoFijo" stackId="1" stroke="#14b8a6" fill="#14b8a6" name="Activo Fijo" />
                        <Area type="monotone" dataKey="activoCirculante" stackId="1" stroke="#06b6d4" fill="#06b6d4" name="Activo Circulante" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/30 to-red-500/30 backdrop-blur-sm border border-orange-400/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Estructura de Financiación</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={balanceProjectionData}>
                        <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                        <YAxis tick={{ fill: '#d1d5db' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Area type="monotone" dataKey="patrimonio" stackId="1" stroke="#34d399" fill="#34d399" name="Patrimonio" />
                        <Area type="monotone" dataKey="deuda" stackId="1" stroke="#f87171" fill="#f87171" name="Deuda" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </section>
          )}

          {/* Flujos de Caja */}
          {activeSection === 'cashflow' && (
            <section className="relative z-10 space-y-6">
              <Card className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-400/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Proyección de Flujos de Caja</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowProjectionData}>
                      <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                      <YAxis tick={{ fill: '#d1d5db' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Bar dataKey="operacional" fill="#34d399" name="Flujo Operacional" />
                      <Bar dataKey="inversion" fill="#fb923c" name="Flujo de Inversión" />
                      <Bar dataKey="financiacion" fill="#f87171" name="Flujo de Financiación" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </section>
          )}

          {/* Ratios Financieros */}
          {activeSection === 'ratios' && (
            <section className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Evolución de Ratios de Rentabilidad</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ratiosProjectionData}>
                        <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                        <YAxis tick={{ fill: '#d1d5db' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Line type="monotone" dataKey="roe" stroke="#60a5fa" strokeWidth={3} name="ROE %" />
                        <Line type="monotone" dataKey="roa" stroke="#34d399" strokeWidth={3} name="ROA %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Evolución de Ratios de Solvencia</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ratiosProjectionData}>
                        <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                        <YAxis tick={{ fill: '#d1d5db' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Line type="monotone" dataKey="liquidez" stroke="#a855f7" strokeWidth={3} name="Liquidez" />
                        <Line type="monotone" dataKey="endeudamiento" stroke="#f87171" strokeWidth={3} name="Endeudamiento %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </section>
          )}

          {/* NOF Proyectado */}
          {activeSection === 'nof' && (
            <section className="relative z-10 space-y-6">
              <Card className="bg-gradient-to-br from-yellow-500/30 to-orange-500/30 backdrop-blur-sm border border-yellow-400/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Evolución de NOF y Periodos Medios</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={nofProjectionData}>
                      <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                      <YAxis yAxisId="left" tick={{ fill: '#d1d5db' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#d1d5db' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Bar yAxisId="left" dataKey="nof" fill="#fbbf24" name="NOF (K€)" />
                      <Line yAxisId="right" type="monotone" dataKey="pmm" stroke="#34d399" strokeWidth={3} name="PMM (días)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </section>
          )}

          {/* Servicio de Deuda */}
          {activeSection === 'debt' && (
            <section className="relative z-10 space-y-6">
              <Card className="bg-gradient-to-br from-red-500/30 to-pink-500/30 backdrop-blur-sm border border-red-400/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Servicio de Deuda vs Flujo Operacional</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={debtServiceData}>
                      <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                      <YAxis yAxisId="left" tick={{ fill: '#d1d5db' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#d1d5db' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Bar yAxisId="left" dataKey="flujoOperacional" fill="#34d399" name="Flujo Operacional" />
                      <Bar yAxisId="left" dataKey="servicioDeuda" fill="#f87171" name="Servicio de Deuda" />
                      <Line yAxisId="right" type="monotone" dataKey="cobertura" stroke="#fbbf24" strokeWidth={3} name="Ratio de Cobertura" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </section>
          )}

          {/* Ventas por Segmentos */}
          {activeSection === 'segments' && (
            <section className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-indigo-500/30 to-purple-500/30 backdrop-blur-sm border border-indigo-400/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Evolución de Ventas por Segmento</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={segmentsProjectionData}>
                        <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                        <YAxis tick={{ fill: '#d1d5db' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Area type="monotone" dataKey="segmentoA" stackId="1" stroke="#6366f1" fill="#6366f1" name="Segmento A" />
                        <Area type="monotone" dataKey="segmentoB" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Segmento B" />
                        <Area type="monotone" dataKey="segmentoC" stackId="1" stroke="#a855f7" fill="#a855f7" name="Segmento C" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 backdrop-blur-sm border border-green-400/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Evolución de Márgenes por Segmento</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={segmentsProjectionData}>
                        <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                        <YAxis tick={{ fill: '#d1d5db' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Line type="monotone" dataKey="margenA" stroke="#10b981" strokeWidth={3} name="Margen A %" />
                        <Line type="monotone" dataKey="margenB" stroke="#34d399" strokeWidth={3} name="Margen B %" />
                        <Line type="monotone" dataKey="margenC" stroke="#6ee7b7" strokeWidth={3} name="Margen C %" />
                      </LineChart>
                    </ResponsiveContainer>
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
