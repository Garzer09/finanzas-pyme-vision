
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  Calculator,
  Calendar,
  Shield
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Cell
} from 'recharts';
import { useState } from 'react';

export const DebtServiceModule = () => {
  const [periodo, setPeriodo] = useState('mensual');
  const [ebitda, setEbitda] = useState(450000);
  const [flujoCajaOperativo, setFlujoCajaOperativo] = useState(380000);
  
  // Datos simulados del servicio de deuda
  const servicioDeudaData = [
    { mes: 'Ene', servicio: 28500, flujoDisponible: 35000, dscr: 1.23 },
    { mes: 'Feb', servicio: 28500, flujoDisponible: 32000, dscr: 1.12 },
    { mes: 'Mar', servicio: 28500, flujoDisponible: 38000, dscr: 1.33 },
    { mes: 'Abr', servicio: 30200, flujoDisponible: 34000, dscr: 1.13 },
    { mes: 'May', servicio: 30200, flujoDisponible: 36000, dscr: 1.19 },
    { mes: 'Jun', servicio: 30200, flujoDisponible: 29000, dscr: 0.96 },
    { mes: 'Jul', servicio: 28500, flujoDisponible: 41000, dscr: 1.44 },
    { mes: 'Ago', servicio: 28500, flujoDisponible: 37000, dscr: 1.30 },
    { mes: 'Sep', servicio: 28500, flujoDisponible: 33000, dscr: 1.16 },
    { mes: 'Oct', servicio: 32000, flujoDisponible: 39000, dscr: 1.22 },
    { mes: 'Nov', servicio: 32000, flujoDisponible: 35000, dscr: 1.09 },
    { mes: 'Dic', servicio: 32000, flujoDisponible: 42000, dscr: 1.31 }
  ];

  // Cálculos
  const servicioDeudaAnual = servicioDeudaData.reduce((sum, item) => sum + item.servicio, 0);
  const flujoDisponibleAnual = servicioDeudaData.reduce((sum, item) => sum + item.flujoDisponible, 0);
  const dscrPromedio = flujoDisponibleAnual / servicioDeudaAnual;
  const mesesEnRiesgo = servicioDeudaData.filter(item => item.dscr < 1.0).length;
  const dscrMinimo = Math.min(...servicioDeudaData.map(item => item.dscr));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDSCRColor = (dscr: number) => {
    if (dscr >= 1.2) return 'text-green-400';
    if (dscr >= 1.0) return 'text-yellow-400';
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
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Análisis del Servicio de Deuda</h1>
                <p className="text-gray-400">Evaluación de la capacidad para hacer frente a las obligaciones de deuda</p>
              </div>
              <div className="flex gap-3">
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger className="w-40 bg-black/20 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* KPIs principales */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <CreditCard className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Servicio de Deuda Anual</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatCurrency(servicioDeudaAnual)}</p>
                  <p className="text-sm text-gray-300">principal + intereses</p>
                </div>
              </Card>

              <Card className={`backdrop-blur-sm border p-6 ${dscrPromedio >= 1.2 
                ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-400/50' 
                : dscrPromedio >= 1.0 
                ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-yellow-400/50'
                : 'bg-gradient-to-br from-red-500/30 to-pink-500/30 border-red-400/50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Calculator className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white">DSCR Promedio</h3>
                </div>
                <div className="space-y-2">
                  <p className={`text-2xl font-bold ${getDSCRColor(dscrPromedio)}`}>{dscrPromedio.toFixed(2)}x</p>
                  <p className="text-sm text-gray-300">cobertura media</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/30 to-red-500/30 backdrop-blur-sm border border-orange-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-white">DSCR Mínimo</h3>
                </div>
                <div className="space-y-2">
                  <p className={`text-2xl font-bold ${getDSCRColor(dscrMinimo)}`}>{dscrMinimo.toFixed(2)}x</p>
                  <p className="text-sm text-gray-300">peor mes del año</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Shield className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">Meses en Riesgo</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{mesesEnRiesgo}</p>
                  <p className="text-sm text-gray-300">DSCR menor a 1.0</p>
                </div>
              </Card>
            </div>
          </section>

          {/* Configuración de parámetros */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Parámetros de Flujo de Caja</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white text-sm font-medium mb-2 block">EBITDA Anual</Label>
                  <Input
                    type="number"
                    value={ebitda}
                    onChange={(e) => setEbitda(Number(e.target.value))}
                    className="bg-black/20 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formatCurrency(ebitda)}</p>
                </div>

                <div>
                  <Label className="text-white text-sm font-medium mb-2 block">Flujo de Caja Operativo Anual</Label>
                  <Input
                    type="number"
                    value={flujoCajaOperativo}
                    onChange={(e) => setFlujoCajaOperativo(Number(e.target.value))}
                    className="bg-black/20 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formatCurrency(flujoCajaOperativo)}</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Gráfico comparativo */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Evolución del Servicio de Deuda vs Flujo Disponible</h2>
              
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={servicioDeudaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="mes" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K€`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === 'servicio' ? 'Servicio de Deuda' : 'Flujo Disponible'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="servicio" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      name="servicio"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="flujoDisponible" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="flujoDisponible"
                    />
                    <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </section>

          {/* Gráfico del DSCR */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Evolución del DSCR (Debt Service Coverage Ratio)</h2>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={servicioDeudaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="mes" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => [`${Number(value).toFixed(2)}x`, 'DSCR']}
                    />
                    <ReferenceLine y={1.0} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" 
                      label={{ value: "Umbral mínimo (1.0)", position: "left", fill: "#ef4444" }} />
                    <ReferenceLine y={1.2} stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3"
                      label={{ value: "Umbral recomendado (1.2)", position: "left", fill: "#f59e0b" }} />
                    <Bar dataKey="dscr">
                      {servicioDeudaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.dscr >= 1.2 ? "#10b981" : entry.dscr >= 1.0 ? "#f59e0b" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-300">DSCR ≥ 1.2 (Bueno)</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-300">1.0 ≤ DSCR &lt; 1.2 (Aceptable)</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-300">DSCR &lt; 1.0 (Riesgo)</span>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
