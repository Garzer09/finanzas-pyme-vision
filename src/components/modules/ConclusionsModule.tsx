import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClaudeInsights } from '@/components/ClaudeInsights';
import { TrendingUp, Target, AlertTriangle, CheckCircle } from 'lucide-react';

export const ConclusionsModule = () => {
  const kpisSummary = [
    { label: 'Valoración EVA', value: '€8.5M', status: 'positive', icon: TrendingUp },
    { label: 'ROIC vs WACC', value: '+3.2%', status: 'positive', icon: Target },
    { label: 'Ratio Deuda/EBITDA', value: '2.1x', status: 'warning', icon: AlertTriangle },
    { label: 'Liquidez General', value: '1.35x', status: 'positive', icon: CheckCircle }
  ];

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
                <p className="text-slate-700 text-lg font-medium">Síntesis ejecutiva y recomendaciones estratégicas generadas por Claude</p>
              </div>
            </div>
          </section>

          {/* KPIs Summary */}
          <section>
            <div className="responsive-grid">
              {kpisSummary.map((kpi, index) => {
                const Icon = kpi.icon;
                return (
                  <Card key={index} className={`modern-card p-6 hover:shadow-lg transition-all duration-300 ${getStatusColor(kpi.status)}`}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-white/80 border border-current/20">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{kpi.label}</h3>
                        <p className="text-2xl font-bold">{kpi.value}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
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