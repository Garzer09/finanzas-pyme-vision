import { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Save, TrendingUp, Target, AlertTriangle, CheckCircle } from 'lucide-react';

export const ConclusionsModule = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [conclusions, setConclusions] = useState({
    resumenEjecutivo: 'La empresa presenta una situación financiera sólida con indicadores positivos en liquidez, rentabilidad y solvencia. Las proyecciones para los próximos 3 años muestran un crecimiento sostenido.',
    fortalezas: [
      'Estructura financiera equilibrada con ratio de deuda/EBITDA dentro de parámetros aceptables',
      'Generación de flujo de caja operativo positivo y creciente',
      'Márgenes operativos en línea con el sector',
      'Diversificación de ingresos por segmentos de negocio'
    ],
    areasMejora: [
      'Optimización del capital de trabajo para reducir NOF',
      'Mejora en plazos de cobro a clientes',
      'Incremento del margen EBITDA hacia el objetivo del 20%',
      'Reducción gradual del endeudamiento a medio plazo'
    ],
    recomendaciones: [
      'Implementar plan de reducción de deuda a 5 años',
      'Negociar mejores condiciones de pago con proveedores',
      'Invertir en automatización para mejorar eficiencia operativa',
      'Explorar nuevos canales de distribución para diversificar ingresos'
    ],
    riesgos: [
      'Sensibilidad a variaciones en costes de materias primas',
      'Dependencia de clientes principales (concentración > 30%)',
      'Exposición a tipos de interés variables en parte de la deuda',
      'Competencia creciente en mercados principales'
    ],
    oportunidades: [
      'Expansión a mercados internacionales',
      'Desarrollo de nuevos productos/servicios',
      'Adquisiciones estratégicas para consolidar posición',
      'Transformación digital para mejorar competitividad'
    ]
  });

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
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-cadet-600 bg-clip-text text-transparent">
                    Conclusiones del Análisis Financiero
                  </h1>
                  <p className="text-slate-700 text-lg font-medium">Síntesis ejecutiva y recomendaciones estratégicas</p>
                </div>
                <Button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-steel hover:shadow-steel rounded-2xl px-6 py-3 font-semibold"
                >
                  {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {isEditing ? 'Guardar' : 'Editar'}
                </Button>
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

          {/* Executive Summary */}
          <section>
            <Card className="modern-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-steel-100">
                  <FileText className="h-6 w-6 text-steel-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Resumen Ejecutivo</h2>
              </div>
              
              {isEditing ? (
                <textarea 
                  rows={6}
                  value={conclusions.resumenEjecutivo}
                  onChange={(e) => setConclusions({...conclusions, resumenEjecutivo: e.target.value})}
                  className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-steel-500 focus:border-steel-500 shadow-sm font-medium resize-none transition-all duration-200"
                />
              ) : (
                <p className="text-slate-900 font-medium leading-relaxed">{conclusions.resumenEjecutivo}</p>
              )}
            </Card>
          </section>

          {/* Main Sections Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Fortalezas */}
            <Card className="modern-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-success-100">
                  <CheckCircle className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Fortalezas Identificadas</h3>
              </div>
              <div className="space-y-3">
                {conclusions.fortalezas.map((fortaleza, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-success-500 mt-2 flex-shrink-0"></div>
                    <p className="text-slate-700 font-medium">{fortaleza}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Áreas de Mejora */}
            <Card className="modern-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-warning-100">
                  <Target className="h-6 w-6 text-warning-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Áreas de Mejora</h3>
              </div>
              <div className="space-y-3">
                {conclusions.areasMejora.map((area, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-warning-500 mt-2 flex-shrink-0"></div>
                    <p className="text-slate-700 font-medium">{area}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recomendaciones */}
            <Card className="modern-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-steel-100">
                  <TrendingUp className="h-6 w-6 text-steel-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Recomendaciones Estratégicas</h3>
              </div>
              <div className="space-y-3">
                {conclusions.recomendaciones.map((recomendacion, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-steel-500 mt-2 flex-shrink-0"></div>
                    <p className="text-slate-700 font-medium">{recomendacion}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Riesgos */}
            <Card className="modern-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-danger-100">
                  <AlertTriangle className="h-6 w-6 text-danger-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Riesgos Identificados</h3>
              </div>
              <div className="space-y-3">
                {conclusions.riesgos.map((riesgo, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-danger-500 mt-2 flex-shrink-0"></div>
                    <p className="text-slate-700 font-medium">{riesgo}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Oportunidades */}
          <section>
            <Card className="modern-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-cadet-100">
                  <TrendingUp className="h-6 w-6 text-cadet-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Oportunidades de Crecimiento</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {conclusions.oportunidades.map((oportunidad, index) => (
                  <div key={index} className="bg-gradient-to-r from-cadet-50 to-steel-50 border border-cadet-200/60 rounded-xl p-4 hover:shadow-soft transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-cadet-500 to-steel-500">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <p className="text-slate-900 font-medium">{oportunidad}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Action Plan */}
          <section>
            <Card className="modern-card p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Plan de Acción Recomendado</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-steel-50 to-cadet-50 border border-steel-200/60">
                  <h4 className="text-steel-600 font-bold mb-2">Corto Plazo (0-6 meses)</h4>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Optimizar NOF</li>
                    <li>• Renegociar proveedores</li>
                    <li>• Implementar KPIs</li>
                  </ul>
                </div>
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-cadet-50 to-steel-50 border border-cadet-200/60">
                  <h4 className="text-cadet-600 font-bold mb-2">Medio Plazo (6-18 meses)</h4>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Reducir endeudamiento</li>
                    <li>• Expandir mercados</li>
                    <li>• Digitalizar procesos</li>
                  </ul>
                </div>
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-steel-50 to-cadet-50 border border-steel-200/60">
                  <h4 className="text-steel-600 font-bold mb-2">Largo Plazo (18+ meses)</h4>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Adquisiciones estratégicas</li>
                    <li>• Nuevos productos</li>
                    <li>• Internacionalización</li>
                  </ul>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};