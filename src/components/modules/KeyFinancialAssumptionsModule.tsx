
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
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/30 to-cyan-500/30',
      borderColor: 'border-blue-400/50'
    },
    {
      title: 'Margen EBITDA',
      current: 22.5,
      unit: '%',
      description: 'Meta objetivo',
      icon: Percent,
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-500/30 to-teal-500/30',
      borderColor: 'border-emerald-400/50'
    },
    {
      title: 'Tasa de Descuento',
      current: 12.0,
      unit: '%',
      description: 'WACC estimado',
      icon: Calculator,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/30 to-red-500/30',
      borderColor: 'border-orange-400/50'
    },
    {
      title: 'Capex / Ventas',
      current: 3.5,
      unit: '%',
      description: 'Inversión anual',
      icon: DollarSign,
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/30 to-pink-500/30',
      borderColor: 'border-purple-400/50'
    },
    {
      title: 'Periodo Proyección',
      current: 5,
      unit: 'años',
      description: 'Horizonte temporal',
      icon: Calendar,
      color: 'text-teal-400',
      bgGradient: 'from-teal-500/30 to-cyan-500/30',
      borderColor: 'border-teal-400/50'
    },
    {
      title: 'Tasa Terminal',
      current: 2.5,
      unit: '%',
      description: 'Crecimiento perpetuo',
      icon: Target,
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-500/30 to-orange-500/30',
      borderColor: 'border-yellow-400/50'
    }
  ];

  return (
    <div className="flex min-h-screen bg-navy-800">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Data wave background effect */}
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          {/* Header Section */}
          <section className="relative z-10">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Supuestos Clave</h1>
              <p className="text-gray-400">Parámetros fundamentales para el análisis financiero</p>
            </div>
          </section>

          {/* Assumptions Cards */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assumptions.map((assumption, index) => {
                const Icon = assumption.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`bg-gradient-to-br ${assumption.bgGradient} backdrop-blur-sm border ${assumption.borderColor} hover:scale-105 transition-all duration-300 animate-fade-in group p-6`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/10 border border-white/20`}>
                          <Icon className={`h-5 w-5 ${assumption.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{assumption.title}</h3>
                          <p className="text-sm text-gray-300">{assumption.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">
                          {assumption.current.toFixed(assumption.unit === '%' ? 1 : 0)}
                        </span>
                        <span className="text-lg text-gray-300">{assumption.unit}</span>
                      </div>

                      {/* Input for editing */}
                      <div className="space-y-2">
                        <input 
                          type="number" 
                          step="0.1"
                          defaultValue={assumption.current}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                        <button className="w-full py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 rounded-lg text-teal-300 font-medium transition-colors">
                          Actualizar
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Summary Section */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/30 to-cyan-500/30 backdrop-blur-sm border border-teal-400/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Resumen de Supuestos</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                <div>
                  <p className="text-gray-300 text-sm">Escenario Base</p>
                  <p className="text-lg font-medium">Crecimiento Moderado</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Último Actualizado</p>
                  <p className="text-lg font-medium">Hace 2 horas</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Estado</p>
                  <p className="text-lg font-medium text-emerald-400">Validado</p>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
