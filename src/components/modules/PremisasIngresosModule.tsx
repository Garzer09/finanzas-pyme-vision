
import { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, CalendarDays, Percent, Target } from 'lucide-react';

export const PremisasIngresosModule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('annual');

  const ingresosData = [
    { periodo: 'Año 0', ventas: 2500, crecimiento: 0 },
    { periodo: 'Año 1', ventas: 2800, crecimiento: 12 },
    { periodo: 'Año 2', ventas: 3150, crecimiento: 12.5 },
    { periodo: 'Año 3', ventas: 3550, crecimiento: 12.7 },
  ];

  const segmentosData = [
    { segmento: 'Retail', actual: 1200, proyectado: 1380 },
    { segmento: 'Corporativo', actual: 800, proyectado: 920 },
    { segmento: 'Digital', actual: 350, proyectado: 420 },
    { segmento: 'Servicios', actual: 150, proyectado: 180 },
  ];

  return (
    <div className="flex min-h-screen bg-navy-800" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          <section className="relative z-10">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">4.1. Premisas de Ingresos</h1>
              <p className="text-gray-400">Análisis de las hipótesis de crecimiento y desarrollo de ingresos</p>
            </div>
          </section>

          <section className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-teal-400" />
                    Evolución de Ingresos
                  </CardTitle>
                  <div className="flex gap-2">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="annual">Anual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ingresosData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="periodo" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="ventas" 
                          stroke="#14B8A6" 
                          strokeWidth={3}
                          name="Ventas (K€)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Percent className="h-5 w-5 text-emerald-400" />
                    Tasas de Crecimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ingresosData.slice(1)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="periodo" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Bar dataKey="crecimiento" fill="#10B981" name="Crecimiento %" />
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
                  <Target className="h-5 w-5 text-purple-400" />
                  Ingresos por Segmento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segmentosData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="segmento" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Bar dataKey="actual" fill="#6366F1" name="Actual (K€)" />
                      <Bar dataKey="proyectado" fill="#8B5CF6" name="Proyectado (K€)" />
                    </BarChart>
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
