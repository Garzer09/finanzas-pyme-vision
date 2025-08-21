import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, Shield, Zap, Calculator } from 'lucide-react';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export const FinancialRatiosCurrentModule = () => {
  const { companyId } = useCompanyContext();
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);

  const defaultKpiData = [
    {
      title: 'ROE',
      value: '13.5%',
      subtitle: 'Rentabilidad fondos propios',
      trend: 'up' as const,
      trendValue: '+2.1%',
      icon: TrendingUp,
      variant: 'success' as const
    },
    {
      title: 'ROA',
      value: '7.6%',
      subtitle: 'Rentabilidad activos',
      trend: 'up' as const,
      trendValue: '+1.2%',
      icon: Calculator,
      variant: 'success' as const
    },
    {
      title: 'Ratio Liquidez',
      value: '1.35',
      subtitle: 'Capacidad de pago',
      trend: 'up' as const,
      trendValue: '+0.15',
      icon: Shield,
      variant: 'success' as const
    },
    {
      title: 'Rotación Activos',
      value: '0.78x',
      subtitle: 'Eficiencia activos',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: Zap,
      variant: 'default' as const
    }
  ];

  const ratiosRadar = [
    { ratio: 'Liquidez', value: 85, fullMark: 100 },
    { ratio: 'Solvencia', value: 78, fullMark: 100 },
    { ratio: 'Rentabilidad', value: 82, fullMark: 100 },
    { ratio: 'Eficiencia', value: 75, fullMark: 100 },
    { ratio: 'Endeudamiento', value: 70, fullMark: 100 },
    { ratio: 'Actividad', value: 73, fullMark: 100 }
  ];

  const ratiosComparison = [
    { categoria: 'Liquidez', empresa: 1.35, sector: 1.25, benchmark: 1.50 },
    { categoria: 'Solvencia', empresa: 1.29, sector: 1.15, benchmark: 1.40 },
    { categoria: 'ROE', empresa: 13.5, sector: 11.2, benchmark: 15.0 },
    { categoria: 'ROA', empresa: 7.6, sector: 6.8, benchmark: 9.0 },
    { categoria: 'Endeudamiento', empresa: 43.8, sector: 52.3, benchmark: 40.0 },
    { categoria: 'Rotación', empresa: 0.78, sector: 0.85, benchmark: 0.90 }
  ];

  const ratiosDetalle = [
    { grupo: 'LIQUIDEZ', ratios: [
      { nombre: 'Ratio de Liquidez', valor: 1.35, benchmark: 1.5, formula: 'Activo Corriente / Pasivo Corriente' },
      { nombre: 'Test Ácido', valor: 0.92, benchmark: 1.0, formula: '(AC - Existencias) / PC' },
      { nombre: 'Ratio Tesorería', valor: 0.33, benchmark: 0.3, formula: 'Disponible / Pasivo Corriente' }
    ]},
    { grupo: 'RENTABILIDAD', ratios: [
      { nombre: 'ROE', valor: 13.5, benchmark: 15.0, formula: 'Beneficio Neto / Patrimonio Neto' },
      { nombre: 'ROA', valor: 7.6, benchmark: 9.0, formula: 'Beneficio Neto / Activo Total' },
      { nombre: 'Margen Neto', valor: 9.75, benchmark: 12.0, formula: 'Beneficio Neto / Ventas' }
    ]},
    { grupo: 'EFICIENCIA', ratios: [
      { nombre: 'Rotación Activos', valor: 0.78, benchmark: 0.9, formula: 'Ventas / Activo Total' },
      { nombre: 'Rotación Existencias', valor: 8.2, benchmark: 10.0, formula: 'Coste Ventas / Existencias' },
      { nombre: 'Rotación Clientes', valor: 5.9, benchmark: 7.2, formula: 'Ventas / Clientes' }
    ]},
    { grupo: 'ENDEUDAMIENTO', ratios: [
      { nombre: 'Ratio Endeudamiento', valor: 43.8, benchmark: 40.0, formula: 'Pasivo Total / Activo Total' },
      { nombre: 'Ratio Autonomía', valor: 56.3, benchmark: 60.0, formula: 'Patrimonio Neto / Activo Total' },
      { nombre: 'Cobertura Intereses', valor: 8.2, benchmark: 10.0, formula: 'EBIT / Gastos Financieros' }
    ]}
  ];

  useEffect(() => {
    const fetchRatiosData = async () => {
      if (!companyId) return;
      
      setLoading(true);
      try {
        // Check if company has financial data to calculate ratios
        const { data: balanceData, error: balanceError } = await supabase
          .from('fs_balance_lines')
          .select('*')
          .eq('company_id', companyId)
          .limit(1);

        const { data: pygData, error: pygError } = await supabase
          .from('fs_pyg_lines')
          .select('*')
          .eq('company_id', companyId)
          .limit(1);

        if (balanceError || pygError) {
          console.error('Error checking financial data:', balanceError || pygError);
        }

        if (balanceData && balanceData.length > 0 && pygData && pygData.length > 0) {
          setHasRealData(true);
          // TODO: Calculate real ratios from financial data
          setKpiData(defaultKpiData);
        } else {
          setHasRealData(false);
          setKpiData(defaultKpiData);
        }
      } catch (error) {
        console.error('Error fetching ratios data:', error);
        setHasRealData(false);
        setKpiData(defaultKpiData);
      } finally {
        setLoading(false);
      }
    };

    fetchRatiosData();
  }, [companyId]);

  return (
    <main className="flex-1 p-6 space-y-8 overflow-auto bg-gradient-to-br from-slate-50 via-white to-steel-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header Section */}
      <section className="relative">
        <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-steel/5 via-cadet/3 to-slate-100/5 rounded-3xl"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-steel/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-cadet/8 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-steel-800 bg-clip-text text-transparent">
              Ratios Financieros Actuales
            </h1>
            <p className="text-slate-700 text-lg font-medium">Análisis integral de la salud financiera mediante ratios clave</p>
          </div>
        </div>
      </section>

      {/* KPIs Grid */}
      <section>
        {loading ? (
          <div className="text-center">Cargando datos de ratios...</div>
        ) : (
          <>
            {!hasRealData && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Datos de demostración:</strong> Esta empresa no tiene datos reales para calcular ratios. Se muestran ratios de ejemplo para demostrar la funcionalidad.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiData.map((kpi, index) => (
                <ModernKPICard key={index} {...kpi} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Radar Chart and Comparison */}
      {(hasRealData || (!hasRealData && kpiData.length > 0)) && (
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Radar Chart */}
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-steel/5 via-white/20 to-cadet/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-4 left-4 w-24 h-24 bg-steel/10 rounded-full blur-3xl"></div>
              
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
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
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
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-cadet/5 via-white/20 to-steel/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-cadet/8 rounded-full blur-3xl"></div>
              
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
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
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
      )}

      {/* Detailed Ratios */}
      {hasRealData && (
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {ratiosDetalle.map((grupo, index) => (
              <Card key={index} className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel/30 rounded-3xl shadow-2xl hover:shadow-2xl hover:shadow-steel/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-steel/3 via-white/20 to-cadet/3 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-6 right-6 w-32 h-32 bg-steel/8 rounded-full blur-3xl"></div>
                <div className="absolute bottom-6 left-6 w-40 h-40 bg-cadet/6 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-slate-900 text-lg">{grupo.grupo}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    {grupo.ratios.map((ratio, ratioIndex) => (
                      <div key={ratioIndex} className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-slate-900">{ratio.nombre}</span>
                          <div className="flex space-x-4">
                            <span className="font-bold text-steel-600">
                              {ratio.nombre.includes('%') || ratio.nombre.includes('Margen') ? `${ratio.valor}%` : ratio.valor}
                            </span>
                            <span className="text-sm text-slate-500">
                              Target: {ratio.nombre.includes('%') || ratio.nombre.includes('Margen') ? `${ratio.benchmark}%` : ratio.benchmark}
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
      )}
    </main>
  );
};