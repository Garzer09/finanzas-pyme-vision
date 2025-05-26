
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { Calculator, Target, TrendingUp, BarChart3 } from 'lucide-react';

export const BreakevenCurrentModule = () => {
  const [viewMode, setViewMode] = useState<'chart' | 'analysis' | 'sensitivity'>('chart');

  // Datos para el análisis de punto muerto
  const breakevenData = {
    ventasActuales: 2500000,
    costesVariables: 1380000,
    costesFijos: 795000,
    margenContribucion: 1120000,
    porcentajeMargenContribucion: 44.8,
    puntoMuertoUnidades: 1772321, // Costes Fijos / % Margen Contribución
    puntoMuertoEuros: 1772321,
    margenSeguridad: 728679,
    porcentajeMargenSeguridad: 29.1
  };

  // Datos para el gráfico interactivo
  const chartData = Array.from({ length: 21 }, (_, i) => {
    const ventas = i * 250000;
    const costesVariables = ventas * 0.552;
    const costesFijos = 795000;
    const costesTotales = costesVariables + costesFijos;
    const beneficio = ventas - costesTotales;
    
    return {
      ventas: ventas / 1000,
      ingresos: ventas / 1000,
      costesTotales: costesTotales / 1000,
      costesFijos: costesFijos / 1000,
      beneficio: beneficio / 1000,
      puntoMuerto: Math.abs(ventas - 1772321) < 50000
    };
  });

  const sensitivityData = [
    { escenario: 'Actual', costesFijos: 795, margenContrib: 44.8, puntoMuerto: 1772 },
    { escenario: '+10% CF', costesFijos: 875, margenContrib: 44.8, puntoMuerto: 1951 },
    { escenario: '-10% CF', costesFijos: 716, margenContrib: 44.8, puntoMuerto: 1594 },
    { escenario: '+5% MC', costesFijos: 795, margenContrib: 49.8, puntoMuerto: 1597 },
    { escenario: '-5% MC', costesFijos: 795, margenContrib: 39.8, puntoMuerto: 1996 }
  ];

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K€`;
    }
    return `${value.toLocaleString()}€`;
  };

  return (
    <div className="flex min-h-screen bg-navy-800">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          {/* Header */}
          <section className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/20 border border-teal-400/30">
                    <Target className="h-6 w-6 text-teal-400" />
                  </div>
                  Análisis del Punto Muerto - Situación Actual
                </h1>
                <p className="text-gray-400">Análisis de punto de equilibrio y margen de seguridad</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'chart' ? 'default' : 'outline'}
                  onClick={() => setViewMode('chart')}
                  className="border-gray-600"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Gráfico
                </Button>
                <Button
                  variant={viewMode === 'analysis' ? 'default' : 'outline'}
                  onClick={() => setViewMode('analysis')}
                  className="border-gray-600"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Análisis
                </Button>
                <Button
                  variant={viewMode === 'sensitivity' ? 'default' : 'outline'}
                  onClick={() => setViewMode('sensitivity')}
                  className="border-gray-600"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Sensibilidad
                </Button>
              </div>
            </div>
          </section>

          {/* Vista Gráfico Interactivo */}
          {viewMode === 'chart' && (
            <section className="relative z-10">
              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Gráfico de Punto Muerto Interactivo</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <XAxis 
                        dataKey="ventas" 
                        tick={{ fill: '#d1d5db' }}
                        label={{ value: 'Ventas (K€)', position: 'insideBottom', offset: -10, style: { fill: '#d1d5db' } }}
                      />
                      <YAxis 
                        tick={{ fill: '#d1d5db' }}
                        label={{ value: 'Importe (K€)', angle: -90, position: 'insideLeft', style: { fill: '#d1d5db' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                        formatter={(value: any, name) => [`${value}K€`, name]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="beneficio" 
                        fill="#10b981" 
                        fillOpacity={0.3}
                        stroke="none"
                        name="Zona de Beneficio"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="ingresos" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="Ingresos"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="costesTotales" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        name="Costes Totales"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="costesFijos" 
                        stroke="#f97316" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Costes Fijos"
                        dot={false}
                      />
                      <Bar 
                        dataKey="puntoMuerto" 
                        fill="#fbbf24" 
                        opacity={0.7}
                        name="Punto Muerto"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{formatCurrency(breakevenData.puntoMuertoEuros)}</div>
                    <div className="text-sm text-gray-400">Punto Muerto €</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{formatCurrency(breakevenData.margenSeguridad)}</div>
                    <div className="text-sm text-gray-400">Margen Seguridad</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-400">{breakevenData.porcentajeMargenContribucion.toFixed(1)}%</div>
                    <div className="text-sm text-gray-400">Margen Contribución</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{breakevenData.porcentajeMargenSeguridad.toFixed(1)}%</div>
                    <div className="text-sm text-gray-400">% Margen Seguridad</div>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* Vista Análisis */}
          {viewMode === 'analysis' && (
            <section className="relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Datos Clave del Punto Muerto</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-white">Ventas Actuales</span>
                      <span className="text-blue-400 font-semibold">{formatCurrency(breakevenData.ventasActuales)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-white">Costes Variables</span>
                      <span className="text-orange-400 font-semibold">{formatCurrency(breakevenData.costesVariables)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-white">Costes Fijos</span>
                      <span className="text-red-400 font-semibold">{formatCurrency(breakevenData.costesFijos)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-white">Margen de Contribución</span>
                      <span className="text-emerald-400 font-semibold">{formatCurrency(breakevenData.margenContribucion)}</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Resultados del Análisis</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                      <div className="text-blue-400 font-semibold mb-1">Punto de Equilibrio</div>
                      <div className="text-2xl font-bold text-white">{formatCurrency(breakevenData.puntoMuertoEuros)}</div>
                      <div className="text-sm text-gray-400">Ventas mínimas para no tener pérdidas</div>
                    </div>
                    
                    <div className="p-4 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
                      <div className="text-emerald-400 font-semibold mb-1">Margen de Seguridad</div>
                      <div className="text-2xl font-bold text-white">{formatCurrency(breakevenData.margenSeguridad)}</div>
                      <div className="text-sm text-gray-400">{breakevenData.porcentajeMargenSeguridad.toFixed(1)}% sobre ventas actuales</div>
                    </div>
                    
                    <div className="p-4 bg-teal-500/20 border border-teal-400/30 rounded-lg">
                      <div className="text-teal-400 font-semibold mb-1">% Margen de Contribución</div>
                      <div className="text-2xl font-bold text-white">{breakevenData.porcentajeMargenContribucion.toFixed(1)}%</div>
                      <div className="text-sm text-gray-400">Por cada euro de venta</div>
                    </div>
                  </div>
                </Card>
              </div>
            </section>
          )}

          {/* Vista Sensibilidad */}
          {viewMode === 'sensitivity' && (
            <section className="relative z-10">
              <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Análisis de Sensibilidad del Punto Muerto</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-semibold mb-4">Tabla de Sensibilidad</h4>
                    <div className="space-y-3">
                      {sensitivityData.map((item, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${
                          index === 0 ? 'bg-blue-500/20 border-blue-400/30' : 'bg-gray-700/50 border-gray-600'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">{item.escenario}</span>
                            <Badge variant="outline" className={
                              item.puntoMuerto < 1772 ? 'text-emerald-400 border-emerald-400' :
                              item.puntoMuerto > 1772 ? 'text-red-400 border-red-400' :
                              'text-blue-400 border-blue-400'
                            }>
                              {item.puntoMuerto}K€
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            CF: {item.costesFijos}K€ | MC: {item.margenContrib}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-semibold mb-4">Gráfico de Sensibilidad</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sensitivityData}>
                          <XAxis 
                            dataKey="escenario" 
                            tick={{ fill: '#d1d5db', fontSize: 10 }} 
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fill: '#d1d5db' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              borderRadius: '8px',
                              color: '#fff'
                            }} 
                            formatter={(value: any) => [`${value}K€`, 'Punto Muerto']}
                          />
                          <Bar 
                            dataKey="puntoMuerto" 
                            fill="#60a5fa"
                            stroke="#fff"
                            strokeWidth={1}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                  <h4 className="text-yellow-400 font-semibold mb-2">Conclusiones del Análisis</h4>
                  <ul className="text-white text-sm space-y-1">
                    <li>• El punto muerto actual es de {formatCurrency(breakevenData.puntoMuertoEuros)}</li>
                    <li>• La empresa tiene un margen de seguridad del {breakevenData.porcentajeMargenSeguridad.toFixed(1)}%</li>
                    <li>• Una reducción del 10% en costes fijos mejora el punto muerto en {((1772 - 1594) / 1772 * 100).toFixed(1)}%</li>
                    <li>• Un incremento del 5% en el margen de contribución mejora el punto muerto en {((1772 - 1597) / 1772 * 100).toFixed(1)}%</li>
                  </ul>
                </div>
              </Card>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
