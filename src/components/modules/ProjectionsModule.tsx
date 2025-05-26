
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { TrendingUp, Calendar, Target, Zap, ArrowUp, ArrowDown } from 'lucide-react';

export const ProjectionsModule = () => {
  const projectionData = [
    { year: '2024', revenue: 2750, ebitda: 605, netIncome: 412 },
    { year: '2025', revenue: 3025, ebitda: 696, netIncome: 475 },
    { year: '2026', revenue: 3328, ebitda: 798, netIncome: 549 },
    { year: '2027', revenue: 3660, ebitda: 915, netIncome: 634 },
    { year: '2028', revenue: 4026, ebitda: 1047, netIncome: 731 }
  ];

  const cashFlowData = [
    { year: '2024', operacional: 580, inversion: -120, financiacion: -85 },
    { year: '2025', operacional: 665, inversion: -135, financiacion: -95 },
    { year: '2026', operacional: 765, inversion: -150, financiacion: -105 },
    { year: '2027', operacional: 880, inversion: -165, financiacion: -115 },
    { year: '2028', operacional: 1010, inversion: -180, financiacion: -125 }
  ];

  const kpis = [
    {
      title: 'Ingresos 2028',
      value: '€4.03M',
      change: '+46.5%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/30 to-cyan-500/30',
      borderColor: 'border-blue-400/50'
    },
    {
      title: 'EBITDA 2028',
      value: '€1.05M',
      change: '+73.0%',
      trend: 'up',
      icon: Target,
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-500/30 to-teal-500/30',
      borderColor: 'border-emerald-400/50'
    },
    {
      title: 'CAGR Ingresos',
      value: '10.0%',
      change: 'Proyectado',
      trend: 'neutral',
      icon: Calendar,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/30 to-red-500/30',
      borderColor: 'border-orange-400/50'
    },
    {
      title: 'Flujo Libre 2028',
      value: '€830K',
      change: '+85.2%',
      trend: 'up',
      icon: Zap,
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/30 to-pink-500/30',
      borderColor: 'border-purple-400/50'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-emerald-400" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-400" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

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
              <h1 className="text-2xl font-bold text-white mb-2">Proyecciones Financieras</h1>
              <p className="text-gray-400">Análisis prospectivo a 5 años (2024-2028)</p>
            </div>
          </section>

          {/* KPI Cards */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((kpi, index) => {
                const Icon = kpi.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`bg-gradient-to-br ${kpi.bgGradient} backdrop-blur-sm border ${kpi.borderColor} hover:scale-105 transition-all duration-300 animate-fade-in group p-6`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/10 border border-white/20`}>
                          <Icon className={`h-5 w-5 ${kpi.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm">{kpi.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(kpi.trend)}
                        <span className="text-sm font-medium text-emerald-400">
                          {kpi.change}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-2xl font-bold text-white">
                        {kpi.value}
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
              {/* Revenue & Profitability Projection */}
              <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Proyección de Ingresos y Rentabilidad</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData}>
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
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="ebitda" stackId="2" stroke="#34d399" fill="#34d399" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Cash Flow Projection */}
              <Card className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Zap className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white">Proyección de Flujo de Caja</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData}>
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
                      <Bar dataKey="operacional" fill="#34d399" />
                      <Bar dataKey="inversion" fill="#fb923c" />
                      <Bar dataKey="financiacion" fill="#f87171" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </section>

          {/* Scenarios Summary */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Resumen de Escenarios</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h3 className="text-emerald-400 font-medium">Optimista</h3>
                  <div className="space-y-2 text-white">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Ingresos 2028</span>
                      <span>€4.4M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">EBITDA 2028</span>
                      <span>€1.2M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">CAGR</span>
                      <span>12.5%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-teal-400 font-medium">Base</h3>
                  <div className="space-y-2 text-white">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Ingresos 2028</span>
                      <span>€4.0M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">EBITDA 2028</span>
                      <span>€1.05M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">CAGR</span>
                      <span>10.0%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-orange-400 font-medium">Conservador</h3>
                  <div className="space-y-2 text-white">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Ingresos 2028</span>
                      <span>€3.6M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">EBITDA 2028</span>
                      <span>€0.9M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">CAGR</span>
                      <span>7.5%</span>
                    </div>
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
