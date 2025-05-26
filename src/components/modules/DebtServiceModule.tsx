
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Banknote, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Calculator
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { useState } from 'react';

export const DebtServiceModule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('mensual');

  // Datos simulados del servicio de deuda
  const servicioDeudaData = [
    { periodo: 'Ene', ebitda: 62000, servicioDeuda: 45000, dscr: 1.38, flujoLibre: 17000 },
    { periodo: 'Feb', ebitda: 58000, servicioDeuda: 45000, dscr: 1.29, flujoLibre: 13000 },
    { periodo: 'Mar', ebitda: 65000, servicioDeuda: 45000, dscr: 1.44, flujoLibre: 20000 },
    { periodo: 'Abr', ebitda: 42000, servicioDeuda: 45000, dscr: 0.93, flujoLibre: -3000 },
    { periodo: 'May', ebitda: 68000, servicioDeuda: 45000, dscr: 1.51, flujoLibre: 23000 },
    { periodo: 'Jun', ebitda: 72000, servicioDeuda: 45000, dscr: 1.60, flujoLibre: 27000 },
    { periodo: 'Jul', ebitda: 55000, servicioDeuda: 45000, dscr: 1.22, flujoLibre: 10000 },
    { periodo: 'Ago', ebitda: 48000, servicioDeuda: 45000, dscr: 1.07, flujoLibre: 3000 },
    { periodo: 'Sep', ebitda: 61000, servicioDeuda: 45000, dscr: 1.36, flujoLibre: 16000 },
    { periodo: 'Oct', ebitda: 69000, servicioDeuda: 45000, dscr: 1.53, flujoLibre: 24000 },
    { periodo: 'Nov', ebitda: 58000, servicioDeuda: 45000, dscr: 1.29, flujoLibre: 13000 },
    { periodo: 'Dic', ebitda: 63000, servicioDeuda: 45000, dscr: 1.40, flujoLibre: 18000 }
  ];

  // Cálculos agregados
  const totalEbitda = servicioDeudaData.reduce((sum, item) => sum + item.ebitda, 0);
  const totalServicioDeuda = servicioDeudaData.reduce((sum, item) => sum + item.servicioDeuda, 0);
  const dscrPromedio = totalEbitda / totalServicioDeuda;
  const periodosRiesgo = servicioDeudaData.filter(item => item.dscr < 1.2).length;
  const totalFlujoLibre = servicioDeudaData.reduce((sum, item) => sum + item.flujoLibre, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDSCRStatus = (dscr: number) => {
    if (dscr >= 1.5) return { color: 'text-green-400', bg: 'bg-green-500/20', status: 'Excelente' };
    if (dscr >= 1.2) return { color: 'text-blue-400', bg: 'bg-blue-500/20', status: 'Bueno' };
    if (dscr >= 1.0) return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', status: 'Aceptable' };
    return { color: 'text-red-400', bg: 'bg-red-500/20', status: 'Riesgo' };
  };

  const dscrStatus = getDSCRStatus(dscrPromedio);

  return (
    <div className="flex min-h-screen bg-navy-800" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          <section className="relative z-10">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Análisis del Servicio de Deuda</h1>
              <p className="text-gray-400">Evaluación de la capacidad para hacer frente a las obligaciones financieras</p>
              
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
              <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Calculator className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">DSCR Promedio</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{dscrPromedio.toFixed(2)}x</p>
                  <p className={`text-sm px-2 py-1 rounded-full ${dscrStatus.bg} ${dscrStatus.color}`}>
                    {dscrStatus.status}
                  </p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white">EBITDA Anual</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalEbitda)}</p>
                  <p className="text-sm text-gray-300">flujo disponible</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/30 to-red-500/30 backdrop-blur-sm border border-orange-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Banknote className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-white">Servicio Deuda Anual</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalServicioDeuda)}</p>
                  <p className="text-sm text-gray-300">principal + intereses</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <AlertTriangle className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">Períodos de Riesgo</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{periodosRiesgo}</p>
                  <p className="text-sm text-gray-300">DSCR &lt; 1.2</p>
                </div>
              </Card>
            </div>
          </section>

          {/* Gráfico de evolución DSCR */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Evolución del DSCR</h2>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={servicioDeudaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="periodo" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value, name) => {
                        if (name === 'dscr') return [`${Number(value).toFixed(2)}x`, 'DSCR'];
                        return [formatCurrency(Number(value)), name === 'ebitda' ? 'EBITDA' : 'Servicio Deuda'];
                      }}
                    />
                    
                    {/* Líneas de referencia */}
                    <ReferenceLine y={1.0} stroke="#ef4444" strokeDasharray="5 5" label="Umbral Crítico" />
                    <ReferenceLine y={1.2} stroke="#f59e0b" strokeDasharray="5 5" label="Umbral Recomendado" />
                    <ReferenceLine y={1.5} stroke="#10b981" strokeDasharray="5 5" label="Objetivo" />
                    
                    <Line 
                      type="monotone" 
                      dataKey="dscr" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-red-400 border-dashed"></div>
                  <span className="text-sm text-gray-300">Crítico (1.0x)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-yellow-400 border-dashed"></div>
                  <span className="text-sm text-gray-300">Recomendado (1.2x)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-green-400 border-dashed"></div>
                  <span className="text-sm text-gray-300">Objetivo (1.5x)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-400"></div>
                  <span className="text-sm text-gray-300">DSCR</span>
                </div>
              </div>
            </Card>
          </section>

          {/* Comparación Flujo vs Servicio */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Flujo de Caja vs Servicio de Deuda</h2>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={servicioDeudaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="periodo" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === 'ebitda' ? 'EBITDA' : 
                        name === 'servicioDeuda' ? 'Servicio Deuda' : 'Flujo Libre'
                      ]}
                    />
                    
                    <Bar dataKey="ebitda" fill="#10b981" name="EBITDA" />
                    <Bar dataKey="servicioDeuda" fill="#ef4444" name="Servicio Deuda" />
                    <Line 
                      type="monotone" 
                      dataKey="flujoLibre" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      name="Flujo Libre"
                    />
                    
                    <ReferenceLine y={0} stroke="#6b7280" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </section>

          {/* Análisis de períodos críticos */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Análisis de Períodos Críticos</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Resumen Ejecutivo</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                      <span className="text-gray-300">Flujo Libre Total</span>
                      <span className={`font-bold ${totalFlujoLibre >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(totalFlujoLibre)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                      <span className="text-gray-300">Cobertura Promedio</span>
                      <span className={`font-bold ${dscrStatus.color}`}>
                        {dscrPromedio.toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                      <span className="text-gray-300">Meses en Riesgo</span>
                      <span className={`font-bold ${periodosRiesgo > 3 ? 'text-red-400' : periodosRiesgo > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {periodosRiesgo} de 12
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Recomendaciones</h3>
                  <div className="space-y-3">
                    {dscrPromedio >= 1.5 ? (
                      <div className="flex items-start gap-3 p-3 bg-green-500/20 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-green-400 font-medium">Situación Óptima</p>
                          <p className="text-gray-300 text-sm">La empresa mantiene una cobertura excelente del servicio de deuda.</p>
                        </div>
                      </div>
                    ) : dscrPromedio >= 1.2 ? (
                      <div className="flex items-start gap-3 p-3 bg-blue-500/20 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-blue-400 font-medium">Situación Aceptable</p>
                          <p className="text-gray-300 text-sm">Considerar mejorar la eficiencia operativa en períodos de menor rendimiento.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-3 bg-red-500/20 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                        <div>
                          <p className="text-red-400 font-medium">Atención Requerida</p>
                          <p className="text-gray-300 text-sm">Se recomienda renegociar términos de deuda o mejorar flujo operativo.</p>
                        </div>
                      </div>
                    )}
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
