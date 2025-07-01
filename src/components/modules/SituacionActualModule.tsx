
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, DollarSign, Users, Target, AlertTriangle, CheckCircle } from 'lucide-react';

export const SituacionActualModule = () => {
  const kpiData = [
    {
      title: 'Facturación Anual',
      value: '€2,500,000',
      subtitle: 'Ingresos totales',
      trend: 'up' as const,
      trendValue: '+12%',
      icon: DollarSign,
      variant: 'success' as const
    },
    {
      title: 'EBITDA',
      value: '€450,000',
      subtitle: '18% margen',
      trend: 'up' as const,
      trendValue: '+5%',
      icon: TrendingUp,
      variant: 'success' as const
    },
    {
      title: 'Empleados',
      value: '25',
      subtitle: 'Plantilla actual',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: Users,
      variant: 'default' as const
    },
    {
      title: 'Market Share',
      value: '8.5%',
      subtitle: 'Cuota de mercado',
      trend: 'up' as const,
      trendValue: '+2%',
      icon: Target,
      variant: 'success' as const
    }
  ];

  const ventasPorSegmento = [
    { name: 'Retail', value: 1200000, color: '#4682B4' },
    { name: 'Mayorista', value: 800000, color: '#5F9EA0' },
    { name: 'Online', value: 350000, color: '#87CEEB' },
    { name: 'Exportación', value: 150000, color: '#B0C4DE' }
  ];

  const evolucionMensual = [
    { mes: 'Ene', ventas: 180000, costes: 125000 },
    { mes: 'Feb', ventas: 195000, costes: 130000 },
    { mes: 'Mar', ventas: 220000, costes: 145000 },
    { mes: 'Abr', ventas: 205000, costes: 140000 },
    { mes: 'May', ventas: 235000, costes: 155000 },
    { mes: 'Jun', ventas: 215000, costes: 150000 }
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
                  Situación Actual de la Empresa
                </h1>
                <p className="text-slate-700 text-lg font-medium">Análisis integral del estado financiero y operativo actual</p>
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

          {/* Charts Section */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ventas por Segmento */}
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-steel/5 via-white/20 to-cadet/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-4 left-4 w-24 h-24 bg-steel/10 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-slate-900 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-steel/20 backdrop-blur-sm border border-steel/30 shadow-xl">
                      <Target className="h-6 w-6 text-steel-700" />
                    </div>
                    Ventas por Segmento
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="h-80 relative">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ventasPorSegmento}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {ventasPorSegmento.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `€${Number(value).toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Evolución Mensual */}
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-cadet/5 via-white/20 to-steel/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute bottom-4 right-4 w-32 h-32 bg-cadet/8 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-slate-900 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-cadet/20 backdrop-blur-sm border border-cadet/30 shadow-xl">
                      <TrendingUp className="h-6 w-6 text-cadet-700" />
                    </div>
                    Evolución Mensual
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="h-80 relative">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={evolucionMensual}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="mes" stroke="#64748b" />
                        <YAxis stroke="#64748b" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value) => `€${Number(value).toLocaleString()}`} />
                        <Bar dataKey="ventas" fill="#4682B4" name="Ventas" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="costes" fill="#5F9EA0" name="Costes" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Status Summary */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-steel/3 via-white/20 to-cadet/3 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-6 right-6 w-32 h-32 bg-steel/8 rounded-full blur-3xl"></div>
              <div className="absolute bottom-6 left-6 w-40 h-40 bg-cadet/6 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">Resumen de Situación</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-success-50/80 backdrop-blur-sm rounded-2xl border border-success-200/50 shadow-lg">
                      <CheckCircle className="h-6 w-6 text-success-600" />
                      <div>
                        <h4 className="font-semibold text-success-800">Fortalezas</h4>
                        <p className="text-sm text-success-700">Crecimiento sostenido, márgenes saludables</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-warning-50/80 backdrop-blur-sm rounded-2xl border border-warning-200/50 shadow-lg">
                      <AlertTriangle className="h-6 w-6 text-warning-600" />
                      <div>
                        <h4 className="font-semibold text-warning-800">Oportunidades</h4>
                        <p className="text-sm text-warning-700">Expansión digital, nuevos mercados</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                      <p className="text-slate-700 text-sm mb-2 font-medium">Posición Competitiva</p>
                      <p className="text-2xl font-bold text-steel-600 drop-shadow-sm">Fuerte</p>
                    </div>
                    <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                      <p className="text-slate-700 text-sm mb-2 font-medium">Perspectiva</p>
                      <p className="text-2xl font-bold text-steel-700 drop-shadow-sm">Positiva</p>
                    </div>
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
