
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
      color: 'text-steel-blue',
      bgGradient: 'from-steel-blue/20 to-steel-blue-light/20',
      borderColor: 'border-steel-blue/30'
    },
    {
      title: 'Margen EBITDA',
      current: 22.5,
      unit: '%',
      description: 'Meta objetivo',
      icon: Percent,
      color: 'text-steel-blue-dark',
      bgGradient: 'from-steel-blue-light/20 to-light-gray-100/30',
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
    <div className="flex min-h-screen bg-white" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto bg-light-gray-50">
          <section>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Supuestos Financieros Clave</h1>
              <p className="text-gray-600">Parámetros fundamentales para el análisis financiero y proyecciones</p>
            </div>
          </section>

          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assumptions.map((assumption, index) => {
                const Icon = assumption.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`bg-gradient-to-br ${assumption.bgGradient} backdrop-blur-sm border ${assumption.borderColor} hover:scale-105 transition-all duration-300 p-6`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white border border-steel-blue/20">
                          <Icon className={`h-5 w-5 ${assumption.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{assumption.title}</h3>
                          <p className="text-sm text-gray-600">{assumption.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {assumption.current.toFixed(assumption.unit === '%' ? 1 : 0)}
                        </span>
                        <span className="text-lg text-gray-600">{assumption.unit}</span>
                      </div>

                      <div className="space-y-2">
                        <input 
                          type="number" 
                          step="0.1"
                          defaultValue={assumption.current}
                          className="w-full px-3 py-2 bg-white border border-light-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-steel-blue"
                        />
                        <button className="w-full py-2 bg-steel-blue/10 hover:bg-steel-blue/20 border border-steel-blue/30 rounded-lg text-steel-blue font-medium transition-colors">
                          Actualizar
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <Card className="bg-white border border-light-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen de Supuestos</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-900">
                <div>
                  <p className="text-gray-600 text-sm">Escenario Base</p>
                  <p className="text-lg font-medium">Crecimiento Moderado</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Último Actualizado</p>
                  <p className="text-lg font-medium">Hace 2 horas</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Estado</p>
                  <p className="text-lg font-medium text-steel-blue">Validado</p>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
