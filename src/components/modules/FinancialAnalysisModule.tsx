
import { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, TrendingUp, BarChart3, DollarSign } from 'lucide-react';

export const FinancialAnalysisModule = () => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const pygData = [
    { concepto: 'Ingresos', actual: 2500, presupuesto: 2400 },
    { concepto: 'Coste Ventas', actual: -1500, presupuesto: -1440 },
    { concepto: 'Margen Bruto', actual: 1000, presupuesto: 960 },
    { concepto: 'Gastos Operativos', actual: -550, presupuesto: -520 },
    { concepto: 'EBITDA', actual: 450, presupuesto: 440 },
    { concepto: 'Amortizaciones', actual: -120, presupuesto: -115 },
    { concepto: 'EBIT', actual: 330, presupuesto: 325 },
  ];

  const balanceData = [
    { concepto: 'Activo Fijo', valor: 1200 },
    { concepto: 'Existencias', valor: 280 },
    { concepto: 'Clientes', valor: 420 },
    { concepto: 'Tesorería', valor: 125 },
    { concepto: 'Total Activo', valor: 2025 },
  ];

  const flujosData = [
    { mes: 'Ene', operativo: 45, inversion: -15, financiacion: -10 },
    { mes: 'Feb', operativo: 52, inversion: -8, financiacion: -12 },
    { mes: 'Mar', operativo: 48, inversion: -20, financiacion: -5 },
    { mes: 'Abr', operativo: 38, inversion: -25, financiacion: -8 },
    { mes: 'May', operativo: 55, inversion: -12, financiacion: -15 },
    { mes: 'Jun', operativo: 42, inversion: -18, financiacion: -10 },
  ];

  return (
    <div className="flex min-h-screen bg-navy-800" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          <section className="relative z-10">
            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Análisis Financiero</h1>
                <p className="text-gray-400">P&G, Balance y Flujos de Caja con selección temporal</p>
              </div>
              
              <div className="flex gap-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all">Todo el año</SelectItem>
                    <SelectItem value="1">Enero</SelectItem>
                    <SelectItem value="2">Febrero</SelectItem>
                    <SelectItem value="3">Marzo</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Mayo</SelectItem>
                    <SelectItem value="6">Junio</SelectItem>
                    <SelectItem value="7">Julio</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Septiembre</SelectItem>
                    <SelectItem value="10">Octubre</SelectItem>
                    <SelectItem value="11">Noviembre</SelectItem>
                    <SelectItem value="12">Diciembre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-teal-400" />
                    Cuenta de Pérdidas y Ganancias ({selectedYear})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pygData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="concepto" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Bar dataKey="actual" fill="#14B8A6" name="Actual (K€)" />
                        <Bar dataKey="presupuesto" fill="#6366F1" name="Presupuesto (K€)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                    Balance de Situación ({selectedYear})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={balanceData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" stroke="#9CA3AF" />
                        <YAxis dataKey="concepto" type="category" stroke="#9CA3AF" width={100} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Bar dataKey="valor" fill="#10B981" name="Valor (K€)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  Evolución de Flujos de Caja ({selectedYear})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={flujosData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="mes" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Line type="monotone" dataKey="operativo" stroke="#14B8A6" strokeWidth={3} name="Operativo (K€)" />
                      <Line type="monotone" dataKey="inversion" stroke="#F59E0B" strokeWidth={3} name="Inversión (K€)" />
                      <Line type="monotone" dataKey="financiacion" stroke="#EF4444" strokeWidth={3} name="Financiación (K€)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
