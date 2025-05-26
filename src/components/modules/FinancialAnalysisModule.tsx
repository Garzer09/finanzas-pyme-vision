
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Percent, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';

export const FinancialAnalysisModule = () => {
  const revenueData = [
    { year: '2020', value: 1800 },
    { year: '2021', value: 2100 },
    { year: '2022', value: 2350 },
    { year: '2023', value: 2500 },
    { year: '2024', value: 2750 }
  ];

  const profitabilityData = [
    { metric: 'Margen Bruto', value: 65, color: '#60a5fa' },
    { metric: 'Margen EBITDA', value: 22, color: '#34d399' },
    { metric: 'Margen Neto', value: 15, color: '#fb923c' }
  ];

  const distributionData = [
    { name: 'Operaciones', value: 65, color: '#60a5fa' },
    { name: 'Inversiones', value: 25, color: '#34d399' },
    { name: 'Financiación', value: 10, color: '#fb923c' }
  ];

  const metrics = [
    {
      title: 'Ingresos Totales',
      value: '€2.75M',
      change: '+10%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/30 to-cyan-500/30',
      borderColor: 'border-blue-400/50'
    },
    {
      title: 'EBITDA',
      value: '€605K',
      change: '+12%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-500/30 to-teal-500/30',
      borderColor: 'border-emerald-400/50'
    },
    {
      title: 'Margen Neto',
      value: '15.2%',
      change: '+2.1%',
      trend: 'up',
      icon: Percent,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/30 to-red-500/30',
      borderColor: 'border-orange-400/50'
    },
    {
      title: 'ROE',
      value: '18.5%',
      change: '+1.8%',
      trend: 'up',
      icon: Activity,
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/30 to-pink-500/30',
      borderColor: 'border-purple-400/50'
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
              <h1 className="text-2xl font-bold text-white mb-2">Análisis Financiero</h1>
              <p className="text-gray-400">Indicadores clave y tendencias de rendimiento</p>
            </div>
          </section>

          {/* Metrics Cards */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => {
                const Icon = metric.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`bg-gradient-to-br ${metric.bgGradient} backdrop-blur-sm border ${metric.borderColor} hover:scale-105 transition-all duration-300 animate-fade-in group p-6`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/10 border border-white/20`}>
                          <Icon className={`h-5 w-5 ${metric.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm">{metric.title}</h3>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-emerald-400">
                        {metric.change}
                      </span>
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
              {/* Revenue Trend */}
              <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Evolución de Ingresos</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <XAxis dataKey="year" tick={{ fill: '#d1d5db' }} />
                      <YAxis tick={{ fill: '#d1d5db' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Profitability Analysis */}
              <Card className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Percent className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white">Análisis de Rentabilidad</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitabilityData}>
                      <XAxis dataKey="metric" tick={{ fill: '#d1d5db', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#d1d5db' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Bar dataKey="value" fill="#34d399" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Cash Flow Distribution */}
              <Card className="bg-gradient-to-br from-orange-500/30 to-red-500/30 backdrop-blur-sm border border-orange-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <PieIcon className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-white">Distribución de Flujo de Caja</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Key Ratios */}
              <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Activity className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">Ratios Clave</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">ROA</span>
                    <span className="text-white font-semibold">12.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">ROE</span>
                    <span className="text-white font-semibold">18.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Ratio Corriente</span>
                    <span className="text-white font-semibold">1.85</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Ratio D/E</span>
                    <span className="text-white font-semibold">0.45</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">P/E Ratio</span>
                    <span className="text-white font-semibold">16.2</span>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
