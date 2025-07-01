
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export const CashFlowCurrentModule = () => {
  const kpiData = [
    {
      title: 'Flujo Operativo',
      value: '€380,000',
      subtitle: 'Actividades operativas',
      trend: 'up' as const,
      trendValue: '+15%',
      icon: ArrowUpCircle,
      variant: 'success' as const
    },
    {
      title: 'Flujo Inversión',
      value: '€-120,000',
      subtitle: 'Actividades de inversión',
      trend: 'down' as const,
      trendValue: '-25%',
      icon: ArrowDownCircle,
      variant: 'warning' as const
    },
    {
      title: 'Flujo Financiación',
      value: '€-85,000',
      subtitle: 'Actividades financieras',
      trend: 'down' as const,
      trendValue: '-10%',
      icon: DollarSign,
      variant: 'default' as const
    },
    {
      title: 'Flujo Neto',
      value: '€175,000',
      subtitle: 'Variación total',
      trend: 'up' as const,
      trendValue: '+22%',
      icon: TrendingUp,
      variant: 'success' as const
    }
  ];

  const cashFlowData = [
    { mes: 'Ene', operativo: 32000, inversion: -8000, financiacion: -7000, neto: 17000 },
    { mes: 'Feb', operativo: 28000, inversion: -5000, financiacion: -8000, neto: 15000 },
    { mes: 'Mar', operativo: 35000, inversion: -12000, financiacion: -6000, neto: 17000 },
    { mes: 'Abr', operativo: 30000, inversion: -15000, financiacion: -7000, neto: 8000 },
    { mes: 'May', operativo: 38000, inversion: -10000, financiacion: -8000, neto: 20000 },
    { mes: 'Jun', operativo: 42000, inversion: -18000, financiacion: -9000, neto: 15000 }
  ];

  const flujosDetalle = [
    { concepto: 'Resultado del Ejercicio', valor: 243750 },
    { concepto: 'Amortizaciones', valor: 80000 },
    { concepto: 'Variación NOF', valor: -45000 },
    { concepto: 'Otros ajustes', valor: 15000 },
    { concepto: 'Flujo Caja Operativo', valor: 380000, destacar: true },
    { concepto: 'Inversiones en Inmovilizado', valor: -120000 },
    { concepto: 'Flujo Caja Inversión', valor: -120000, destacar: true },
    { concepto: 'Variación Deuda Financiera', valor: -45000 },
    { concepto: 'Dividendos', valor: -40000 },
    { concepto: 'Flujo Caja Financiación', valor: -85000, destacar: true },
    { concepto: 'FLUJO CAJA NETO', valor: 175000, destacar: true, principal: true }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
                  Estado de Flujos de Efectivo
                </h1>
                <p className="text-slate-700 text-lg font-medium">Análisis de la generación y aplicación de efectivo</p>
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

          {/* Cash Flow Evolution Chart */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-steel/5 via-white/20 to-cadet/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-4 left-4 w-24 h-24 bg-steel/10 rounded-full blur-3xl"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-slate-900 flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-steel/20 backdrop-blur-sm border border-steel/30 shadow-xl">
                    <TrendingUp className="h-6 w-6 text-steel-700" />
                  </div>
                  Evolución Mensual de Flujos
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="h-80 relative">
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" />
                      <YAxis stroke="#64748b" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line type="monotone" dataKey="operativo" stroke="#10B981" strokeWidth={3} name="Operativo" />
                      <Line type="monotone" dataKey="inversion" stroke="#EF4444" strokeWidth={3} name="Inversión" />
                      <Line type="monotone" dataKey="financiacion" stroke="#F59E0B" strokeWidth={3} name="Financiación" />
                      <Line type="monotone" dataKey="neto" stroke="#4682B4" strokeWidth={4} name="Flujo Neto" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Detailed Cash Flow Statement */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-steel/3 via-white/20 to-cadet/3 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-6 right-6 w-32 h-32 bg-steel/8 rounded-full blur-3xl"></div>
              <div className="absolute bottom-6 left-6 w-40 h-40 bg-cadet/6 rounded-full blur-3xl"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-slate-900 text-xl">Estado de Flujos Detallado</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {flujosDetalle.map((item, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center py-3 px-6 border-b border-slate-100/60 ${
                        item.principal
                          ? 'bg-steel-100/80 font-bold backdrop-blur-sm border-t-2 border-steel-300'
                          : item.destacar
                          ? 'bg-steel-50/80 font-semibold backdrop-blur-sm'
                          : 'hover:bg-slate-50/60 backdrop-blur-sm'
                      }`}
                    >
                      <span className={`${
                        item.principal 
                          ? 'text-steel-900 font-bold text-lg' 
                          : item.destacar 
                          ? 'text-steel-800 font-bold' 
                          : 'text-slate-700'
                      }`}>
                        {item.concepto}
                      </span>
                      <span className={`font-mono ${
                        item.valor >= 0 ? 'text-success-600' : 'text-danger-600'
                      } ${item.principal ? 'font-bold text-xl' : item.destacar ? 'font-bold text-lg' : ''}`}>
                        {formatCurrency(item.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
