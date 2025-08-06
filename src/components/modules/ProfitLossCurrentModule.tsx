import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Percent, Calculator } from 'lucide-react';
import { useCompanyData } from '@/hooks/useCompanyData';
import { MissingFinancialData } from '@/components/ui/missing-financial-data';

export const ProfitLossCurrentModule = () => {
  const { data, loading, error, hasRealData, getLatestData, currentCompany, hasCompanyContext } = useCompanyData('pyg');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Default fallback data
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

  // Process real data if available
  const processedData = () => {
    if (!hasRealData || !data.length) {
      return { kpiData: defaultKpiData, plData: defaultPlData };
    }

    const latestData = getLatestData('pyg');
    if (!latestData?.data_content) {
      return { kpiData: defaultKpiData, plData: defaultPlData };
    }

    const content = latestData.data_content;
    
    // Extract main financial figures
    const revenue = content['importe_neto_cifra_negocios'] || content['ventas'] || 0;
    const ebitda = content['ebitda'] || 0;
    const netIncome = content['resultado_neto'] || 0;

    const kpiData = [
      {
        title: 'Ingresos Totales',
        value: formatCurrency(revenue),
        subtitle: hasCompanyContext ? `${currentCompany?.name}` : 'Cifra de negocios',
        trend: 'up' as const,
        trendValue: '+12%',
        icon: DollarSign,
        variant: 'success' as const
      },
      {
        title: 'EBITDA',
        value: formatCurrency(ebitda),
        subtitle: revenue ? `${((ebitda / revenue) * 100).toFixed(1)}% margen` : 'Sin datos',
        trend: 'up' as const,
        trendValue: '+5%',
        icon: TrendingUp,
        variant: 'success' as const
      },
      {
        title: 'Resultado Neto',
        value: formatCurrency(netIncome),
        subtitle: revenue ? `${((netIncome / revenue) * 100).toFixed(1)}% margen` : 'Sin datos',
        trend: netIncome >= 0 ? 'up' as const : 'down' as const,
        trendValue: '+8%',
        icon: Calculator,
        variant: netIncome >= 0 ? 'success' as const : 'danger' as const
      }
    ];

    // Build P&L structure from real data
    const plData = Object.entries(content).map(([key, value]) => ({
      concepto: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      valor: Number(value) || 0,
      porcentaje: revenue !== 0 ? (Number(value) / revenue) * 100 : 0,
      destacar: ['ebitda', 'resultado_neto', 'importe_neto_cifra_negocios'].includes(key)
    })).filter(item => item.valor !== 0);

    return { kpiData, plData };
  };

  const { kpiData, plData } = processedData();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Cargando datos financieros...</div>
      </div>
    );
  }

  if (!hasRealData && hasCompanyContext) {
    return (
      <div className="container mx-auto p-6">
        <MissingFinancialData 
          dataType="pyg"
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
              Cuenta de Resultados
            </h1>
            <p className="text-slate-700 text-lg font-medium">
              {hasCompanyContext && currentCompany ? 
                `Análisis de rentabilidad - ${currentCompany.name}` : 
                'Análisis detallado del rendimiento financiero y rentabilidad'
              }
            </p>
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

      {/* P&L Statement */}
      <section>
        <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl overflow-hidden">
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
        <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl overflow-hidden">
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
    </div>
  );
};