
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Building, TrendingUp, Shield, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export const BalanceSheetCurrentModule = () => {
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [activoData, setActivoData] = useState<any[]>([]);
  const [pasivoData, setPasivoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);

  const defaultKpiData = [
    {
      title: 'Activo Total',
      value: '€3,200,000',
      subtitle: 'Total de activos',
      trend: 'up' as const,
      trendValue: '+8%',
      icon: Building,
      variant: 'success' as const
    },
    {
      title: 'Patrimonio Neto',
      value: '€1,800,000',
      subtitle: '56.25% del activo',
      trend: 'up' as const,
      trendValue: '+12%',
      icon: Shield,
      variant: 'success' as const
    },
    {
      title: 'Deuda Total',
      value: '€1,400,000',
      subtitle: '43.75% del activo',
      trend: 'down' as const,
      trendValue: '-5%',
      icon: CreditCard,
      variant: 'warning' as const
    },
    {
      title: 'Ratio Solvencia',
      value: '1.29',
      subtitle: 'Activo/Pasivo',
      trend: 'up' as const,
      trendValue: '+0.15',
      icon: TrendingUp,
      variant: 'success' as const
    }
  ];

  const defaultActivoData = [
    { name: 'Inmovilizado', value: 1800000, color: '#4682B4' },
    { name: 'Existencias', value: 650000, color: '#5F9EA0' },
    { name: 'Clientes', value: 420000, color: '#87CEEB' },
    { name: 'Tesorería', value: 330000, color: '#B0C4DE' }
  ];

  const defaultPasivoData = [
    { name: 'Patrimonio Neto', value: 1800000, color: '#10B981' },
    { name: 'Deuda LP', value: 900000, color: '#F59E0B' },
    { name: 'Deuda CP', value: 500000, color: '#EF4444' }
  ];

  const evolucionBalance = [
    { año: '2021', activo: 2800000, pasivo: 1200000, patrimonio: 1600000 },
    { año: '2022', activo: 3000000, pasivo: 1350000, patrimonio: 1650000 },
    { año: '2023', activo: 3200000, pasivo: 1400000, patrimonio: 1800000 }
  ];

  useEffect(() => {
    const fetchBalanceData = async () => {
      setLoading(true);
      try {
        // Fetch Balance data directly from fs_balance_lines table
        const { data: balanceData, error } = await supabase
          .from('fs_balance_lines')
          .select('*')
          .order('period_year', { ascending: false });

        if (error) throw error;

        if (balanceData && balanceData.length > 0) {
          setHasRealData(true);
          console.log('Balance data from fs_balance_lines:', balanceData);
          
          // Group by year and get latest year data
          const latestYear = Math.max(...balanceData.map(item => item.period_year));
          const latestYearData = balanceData.filter(item => item.period_year === latestYear);
          
          // Calculate totals from real data
          const dataMap = new Map(latestYearData.map(item => [item.concept, item.amount]));
          
          const totalAssets = (
            (dataMap.get('Inmovilizado material') || 0) +
            (dataMap.get('Inversiones inmobiliarias') || 0) +
            (dataMap.get('Inversiones financieras a largo plazo') || 0) +
            (dataMap.get('Existencias') || 0) +
            (dataMap.get('Deudores comerciales y otras cuentas a cobrar') || 0) +
            (dataMap.get('Inversiones financieras a corto plazo') || 0) +
            (dataMap.get('Efectivo y equivalentes') || 0)
          );

          const totalEquity = (
            (dataMap.get('Capital social') || 0) +
            (dataMap.get('Reservas') || 0) +
            (dataMap.get('Resultados ejercicios anteriores') || 0) +
            (dataMap.get('Resultado del ejercicio') || 0)
          );

          const totalDebt = (
            (dataMap.get('Deudas a largo plazo') || 0) +
            (dataMap.get('Deudas con empresas del grupo a largo plazo') || 0) +
            (dataMap.get('Deudas a corto plazo') || 0) +
            (dataMap.get('Deudas con empresas del grupo a corto plazo') || 0) +
            (dataMap.get('Acreedores comerciales y otras cuentas a pagar') || 0)
          );

          // Build real KPI data
          const realKpiData = [
            {
              title: 'Activo Total',
              value: formatCurrency(totalAssets),
              subtitle: 'Total de activos',
              trend: 'up' as const,
              trendValue: '+8%',
              icon: Building,
              variant: 'success' as const
            },
            {
              title: 'Patrimonio Neto',
              value: formatCurrency(totalEquity),
              subtitle: `${((totalEquity / totalAssets) * 100).toFixed(1)}% del activo`,
              trend: 'up' as const,
              trendValue: '+12%',
              icon: Shield,
              variant: 'success' as const
            },
            {
              title: 'Deuda Total',
              value: formatCurrency(totalDebt),
              subtitle: `${((totalDebt / totalAssets) * 100).toFixed(1)}% del activo`,
              trend: 'down' as const,
              trendValue: '-5%',
              icon: CreditCard,
              variant: 'warning' as const
            },
            {
              title: 'Ratio Solvencia',
              value: (totalAssets / totalDebt).toFixed(2),
              subtitle: 'Activo/Pasivo',
              trend: 'up' as const,
              trendValue: '+0.15',
              icon: TrendingUp,
              variant: 'success' as const
            }
          ];

          // Build activo data
          const realActivoData = [
            { name: 'Inmovilizado', value: dataMap.get('Inmovilizado material') || 0, color: '#4682B4' },
            { name: 'Existencias', value: dataMap.get('Existencias') || 0, color: '#5F9EA0' },
            { name: 'Clientes', value: dataMap.get('Deudores comerciales y otras cuentas a cobrar') || 0, color: '#87CEEB' },
            { name: 'Tesorería', value: dataMap.get('Efectivo y equivalentes') || 0, color: '#B0C4DE' }
          ];

          // Build pasivo data
          const realPasivoData = [
            { name: 'Patrimonio Neto', value: totalEquity, color: '#10B981' },
            { name: 'Deuda LP', value: (dataMap.get('Deudas a largo plazo') || 0) + (dataMap.get('Deudas con empresas del grupo a largo plazo') || 0), color: '#F59E0B' },
            { name: 'Deuda CP', value: (dataMap.get('Deudas a corto plazo') || 0) + (dataMap.get('Deudas con empresas del grupo a corto plazo') || 0) + (dataMap.get('Acreedores comerciales y otras cuentas a pagar') || 0), color: '#EF4444' }
          ];

          setKpiData(realKpiData);
          setActivoData(realActivoData);
          setPasivoData(realPasivoData);
        } else {
          setHasRealData(false);
          setKpiData(defaultKpiData);
          setActivoData(defaultActivoData);
          setPasivoData(defaultPasivoData);
        }
      } catch (error) {
        console.error('Error fetching Balance data:', error);
        setHasRealData(false);
        setKpiData(defaultKpiData);
        setActivoData(defaultActivoData);
        setPasivoData(defaultPasivoData);
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceData();
  }, []);

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
                  Balance de Situación Actual
                </h1>
                <p className="text-slate-700 text-lg font-medium">Análisis de la estructura patrimonial y financiera</p>
              </div>
            </div>
          </section>

          {/* KPIs Grid */}
          <section>
            {loading ? (
              <div className="text-center">Cargando datos del balance...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiData.map((kpi, index) => (
                  <ModernKPICard key={index} {...kpi} />
                ))}
              </div>
            )}
          </section>

          {/* Balance Structure Charts */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Estructura del Activo */}
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-steel/5 via-white/20 to-cadet/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-4 left-4 w-24 h-24 bg-steel/10 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-slate-900 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-steel/20 backdrop-blur-sm border border-steel/30 shadow-xl">
                      <Building className="h-6 w-6 text-steel-700" />
                    </div>
                    Estructura del Activo
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="h-80 relative">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activoData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {activoData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Estructura del Pasivo */}
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-cadet/5 via-white/20 to-steel/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute bottom-4 right-4 w-32 h-32 bg-cadet/8 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-slate-900 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-cadet/20 backdrop-blur-sm border border-cadet/30 shadow-xl">
                      <Shield className="h-6 w-6 text-cadet-700" />
                    </div>
                    Estructura del Pasivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="h-80 relative">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pasivoData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pasivoData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Evolution Chart */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-steel/3 via-white/20 to-cadet/3 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-6 right-6 w-32 h-32 bg-steel/8 rounded-full blur-3xl"></div>
              <div className="absolute bottom-6 left-6 w-40 h-40 bg-cadet/6 rounded-full blur-3xl"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-slate-900 flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-steel/20 backdrop-blur-sm border border-steel/30 shadow-xl">
                    <TrendingUp className="h-6 w-6 text-steel-700" />
                  </div>
                  Evolución del Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="h-80 relative">
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evolucionBalance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="año" stroke="#64748b" />
                      <YAxis stroke="#64748b" tickFormatter={(value) => `€${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="activo" fill="#4682B4" name="Activo" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pasivo" fill="#EF4444" name="Pasivo" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="patrimonio" fill="#10B981" name="Patrimonio" radius={[4, 4, 0, 0]} />
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
