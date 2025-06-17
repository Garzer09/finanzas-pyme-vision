
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
    <div className="flex min-h-screen bg-white" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto bg-light-gray-50">
          <section>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Economic Value Added (EVA)</h1>
              <p className="text-gray-600">Análisis de valor económico agregado y creación de valor para accionistas</p>
            </div>
          </section>

          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {evaSummary.map((item, index) => {
                const Icon = item.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`bg-gradient-to-br ${item.bgGradient} backdrop-blur-sm border ${item.borderColor} hover:scale-105 transition-all duration-300 p-6`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white border border-steel-blue/20">
                          <Icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {item.value}
                      </span>
                      <p className="text-sm font-medium text-steel-blue">{item.change}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-light-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-steel-blue/10 border border-steel-blue/20">
                    <TrendingUp className="h-5 w-5 text-steel-blue" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Evolución del EVA</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="year" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          color: '#374151'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="eva" 
                        stroke="#4682B4" 
                        strokeWidth={3}
                        name="EVA (K€)"
                        dot={{ fill: '#4682B4', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="bg-white border border-light-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-steel-blue/10 border border-steel-blue/20">
                    <Calculator className="h-5 w-5 text-steel-blue" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Drivers del EVA</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evaDrivers}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="driver" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          color: '#374151'
                        }} 
                      />
                      <Bar dataKey="value" fill="#4682B4" name="Actual" />
                      <Bar dataKey="benchmark" fill="#B0BEC5" name="Benchmark" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </section>

          <section>
            <Card className="bg-white border border-light-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Análisis Detallado del EVA</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-gray-900">
                <div>
                  <p className="text-gray-600 text-sm">NOPAT</p>
                  <p className="text-2xl font-bold">€465K</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Capital Invertido</p>
                  <p className="text-2xl font-bold">€3.72M</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Costo del Capital</p>
                  <p className="text-2xl font-bold">€268K</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">EVA Final</p>
                  <p className="text-2xl font-bold text-steel-blue">€185K</p>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
