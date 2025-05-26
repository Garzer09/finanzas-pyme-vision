
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { CompanyHealthStatus } from '@/components/CompanyHealthStatus';
import { ExecutiveSummaryKPIs } from '@/components/ExecutiveSummaryKPIs';
import { GlobalFilters } from '@/components/GlobalFilters';
import { MainCharts } from '@/components/MainCharts';
import { AlertPanel } from '@/components/AlertPanel';
import { ModuleAccessControl } from '@/components/ModuleAccessControl';
import { Card } from '@/components/ui/card';
import { Upload, Settings, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="flex min-h-screen bg-navy-800" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          {/* Quick Actions */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Link to="/subir-excel">
                <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-500/30 p-6 hover:border-teal-400/50 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-teal-500/20 border border-teal-400/30">
                      <Upload className="h-6 w-6 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Subir Archivo Excel</h3>
                      <p className="text-teal-300 text-sm">Carga tus datos financieros para análisis automático</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to="/suscripcion">
                <Card className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 backdrop-blur-sm border border-purple-500/30 p-6 hover:border-purple-400/50 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-purple-500/20 border border-purple-400/30">
                      <Settings className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Gestionar Suscripción</h3>
                      <p className="text-purple-300 text-sm">Configura tu plan y acceso a módulos</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </section>

          <ModuleAccessControl moduleId="resumen-ejecutivo">
            <section className="relative z-10">
              <CompanyHealthStatus />
            </section>
            
            <section className="relative z-10">
              <ExecutiveSummaryKPIs />
            </section>
            
            <section className="relative z-10">
              <GlobalFilters />
            </section>
            
            <section className="relative z-10">
              <MainCharts />
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

                {/* Enlaces rápidos a módulos de análisis */}
                <div className="mt-8 pt-6 border-t border-gray-600/50">
                  <h3 className="text-lg font-semibold text-blue-300 mb-4">Acceso Rápido al Análisis Detallado</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/pyg-actual" className="group">
                      <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 p-4 hover:border-blue-400/50 transition-all duration-300 cursor-pointer group-hover:scale-105">
                        <div className="text-center">
                          <TrendingUp className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                          <h4 className="text-white font-semibold text-sm">P&G Actual</h4>
                        </div>
                      </Card>
                    </Link>
                    
                    <Link to="/balance-actual" className="group">
                      <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-500/30 p-4 hover:border-emerald-400/50 transition-all duration-300 cursor-pointer group-hover:scale-105">
                        <div className="text-center">
                          <TrendingUp className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                          <h4 className="text-white font-semibold text-sm">Balance</h4>
                        </div>
                      </Card>
                    </Link>
                    
                    <Link to="/ratios-actual" className="group">
                      <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 p-4 hover:border-purple-400/50 transition-all duration-300 cursor-pointer group-hover:scale-105">
                        <div className="text-center">
                          <TrendingUp className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                          <h4 className="text-white font-semibold text-sm">Ratios</h4>
                        </div>
                      </Card>
                    </Link>
                    
                    <Link to="/pyg-proyectado" className="group">
                      <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-orange-500/30 p-4 hover:border-orange-400/50 transition-all duration-300 cursor-pointer group-hover:scale-105">
                        <div className="text-center">
                          <TrendingUp className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                          <h4 className="text-white font-semibold text-sm">Proyecciones</h4>
                        </div>
                      </Card>
                    </Link>
                  </div>
                </div>
              </Card>
            </section>
            
            <section className="relative z-10">
              <AlertPanel />
            </section>
          </ModuleAccessControl>
        </main>
      </div>
    </div>
  );
};

export default Index;
