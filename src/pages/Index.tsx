
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { CompanyHealthStatus } from '@/components/CompanyHealthStatus';
import { KPICardsAnimated } from '@/components/KPICardsAnimated';
import { GlobalFilters } from '@/components/GlobalFilters';
import { MainCharts } from '@/components/MainCharts';
import { AlertPanel } from '@/components/AlertPanel';
import { Card } from '@/components/ui/card';
import { TrendingUp, FileText, Users, Target, DollarSign, BarChart3, Percent } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex min-h-screen bg-navy-800" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          <section className="relative z-10">
            <CompanyHealthStatus />
          </section>
          
          <section className="relative z-10">
            <KPICardsAnimated />
          </section>
          
          <section className="relative z-10">
            <GlobalFilters />
          </section>
          
          <section className="relative z-10">
            <MainCharts />
          </section>
          
          {/* Métricas Principales */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-500/30 p-6 hover:border-teal-400/50 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-teal-500/20 border border-teal-400/30">
                    <DollarSign className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>Ingresos Totales</h3>
                    <p className="text-teal-300 font-medium text-2xl">€2.5M</p>
                    <p className="text-gray-300 text-sm">+12% YoY</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-sm border border-emerald-500/30 p-6 hover:border-emerald-400/50 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                    <BarChart3 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>EBITDA</h3>
                    <p className="text-emerald-300 font-medium text-2xl">€450K</p>
                    <p className="text-gray-300 text-sm">18% margen</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 backdrop-blur-sm border border-purple-500/30 p-6 hover:border-purple-400/50 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-500/20 border border-purple-400/30">
                    <Percent className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>Margen Neto</h3>
                    <p className="text-purple-300 font-medium text-2xl">12.5%</p>
                    <p className="text-gray-300 text-sm">€312K beneficio</p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Resumen Ejecutivo Text Section */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
                <div className="p-2 rounded-lg bg-teal-500/20 border border-teal-400/30">
                  <FileText className="h-6 w-6 text-teal-400" />
                </div>
                Resumen Ejecutivo del Análisis Financiero
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-teal-300 mb-3">Situación Actual</h3>
                  <p className="text-gray-300 leading-relaxed">
                    La empresa presenta una situación financiera sólida con indicadores positivos en liquidez, 
                    rentabilidad y solvencia. Los ratios financieros se encuentran dentro de los parámetros 
                    recomendados para el sector.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    El análisis del año 0 muestra una base estable para el crecimiento futuro, con una 
                    estructura de costes optimizada y flujos de caja positivos.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-emerald-300 mb-3">Proyecciones</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Las proyecciones para los próximos 3 años muestran un crecimiento sostenido con 
                    incrementos progresivos en ingresos y mejoras en márgenes operativos.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    El plan de inversiones contempla las necesidades de CAPEX y capital de trabajo 
                    para soportar el crecimiento proyectado.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-600/50">
                <h3 className="text-lg font-semibold text-purple-300 mb-4" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>Valor Económico Añadido (EVA)</h3>
                <p className="text-gray-300 leading-relaxed">
                  El análisis EVA confirma la capacidad de la empresa para crear valor económico, 
                  superando el coste de capital en todos los escenarios proyectados. Esta métrica 
                  valida la viabilidad y atractivo de la inversión.
                </p>
              </div>
            </Card>
          </section>
          
          <section className="relative z-10">
            <AlertPanel />
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
