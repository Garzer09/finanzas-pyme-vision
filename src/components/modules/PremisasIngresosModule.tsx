
import { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, CalendarDays, Percent, Target } from 'lucide-react';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useFinancialAssumptionsData } from '@/hooks/useFinancialAssumptionsData';
import { Input } from '@/components/ui/input';

export const PremisasIngresosModule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('annual');
  const { companyId } = useCompanyContext();
  const { getLatestAssumption, upsertSegmentMargins } = useFinancialAssumptionsData(companyId);
  const [margins, setMargins] = useState({
    premium: Number(getLatestAssumption('margen_segmento_premium')?.assumption_value) || 35,
    estandar: Number(getLatestAssumption('margen_segmento_estandar')?.assumption_value) || 25,
    basicos: Number(getLatestAssumption('margen_segmento_basicos')?.assumption_value) || 15,
    servicios: Number(getLatestAssumption('margen_segmento_servicios')?.assumption_value) || 45,
  });

  const ingresosData = [
    { periodo: 'Año 0', ventas: 2500, crecimiento: 0 },
    { periodo: 'Año 1', ventas: 2800, crecimiento: 12 },
    { periodo: 'Año 2', ventas: 3150, crecimiento: 12.5 },
    { periodo: 'Año 3', ventas: 3550, crecimiento: 12.7 },
  ];

  const segmentosData = [
    { segmento: 'Retail', actual: 1200, proyectado: 1380 },
    { segmento: 'Corporativo', actual: 800, proyectado: 920 },
    { segmento: 'Digital', actual: 350, proyectado: 420 },
    { segmento: 'Servicios', actual: 150, proyectado: 180 },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-light-gray-50 via-white to-steel-blue-light/20" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-8 overflow-auto">
          {/* Header Section with Enhanced Glass Effect */}
          <section className="relative">
            <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel-blue/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel-blue/8 via-steel-blue-light/5 to-light-gray-100/8 rounded-3xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-steel-blue/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-light-gray-200/8 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-steel-blue to-steel-blue-dark bg-clip-text text-transparent">
                  4.1. Premisas de Ingresos
                </h1>
                <p className="text-gray-700 text-lg font-medium">Análisis de las hipótesis de crecimiento y desarrollo de ingresos</p>
              </div>
            </div>
          </section>

          {/* Enhanced Charts Section */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-steel-blue/5 via-white/20 to-light-gray-100/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-4 left-4 w-24 h-24 bg-steel-blue/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 right-4 w-32 h-32 bg-light-gray-200/8 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-gray-900 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-steel-blue/20 backdrop-blur-sm border border-steel-blue/30 shadow-xl">
                      <TrendingUp className="h-6 w-6 text-steel-blue-dark" />
                    </div>
                    Evolución de Ingresos
                  </CardTitle>
                  <div className="flex gap-2">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm border-steel-blue/30 text-gray-900 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-sm border-steel-blue/30 rounded-xl">
                        <SelectItem value="annual">Anual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="h-80 relative">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ingresosData}>
                        <defs>
                          <linearGradient id="ingresosGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#5EEAD4" stopOpacity={0.2}/>
                          </linearGradient>
                          <filter id="ingresosShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#14B8A6" floodOpacity="0.3"/>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="periodo" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            borderRadius: '16px',
                            color: '#374151',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="ventas" 
                          stroke="url(#ingresosGradient)" 
                          strokeWidth={4}
                          name="Ventas (K€)"
                          dot={{ fill: '#14B8A6', strokeWidth: 2, r: 6 }}
                          filter="url(#ingresosShadow)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-light-gray-100/5 via-white/20 to-steel-blue/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-4 right-4 w-28 h-28 bg-light-gray-200/8 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-steel-blue/10 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-gray-900 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-steel-blue-light/20 backdrop-blur-sm border border-steel-blue-light/30 shadow-xl">
                      <Percent className="h-6 w-6 text-steel-blue" />
                    </div>
                    Tasas de Crecimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="h-80 relative">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ingresosData.slice(1)}>
                        <defs>
                          <linearGradient id="crecimientoGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#34D399" stopOpacity={0.6}/>
                          </linearGradient>
                          <filter id="crecimientoShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#10B981" floodOpacity="0.2"/>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="periodo" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            borderRadius: '16px',
                            color: '#374151',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                          }} 
                        />
                        <Bar 
                          dataKey="crecimiento" 
                          fill="url(#crecimientoGradient)" 
                          name="Crecimiento %" 
                          radius={[8, 8, 0, 0]} 
                          filter="url(#crecimientoShadow)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Enhanced Segments Section */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-steel-blue/3 via-white/20 to-light-gray-100/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-6 right-6 w-32 h-32 bg-steel-blue/8 rounded-full blur-3xl"></div>
              <div className="absolute bottom-6 left-6 w-40 h-40 bg-light-gray-200/6 rounded-full blur-3xl"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-gray-900 flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-steel-blue/20 backdrop-blur-sm border border-steel-blue/30 shadow-xl">
                    <Target className="h-6 w-6 text-steel-blue-dark" />
                  </div>
                  Ingresos por Segmento y Márgenes
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80 relative">
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segmentosData}>
                      <defs>
                        <linearGradient id="segmentosGradient1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                        </linearGradient>
                        <linearGradient id="segmentosGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#A855F7" stopOpacity={0.6}/>
                        </linearGradient>
                        <filter id="segmentosShadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#6366F1" floodOpacity="0.2"/>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="segmento" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          borderRadius: '16px',
                          color: '#374151',
                          backdropFilter: 'blur(20px)',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }} 
                      />
                      <Bar 
                        dataKey="actual" 
                        fill="url(#segmentosGradient1)" 
                        name="Actual (K€)" 
                        radius={[8, 8, 0, 0]} 
                        filter="url(#segmentosShadow)"
                      />
                      <Bar 
                        dataKey="proyectado" 
                        fill="url(#segmentosGradient2)" 
                        name="Proyectado (K€)" 
                        radius={[8, 8, 0, 0]} 
                        filter="url(#segmentosShadow)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Márgenes por Segmento (%)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Premium</label>
                        <Input type="number" value={margins.premium} onChange={(e) => setMargins(s => ({...s, premium: Number(e.target.value)}))} />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Estándar</label>
                        <Input type="number" value={margins.estandar} onChange={(e) => setMargins(s => ({...s, estandar: Number(e.target.value)}))} />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Básicos</label>
                        <Input type="number" value={margins.basicos} onChange={(e) => setMargins(s => ({...s, basicos: Number(e.target.value)}))} />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Servicios</label>
                        <Input type="number" value={margins.servicios} onChange={(e) => setMargins(s => ({...s, servicios: Number(e.target.value)}))} />
                      </div>
                    </div>
                    <div>
                      <Button onClick={() => upsertSegmentMargins(margins)} className="mt-2">Guardar Márgenes</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
