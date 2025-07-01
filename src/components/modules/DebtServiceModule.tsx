import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    if (dscr >= 1.2) return 'text-steel-blue';
    if (dscr >= 1.0) return 'text-gray-600';
    return 'text-steel-blue-dark';
  };

  const kpiData = [
    {
      title: 'Servicio de Deuda Anual',
      value: '€353K',
      subtitle: 'Principal + intereses',
      trend: 'neutral' as const,  
      trendValue: '0%',
      icon: CreditCard,
      variant: 'default' as const
    },
    {
      title: 'DSCR Promedio',
      value: '1.18x',
      subtitle: 'Cobertura media',
      trend: dscrPromedio >= 1.2 ? 'up' as const : 'down' as const,
      trendValue: dscrPromedio >= 1.2 ? 'Bueno' : 'Mejorable',
      icon: Calculator,
      variant: dscrPromedio >= 1.2 ? 'success' as const : 'warning' as const
    },
    {
      title: 'DSCR Mínimo',
      value: '0.96x',
      subtitle: 'Peor mes del año',
      trend: 'down' as const,
      trendValue: 'Riesgo',
      icon: AlertTriangle,
      variant: 'danger' as const
    },
    {
      title: 'Meses en Riesgo',
      value: '1',
      subtitle: 'DSCR menor a 1.0',
      trend: 'down' as const,
      trendValue: 'Crítico',
      icon: Shield,
      variant: 'danger' as const
    }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-8 overflow-auto">
          {/* Header Section */}
          <section className="relative">
            <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel/5 via-cadet/3 to-slate-100/5 rounded-3xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-steel/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-cadet/8 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-steel-800 bg-clip-text text-transparent">
                  Análisis del Servicio de Deuda
                </h1>
                <p className="text-slate-700 text-lg font-medium">Evaluación de la capacidad para hacer frente a las obligaciones de deuda</p>
              </div>
            </div>
          </section>

          {/* KPIs Grid */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiData.map((kpi, index) => (
                <ModernKPICard key={index} {...kpi} />
              ))}
            </div>
          </section>

          {/* Configuración de parámetros */}
          <section>
            <Card className="bg-white border border-light-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Parámetros de Flujo de Caja</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-900 text-sm font-medium mb-2 block">EBITDA Anual</Label>
                  <Input
                    type="number"
                    value={ebitda}
                    onChange={(e) => setEbitda(Number(e.target.value))}
                    className="bg-white border-light-gray-200 text-gray-900"
                  />
                  <p className="text-xs text-gray-600 mt-1">{formatCurrency(ebitda)}</p>
                </div>

                <div>
                  <Label className="text-gray-900 text-sm font-medium mb-2 block">Flujo de Caja Operativo Anual</Label>
                  <Input
                    type="number"
                    value={flujoCajaOperativo}
                    onChange={(e) => setFlujoCajaOperativo(Number(e.target.value))}
                    className="bg-white border-light-gray-200 text-gray-900"
                  />
                  <p className="text-xs text-gray-600 mt-1">{formatCurrency(flujoCajaOperativo)}</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Gráfico comparativo */}
          <section>
            <Card className="bg-white border border-light-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Evolución del Servicio de Deuda vs Flujo Disponible</h2>
              
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={servicioDeudaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mes" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K€`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: '#374151'
                      }}
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === 'servicio' ? 'Servicio de Deuda' : 'Flujo Disponible'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="servicio" 
                      stroke="#B0BEC5" 
                      strokeWidth={3}
                      name="servicio"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="flujoDisponible" 
                      stroke="#4682B4" 
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
          <section>
            <Card className="bg-white border border-light-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Evolución del DSCR (Debt Service Coverage Ratio)</h2>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={servicioDeudaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mes" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: '#374151'
                      }}
                      formatter={(value) => [`${Number(value).toFixed(2)}x`, 'DSCR']}
                    />
                    <ReferenceLine y={1.0} stroke="#B0BEC5" strokeWidth={2} strokeDasharray="3 3" 
                      label={{ value: "Umbral mínimo (1.0)", position: "left", fill: "#B0BEC5" }} />
                    <ReferenceLine y={1.2} stroke="#4682B4" strokeWidth={2} strokeDasharray="3 3"
                      label={{ value: "Umbral recomendado (1.2)", position: "left", fill: "#4682B4" }} />
                    <Bar dataKey="dscr">
                      {servicioDeudaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.dscr >= 1.2 ? "#4682B4" : entry.dscr >= 1.0 ? "#87CEEB" : "#B0BEC5"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 bg-steel-blue rounded"></div>
                  <span className="text-sm text-gray-600">DSCR ≥ 1.2 (Bueno)</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 bg-[#87CEEB] rounded"></div>
                  <span className="text-sm text-gray-600">1.0 ≤ DSCR &lt; 1.2 (Aceptable)</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 bg-[#B0BEC5] rounded"></div>
                  <span className="text-sm text-gray-600">DSCR &lt; 1.0 (Riesgo)</span>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
