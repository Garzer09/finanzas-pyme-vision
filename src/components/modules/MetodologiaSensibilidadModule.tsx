import { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Target, TrendingUp, AlertTriangle, Calculator } from 'lucide-react';

export const MetodologiaSensibilidadModule = () => {
  const [ventasVariacion, setVentasVariacion] = useState([0]);
  const [costesVariacion, setCostesVariacion] = useState([0]);

  const kpiData = [
    {
      title: 'EBITDA Base',
      value: '€450K',
      subtitle: 'Escenario actual',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: Target,
      variant: 'default' as const
    },
    {
      title: 'Sensibilidad Ventas',
      value: '±25K',
      subtitle: 'Por cada 1%',
      trend: 'up' as const,
      trendValue: 'Alto impacto',
      icon: TrendingUp,
      variant: 'success' as const
    },
    {
      title: 'Sensibilidad Costes',
      value: '±15K',
      subtitle: 'Por cada 1%',
      trend: 'down' as const,
      trendValue: 'Medio impacto',
      icon: AlertTriangle,
      variant: 'warning' as const
    },
    {
      title: 'EBITDA Simulado',
      value: `€${(450 + (ventasVariacion[0] * 25) - (costesVariacion[0] * 15)).toFixed(0)}K`,
      subtitle: 'Con variaciones',
      trend: (450 + (ventasVariacion[0] * 25) - (costesVariacion[0] * 15)) > 450 ? 'up' as const : 'down' as const,
      trendValue: `${((450 + (ventasVariacion[0] * 25) - (costesVariacion[0] * 15) - 450) / 450 * 100).toFixed(1)}%`,
      icon: Calculator,
      variant: (450 + (ventasVariacion[0] * 25) - (costesVariacion[0] * 15)) > 450 ? 'success' as const : 'danger' as const
    }
  ];

  const escenarios = [
    { escenario: 'Pesimista', ebitda: 350, margen: 14, probabilidad: 20 },
    { escenario: 'Base', ebitda: 450, margen: 18, probabilidad: 60 },
    { escenario: 'Optimista', ebitda: 580, margen: 23, probabilidad: 20 },
  ];

  const sensibilidadData = [
    { variable: 'Ventas -10%', impacto: -250 },
    { variable: 'Ventas +10%', impacto: 250 },
    { variable: 'Costes +5%', impacto: -75 },
    { variable: 'Costes -5%', impacto: 75 },
    { variable: 'Precio +3%', impacto: 75 },
    { variable: 'Precio -3%', impacto: -75 },
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
                  Metodología de Análisis de Sensibilidad
                </h1>
                <p className="text-slate-700 text-lg font-medium">Análisis del impacto de variables clave en los resultados financieros</p>
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

          {/* Enhanced Charts Grid */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Variables Simulator */}
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-steel-blue/5 via-white/20 to-light-gray-100/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-4 left-4 w-24 h-24 bg-steel-blue/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 right-4 w-32 h-32 bg-light-gray-200/8 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-gray-900 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-steel-blue/20 backdrop-blur-sm border border-steel-blue/30 shadow-xl">
                      <Target className="h-6 w-6 text-steel-blue-dark" />
                    </div>
                    Simulador de Variables
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 relative z-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        Variación de Ventas: {ventasVariacion[0] > 0 ? '+' : ''}{ventasVariacion[0]}%
                      </label>
                      <Slider
                        value={ventasVariacion}
                        onValueChange={setVentasVariacion}
                        max={30}
                        min={-30}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        Variación de Costes: {costesVariacion[0] > 0 ? '+' : ''}{costesVariacion[0]}%
                      </label>
                      <Slider
                        value={costesVariacion}
                        onValueChange={setCostesVariacion}
                        max={20}
                        min={-20}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg">
                      <h4 className="text-gray-900 font-semibold mb-4">Impacto Simulado</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-gray-700">
                          <span>EBITDA Base:</span>
                          <span className="font-bold">€450K</span>
                        </div>
                        <div className="flex justify-between text-steel-blue">
                          <span>EBITDA Simulado:</span>
                          <span className="font-bold">€{(450 + (ventasVariacion[0] * 25) - (costesVariacion[0] * 15)).toFixed(0)}K</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scenarios Analysis */}
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-light-gray-100/5 via-white/20 to-steel-blue/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-4 right-4 w-28 h-28 bg-light-gray-200/8 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-steel-blue/10 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-gray-900 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-steel-blue-light/20 backdrop-blur-sm border border-steel-blue-light/30 shadow-xl">
                      <Calculator className="h-6 w-6 text-steel-blue" />
                    </div>
                    Escenarios de Análisis
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="h-80 relative">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={escenarios}>
                        <defs>
                          <linearGradient id="escenariosGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#34D399" stopOpacity={0.6}/>
                          </linearGradient>
                          <filter id="escenariosShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#10B981" floodOpacity="0.2"/>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="escenario" stroke="#6B7280" />
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
                          dataKey="ebitda" 
                          fill="url(#escenariosGradient)" 
                          name="EBITDA (K€)" 
                          radius={[8, 8, 0, 0]} 
                          filter="url(#escenariosShadow)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Enhanced Sensitivity Analysis */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-steel-blue/3 via-white/20 to-light-gray-100/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-6 right-6 w-32 h-32 bg-steel-blue/8 rounded-full blur-3xl"></div>
              <div className="absolute bottom-6 left-6 w-40 h-40 bg-light-gray-200/6 rounded-full blur-3xl"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-gray-900 flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-steel-blue/20 backdrop-blur-sm border border-steel-blue/30 shadow-xl">
                    <AlertTriangle className="h-6 w-6 text-steel-blue-dark" />
                  </div>
                  Análisis de Sensibilidad por Variable
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="h-80 relative">
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sensibilidadData} layout="horizontal">
                      <defs>
                        <linearGradient id="sensibilidadGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.6}/>
                        </linearGradient>
                        <filter id="sensibilidadShadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.2"/>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" stroke="#6B7280" />
                      <YAxis dataKey="variable" type="category" stroke="#6B7280" width={100} />
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
                        dataKey="impacto" 
                        fill="url(#sensibilidadGradient)" 
                        name="Impacto EBITDA (K€)" 
                        radius={[0, 8, 8, 0]} 
                        filter="url(#sensibilidadShadow)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
