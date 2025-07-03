
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, DollarSign, Percent, Calculator } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useEffect, useState } from 'react';

export const ProfitLossCurrentModule = () => {
  const { data, loading, error, getLatestData } = useFinancialData();
  const [plData, setPlData] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<any[]>([]);

  // Default data as fallback
  const defaultKpiData = [
    {
      title: 'Ingresos Totales',
      value: '€2,500,000',
      subtitle: 'Facturación anual',
      trend: 'up' as const,
      trendValue: '+12%',
      icon: DollarSign,
      variant: 'success' as const
    },
    {
      title: 'Margen Bruto',
      value: '40%',
      subtitle: '€1,000,000',
      trend: 'up' as const,
      trendValue: '+2%',
      icon: Percent,
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
      title: 'Beneficio Neto',
      value: '€243,750',
      subtitle: '9.75% margen',
      trend: 'up' as const,
      trendValue: '+8%',
      icon: Calculator,
      variant: 'success' as const
    }
  ];

  const defaultPlData = [
    { concepto: 'Ventas Netas', valor: 2500000, porcentaje: 100 },
    { concepto: 'Coste de Ventas', valor: -1500000, porcentaje: -60 },
    { concepto: 'MARGEN BRUTO', valor: 1000000, porcentaje: 40, destacar: true },
    { concepto: 'Gastos Personal', valor: -400000, porcentaje: -16 },
    { concepto: 'Otros Gastos Explotación', valor: -150000, porcentaje: -6 },
    { concepto: 'EBITDA', valor: 450000, porcentaje: 18, destacar: true },
    { concepto: 'Amortizaciones', valor: -80000, porcentaje: -3.2 },
    { concepto: 'EBIT', valor: 370000, porcentaje: 14.8, destacar: true },
    { concepto: 'Gastos Financieros', valor: -45000, porcentaje: -1.8 },
    { concepto: 'BAI', valor: 325000, porcentaje: 13 },
    { concepto: 'Impuestos', valor: -81250, porcentaje: -3.25 },
    { concepto: 'BENEFICIO NETO', valor: 243750, porcentaje: 9.75, destacar: true },
  ];

  const evolucionTrimestral = [
    { trimestre: 'Q1', ingresos: 580000, gastos: 520000, beneficio: 60000 },
    { trimestre: 'Q2', ingresos: 620000, gastos: 545000, beneficio: 75000 },
    { trimestre: 'Q3', ingresos: 650000, gastos: 570000, beneficio: 80000 },
    { trimestre: 'Q4', ingresos: 650000, gastos: 560000, beneficio: 90000 }
  ];

  useEffect(() => {
    // Try to get P&G data from the database
    const pygData = getLatestData('estado_pyg');
    
    if (pygData && pygData.data_content) {
      // Process real data from database
      const content = pygData.data_content;
      console.log('P&G Data from database:', content);
      
      // Map real data to our format if available
      const realPlData = content.datos_financieros || defaultPlData;
      const realKpiData = content.kpis || defaultKpiData;
      
      setPlData(realPlData);
      setKpiData(realKpiData);
    } else {
      // Use default data as fallback
      setPlData(defaultPlData);
      setKpiData(defaultKpiData);
    }
  }, [data]);

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
                  Cuenta de Resultados Actual
                </h1>
                <p className="text-slate-700 text-lg font-medium">Análisis detallado del rendimiento financiero y rentabilidad</p>
              </div>
            </div>
          </section>

          {/* KPIs Grid */}
          <section>
            {loading ? (
              <div className="text-center">Cargando datos financieros...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiData.map((kpi, index) => (
                  <ModernKPICard key={index} {...kpi} />
                ))}
              </div>
            )}
          </section>

          {/* P&L Statement */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-steel/3 via-white/20 to-cadet/3 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-6 right-6 w-32 h-32 bg-steel/8 rounded-full blur-3xl"></div>
              <div className="absolute bottom-6 left-6 w-40 h-40 bg-cadet/6 rounded-full blur-3xl"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-slate-900 text-xl">Cuenta de Resultados Detallada</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {plData.map((item, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center py-3 px-6 border-b border-slate-100/60 ${
                        item.destacar
                          ? 'bg-steel-50/80 font-semibold backdrop-blur-sm'
                          : 'hover:bg-slate-50/60 backdrop-blur-sm'
                      }`}
                    >
                      <span className={`${item.destacar ? 'text-steel-800 font-bold' : 'text-slate-700'}`}>
                        {item.concepto}
                      </span>
                      <div className="flex space-x-6 text-right">
                        <span className={`font-mono ${
                          item.valor >= 0 ? 'text-success-600' : 'text-danger-600'
                        } ${item.destacar ? 'font-bold text-lg' : ''}`}>
                          {formatCurrency(item.valor)}
                        </span>
                        <span className={`text-slate-500 w-16 ${item.destacar ? 'font-semibold' : ''}`}>
                          {item.porcentaje.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Quarterly Evolution Chart */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-cadet/5 via-white/20 to-steel/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-cadet/8 rounded-full blur-3xl"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-slate-900 flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cadet/20 backdrop-blur-sm border border-cadet/30 shadow-xl">
                    <TrendingUp className="h-6 w-6 text-cadet-700" />
                  </div>
                  Evolución Trimestral
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="h-80 relative">
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolucionTrimestral}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="trimestre" stroke="#64748b" />
                      <YAxis stroke="#64748b" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value) => `€${Number(value).toLocaleString()}`} />
                      <Line type="monotone" dataKey="ingresos" stroke="#4682B4" strokeWidth={3} name="Ingresos" />
                      <Line type="monotone" dataKey="gastos" stroke="#5F9EA0" strokeWidth={3} name="Gastos" />
                      <Line type="monotone" dataKey="beneficio" stroke="#10B981" strokeWidth={3} name="Beneficio" />
                    </LineChart>
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
