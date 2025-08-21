import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, Shield, Zap, Calculator } from 'lucide-react';
import { useMemo } from 'react';
import { useFinancialRatiosOptimized, FinancialRatio } from '@/hooks/useFinancialRatiosOptimized';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { MissingFinancialData } from '@/components/ui/missing-financial-data';

export const FinancialRatiosCurrentModule = () => {
  const { 
    ratios, 
    loading, 
    error, 
    hasRealData, 
    refreshRatios 
  } = useFinancialRatiosOptimized();

  // Helper functions for calculations
  const formatRatio = (value: number, unit: string = '') => {
    if (value === 0) return 'Sin datos';
    return `${value.toFixed(2)}${unit}`;
  };

  // Get company context for display
  const { currentCompany, hasCompanyContext } = useCompanyContext();

  // Transform ratios to KPI format
  const kpiData = useMemo(() => {
    if (!hasRealData || !ratios.length) {
      return defaultKpiData;
    }

    // Take first 4 ratios for KPI cards
    return ratios.slice(0, 4).map((ratio, index) => {
      const icons = [TrendingUp, Shield, Zap, Calculator];
      const variants = ['success', 'info', 'warning', 'default'] as const;
      
      // Determine trend based on ratio value vs benchmark
      const getTrend = (value: number, benchmark: number) => {
        if (ratio.name.includes('Endeudamiento')) {
          return value <= benchmark ? 'up' : 'down';
        }
        return value >= benchmark ? 'up' : 'down';
      };

      const getVariant = (value: number, benchmark: number) => {
        if (ratio.name.includes('Endeudamiento')) {
          return value <= benchmark ? 'success' : value <= benchmark * 1.2 ? 'warning' : 'danger';
        }
        return value >= benchmark ? 'success' : value >= benchmark * 0.8 ? 'warning' : 'danger';
      };

      return {
        title: ratio.name,
        value: formatRatio(ratio.value, ratio.unit),
        subtitle: ratio.description,
        trend: getTrend(ratio.value, ratio.benchmark) as const,
        trendValue: `${ratio.value.toFixed(2)}${ratio.unit}`,
        icon: icons[index % icons.length],
        variant: getVariant(ratio.value, ratio.benchmark) as const
      };
    });
  }, [ratios, hasRealData]);





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