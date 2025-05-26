
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Package, 
  Users, 
  Truck, 
  RotateCcw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { useState } from 'react';

export const NOFModule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('mensual');

  // Datos NOF actuales
  const nofData = {
    existencias: 350000,
    clientes: 420000,
    proveedores: 280000,
    nofTotal: 490000,
    pmc: 61.3, // días
    pmp: 58.4, // días
    pme: 73.0, // días
    pmm: 76.0  // días
  };

  // Evolución mensual de NOF
  const evolucionNOF = [
    { mes: 'Ene', existencias: 320000, clientes: 380000, proveedores: 260000, nof: 440000, pmm: 78.5 },
    { mes: 'Feb', existencias: 335000, clientes: 395000, proveedores: 275000, nof: 455000, pmm: 76.2 },
    { mes: 'Mar', existencias: 350000, clientes: 420000, proveedores: 280000, nof: 490000, pmm: 76.0 },
    { mes: 'Abr', existencias: 365000, clientes: 445000, proveedores: 295000, nof: 515000, pmm: 77.8 },
    { mes: 'May', existencias: 340000, clientes: 415000, proveedores: 285000, nof: 470000, pmm: 74.5 },
    { mes: 'Jun', existencias: 360000, clientes: 435000, proveedores: 300000, nof: 495000, pmm: 75.1 }
  ];

  // Análisis sectorial (comparación con benchmarks)
  const benchmarkData = [
    { metrica: 'PME', empresa: 73.0, sector: 65.0, excelente: 55.0 },
    { metrica: 'PMC', empresa: 61.3, sector: 52.0, excelente: 40.0 },
    { metrica: 'PMP', empresa: 58.4, sector: 65.0, excelente: 75.0 },
    { metrica: 'PMM', empresa: 76.0, sector: 52.0, excelente: 20.0 }
  ];

  // Datos para el ciclo de conversión
  const cicloConversion = [
    { etapa: 'Compra MP', dias: 0, acumulado: 0 },
    { etapa: 'Almacén', dias: 73, acumulado: 73 },
    { etapa: 'Venta', dias: 0, acumulado: 73 },
    { etapa: 'Cobro', dias: 61.3, acumulado: 134.3 },
    { etapa: 'Pago Prov.', dias: -58.4, acumulado: 76.0 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPerformanceColor = (valor: number, benchmark: number, mejor: 'menor' | 'mayor') => {
    const diferencia = mejor === 'menor' ? benchmark - valor : valor - benchmark;
    if (diferencia > 10) return 'text-green-400';
    if (diferencia > 0) return 'text-blue-400';
    if (diferencia > -10) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex min-h-screen bg-navy-800" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          <section className="relative z-10">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Análisis de Necesidades Operativas de Financiación (NOF)</h1>
              <p className="text-gray-400">Evaluación del capital circulante y ciclo de conversión de efectivo</p>
              
              {/* Period Selector */}
              <div className="mt-4 flex gap-2">
                {['mensual', 'trimestral', 'anual'].map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                    className="capitalize"
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          {/* KPI Cards */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white">NOF Total</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatCurrency(nofData.nofTotal)}</p>
                  <p className="text-sm text-gray-300">capital circulante</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <RotateCcw className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">PMM</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{nofData.pmm.toFixed(1)}</p>
                  <p className="text-sm text-gray-300">días maduración</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/30 to-red-500/30 backdrop-blur-sm border border-orange-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Users className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-white">PMC</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{nofData.pmc.toFixed(1)}</p>
                  <p className="text-sm text-gray-300">días cobro</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Truck className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">PMP</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{nofData.pmp.toFixed(1)}</p>
                  <p className="text-sm text-gray-300">días pago</p>
                </div>
              </Card>
            </div>
          </section>

          {/* Composición NOF */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Composición NOF</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-green-400" />
                      <span className="text-white">Existencias</span>
                    </div>
                    <span className="text-green-400 font-bold">{formatCurrency(nofData.existencias)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-400" />
                      <span className="text-white">Clientes</span>
                    </div>
                    <span className="text-blue-400 font-bold">{formatCurrency(nofData.clientes)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-red-400" />
                      <span className="text-white">Proveedores</span>
                    </div>
                    <span className="text-red-400 font-bold">-{formatCurrency(nofData.proveedores)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-teal-500/30 rounded-lg border border-teal-500/50">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-teal-400" />
                      <span className="text-white font-semibold">NOF Total</span>
                    </div>
                    <span className="text-teal-400 font-bold text-lg">{formatCurrency(nofData.nofTotal)}</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Períodos Medios</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-yellow-500/20 rounded-lg">
                    <span className="text-white">PME (Existencias)</span>
                    <span className="text-yellow-400 font-bold">{nofData.pme.toFixed(1)} días</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg">
                    <span className="text-white">PMC (Cobro)</span>
                    <span className="text-blue-400 font-bold">{nofData.pmc.toFixed(1)} días</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-500/20 rounded-lg">
                    <span className="text-white">PMP (Pago)</span>
                    <span className="text-red-400 font-bold">{nofData.pmp.toFixed(1)} días</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-500/30 rounded-lg border border-purple-500/50">
                    <span className="text-white font-semibold">PMM (Maduración)</span>
                    <span className="text-purple-400 font-bold text-lg">{nofData.pmm.toFixed(1)} días</span>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Evolución NOF */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Evolución de NOF y Componentes</h2>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={evolucionNOF}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="mes" stroke="#9ca3af" />
                    <YAxis yAxisId="left" stroke="#9ca3af" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value, name) => {
                        if (name === 'pmm') return [`${Number(value).toFixed(1)} días`, 'PMM'];
                        return [formatCurrency(Number(value)), 
                               name === 'existencias' ? 'Existencias' : 
                               name === 'clientes' ? 'Clientes' : 
                               name === 'proveedores' ? 'Proveedores' : 'NOF'];
                      }}
                    />
                    
                    <Bar yAxisId="left" dataKey="existencias" fill="#10b981" name="existencias" />
                    <Bar yAxisId="left" dataKey="clientes" fill="#3b82f6" name="clientes" />
                    <Bar yAxisId="left" dataKey="proveedores" fill="#ef4444" name="proveedores" />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="pmm" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      name="pmm"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </section>

          {/* Análisis comparativo */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Comparación con Benchmarks Sectoriales</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={benchmarkData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="metrica" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value, name) => [
                          `${Number(value).toFixed(1)} días`, 
                          name === 'empresa' ? 'Nuestra Empresa' : 
                          name === 'sector' ? 'Promedio Sector' : 'Clase Mundial'
                        ]}
                      />
                      <Bar dataKey="empresa" fill="#3b82f6" name="empresa" />
                      <Bar dataKey="sector" fill="#10b981" name="sector" />
                      <Bar dataKey="excelente" fill="#f59e0b" name="excelente" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Análisis de Performance</h3>
                  <div className="space-y-3">
                    {benchmarkData.map((item) => {
                      const esMejor = item.metrica === 'PMP' ? 'mayor' : 'menor';
                      const colorClass = getPerformanceColor(item.empresa, item.sector, esMejor);
                      
                      return (
                        <div key={item.metrica} className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                          <span className="text-white">{item.metrica}</span>
                          <div className="text-right">
                            <span className={`font-bold ${colorClass}`}>
                              {item.empresa.toFixed(1)} días
                            </span>
                            <p className="text-xs text-gray-400">
                              vs {item.sector.toFixed(1)} sector
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Ciclo de conversión visual */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Ciclo de Conversión de Efectivo</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-400">Compra Materiales</p>
                    <p className="text-white font-bold">Día 0</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-400">En Almacén</p>
                    <p className="text-yellow-400 font-bold">+{nofData.pme.toFixed(0)} días</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-400">Venta</p>
                    <p className="text-white font-bold">Día {nofData.pme.toFixed(0)}</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-400">Cobro</p>
                    <p className="text-blue-400 font-bold">+{nofData.pmc.toFixed(0)} días</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-400">Pago Proveedores</p>
                    <p className="text-red-400 font-bold">-{nofData.pmp.toFixed(0)} días</p>
                  </div>
                </div>

                <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/50">
                  <div className="text-center">
                    <p className="text-purple-400 font-semibold">Período Medio de Maduración</p>
                    <p className="text-2xl font-bold text-white">{nofData.pmm.toFixed(1)} días</p>
                    <p className="text-sm text-gray-300">
                      Tiempo desde la compra hasta el cobro (neto del período de pago a proveedores)
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
