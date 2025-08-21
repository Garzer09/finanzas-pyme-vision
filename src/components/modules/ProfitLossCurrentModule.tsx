import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Percent, Calculator } from 'lucide-react';
import { useCompanyData } from '@/hooks/useCompanyData';
import { MissingFinancialData } from '@/components/ui/missing-financial-data';

export const ProfitLossCurrentModule = () => {
  const { data, loading, error, hasRealData, getLatestData, currentCompany, hasCompanyContext } = useCompanyData('estado_pyg');

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

  // Helpers to robustly find values by multiple synonyms/variants
  const normalizeKey = (key: string) => key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
  const findValue = (content: Record<string, any>, variants: string[]) => {
    const map = new Map<string, any>();
    Object.entries(content).forEach(([k, v]) => map.set(normalizeKey(k), v));
    for (const variant of variants) {
      const norm = normalizeKey(variant);
      if (map.has(norm)) return Number(map.get(norm)) || 0;
      // fuzzy contains
      for (const [k, v] of map.entries()) {
        if (k.includes(norm)) return Number(v) || 0;
      }
    }
    return 0;
  };

  // Process real data if available
  const processedData = () => {
    if (!hasRealData || !data.length) {
      return { kpiData: defaultKpiData, plData: defaultPlData };
    }

    const latestData = getLatestData('estado_pyg');
    if (!latestData?.data_content) {
      return { kpiData: defaultKpiData, plData: defaultPlData };
    }

    const content = latestData.data_content;
    
    // Extract main financial figures using robust synonyms
    const revenue = findValue(content, [
      'importe_neto_cifra_negocios', 'importe neto cifra negocios', 'cifra de negocios', 'ventas', 'ingresos', 'importe_neto_de_la_cifra_de_negocios'
    ]);
    const ebitda = findValue(content, [
      'ebitda', 'resultado bruto de explotacion', 'resultado_bruto_explotacion'
    ]);
    const netIncome = findValue(content, [
      'resultado_neto', 'beneficio_neto', 'resultado del ejercicio', 'resultado_del_ejercicio'
    ]);

    console.debug('[P&L] Processing data:', { 
      records: data.length, 
      latestKeys: Object.keys(content).length, 
      revenue, 
      ebitda, 
      netIncome,
      companyId: hasCompanyContext ? currentCompany?.id : 'N/A'
    });

    // Calculate margins and trends more accurately
    const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
    
    // Get previous period for trend calculation
    const previousData = getPeriodComparison('estado_pyg');
    const prevContent = previousData.length > 1 ? previousData[1]?.data_content : null;
    
    const prevRevenue = prevContent ? findValue(prevContent, [
      'importe_neto_cifra_negocios', 'ventas', 'ingresos'
    ]) : 0;
    
    const prevEbitda = prevContent ? findValue(prevContent, [
      'ebitda', 'resultado_bruto_explotacion'
    ]) : 0;
    
    const prevNetIncome = prevContent ? findValue(prevContent, [
      'resultado_neto', 'beneficio_neto'
    ]) : 0;
    
    // Calculate real trends
    const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ebitdaGrowth = prevEbitda !== 0 ? ((ebitda - prevEbitda) / Math.abs(prevEbitda)) * 100 : 0;
    const netGrowth = prevNetIncome !== 0 ? ((netIncome - prevNetIncome) / Math.abs(prevNetIncome)) * 100 : 0;

    const kpiData = [
      {
        title: 'Ingresos Totales',
        value: revenue > 0 ? formatCurrency(revenue) : 'Sin datos',
        subtitle: hasCompanyContext && currentCompany ? `${currentCompany.name}` : 'Cifra de negocios',
        trend: revenueGrowth > 0 ? 'up' as const : revenueGrowth < 0 ? 'down' as const : 'neutral' as const,
        trendValue: Math.abs(revenueGrowth) >= 0.1 ? `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%` : '0%',
        icon: DollarSign,
        variant: revenue > 0 ? 'success' as const : 'default' as const
      },
      {
        title: 'EBITDA',
        value: ebitda !== 0 ? formatCurrency(ebitda) : 'Sin datos',
        subtitle: ebitdaMargin !== 0 ? `${ebitdaMargin.toFixed(1)}% margen` : 'Sin datos de margen',
        trend: ebitdaGrowth > 0 ? 'up' as const : ebitdaGrowth < 0 ? 'down' as const : 'neutral' as const,
        trendValue: Math.abs(ebitdaGrowth) >= 0.1 ? `${ebitdaGrowth > 0 ? '+' : ''}${ebitdaGrowth.toFixed(1)}%` : '0%',
        icon: TrendingUp,
        variant: ebitda > 0 ? 'success' as const : ebitda < 0 ? 'danger' as const : 'default' as const
      },
      {
        title: 'Resultado Neto',
        value: netIncome !== 0 ? formatCurrency(netIncome) : 'Sin datos',
        subtitle: netMargin !== 0 ? `${netMargin.toFixed(1)}% margen neto` : 'Sin datos de margen',
        trend: netGrowth > 0 ? 'up' as const : netGrowth < 0 ? 'down' as const : 'neutral' as const,
        trendValue: Math.abs(netGrowth) >= 0.1 ? `${netGrowth > 0 ? '+' : ''}${netGrowth.toFixed(1)}%` : '0%',
        icon: Calculator,
        variant: netIncome > 0 ? 'success' as const : netIncome < 0 ? 'danger' as const : 'default' as const
      }
    ];

    // Helper function to format concept names
    const formatConceptName = (key: string): string => {
      // Common P&L concept translations
      const translations: Record<string, string> = {
        'importe_neto_cifra_negocios': 'Importe Neto de la Cifra de Negocios',
        'importe_neto_de_la_cifra_de_negocios': 'Importe Neto de la Cifra de Negocios',
        'variacion_existencias': 'Variación de Existencias',
        'trabajos_realizados_empresa': 'Trabajos Realizados por la Empresa',
        'aprovisionamientos': 'Aprovisionamientos',
        'otros_gastos_explotacion': 'Otros Gastos de Explotación',
        'gastos_personal': 'Gastos de Personal',
        'amortizacion_inmovilizado': 'Amortización del Inmovilizado',
        'resultado_explotacion': 'RESULTADO DE EXPLOTACIÓN',
        'resultado_bruto_explotacion': 'RESULTADO BRUTO DE EXPLOTACIÓN (EBITDA)',
        'ebitda': 'EBITDA',
        'ingresos_financieros': 'Ingresos Financieros',
        'gastos_financieros': 'Gastos Financieros',
        'resultado_financiero': 'Resultado Financiero',
        'resultado_antes_impuestos': 'Resultado Antes de Impuestos',
        'impuesto_beneficios': 'Impuesto sobre Beneficios',
        'resultado_neto': 'RESULTADO NETO DEL EJERCICIO',
        'resultado_del_ejercicio': 'RESULTADO DEL EJERCICIO'
      };
      
      return translations[key.toLowerCase()] || 
             key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    const isHighlightedConcept = (key: string): boolean => {
      const highlighted = [
        'importe_neto_cifra_negocios',
        'importe_neto_de_la_cifra_de_negocios', 
        'resultado_bruto_explotacion',
        'ebitda',
        'resultado_explotacion',
        'resultado_antes_impuestos',
        'resultado_neto',
        'resultado_del_ejercicio'
      ];
      return highlighted.includes(key.toLowerCase());
    };

    // Build P&L structure from real data with better formatting
    const plData = Object.entries(content)
      .map(([key, value]) => {
        const numValue = Number(value) || 0;
        return {
          concepto: formatConceptName(key),
          valor: numValue,
          porcentaje: revenue !== 0 ? (numValue / revenue) * 100 : 0,
          destacar: isHighlightedConcept(key),
          isPositive: numValue >= 0
        };
      })
      .filter(item => Math.abs(item.valor) >= 1) // Filter very small amounts
      .sort((a, b) => {
        // Sort by importance and then by value
        if (a.destacar && !b.destacar) return -1;
        if (!a.destacar && b.destacar) return 1;
        return Math.abs(b.valor) - Math.abs(a.valor);
      });

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
            <div className="flex items-center justify-between">
              <p className="text-slate-700 text-lg font-medium">
                {hasCompanyContext && currentCompany ? 
                  `Análisis de rentabilidad - ${currentCompany.name}` : 
                  'Análisis detallado del rendimiento financiero y rentabilidad'
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
                      item.isPositive ? 'text-success-600' : 'text-danger-600'
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