
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, Target, Zap, Activity } from 'lucide-react';

export const SensitivityModule = () => {
  const sensitivityData = [
    { parameter: 'Crecimiento Ventas', base: 100, optimista: 125, pesimista: 75 },
    { parameter: 'Margen EBITDA', base: 100, optimista: 115, pesimista: 85 },
    { parameter: 'Tasa Descuento', base: 100, optimista: 110, pesimista: 90 },
    { parameter: 'CAPEX', base: 100, optimista: 90, pesimista: 120 }
  ];

  const riskFactors = [
    { factor: 'Competencia', impact: 85, probability: 70 },
    { factor: 'Regulación', impact: 60, probability: 40 },
    { factor: 'Economía', impact: 90, probability: 30 },
    { factor: 'Tecnología', impact: 70, probability: 60 },
    { factor: 'Clientes', impact: 80, probability: 50 }
  ];

  const scenarios = [
    {
      title: 'Escenario Base',
      probability: '50%',
      valor: '€8.5M',
      icon: Target,
      color: 'text-teal-400',
      bgGradient: 'from-teal-500/30 to-cyan-500/30',
      borderColor: 'border-teal-400/50'
    },
    {
      title: 'Escenario Optimista',
      probability: '25%',
      valor: '€12.2M',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-500/30 to-teal-500/30',
      borderColor: 'border-emerald-400/50'
    },
    {
      title: 'Escenario Pesimista',
      probability: '25%',
      valor: '€5.8M',
      icon: TrendingDown,
      color: 'text-red-400',
      bgGradient: 'from-red-500/30 to-orange-500/30',
      borderColor: 'border-red-400/50'
    }
  ];

  const riskMetrics = [
    {
      title: 'VaR 95%',
      value: '€2.1M',
      description: 'Pérdida máxima esperada',
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/30 to-red-500/30',
      borderColor: 'border-orange-400/50'
    },
    {
      title: 'Volatilidad',
      value: '28.5%',
      description: 'Desviación estándar',
      icon: Activity,
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/30 to-pink-500/30',
      borderColor: 'border-purple-400/50'
    },
    {
      title: 'Beta',
      value: '1.35',
      description: 'Riesgo sistemático',
      icon: Zap,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/30 to-cyan-500/30',
      borderColor: 'border-blue-400/50'
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
              <h1 className="text-2xl font-bold text-white mb-2">Análisis de Sensibilidad</h1>
              <p className="text-gray-400">Evaluación de riesgos y escenarios alternativos</p>
            </div>
          </section>

          {/* Scenario Cards */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {scenarios.map((scenario, index) => {
                const Icon = scenario.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`bg-gradient-to-br ${scenario.bgGradient} backdrop-blur-sm border ${scenario.borderColor} hover:scale-105 transition-all duration-300 animate-fade-in group p-6`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/10 border border-white/20`}>
                          <Icon className={`h-5 w-5 ${scenario.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{scenario.title}</h3>
                          <p className="text-sm text-gray-300">Probabilidad: {scenario.probability}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-2xl font-bold text-white">
                        {scenario.valor}
                      </span>
                      <p className="text-sm text-gray-300">Valoración estimada</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Risk Metrics */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {riskMetrics.map((metric, index) => {
                const Icon = metric.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`bg-gradient-to-br ${metric.bgGradient} backdrop-blur-sm border ${metric.borderColor} hover:scale-105 transition-all duration-300 animate-fade-in group p-6`}
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/10 border border-white/20`}>
                          <Icon className={`h-5 w-5 ${metric.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{metric.title}</h3>
                          <p className="text-sm text-gray-300">{metric.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-2xl font-bold text-white">
                        {metric.value}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Charts Grid */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sensitivity Analysis */}
              <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Análisis de Sensibilidad</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sensitivityData}>
                      <XAxis dataKey="parameter" tick={{ fill: '#d1d5db', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#d1d5db' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Bar dataKey="pesimista" fill="#f87171" />
                      <Bar dataKey="base" fill="#60a5fa" />
                      <Bar dataKey="optimista" fill="#34d399" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Risk Factors */}
              <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <AlertTriangle className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">Mapa de Riesgos</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskFactors}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="factor" tick={{ fill: '#d1d5db', fontSize: 10 }} />
                      <PolarRadiusAxis tick={{ fill: '#d1d5db', fontSize: 10 }} />
                      <Radar name="Impacto" dataKey="impact" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                      <Radar name="Probabilidad" dataKey="probability" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </section>

          {/* Monte Carlo Summary */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-400/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Simulación Monte Carlo</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-white">
                <div>
                  <p className="text-gray-300 text-sm">Iteraciones</p>
                  <p className="text-2xl font-bold">10,000</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Valor Esperado</p>
                  <p className="text-2xl font-bold">€8.7M</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Percentil 5%</p>
                  <p className="text-2xl font-bold text-red-400">€4.2M</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Percentil 95%</p>
                  <p className="text-2xl font-bold text-emerald-400">€15.8M</p>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
