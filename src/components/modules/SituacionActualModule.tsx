
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Percent, Calendar, AlertCircle } from 'lucide-react';

export const SituacionActualModule = () => {
  const metricas = [
    {
      title: 'Ingresos Totales',
      value: '€2.5M',
      change: '+12%',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-500/30 to-teal-500/30',
      borderColor: 'border-emerald-400/50'
    },
    {
      title: 'EBITDA',
      value: '€450K',
      change: '-5%',
      icon: TrendingUp,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/30 to-cyan-500/30',
      borderColor: 'border-blue-400/50'
    },
    {
      title: 'Margen EBITDA',
      value: '18%',
      change: '-2.5pp',
      icon: Percent,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/30 to-red-500/30',
      borderColor: 'border-orange-400/50'
    },
    {
      title: 'Ratio Deuda/EBITDA',
      value: '2.1x',
      change: '+0.3x',
      icon: BarChart3,
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/30 to-pink-500/30',
      borderColor: 'border-purple-400/50'
    }
  ];

  return (
    <div className="flex min-h-screen bg-navy-800" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          <section className="relative z-10">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Análisis de Situación Financiera Actual</h1>
              <p className="text-gray-400">Estado financiero y operativo del año base (Año 0)</p>
            </div>
          </section>

          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metricas.map((metrica, index) => {
                const Icon = metrica.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`bg-gradient-to-br ${metrica.bgGradient} backdrop-blur-sm border ${metrica.borderColor} hover:scale-105 transition-all duration-300 p-6`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                        <Icon className={`h-5 w-5 ${metrica.color}`} />
                      </div>
                      <h3 className="font-semibold text-white">{metrica.title}</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-white">{metrica.value}</p>
                      <p className="text-sm text-gray-300">{metrica.change}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/30 to-cyan-500/30 backdrop-blur-sm border border-teal-400/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-teal-400" />
                Resumen Ejecutivo - Situación Actual
              </h2>
              <div className="text-white space-y-3">
                <p className="text-gray-300">
                  La empresa presenta una situación financiera estable con oportunidades de mejora en eficiencia operativa.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-300">Fortalezas</p>
                    <ul className="text-sm list-disc list-inside text-emerald-400">
                      <li>Crecimiento sostenido de ingresos</li>
                      <li>Posición de liquidez adecuada</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Áreas de Mejora</p>
                    <ul className="text-sm list-disc list-inside text-orange-400">
                      <li>Optimización de márgenes</li>
                      <li>Gestión del capital de trabajo</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Riesgos</p>
                    <ul className="text-sm list-disc list-inside text-red-400">
                      <li>Dependencia de financiación externa</li>
                      <li>Presión en márgenes operativos</li>
                    </ul>
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
