
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { FinancialDashboardEnhancer } from '@/components/modules/FinancialDashboardEnhancer';
import { ModuleAccessControl } from '@/components/ModuleAccessControl';
import { Card } from '@/components/ui/card';
import { Upload, Settings, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto bg-light-gray-bg">
          {/* Quick Actions */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Link to="/subir-excel">
                <Card className="dashboard-card bg-gradient-to-br from-steel-blue-light to-blue-50 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-steel-blue/20 border border-steel-blue/30 group-hover:bg-steel-blue/30 transition-colors">
                      <Upload className="h-6 w-6 text-steel-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-steel-blue-dark mb-1">Subir Archivo Excel</h3>
                      <p className="text-steel-blue text-sm">Carga tus datos financieros para análisis automático con IA</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to="/suscripcion">
                <Card className="dashboard-card bg-gradient-to-br from-light-gray-100 to-gray-50 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-light-gray-200/50 border border-light-gray-300/50 group-hover:bg-light-gray-200 transition-colors">
                      <Settings className="h-6 w-6 text-steel-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-steel-blue-dark mb-1">Gestionar Suscripción</h3>
                      <p className="text-steel-blue text-sm">Configura tu plan y acceso a módulos</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </section>

          <ModuleAccessControl moduleId="resumen-ejecutivo">
            <FinancialDashboardEnhancer />

            {/* Resumen Ejecutivo Text Section */}
            <section className="relative z-10">
              <Card className="dashboard-card bg-white p-8">
                <h2 className="text-2xl font-bold text-steel-blue-dark mb-6 flex items-center gap-3" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
                  <div className="p-2 rounded-lg bg-steel-blue-light border border-steel-blue/30">
                    <FileText className="h-6 w-6 text-steel-blue" />
                  </div>
                  Resumen Ejecutivo del Análisis Financiero
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-steel-blue mb-3">Situación Actual</h3>
                    <p className="text-professional leading-relaxed">
                      La empresa presenta una situación financiera sólida con indicadores positivos en liquidez, 
                      rentabilidad y solvencia. Los ratios financieros se encuentran dentro de los parámetros 
                      recomendados para el sector.
                    </p>
                    <p className="text-professional leading-relaxed">
                      El análisis del año 0 muestra una base estable para el crecimiento futuro, con una 
                      estructura de costes optimizada y flujos de caja positivos.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-steel-blue mb-3">Proyecciones</h3>
                    <p className="text-professional leading-relaxed">
                      Las proyecciones para los próximos 3 años muestran un crecimiento sostenido con 
                      incrementos progresivos en ingresos y mejoras en márgenes operativos.
                    </p>
                    <p className="text-professional leading-relaxed">
                      El plan de inversiones contempla las necesidades de CAPEX y capital de trabajo 
                      para soportar el crecimiento proyectado.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-light-gray-200">
                  <h3 className="text-lg font-semibold text-steel-blue mb-4" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>Valor Económico Añadido (EVA)</h3>
                  <p className="text-professional leading-relaxed">
                    El análisis EVA confirma la capacidad de la empresa para crear valor económico, 
                    superando el coste de capital en todos los escenarios proyectados. Esta métrica 
                    valida la viabilidad y atractivo de la inversión.
                  </p>
                </div>

                {/* Enlaces rápidos a módulos de análisis */}
                <div className="mt-8 pt-6 border-t border-light-gray-200">
                  <h3 className="text-lg font-semibold text-steel-blue mb-4">Acceso Rápido al Análisis Detallado</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/pyg-actual" className="group">
                      <Card className="dashboard-card bg-gradient-to-br from-steel-blue-light to-blue-50 p-4 hover:shadow-md transition-all duration-300 cursor-pointer group-hover:scale-105">
                        <div className="text-center">
                          <TrendingUp className="h-6 w-6 text-steel-blue mx-auto mb-2" />
                          <h4 className="text-steel-blue-dark font-semibold text-sm">P&G Actual</h4>
                        </div>
                      </Card>
                    </Link>
                    
                    <Link to="/balance-actual" className="group">
                      <Card className="dashboard-card bg-gradient-to-br from-light-gray-100 to-gray-50 p-4 hover:shadow-md transition-all duration-300 cursor-pointer group-hover:scale-105">
                        <div className="text-center">
                          <TrendingUp className="h-6 w-6 text-steel-blue mx-auto mb-2" />
                          <h4 className="text-steel-blue-dark font-semibold text-sm">Balance</h4>
                        </div>
                      </Card>
                    </Link>
                    
                    <Link to="/ratios-actual" className="group">
                      <Card className="dashboard-card bg-gradient-to-br from-steel-blue-light to-blue-50 p-4 hover:shadow-md transition-all duration-300 cursor-pointer group-hover:scale-105">
                        <div className="text-center">
                          <TrendingUp className="h-6 w-6 text-steel-blue mx-auto mb-2" />
                          <h4 className="text-steel-blue-dark font-semibold text-sm">Ratios</h4>
                        </div>
                      </Card>
                    </Link>
                    
                    <Link to="/pyg-proyectado" className="group">
                      <Card className="dashboard-card bg-gradient-to-br from-light-gray-100 to-gray-50 p-4 hover:shadow-md transition-all duration-300 cursor-pointer group-hover:scale-105">
                        <div className="text-center">
                          <TrendingUp className="h-6 w-6 text-steel-blue mx-auto mb-2" />
                          <h4 className="text-steel-blue-dark font-semibold text-sm">Proyecciones</h4>
                        </div>
                      </Card>
                    </Link>
                  </div>
                </div>
              </Card>
            </section>
            
          </ModuleAccessControl>
        </main>
      </div>
    </div>
  );
};

export default Index;
