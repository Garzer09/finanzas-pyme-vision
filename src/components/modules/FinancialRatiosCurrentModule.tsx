import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, Shield, Zap, Calculator } from 'lucide-react';
import { useMemo } from 'react';
import { useCompanyData } from '@/hooks/useCompanyData';
import { MissingFinancialData } from '@/components/ui/missing-financial-data';

export const FinancialRatiosCurrentModule = () => {
  const { 
    data: allData, 
    loading, 
    error, 
    hasRealData, 
    getLatestData, 
    currentCompany, 
    hasCompanyContext 
  } = useCompanyData(['balance_situacion', 'estado_pyg']);

  // Helper functions for calculations
  const findValue = (content: Record<string, any>, keys: string[]) => {
    for (const key of keys) {
      const value = content[key] || content[key.toLowerCase()] || content[key.replace(/_/g, ' ')];
      if (value !== undefined && value !== null) {
        return Number(value) || 0;
      }
    }
    return 0;
  };

  const formatRatio = (value: number, unit: string = '') => {
    if (value === 0) return 'Sin datos';
    return `${value.toFixed(2)}${unit}`;
  };

  // Calculate ratios from real data
  const calculatedRatios = useMemo(() => {
    if (!hasRealData || !allData.length) {
      return null;
    }

    const latestBalance = getLatestData('balance_situacion');
    const latestPyg = getLatestData('estado_pyg');

    if (!latestBalance?.data_content && !latestPyg?.data_content) {
      return null;
    }

    const balanceContent = latestBalance?.data_content || {};
    const pygContent = latestPyg?.data_content || {};

    console.debug('[Ratios] Processing data:', { 
      balanceKeys: Object.keys(balanceContent).length,
      pygKeys: Object.keys(pygContent).length,
      companyId: hasCompanyContext ? currentCompany?.id : 'N/A'
    });

    // Balance sheet values
    const activoCorriente = findValue(balanceContent, ['activo_corriente', 'activo corriente']);
    const activoTotal = findValue(balanceContent, ['activo_total', 'total_activo']);
    const pasivoCorriente = findValue(balanceContent, ['pasivo_corriente', 'pasivo corriente']);
    const pasivoTotal = findValue(balanceContent, ['pasivo_total', 'total_pasivo']);
    const patrimonioNeto = findValue(balanceContent, ['patrimonio_neto', 'patrimonio neto']);
    const existencias = findValue(balanceContent, ['existencias']);
    const efectivo = findValue(balanceContent, ['efectivo_equivalentes', 'efectivo y equivalentes', 'tesoreria']);

    // P&L values
    const ventas = findValue(pygContent, ['importe_neto_cifra_negocios', 'ventas', 'ingresos']);
    const resultadoNeto = findValue(pygContent, ['resultado_ejercicio', 'resultado del ejercicio', 'beneficio_neto']);

    // Calculate ratios
    const ratioLiquidez = pasivoCorriente > 0 ? activoCorriente / pasivoCorriente : 0;
    const pruebaAcida = pasivoCorriente > 0 ? (activoCorriente - existencias) / pasivoCorriente : 0;
    const ratioTesoreria = pasivoCorriente > 0 ? efectivo / pasivoCorriente : 0;
    
    const ratioEndeudamiento = activoTotal > 0 ? (pasivoTotal / activoTotal) * 100 : 0;
    const autonomiaFinanciera = activoTotal > 0 ? (patrimonioNeto / activoTotal) * 100 : 0;
    const ratioSolvencia = pasivoTotal > 0 ? activoTotal / pasivoTotal : 0;

    const roa = activoTotal > 0 ? (resultadoNeto / activoTotal) * 100 : 0;
    const roe = patrimonioNeto > 0 ? (resultadoNeto / patrimonioNeto) * 100 : 0;
    const margenNeto = ventas > 0 ? (resultadoNeto / ventas) * 100 : 0;
    const rotacionActivos = activoTotal > 0 ? ventas / activoTotal : 0;

    return {
      // Liquidez
      ratioLiquidez,
      pruebaAcida,
      ratioTesoreria,
      // Endeudamiento
      ratioEndeudamiento,
      autonomiaFinanciera,
      ratioSolvencia,
      // Rentabilidad
      roa,
      roe,
      margenNeto,
      // Actividad
      rotacionActivos
    };
  }, [allData, hasRealData, getLatestData, hasCompanyContext, currentCompany]);

  // Default data for demo
  const defaultRatios = {
    ratioLiquidez: 1.35,
    pruebaAcida: 0.95,
    ratioTesoreria: 0.25,
    ratioEndeudamiento: 43.8,
    autonomiaFinanciera: 56.3,
    ratioSolvencia: 2.29,
    roa: 7.6,
    roe: 13.5,
    margenNeto: 9.75,
    rotacionActivos: 0.78
  };

  const ratios = calculatedRatios || defaultRatios;
  const isRealData = calculatedRatios !== null;

  // KPI Cards data
  const kpiData = [
    {
      title: 'ROE',
      value: formatRatio(ratios.roe, '%'),
      subtitle: 'Rentabilidad fondos propios',
      trend: ratios.roe > 15 ? 'up' as const : ratios.roe > 10 ? 'neutral' as const : 'down' as const,
      trendValue: `${ratios.roe.toFixed(1)}%`,
      icon: TrendingUp,
      variant: ratios.roe > 15 ? 'success' as const : ratios.roe > 10 ? 'warning' as const : 'danger' as const
    },
    {
      title: 'ROA',
      value: formatRatio(ratios.roa, '%'),
      subtitle: 'Rentabilidad activos',
      trend: ratios.roa > 8 ? 'up' as const : ratios.roa > 5 ? 'neutral' as const : 'down' as const,
      trendValue: `${ratios.roa.toFixed(1)}%`,
      icon: Calculator,
      variant: ratios.roa > 8 ? 'success' as const : ratios.roa > 5 ? 'warning' as const : 'danger' as const
    },
    {
      title: 'Ratio Liquidez',
      value: formatRatio(ratios.ratioLiquidez),
      subtitle: 'Capacidad de pago',
      trend: ratios.ratioLiquidez > 1.5 ? 'up' as const : ratios.ratioLiquidez > 1 ? 'neutral' as const : 'down' as const,
      trendValue: `${ratios.ratioLiquidez.toFixed(2)}x`,
      icon: Shield,
      variant: ratios.ratioLiquidez > 1.5 ? 'success' as const : ratios.ratioLiquidez > 1 ? 'warning' as const : 'danger' as const
    },
    {
      title: 'Autonomía Financiera',
      value: formatRatio(ratios.autonomiaFinanciera, '%'),
      subtitle: 'Independencia financiera',
      trend: ratios.autonomiaFinanciera > 50 ? 'up' as const : ratios.autonomiaFinanciera > 30 ? 'neutral' as const : 'down' as const,
      trendValue: `${ratios.autonomiaFinanciera.toFixed(1)}%`,
      icon: Zap,
      variant: ratios.autonomiaFinanciera > 50 ? 'success' as const : ratios.autonomiaFinanciera > 30 ? 'warning' as const : 'danger' as const
    }
  ];

  // Radar chart data
  const ratiosRadar = [
    { ratio: 'Liquidez', value: Math.min(ratios.ratioLiquidez * 50, 100) },
    { ratio: 'Solvencia', value: Math.min(ratios.ratioSolvencia * 25, 100) },
    { ratio: 'Rentabilidad', value: Math.min(ratios.roe * 5, 100) },
    { ratio: 'Eficiencia', value: Math.min(ratios.rotacionActivos * 100, 100) },
    { ratio: 'Autonomía', value: ratios.autonomiaFinanciera }
  ];

  // Comparison data
  const ratiosComparison = [
    { categoria: 'Liquidez', empresa: ratios.ratioLiquidez, sector: 1.4, benchmark: 1.5 },
    { categoria: 'ROE', empresa: ratios.roe, sector: 12.0, benchmark: 15.0 },
    { categoria: 'ROA', empresa: ratios.roa, sector: 6.5, benchmark: 8.0 },
    { categoria: 'Endeudamiento', empresa: ratios.ratioEndeudamiento, sector: 45.0, benchmark: 40.0 }
  ];

  // Detailed ratios by category
  const ratiosDetalle = [
    { 
      grupo: 'LIQUIDEZ', 
      ratios: [
        { nombre: 'Ratio Corriente', valor: ratios.ratioLiquidez, benchmark: 1.5, formula: 'Activo Corriente / Pasivo Corriente' },
        { nombre: 'Prueba Ácida', valor: ratios.pruebaAcida, benchmark: 1.0, formula: '(Activo Corriente - Existencias) / Pasivo Corriente' },
        { nombre: 'Ratio Tesorería', valor: ratios.ratioTesoreria, benchmark: 0.3, formula: 'Efectivo / Pasivo Corriente' }
      ]
    },
    { 
      grupo: 'RENTABILIDAD', 
      ratios: [
        { nombre: 'ROE', valor: ratios.roe, benchmark: 15.0, formula: 'Beneficio Neto / Patrimonio Neto × 100' },
        { nombre: 'ROA', valor: ratios.roa, benchmark: 8.0, formula: 'Beneficio Neto / Activo Total × 100' },
        { nombre: 'Margen Neto', valor: ratios.margenNeto, benchmark: 12.0, formula: 'Beneficio Neto / Ventas × 100' }
      ]
    },
    { 
      grupo: 'EFICIENCIA', 
      ratios: [
        { nombre: 'Rotación Activos', valor: ratios.rotacionActivos, benchmark: 0.9, formula: 'Ventas / Activo Total' }
      ]
    },
    { 
      grupo: 'ENDEUDAMIENTO', 
      ratios: [
        { nombre: 'Ratio Endeudamiento', valor: ratios.ratioEndeudamiento, benchmark: 40.0, formula: 'Pasivo Total / Activo Total × 100' },
        { nombre: 'Autonomía Financiera', valor: ratios.autonomiaFinanciera, benchmark: 60.0, formula: 'Patrimonio Neto / Activo Total × 100' },
        { nombre: 'Ratio Solvencia', valor: ratios.ratioSolvencia, benchmark: 2.0, formula: 'Activo Total / Pasivo Total' }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos de ratios financieros...</p>
        </div>
      </div>
    );
  }

  if (!hasRealData && hasCompanyContext) {
    return (
      <div className="space-y-8">
        <MissingFinancialData 
          dataType="ratios"
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
              Ratios Financieros
            </h1>
            <div className="flex items-center justify-between">
              <p className="text-slate-700 text-lg font-medium">
                {hasCompanyContext && currentCompany ? 
                  `Análisis integral de salud financiera - ${currentCompany.name}` : 
                  'Análisis integral de la salud financiera mediante ratios clave'
                }
              </p>
              {isRealData && hasRealData && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Datos Reales
                </span>
              )}
              {!isRealData && hasCompanyContext && (
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

      {/* Charts Section */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl overflow-hidden">
            <CardHeader className="relative z-10">
              <CardTitle className="text-slate-900 flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-steel/20 backdrop-blur-sm border border-steel/30 shadow-xl">
                  <TrendingUp className="h-6 w-6 text-steel-700" />
                </div>
                Perfil de Ratios
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="h-80 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={ratiosRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="ratio" className="text-sm" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Empresa"
                      dataKey="value"
                      stroke="#4682B4"
                      fill="#4682B4"
                      fillOpacity={0.3}
                      strokeWidth={3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Chart */}
          <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl overflow-hidden">
            <CardHeader className="relative z-10">
              <CardTitle className="text-slate-900 flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cadet/20 backdrop-blur-sm border border-cadet/30 shadow-xl">
                  <Calculator className="h-6 w-6 text-cadet-700" />
                </div>
                Comparativa Sectorial
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="h-80 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratiosComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="categoria" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="empresa" fill="#4682B4" name="Empresa" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sector" fill="#5F9EA0" name="Sector" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="benchmark" fill="#10B981" name="Benchmark" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Detailed Ratios */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {ratiosDetalle.map((grupo, index) => (
            <Card key={index} className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl overflow-hidden">
              <CardHeader className="relative z-10">
                <CardTitle className="text-slate-900 text-lg">{grupo.grupo}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  {grupo.ratios.map((ratio, ratioIndex) => (
                    <div key={ratioIndex} className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/40 shadow-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-900">{ratio.nombre}</span>
                        <div className="flex space-x-4">
                          <span className="font-bold text-steel-600">
                            {ratio.nombre.includes('%') || ratio.nombre.includes('Margen') || ratio.nombre.includes('ROE') || ratio.nombre.includes('ROA') ? 
                              `${ratio.valor.toFixed(1)}%` : ratio.valor.toFixed(2)}
                          </span>
                          <span className="text-sm text-slate-500">
                            Target: {ratio.nombre.includes('%') || ratio.nombre.includes('Margen') || ratio.nombre.includes('ROE') || ratio.nombre.includes('ROA') ? 
                              `${ratio.benchmark}%` : ratio.benchmark}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-200/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full ${
                            ratio.valor >= ratio.benchmark
                              ? 'bg-gradient-to-r from-success-500 to-success-600' 
                              : 'bg-gradient-to-r from-warning-500 to-warning-600'
                          }`}
                          style={{ 
                            width: `${Math.min((ratio.valor / ratio.benchmark) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">{ratio.formula}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};