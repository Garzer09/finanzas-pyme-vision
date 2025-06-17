
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
      color: 'text-steel-blue',
      bgGradient: 'from-steel-blue/20 to-steel-blue-light/20',
      borderColor: 'border-steel-blue/30'
    },
    {
      title: 'Valor por Acción',
      value: '€42.50',
      method: 'Base: 200K acciones',
      icon: TrendingUp,
      color: 'text-steel-blue-dark',
      bgGradient: 'from-steel-blue-light/20 to-light-gray-100/30',
      borderColor: 'border-steel-blue-light/30'
    },
    {
      title: 'Prima/Descuento',
      value: '-5.2%',
      method: 'vs. Sector',
      icon: Percent,
      color: 'text-gray-700',
      bgGradient: 'from-light-gray-100/30 to-light-gray-200/20',
      borderColor: 'border-light-gray-200/30'
    },
    {
      title: 'Rango Valoración',
      value: '€7.8M - €9.2M',
      method: 'IC 80%',
      icon: Target,
      color: 'text-steel-blue',
      bgGradient: 'from-steel-blue-dark/20 to-steel-blue/20',
      borderColor: 'border-steel-blue/30'
    }
  ];

  const pieData = valuationMethods.map((method, index) => ({
    name: method.method,
    value: method.weight,
    color: ['#4682B4', '#6495ED', '#87CEEB', '#B0C4DE'][index]
  }));

  return (
    <div className="flex min-h-screen bg-white" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto bg-light-gray-50">
          {/* Header Section */}
          <section>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Valoración de la Empresa</h1>
              <p className="text-gray-600">Análisis integral de valor mediante múltiples metodologías</p>
            </div>
          </section>

          {/* Valuation Summary Cards */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {valuationSummary.map((item, index) => {
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
                          <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                          <p className="text-xs text-gray-600">{item.method}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {item.value}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Charts Grid */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Valuation Methods */}
              <Card className="bg-white border border-light-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-steel-blue/10 border border-steel-blue/20">
                    <PieIcon className="h-5 w-5 text-steel-blue" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Métodos de Valoración</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          color: '#374151'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Valuation by Method */}
              <Card className="bg-white border border-light-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-steel-blue/10 border border-steel-blue/20">
                    <Calculator className="h-5 w-5 text-steel-blue" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Valoración por Método</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={valuationMethods}>
                      <XAxis dataKey="method" tick={{ fill: '#6B7280' }} />
                      <YAxis tick={{ fill: '#6B7280' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          color: '#374151'
                        }} 
                      />
                      <Bar dataKey="value" fill="#4682B4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </section>

          {/* Multiples Analysis */}
          <section>
            <Card className="bg-white border border-light-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-steel-blue/10 border border-steel-blue/20">
                  <TrendingUp className="h-5 w-5 text-steel-blue" />
                </div>
                <h3 className="font-semibold text-gray-900">Análisis de Múltiplos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-gray-900">
                  <thead>
                    <tr className="border-b border-light-gray-200">
                      <th className="text-left py-3 px-4 text-gray-600">Múltiplo</th>
                      <th className="text-right py-3 px-4 text-gray-600">Sector</th>
                      <th className="text-right py-3 px-4 text-gray-600">Empresa</th>
                      <th className="text-right py-3 px-4 text-gray-600">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multiples.map((row, index) => (
                      <tr key={index} className="border-b border-light-gray-100">
                        <td className="py-3 px-4 font-medium">{row.multiple}</td>
                        <td className="py-3 px-4 text-right">{row.sector}x</td>
                        <td className="py-3 px-4 text-right">{row.empresa}x</td>
                        <td className={`py-3 px-4 text-right font-medium ${
                          row.diferencia >= 0 ? 'text-steel-blue' : 'text-gray-700'
                        }`}>
                          {row.diferencia >= 0 ? '+' : ''}{row.diferencia}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* DCF Summary */}
          <section>
            <Card className="bg-white border border-light-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Resumen DCF</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-gray-900">
                <div>
                  <p className="text-gray-600 text-sm">Valor Presente FCF</p>
                  <p className="text-2xl font-bold">€6.8M</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Valor Terminal</p>
                  <p className="text-2xl font-bold">€4.2M</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Valor Empresa</p>
                  <p className="text-2xl font-bold">€11.0M</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Menos: Deuda Neta</p>
                  <p className="text-2xl font-bold text-gray-700">-€2.5M</p>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
