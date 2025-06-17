
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Calculator, Target, Percent, PieChart as PieIcon } from 'lucide-react';

export const ValuationModule = () => {
  const valuationMethods = [
    { method: 'DCF', value: 8500, weight: 40 },
    { method: 'Múltiplos', value: 9200, weight: 30 },
    { method: 'Activos', value: 7800, weight: 20 },
    { method: 'Liquidación', value: 6500, weight: 10 }
  ];

  const sensitivityMatrix = [
    { discount: '10%', growth: '1%', value: 9800 },
    { discount: '10%', growth: '2%', value: 10500 },
    { discount: '10%', growth: '3%', value: 11400 },
    { discount: '12%', growth: '1%', value: 8200 },
    { discount: '12%', growth: '2%', value: 8700 },
    { discount: '12%', growth: '3%', value: 9300 },
    { discount: '14%', growth: '1%', value: 7100 },
    { discount: '14%', growth: '2%', value: 7500 },
    { discount: '14%', growth: '3%', value: 8000 }
  ];

  const multiples = [
    { multiple: 'P/E', sector: 16.5, empresa: 15.8, diferencia: -4.2 },
    { multiple: 'EV/EBITDA', sector: 12.2, empresa: 11.8, diferencia: -3.3 },
    { multiple: 'P/B', sector: 2.1, empresa: 1.9, diferencia: -9.5 },
    { multiple: 'EV/Sales', sector: 2.8, empresa: 3.1, diferencia: 10.7 }
  ];

  const valuationSummary = [
    {
      title: 'Valor Empresa',
      value: '€8.5M',
      method: 'DCF Ponderado',
      icon: DollarSign,
      gradient: 'from-blue-500/20 via-blue-400/10 to-transparent',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-700',
      borderColor: 'border-blue-200/50'
    },
    {
      title: 'Valor por Acción',
      value: '€42.50',
      method: 'Base: 200K acciones',
      icon: TrendingUp,
      gradient: 'from-slate-500/20 via-slate-400/10 to-transparent',
      iconBg: 'bg-slate-500/20',
      iconColor: 'text-slate-700',
      borderColor: 'border-slate-200/50'
    },
    {
      title: 'Prima/Descuento',
      value: '-5.2%',
      method: 'vs. Sector',
      icon: Percent,
      gradient: 'from-gray-400/20 via-gray-300/10 to-transparent',
      iconBg: 'bg-gray-400/20',
      iconColor: 'text-gray-700',
      borderColor: 'border-gray-200/50'
    },
    {
      title: 'Rango Valoración',
      value: '€7.8M - €9.2M',
      method: 'IC 80%',
      icon: Target,
      gradient: 'from-blue-400/20 via-blue-300/10 to-transparent',
      iconBg: 'bg-blue-400/20',
      iconColor: 'text-blue-700',
      borderColor: 'border-blue-200/50'
    }
  ];

  const pieData = valuationMethods.map((method, index) => ({
    name: method.method,
    value: method.weight,
    color: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'][index]
  }));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-8 overflow-auto">
          {/* Header Section with Enhanced Glass Effect */}
          <section className="relative">
            <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-blue-400/5 to-slate-500/8 rounded-3xl"></div>
              {/* Enhanced glass reflection */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-slate-400/8 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent">
                  Valoración de la Empresa
                </h1>
                <p className="text-gray-700 text-lg font-medium">Análisis integral de valor mediante múltiples metodologías</p>
              </div>
            </div>
          </section>

          {/* Enhanced Valuation Summary Cards */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {valuationSummary.map((item, index) => {
                const Icon = item.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`group relative bg-white/90 backdrop-blur-2xl border ${item.borderColor} hover:border-blue-300/60 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden`}
                  >
                    {/* Enhanced gradient background with blur */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-60 group-hover:opacity-80 transition-opacity duration-300`}></div>
                    
                    {/* Multiple glass reflection effects */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                    <div className="absolute top-2 left-2 w-16 h-16 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-2 right-2 w-20 h-20 bg-blue-400/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-2xl ${item.iconBg} backdrop-blur-sm border border-white/50 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`h-6 w-6 ${item.iconColor}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                            <p className="text-xs text-gray-600 font-medium">{item.method}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-3xl font-bold text-gray-900 tracking-tight drop-shadow-sm">
                          {item.value}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Enhanced Charts Grid with Blur Effects */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Valuation Methods Chart with Enhanced Blur */}
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-blue-200/60 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 group overflow-hidden">
                {/* Enhanced glass effects */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-white/20 to-slate-500/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-4 left-4 w-24 h-24 bg-blue-400/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 right-4 w-32 h-32 bg-slate-400/8 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-blue-500/20 backdrop-blur-sm border border-blue-200/50 shadow-xl">
                      <PieIcon className="h-6 w-6 text-blue-700" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Métodos de Valoración</h3>
                  </div>
                  <div className="h-72 relative">
                    {/* Chart container with blur background */}
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#3B82F6" floodOpacity="0.3"/>
                          </filter>
                        </defs>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                          filter="url(#shadow)"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            borderRadius: '16px',
                            color: '#374151',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              {/* Valuation by Method Chart with Enhanced Blur */}
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-blue-200/60 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-white/20 to-blue-500/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-4 right-4 w-28 h-28 bg-slate-400/8 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-blue-400/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-slate-500/20 backdrop-blur-sm border border-slate-200/50 shadow-xl">
                      <Calculator className="h-6 w-6 text-slate-700" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Valoración por Método</h3>
                  </div>
                  <div className="h-72 relative">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={valuationMethods}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.6}/>
                          </linearGradient>
                          <filter id="barShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#3B82F6" floodOpacity="0.2"/>
                          </filter>
                        </defs>
                        <XAxis dataKey="method" tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            borderRadius: '16px',
                            color: '#374151',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                          }} 
                        />
                        <Bar 
                          dataKey="value" 
                          fill="url(#barGradient)" 
                          radius={[8, 8, 0, 0]} 
                          filter="url(#barShadow)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Enhanced Multiples Analysis */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-blue-200/60 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-white/20 to-slate-500/3 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-6 right-6 w-32 h-32 bg-blue-400/8 rounded-full blur-3xl"></div>
              <div className="absolute bottom-6 left-6 w-40 h-40 bg-slate-400/6 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 rounded-2xl bg-blue-500/20 backdrop-blur-sm border border-blue-200/50 shadow-xl">
                    <TrendingUp className="h-6 w-6 text-blue-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-xl">Análisis de Múltiplos</h3>
                </div>
                <div className="overflow-x-auto">
                  <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 p-1">
                    <table className="w-full text-gray-900">
                      <thead>
                        <tr className="border-b border-gray-200/50">
                          <th className="text-left py-4 px-6 text-gray-700 font-semibold">Múltiplo</th>
                          <th className="text-right py-4 px-6 text-gray-700 font-semibold">Sector</th>
                          <th className="text-right py-4 px-6 text-gray-700 font-semibold">Empresa</th>
                          <th className="text-right py-4 px-6 text-gray-700 font-semibold">Diferencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {multiples.map((row, index) => (
                          <tr key={index} className="border-b border-gray-100/50 hover:bg-white/40 hover:backdrop-blur-sm transition-all duration-200 rounded-lg">
                            <td className="py-4 px-6 font-medium text-gray-900">{row.multiple}</td>
                            <td className="py-4 px-6 text-right text-gray-800">{row.sector}x</td>
                            <td className="py-4 px-6 text-right text-gray-800">{row.empresa}x</td>
                            <td className={`py-4 px-6 text-right font-medium ${
                              row.diferencia >= 0 ? 'text-blue-600' : 'text-gray-700'
                            }`}>
                              {row.diferencia >= 0 ? '+' : ''}{row.diferencia}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Enhanced DCF Summary */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-blue-200/60 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-white/20 to-blue-500/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-8 left-8 w-36 h-36 bg-blue-400/6 rounded-full blur-3xl"></div>
              <div className="absolute bottom-8 right-8 w-28 h-28 bg-slate-400/8 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-8">Resumen DCF</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-gray-900">
                  <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <p className="text-gray-700 text-sm mb-2 font-medium">Valor Presente FCF</p>
                    <p className="text-3xl font-bold text-blue-600 drop-shadow-sm">€6.8M</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <p className="text-gray-700 text-sm mb-2 font-medium">Valor Terminal</p>
                    <p className="text-3xl font-bold text-slate-600 drop-shadow-sm">€4.2M</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <p className="text-gray-700 text-sm mb-2 font-medium">Valor Empresa</p>
                    <p className="text-3xl font-bold text-blue-600 drop-shadow-sm">€11.0M</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <p className="text-gray-700 text-sm mb-2 font-medium">Menos: Deuda Neta</p>
                    <p className="text-3xl font-bold text-gray-700 drop-shadow-sm">-€2.5M</p>
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
