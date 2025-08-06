import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClaudeInsights } from '@/components/ClaudeInsights';
import { useExecutiveKPIs } from '@/hooks/useExecutiveKPIs';
import { AlertTriangle } from 'lucide-react';

export const ConclusionsModule = () => {
  const { kpis, hasAnyData, dataStatus } = useExecutiveKPIs();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive': return 'text-success-600 bg-success-50 border-success-200';
      case 'warning': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'negative': return 'text-danger-600 bg-danger-50 border-danger-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50/30">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-8 space-y-8 overflow-auto">
          {/* Header Section */}
          <section className="relative">
            <div className="modern-card p-8 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel-50/50 via-cadet-50/30 to-steel-50/20"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-steel-500 to-cadet-500"></div>
              
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-cadet-600 bg-clip-text text-transparent">
                  Conclusiones del Análisis Financiero
                </h1>
                <p className="text-slate-700 text-lg font-medium">Síntesis ejecutiva y recomendaciones estratégicas</p>
              </div>
            </div>
          </section>

          {/* KPIs Summary */}
          <section>
            {!hasAnyData ? (
              <Card className="modern-card p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-warning-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Datos de KPIs Ejecutivos Incompletos</h3>
                <p className="text-muted-foreground mb-4">
                  Para mostrar los KPIs ejecutivos necesitamos datos de estados financieros, valoración y deuda.
                </p>
                <div className="text-sm text-muted-foreground">
                  Faltantes: {[
                    !dataStatus.financial && "Estados financieros",
                    !dataStatus.valuation && "Valoración",
                    !dataStatus.debt && "Pool de deuda",
                    !dataStatus.ratios && "Ratios"
                  ].filter(Boolean).join(', ')}
                </div>
              </Card>
            ) : (
              <div className="responsive-grid">
                {kpis.map((kpi, index) => {
                  const Icon = kpi.icon;
                  return (
                    <Card key={index} className={`modern-card p-6 hover:shadow-lg transition-all duration-300 ${getStatusColor(kpi.status)}`}>
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/80 border border-current/20">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">{kpi.label}</h3>
                          <p className="text-2xl font-bold">{kpi.value}</p>
                          {kpi.calculation && (
                            <p className="text-xs text-muted-foreground mt-1">{kpi.calculation}</p>
                          )}
                          {!kpi.hasData && (
                            <Badge variant="outline" className="mt-2 text-xs">Datos parciales</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Claude Analysis Section */}
          <section>
            <ClaudeInsights
              analysisType="conclusions"
              title="Análisis Integral y Conclusiones"
              description="Síntesis ejecutiva, fortalezas, debilidades, riesgos y recomendaciones estratégicas"
              className="border-0 shadow-lg"
              autoAnalyze={true}
              showHeader={true}
              showMetrics={false}
              showRecommendations={true}
              companyInfo={{
                name: "Empresa Analizada",
                sector: "Industrial",
                size: "Mediana"
              }}
            />
          </section>

          {/* Secondary Analysis Sections */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Análisis de Estructura Financiera */}
            <ClaudeInsights
              analysisType="balance"
              title="Estructura Financiera"
              description="Análisis de balance y posición patrimonial"
              autoAnalyze={true}
              showHeader={true}
              showMetrics={true}
              showRecommendations={false}
            />

            {/* Análisis de Rentabilidad */}
            <ClaudeInsights
              analysisType="pyg"
              title="Análisis de Rentabilidad"
              description="Performance operativa y márgenes"
              autoAnalyze={true}
              showHeader={true}
              showMetrics={true}
              showRecommendations={false}
            />
          </section>

          {/* Comprehensive Strategic Analysis */}
          <section>
            <ClaudeInsights
              analysisType="comprehensive"
              title="Diagnóstico Estratégico Integral"
              description="Análisis 360° con perspectiva estratégica y recomendaciones de alto nivel"
              className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50"
              autoAnalyze={true}
              showHeader={true}
              showMetrics={true}
              showRecommendations={true}
              companyInfo={{
                name: "Empresa Analizada",
                sector: "Industrial",
                size: "Mediana"
              }}
            />
          </section>
        </main>
      </div>
    </div>
  );
};