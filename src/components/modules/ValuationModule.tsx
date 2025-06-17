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
      gradient: 'from-steel-blue/10 via-steel-blue/5 to-transparent',
      iconBg: 'bg-steel-blue/10',
      iconColor: 'text-steel-blue'
    },
    {
      title: 'Valor por Acción',
      value: '€42.50',
      method: 'Base: 200K acciones',
      icon: TrendingUp,
      gradient: 'from-steel-blue-dark/10 via-steel-blue-dark/5 to-transparent',
      iconBg: 'bg-steel-blue-dark/10',
      iconColor: 'text-steel-blue-dark'
    },
    {
      title: 'Prima/Descuento',
      value: '-5.2%',
      method: 'vs. Sector',
      icon: Percent,
      gradient: 'from-gray-100/50 via-gray-50/30 to-transparent',
      iconBg: 'bg-gray-100/50',
      iconColor: 'text-gray-600'
    },
    {
      title: 'Rango Valoración',
      value: '€7.8M - €9.2M',
      method: 'IC 80%',
      icon: Target,
      gradient: 'from-steel-blue-light/15 via-steel-blue-light/8 to-transparent',
      iconBg: 'bg-steel-blue-light/10',
      iconColor: 'text-steel-blue'
    }
  ];

  const pieData = valuationMethods.map((method, index) => ({
    name: method.method,
    value: method.weight,
    color: ['#4682B4', '#6495ED', '#87CEEB', '#B0C4DE'][index]
  }));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-8 overflow-auto">
          {/* Header Section with Glass Effect */}
          <section className="relative">
            <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl shadow-steel-blue/10">
              <div className="absolute inset-0 bg-gradient-to-r from-steel-blue/5 to-steel-blue-light/5 rounded-2xl"></div>
              <div className="relative z-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-steel-blue to-steel-blue-dark bg-clip-text text-transparent">
                  Valoración de la Empresa
                </h1>
                <p className="text-gray-600 text-lg">Análisis integral de valor mediante múltiples metodologías</p>
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
                    className="group relative bg-white/80 backdrop-blur-xl border border-white/30 hover:border-steel-blue/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
                    
                    {/* Glass reflection effect */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${item.iconBg} backdrop-blur-sm border border-white/40 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`h-6 w-6 ${item.iconColor}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                            <p className="text-xs text-gray-600 font-medium">{item.method}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-3xl font-bold text-gray-900 tracking-tight">
                          {item.value}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Enhanced Charts Grid */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Valuation Methods Chart */}
              <Card className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                {/* Glass reflection */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-steel-blue/3 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-steel-blue/10 backdrop-blur-sm border border-steel-blue/20 shadow-lg">
                      <PieIcon className="h-6 w-6 text-steel-blue" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Métodos de Valoración</h3>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '12px',
                            color: '#374151',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              {/* Valuation by Method Chart */}
              <Card className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-steel-blue-dark/3 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-steel-blue-dark/10 backdrop-blur-sm border border-steel-blue-dark/20 shadow-lg">
                      <Calculator className="h-6 w-6 text-steel-blue-dark" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Valoración por Método</h3>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={valuationMethods}>
                        <XAxis dataKey="method" tick={{ fill: '#6B7280' }} />
                        <YAxis tick={{ fill: '#6B7280' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '12px',
                            color: '#374151',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                          }} 
                        />
                        <Bar dataKey="value" fill="#4682B4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Enhanced Multiples Analysis */}
          <section>
            <Card className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-steel-blue/3 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 rounded-xl bg-steel-blue/10 backdrop-blur-sm border border-steel-blue/20 shadow-lg">
                    <TrendingUp className="h-6 w-6 text-steel-blue" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-xl">Análisis de Múltiplos</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-gray-900">
                    <thead>
                      <tr className="border-b border-gray-200/50">
                        <th className="text-left py-4 px-6 text-gray-600 font-semibold">Múltiplo</th>
                        <th className="text-right py-4 px-6 text-gray-600 font-semibold">Sector</th>
                        <th className="text-right py-4 px-6 text-gray-600 font-semibold">Empresa</th>
                        <th className="text-right py-4 px-6 text-gray-600 font-semibold">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {multiples.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100/50 hover:bg-gray-50/30 transition-colors duration-200">
                          <td className="py-4 px-6 font-medium">{row.multiple}</td>
                          <td className="py-4 px-6 text-right">{row.sector}x</td>
                          <td className="py-4 px-6 text-right">{row.empresa}x</td>
                          <td className={`py-4 px-6 text-right font-medium ${
                            row.diferencia >= 0 ? 'text-steel-blue' : 'text-gray-700'
                          }`}>
                            {row.diferencia >= 0 ? '+' : ''}{row.diferencia}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </section>

          {/* Enhanced DCF Summary */}
          <section>
            <Card className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-steel-blue-light/5 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-8">Resumen DCF</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-gray-900">
                  <div className="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
                    <p className="text-gray-600 text-sm mb-2 font-medium">Valor Presente FCF</p>
                    <p className="text-3xl font-bold text-steel-blue">€6.8M</p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
                    <p className="text-gray-600 text-sm mb-2 font-medium">Valor Terminal</p>
                    <p className="text-3xl font-bold text-steel-blue-dark">€4.2M</p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
                    <p className="text-gray-600 text-sm mb-2 font-medium">Valor Empresa</p>
                    <p className="text-3xl font-bold text-steel-blue">€11.0M</p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
                    <p className="text-gray-600 text-sm mb-2 font-medium">Menos: Deuda Neta</p>
                    <p className="text-3xl font-bold text-gray-700">-€2.5M</p>
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
