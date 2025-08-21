import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Building, TrendingUp, Shield, CreditCard } from 'lucide-react';
import { useMemo } from 'react';
import { useCompanyData } from '@/hooks/useCompanyData';
import { MissingFinancialData } from '@/components/ui/missing-financial-data';

export const BalanceSheetCurrentModule = () => {
  const { data, loading, error, hasRealData, getLatestData, currentCompany, hasCompanyContext } = useCompanyData('balance_situacion');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Helper function to find value by multiple possible keys
  const findValue = (content: Record<string, any>, keys: string[]) => {
    for (const key of keys) {
      const value = content[key] || content[key.toLowerCase()] || content[key.replace(/_/g, ' ')];
      if (value !== undefined && value !== null) {
        return Number(value) || 0;
      }
    }
    return 0;
  };

  // Default fallback data
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
      subtitle: '56.3% del activo',
      trend: 'up' as const,
      trendValue: '+12%',
      icon: Shield,
      variant: 'success' as const
    },
    {
      title: 'Deuda Total',
      value: '€1,400,000',
      subtitle: '43.7% del activo',
      trend: 'down' as const,
      trendValue: '-5%',
      icon: CreditCard,
      variant: 'warning' as const
    },
    {
      title: 'Ratio Solvencia',
      value: '2.29',
      subtitle: 'Activo/Pasivo',
      trend: 'up' as const,
      trendValue: '+0.15',
      icon: TrendingUp,
      variant: 'success' as const
    }
  ];

  const defaultActivoData = [
    { name: 'Inmovilizado', value: 1600000, color: '#4682B4' },
    { name: 'Existencias', value: 480000, color: '#5F9EA0' },
    { name: 'Clientes', value: 720000, color: '#87CEEB' },
    { name: 'Tesorería', value: 400000, color: '#B0C4DE' }
  ];

  const defaultPasivoData = [
    { name: 'Patrimonio Neto', value: 1800000, color: '#10B981' },
    { name: 'Deuda LP', value: 800000, color: '#F59E0B' },
    { name: 'Deuda CP', value: 600000, color: '#EF4444' }
  ];

  const evolucionBalance = [
    { año: '2021', activo: 2800000, pasivo: 1200000, patrimonio: 1600000 },
    { año: '2022', activo: 3000000, pasivo: 1350000, patrimonio: 1650000 },
    { año: '2023', activo: 3200000, pasivo: 1400000, patrimonio: 1800000 }
  ];

  // Process balance data using the standard hook pattern
  const processedData = useMemo(() => {
    if (!hasRealData || !data.length) {
      return { kpiData: defaultKpiData, activoData: defaultActivoData, pasivoData: defaultPasivoData };
    }

    const latestData = getLatestData('balance_situacion');
    if (!latestData?.data_content) {
      return { kpiData: defaultKpiData, activoData: defaultActivoData, pasivoData: defaultPasivoData };
    }

    const content = latestData.data_content;
    console.debug('[Balance] Processing data:', { 
      records: data.length, 
      latestKeys: Object.keys(content).length,
      companyId: hasCompanyContext ? currentCompany?.id : 'N/A'
    });
    
    // Calculate totals from real data using robust key matching
    const totalAssets = 
      findValue(content, ['activo_total', 'total_activo']) ||
      findValue(content, ['inmovilizado_material', 'inmovilizado material']) +
      findValue(content, ['inversiones_inmobiliarias', 'inversiones inmobiliarias']) +
      findValue(content, ['inversiones_financieras_largo_plazo', 'inversiones financieras a largo plazo']) +
      findValue(content, ['existencias']) +
      findValue(content, ['deudores_comerciales', 'deudores comerciales y otras cuentas a cobrar']) +
      findValue(content, ['inversiones_financieras_corto_plazo', 'inversiones financieras a corto plazo']) +
      findValue(content, ['efectivo_equivalentes', 'efectivo y equivalentes', 'tesoreria']);

    const totalEquity = 
      findValue(content, ['patrimonio_neto', 'patrimonio neto']) ||
      findValue(content, ['capital_social', 'capital social']) +
      findValue(content, ['reservas']) +
      findValue(content, ['resultados_ejercicios_anteriores', 'resultados ejercicios anteriores']) +
      findValue(content, ['resultado_ejercicio', 'resultado del ejercicio']);

    const totalDebt = 
      findValue(content, ['pasivo_total', 'total_pasivo']) ||
      findValue(content, ['deudas_largo_plazo', 'deudas a largo plazo']) +
      findValue(content, ['deudas_grupo_largo_plazo', 'deudas con empresas del grupo a largo plazo']) +
      findValue(content, ['deudas_corto_plazo', 'deudas a corto plazo']) +
      findValue(content, ['deudas_grupo_corto_plazo', 'deudas con empresas del grupo a corto plazo']) +
      findValue(content, ['acreedores_comerciales', 'acreedores comerciales y otras cuentas a pagar']);

    // Calculate ratios
    const equityRatio = totalAssets > 0 ? (totalEquity / totalAssets) * 100 : 0;
    const debtRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;
    const solvencyRatio = totalDebt > 0 ? totalAssets / totalDebt : 0;

    // Build KPI data with real calculations
    const kpiData = [
      {
        title: 'Activo Total',
        value: totalAssets > 0 ? formatCurrency(totalAssets) : 'Sin datos',
        subtitle: 'Total de activos',
        trend: 'neutral' as const,
        trendValue: '0%',
        icon: Building,
        variant: totalAssets > 0 ? 'success' as const : 'default' as const
      },
      {
        title: 'Patrimonio Neto',
        value: totalEquity !== 0 ? formatCurrency(totalEquity) : 'Sin datos',
        subtitle: equityRatio > 0 ? `${equityRatio.toFixed(1)}% del activo` : 'Sin datos',
        trend: equityRatio > 50 ? 'up' as const : equityRatio > 30 ? 'neutral' as const : 'down' as const,
        trendValue: `${equityRatio.toFixed(1)}%`,
        icon: Shield,
        variant: equityRatio > 50 ? 'success' as const : equityRatio > 30 ? 'warning' as const : 'danger' as const
      },
      {
        title: 'Deuda Total',
        value: totalDebt !== 0 ? formatCurrency(totalDebt) : 'Sin datos',
        subtitle: debtRatio > 0 ? `${debtRatio.toFixed(1)}% del activo` : 'Sin datos',
        trend: debtRatio < 50 ? 'up' as const : debtRatio < 70 ? 'neutral' as const : 'down' as const,
        trendValue: `${debtRatio.toFixed(1)}%`,
        icon: CreditCard,
        variant: debtRatio < 50 ? 'success' as const : debtRatio < 70 ? 'warning' as const : 'danger' as const
      },
      {
        title: 'Ratio Solvencia',
        value: solvencyRatio > 0 ? solvencyRatio.toFixed(2) : 'Sin datos',
        subtitle: 'Activo/Pasivo total',
        trend: solvencyRatio > 2 ? 'up' as const : solvencyRatio > 1.5 ? 'neutral' as const : 'down' as const,
        trendValue: solvencyRatio > 0 ? `${solvencyRatio.toFixed(2)}x` : '0x',
        icon: TrendingUp,
        variant: solvencyRatio > 2 ? 'success' as const : solvencyRatio > 1.5 ? 'warning' as const : solvencyRatio > 0 ? 'danger' as const : 'default' as const
      }
    ];

    // Build structure data for charts
    const activoData = [
      { name: 'Inmovilizado', value: findValue(content, ['inmovilizado_material', 'inmovilizado material']), color: '#4682B4' },
      { name: 'Existencias', value: findValue(content, ['existencias']), color: '#5F9EA0' },
      { name: 'Clientes', value: findValue(content, ['deudores_comerciales', 'deudores comerciales y otras cuentas a cobrar']), color: '#87CEEB' },
      { name: 'Tesorería', value: findValue(content, ['efectivo_equivalentes', 'efectivo y equivalentes', 'tesoreria']), color: '#B0C4DE' }
    ].filter(item => item.value > 0);

    const pasivoData = [
      { name: 'Patrimonio Neto', value: totalEquity, color: '#10B981' },
      { name: 'Deuda LP', value: findValue(content, ['deudas_largo_plazo', 'deudas a largo plazo']), color: '#F59E0B' },
      { name: 'Deuda CP', value: findValue(content, ['deudas_corto_plazo', 'deudas a corto plazo']) + findValue(content, ['acreedores_comerciales', 'acreedores comerciales y otras cuentas a pagar']), color: '#EF4444' }
    ].filter(item => item.value !== 0);

    return { kpiData, activoData, pasivoData };
  }, [data, hasRealData, getLatestData, hasCompanyContext, currentCompany]);

  const { kpiData, activoData, pasivoData } = processedData;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos del balance...</p>
        </div>
      </div>
    );
  }

  if (!hasRealData && hasCompanyContext) {
    return (
      <div className="space-y-8">
        <MissingFinancialData 
          dataType="balance"
          onUploadClick={() => window.location.href = '/admin/cargas'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <section className="relative">
        <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-steel/5 via-cadet/3 to-slate-100/5 rounded-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-steel-800 bg-clip-text text-transparent">
              Balance de Situación
            </h1>
            <div className="flex items-center justify-between">
              <p className="text-slate-700 text-lg font-medium">
                {hasCompanyContext && currentCompany ? 
                  `Análisis patrimonial - ${currentCompany.name}` : 
                  'Análisis de la estructura patrimonial y financiera'
                }
              </p>
              {hasRealData && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Datos Reales
                </span>
              )}
              {!hasRealData && hasCompanyContext && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                  <div className="w-2 h-2 bg-amber-600 rounded-full mr-2"></div>
                  Datos de Demostración
                </span>
              )}
            </div>
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

      {/* Balance Structure Charts */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Estructura del Activo */}
          <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl overflow-hidden">
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
          <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl overflow-hidden">
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
      {hasRealData && (
        <section>
          <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl overflow-hidden">
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
      )}
    </div>
  );
};