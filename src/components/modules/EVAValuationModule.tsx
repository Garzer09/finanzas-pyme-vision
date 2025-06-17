
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, TrendingUp, Calculator, Target } from 'lucide-react';

export const EVAValuationModule = () => {
  const evaData = [
    { year: '2020', eva: -120, nopat: 280, wacc: 8.5 },
    { year: '2021', eva: -85, nopat: 320, wacc: 8.2 },
    { year: '2022', eva: 45, nopat: 380, wacc: 7.8 },
    { year: '2023', eva: 125, nopat: 420, wacc: 7.5 },
    { year: '2024', eva: 185, nopat: 465, wacc: 7.2 }
  ];

  const evaDrivers = [
    { driver: 'ROIC', value: 12.5, benchmark: 10.2, unit: '%' },
    { driver: 'WACC', value: 7.2, benchmark: 8.1, unit: '%' },
    { driver: 'Capital Invertido', value: 3720, benchmark: 3500, unit: 'K€' },
    { driver: 'NOPAT', value: 465, benchmark: 420, unit: 'K€' }
  ];

  const evaSummary = [
    {
      title: 'EVA Actual',
      value: '€185K',
      change: '+48%',
      icon: DollarSign,
      color: 'text-steel-blue',
      bgGradient: 'from-steel-blue/20 to-steel-blue-light/20',
      borderColor: 'border-steel-blue/30'
    },
    {
      title: 'ROIC',
      value: '12.5%',
      change: '+2.3pp',
      icon: TrendingUp,
      color: 'text-steel-blue-dark',
      bgGradient: 'from-steel-blue-light/20 to-light-gray-100/30',
      borderColor: 'border-steel-blue-light/30'
    },
    {
      title: 'WACC',
      value: '7.2%',
      change: '-0.3pp',
      icon: Calculator,
      color: 'text-gray-700',
      bgGradient: 'from-light-gray-100/30 to-light-gray-200/20',
      borderColor: 'border-light-gray-200/30'
    },
    {
      title: 'Spread',
      value: '5.3pp',
      change: '+2.6pp',
      icon: Target,
      color: 'text-steel-blue',
      bgGradient: 'from-steel-blue-dark/20 to-steel-blue/20',
      borderColor: 'border-steel-blue/30'
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
                  Economic Value Added (EVA)
                </h1>
                <p className="text-gray-700 text-lg font-medium">Análisis de valor económico agregado y creación de valor para accionistas</p>
              </div>
            </div>
          </section>

          {/* Enhanced EVA Summary Cards */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {evaSummary.map((item, index) => {
                const Icon = item.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`group relative bg-white/90 backdrop-blur-2xl border ${item.borderColor} hover:border-steel-blue/60 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden`}
                  >
                    {/* Enhanced gradient background with blur */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-60 group-hover:opacity-80 transition-opacity duration-300`}></div>
                    
                    {/* Multiple glass reflection effects */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                    <div className="absolute top-2 left-2 w-16 h-16 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-2 right-2 w-20 h-20 bg-steel-blue/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="p-4 rounded-2xl bg-steel-blue/20 backdrop-blur-sm border border-white/50 shadow-xl group-hover:scale-110 transition-transform duration-300">
                            <Icon className={`h-6 w-6 ${item.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-3xl font-bold text-gray-900 tracking-tight drop-shadow-sm">
                          {item.value}
                        </span>
                        <p className="text-sm font-medium text-steel-blue">{item.change}</p>
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
              {/* EVA Evolution Chart */}
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-steel-blue/5 via-white/20 to-light-gray-100/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-4 left-4 w-24 h-24 bg-steel-blue/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 right-4 w-32 h-32 bg-light-gray-200/8 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-steel-blue/20 backdrop-blur-sm border border-steel-blue/30 shadow-xl">
                      <TrendingUp className="h-6 w-6 text-steel-blue-dark" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Evolución del EVA</h3>
                  </div>
                  <div className="h-72 relative">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evaData}>
                        <defs>
                          <linearGradient id="evaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4682B4" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#87CEEB" stopOpacity={0.2}/>
                          </linearGradient>
                          <filter id="evaShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#4682B4" floodOpacity="0.3"/>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="year" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
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
                        <Line 
                          type="monotone" 
                          dataKey="eva" 
                          stroke="url(#evaGradient)" 
                          strokeWidth={4}
                          name="EVA (K€)"
                          dot={{ fill: '#4682B4', strokeWidth: 2, r: 6, filter: 'url(#evaShadow)' }}
                          filter="url(#evaShadow)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              {/* EVA Drivers Chart */}
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-light-gray-100/5 via-white/20 to-steel-blue/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-4 right-4 w-28 h-28 bg-light-gray-200/8 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-steel-blue/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-steel-blue-light/20 backdrop-blur-sm border border-steel-blue-light/30 shadow-xl">
                      <Calculator className="h-6 w-6 text-steel-blue" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Drivers del EVA</h3>
                  </div>
                  <div className="h-72 relative">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={evaDrivers}>
                        <defs>
                          <linearGradient id="driversGradient1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4682B4" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#87CEEB" stopOpacity={0.6}/>
                          </linearGradient>
                          <linearGradient id="driversGradient2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#B0BEC5" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#CFD8DC" stopOpacity={0.6}/>
                          </linearGradient>
                          <filter id="driversShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#4682B4" floodOpacity="0.2"/>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="driver" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
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
                          fill="url(#driversGradient1)" 
                          name="Actual" 
                          radius={[8, 8, 0, 0]} 
                          filter="url(#driversShadow)"
                        />
                        <Bar 
                          dataKey="benchmark" 
                          fill="url(#driversGradient2)" 
                          name="Benchmark" 
                          radius={[8, 8, 0, 0]} 
                          filter="url(#driversShadow)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Enhanced DCF Summary */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-light-gray-100/5 via-white/20 to-steel-blue/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-8 left-8 w-36 h-36 bg-steel-blue/6 rounded-full blur-3xl"></div>
              <div className="absolute bottom-8 right-8 w-28 h-28 bg-light-gray-200/8 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-8">Análisis Detallado del EVA</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-gray-900">
                  <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <p className="text-gray-700 text-sm mb-2 font-medium">NOPAT</p>
                    <p className="text-3xl font-bold text-steel-blue drop-shadow-sm">€465K</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <p className="text-gray-700 text-sm mb-2 font-medium">Capital Invertido</p>
                    <p className="text-3xl font-bold text-steel-blue-dark drop-shadow-sm">€3.72M</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <p className="text-gray-700 text-sm mb-2 font-medium">Costo del Capital</p>
                    <p className="text-3xl font-bold text-gray-700 drop-shadow-sm">€268K</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <p className="text-gray-700 text-sm mb-2 font-medium">EVA Final</p>
                    <p className="text-3xl font-bold text-steel-blue drop-shadow-sm">€185K</p>
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
