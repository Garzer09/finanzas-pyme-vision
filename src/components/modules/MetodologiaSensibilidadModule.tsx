
import { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Target, TrendingUp, AlertTriangle, Calculator } from 'lucide-react';

export const MetodologiaSensibilidadModule = () => {
  const [ventasVariacion, setVentasVariacion] = useState([0]);
  const [costesVariacion, setCostesVariacion] = useState([0]);

  const escenarios = [
    { escenario: 'Pesimista', ebitda: 350, margen: 14, probabilidad: 20 },
    { escenario: 'Base', ebitda: 450, margen: 18, probabilidad: 60 },
    { escenario: 'Optimista', ebitda: 580, margen: 23, probabilidad: 20 },
  ];

  const sensibilidadData = [
    { variable: 'Ventas -10%', impacto: -250 },
    { variable: 'Ventas +10%', impacto: 250 },
    { variable: 'Costes +5%', impacto: -75 },
    { variable: 'Costes -5%', impacto: 75 },
    { variable: 'Precio +3%', impacto: 75 },
    { variable: 'Precio -3%', impacto: -75 },
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
              <h1 className="text-2xl font-bold text-white mb-2">6.1. Metodología de Análisis de Sensibilidad</h1>
              <p className="text-gray-400">Análisis del impacto de variables clave en los resultados financieros</p>
            </div>
          </section>

          <section className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-teal-400" />
                    Simulador de Variables
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Variación de Ventas: {ventasVariacion[0] > 0 ? '+' : ''}{ventasVariacion[0]}%
                    </label>
                    <Slider
                      value={ventasVariacion}
                      onValueChange={setVentasVariacion}
                      max={30}
                      min={-30}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Variación de Costes: {costesVariacion[0] > 0 ? '+' : ''}{costesVariacion[0]}%
                    </label>
                    <Slider
                      value={costesVariacion}
                      onValueChange={setCostesVariacion}
                      max={20}
                      min={-20}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Impacto Simulado</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-300">
                        <span>EBITDA Base:</span>
                        <span>€450K</span>
                      </div>
                      <div className="flex justify-between text-teal-300">
                        <span>EBITDA Simulado:</span>
                        <span>€{(450 + (ventasVariacion[0] * 25) - (costesVariacion[0] * 15)).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-emerald-400" />
                    Escenarios de Análisis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={escenarios}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="escenario" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Bar dataKey="ebitda" fill="#10B981" name="EBITDA (K€)" />
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
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  Análisis de Sensibilidad por Variable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sensibilidadData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" />
                      <YAxis dataKey="variable" type="category" stroke="#9CA3AF" width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Bar dataKey="impacto" fill="#F59E0B" name="Impacto EBITDA (K€)" />
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
