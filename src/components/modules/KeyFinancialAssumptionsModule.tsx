
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Calculator, TrendingUp, Percent, DollarSign, Calendar, Target } from 'lucide-react';

export const KeyFinancialAssumptionsModule = () => {
  const assumptions = [
    {
      title: 'Crecimiento de Ventas',
      current: 15,
      unit: '%',
      description: 'Anual proyectado',
      icon: TrendingUp,
      gradient: 'from-steel-blue/20 via-steel-blue-light/10 to-transparent',
      iconBg: 'bg-steel-blue/20',
      iconColor: 'text-steel-blue-dark',
      borderColor: 'border-steel-blue/30'
    },
    {
      title: 'Margen EBITDA',
      current: 22.5,
      unit: '%',
      description: 'Meta objetivo',
      icon: Percent,
      gradient: 'from-steel-blue-light/20 via-light-gray-100/10 to-transparent',
      iconBg: 'bg-steel-blue-light/20',
      iconColor: 'text-steel-blue',
      borderColor: 'border-steel-blue-light/30'
    },
    {
      title: 'Tasa de Descuento',
      current: 12.0,
      unit: '%',
      description: 'WACC estimado',
      icon: Calculator,
      color: 'text-gray-700',
      bgGradient: 'from-light-gray-100/30 to-light-gray-200/20',
      borderColor: 'border-light-gray-200/30'
    },
    {
      title: 'Capex / Ventas',
      current: 3.5,
      unit: '%',
      description: 'Inversión anual',
      icon: DollarSign,
      color: 'text-steel-blue',
      bgGradient: 'from-steel-blue-dark/20 to-steel-blue/20',
      borderColor: 'border-steel-blue/30'
    },
    {
      title: 'Periodo Proyección',
      current: 5,
      unit: 'años',
      description: 'Horizonte temporal',
      icon: Calendar,
      color: 'text-steel-blue-dark',
      bgGradient: 'from-steel-blue/20 to-steel-blue-light/20',
      borderColor: 'border-steel-blue/30'
    },
    {
      title: 'Tasa Terminal',
      current: 2.5,
      unit: '%',
      description: 'Crecimiento perpetuo',
      icon: Target,
      color: 'text-gray-700',
      bgGradient: 'from-light-gray-200/20 to-light-gray-300/20',
      borderColor: 'border-light-gray-200/30'
    }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-light-gray-50 via-white to-steel-blue-light/20" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-8 overflow-auto">
          {/* Header Section with Enhanced Glass Effect */}
          <section className="relative">
            <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel-blue/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel-blue/8 via-steel-blue-light/5 to-light-gray-100/8 rounded-3xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-steel-blue/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-light-gray-200/8 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-steel-blue to-steel-blue-dark bg-clip-text text-transparent">
                  Supuestos Financieros Clave
                </h1>
                <p className="text-gray-700 text-lg font-medium">Parámetros fundamentales para el análisis financiero y proyecciones</p>
              </div>
            </div>
          </section>

          {/* Enhanced Assumptions Cards */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assumptions.map((assumption, index) => {
                const Icon = assumption.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`group relative bg-white/90 backdrop-blur-2xl border ${assumption.borderColor} hover:border-steel-blue/60 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden`}
                  >
                    {/* Enhanced gradient background with blur */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${assumption.gradient} opacity-60 group-hover:opacity-80 transition-opacity duration-300`}></div>
                    
                    {/* Multiple glass reflection effects */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                    <div className="absolute top-2 left-2 w-16 h-16 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-2 right-2 w-20 h-20 bg-steel-blue/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-2xl ${assumption.iconBg} backdrop-blur-sm border border-white/50 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`h-6 w-6 ${assumption.iconColor}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">{assumption.title}</h3>
                            <p className="text-xs text-gray-600 font-medium">{assumption.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-gray-900 tracking-tight drop-shadow-sm">
                            {assumption.current.toFixed(assumption.unit === '%' ? 1 : 0)}
                          </span>
                          <span className="text-lg text-gray-600">{assumption.unit}</span>
                        </div>

                        <div className="space-y-2">
                          <input 
                            type="number" 
                            step="0.1"
                            defaultValue={assumption.current}
                            className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-steel-blue/20 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-steel-blue shadow-sm"
                          />
                          <button className="w-full py-2 bg-steel-blue/10 hover:bg-steel-blue/20 border border-steel-blue/30 rounded-xl text-steel-blue font-medium transition-all duration-300 hover:shadow-lg">
                            Actualizar
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Enhanced Summary Card */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-steel-blue/3 via-white/20 to-light-gray-100/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-6 right-6 w-32 h-32 bg-steel-blue/8 rounded-full blur-3xl"></div>
              <div className="absolute bottom-6 left-6 w-40 h-40 bg-light-gray-200/6 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Resumen de Supuestos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-900">
                  <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <p className="text-gray-700 text-sm mb-2 font-medium">Escenario Base</p>
                    <p className="text-2xl font-bold text-steel-blue drop-shadow-sm">Crecimiento Moderado</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <p className="text-gray-700 text-sm mb-2 font-medium">Último Actualizado</p>
                    <p className="text-2xl font-bold text-steel-blue-dark drop-shadow-sm">Hace 2 horas</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <p className="text-gray-700 text-sm mb-2 font-medium">Estado</p>
                    <p className="text-2xl font-bold text-steel-blue drop-shadow-sm">Validado</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
