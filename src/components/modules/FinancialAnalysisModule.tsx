import { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { MissingFinancialData } from '@/components/MissingFinancialData';

export const FinancialAnalysisModule = () => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const { companyId } = useCompanyContext();
  const { data: financialData, loading, hasRealData } = useFinancialData('estado_pyg', companyId);

  // Show missing data indicator if no real data
  if (!hasRealData && !loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-light-gray-50 via-white to-steel-blue-light/20">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="max-w-lg w-full">
              <MissingFinancialData 
                dataType="pyg"
                onUploadClick={() => console.log('Navigate to upload')}
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Generate P&G data from real financial data
  const pygData = financialData && financialData.length > 0 ? [
    { concepto: 'Ingresos', actual: 2500, presupuesto: 2400 }, // TODO: Extract from real data
    { concepto: 'Coste Ventas', actual: -1500, presupuesto: -1440 },
    { concepto: 'Margen Bruto', actual: 1000, presupuesto: 960 },
    { concepto: 'Gastos Operativos', actual: -550, presupuesto: -520 },
    { concepto: 'EBITDA', actual: 450, presupuesto: 440 },
    { concepto: 'Amortizaciones', actual: -120, presupuesto: -115 },
    { concepto: 'EBIT', actual: 330, presupuesto: 325 },
  ] : [];

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
              
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-steel-blue to-steel-blue-dark bg-clip-text text-transparent">
                    Análisis Financiero
                  </h1>
                  <p className="text-gray-700 text-lg font-medium">P&G, Balance y Flujos de Caja con selección temporal</p>
                </div>
                
                <div className="flex gap-4">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-32 bg-white/80 backdrop-blur-sm border-steel-blue/30 text-gray-900 rounded-xl">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-steel-blue/30 rounded-xl">
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm border-steel-blue/30 text-gray-900 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-steel-blue/30 rounded-xl">
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
            </div>
          </section>

          {/* Enhanced Charts Grid */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* P&G Chart */}
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-steel-blue/5 via-white/20 to-light-gray-100/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-4 left-4 w-24 h-24 bg-steel-blue/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 right-4 w-32 h-32 bg-light-gray-200/8 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-gray-900 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-steel-blue/20 backdrop-blur-sm border border-steel-blue/30 shadow-xl">
                      <BarChart3 className="h-6 w-6 text-steel-blue-dark" />
                    </div>
                    Cuenta de Pérdidas y Ganancias ({selectedYear})
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="h-80 relative">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pygData}>
                        <defs>
                          <linearGradient id="pygGradient1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#5EEAD4" stopOpacity={0.6}/>
                          </linearGradient>
                          <linearGradient id="pygGradient2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                          </linearGradient>
                          <filter id="pygShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#14B8A6" floodOpacity="0.2"/>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="concepto" stroke="#6B7280" angle={-45} textAnchor="end" height={100} />
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
                          dataKey="actual" 
                          fill="url(#pygGradient1)" 
                          name="Actual (K€)" 
                          radius={[8, 8, 0, 0]} 
                          filter="url(#pygShadow)"
                        />
                        <Bar 
                          dataKey="presupuesto" 
                          fill="url(#pygGradient2)" 
                          name="Presupuesto (K€)" 
                          radius={[8, 8, 0, 0]} 
                          filter="url(#pygShadow)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Balance Chart */}
              <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-light-gray-100/5 via-white/20 to-steel-blue/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute top-4 right-4 w-28 h-28 bg-light-gray-200/8 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-steel-blue/10 rounded-full blur-3xl"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-gray-900 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-steel-blue-light/20 backdrop-blur-sm border border-steel-blue-light/30 shadow-xl">
                      <DollarSign className="h-6 w-6 text-steel-blue" />
                    </div>
                    Balance de Situación ({selectedYear})
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="h-80 relative">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={balanceData} layout="horizontal">
                        <defs>
                          <linearGradient id="balanceGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#34D399" stopOpacity={0.6}/>
                          </linearGradient>
                          <filter id="balanceShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#10B981" floodOpacity="0.2"/>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis type="number" stroke="#6B7280" />
                        <YAxis dataKey="concepto" type="category" stroke="#6B7280" width={100} />
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
                          dataKey="valor" 
                          fill="url(#balanceGradient)" 
                          name="Valor (K€)" 
                          radius={[0, 8, 8, 0]} 
                          filter="url(#balanceShadow)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Enhanced Cash Flow Chart */}
          <section>
            <Card className="bg-white/90 backdrop-blur-2xl border border-white/40 hover:border-steel-blue/30 rounded-3xl p-8 shadow-2xl hover:shadow-2xl hover:shadow-steel-blue/20 transition-all duration-500 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-steel-blue/3 via-white/20 to-light-gray-100/5 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="absolute top-6 right-6 w-32 h-32 bg-steel-blue/8 rounded-full blur-3xl"></div>
              <div className="absolute bottom-6 left-6 w-40 h-40 bg-light-gray-200/6 rounded-full blur-3xl"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-gray-900 flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-steel-blue/20 backdrop-blur-sm border border-steel-blue/30 shadow-xl">
                    <TrendingUp className="h-6 w-6 text-steel-blue-dark" />
                  </div>
                  Evolución de Flujos de Caja ({selectedYear})
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="h-80 relative">
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={flujosData}>
                      <defs>
                        <linearGradient id="flujosGradient1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#5EEAD4" stopOpacity={0.2}/>
                        </linearGradient>
                        <linearGradient id="flujosGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.2}/>
                        </linearGradient>
                        <linearGradient id="flujosGradient3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#F87171" stopOpacity={0.2}/>
                        </linearGradient>
                        <filter id="flujosShadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#14B8A6" floodOpacity="0.3"/>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="mes" stroke="#6B7280" />
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
                        dataKey="operativo" 
                        stroke="url(#flujosGradient1)" 
                        strokeWidth={4} 
                        name="Operativo (K€)" 
                        dot={{ fill: '#14B8A6', strokeWidth: 2, r: 6 }}
                        filter="url(#flujosShadow)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="inversion" 
                        stroke="url(#flujosGradient2)" 
                        strokeWidth={4} 
                        name="Inversión (K€)" 
                        dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                        filter="url(#flujosShadow)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="financiacion" 
                        stroke="url(#flujosGradient3)" 
                        strokeWidth={4} 
                        name="Financiación (K€)" 
                        dot={{ fill: '#EF4444', strokeWidth: 2, r: 6 }}
                        filter="url(#flujosShadow)"
                      />
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
