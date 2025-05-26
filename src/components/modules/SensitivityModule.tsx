
import { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Area } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, Target, Zap, Activity, Settings, BarChart3, LineChart as LineChartIcon, Calculator, Gauge } from 'lucide-react';

export const SensitivityModule = () => {
  const [selectedScenario, setSelectedScenario] = useState('base');
  const [ventasVariacion, setVentasVariacion] = useState([0]);
  const [costesVariacion, setCostesVariacion] = useState([0]);
  const [preciosVariacion, setPreciosVariacion] = useState([0]);
  const [activeTab, setActiveTab] = useState('configuracion');

  // Datos de escenarios
  const scenarios = [
    {
      id: 'pesimista',
      name: 'Pesimista',
      description: 'Escenario conservador',
      probability: 25,
      color: '#f87171',
      assumptions: {
        ventas: -15,
        costes: 8,
        precios: -5
      },
      results: {
        ebitda: 380,
        margen: 15.2,
        flujo: 245,
        valor: 5800
      }
    },
    {
      id: 'base',
      name: 'Base',
      description: 'Escenario más probable',
      probability: 50,
      color: '#60a5fa',
      assumptions: {
        ventas: 5,
        costes: 3,
        precios: 0
      },
      results: {
        ebitda: 450,
        margen: 18.0,
        flujo: 320,
        valor: 8500
      }
    },
    {
      id: 'optimista',
      name: 'Optimista',
      description: 'Escenario favorable',
      probability: 25,
      color: '#34d399',
      assumptions: {
        ventas: 20,
        costes: -2,
        precios: 8
      },
      results: {
        ebitda: 580,
        margen: 23.2,
        flujo: 425,
        valor: 12200
      }
    }
  ];

  // Datos para comparativa de KPIs
  const kpiComparison = [
    {
      kpi: 'EBITDA (K€)',
      pesimista: 380,
      base: 450,
      optimista: 580,
      variacion_pesi: -15.6,
      variacion_opti: 28.9
    },
    {
      kpi: 'Margen EBITDA (%)',
      pesimista: 15.2,
      base: 18.0,
      optimista: 23.2,
      variacion_pesi: -2.8,
      variacion_opti: 5.2
    },
    {
      kpi: 'Flujo de Caja (K€)',
      pesimista: 245,
      base: 320,
      optimista: 425,
      variacion_pesi: -23.4,
      variacion_opti: 32.8
    },
    {
      kpi: 'Valoración (K€)',
      pesimista: 5800,
      base: 8500,
      optimista: 12200,
      variacion_pesi: -31.8,
      variacion_opti: 43.5
    }
  ];

  // Datos para tornado chart
  const tornadoData = [
    {
      variable: 'Crecimiento Ventas',
      impacto_negativo: -28,
      impacto_positivo: 32,
      rango: '±15%'
    },
    {
      variable: 'Costes Variables',
      impacto_negativo: -18,
      impacto_positivo: 22,
      rango: '±8%'
    },
    {
      variable: 'Precios',
      impacto_negativo: -15,
      impacto_positivo: 18,
      rango: '±5%'
    },
    {
      variable: 'Costes Fijos',
      impacto_negativo: -12,
      impacto_positivo: 12,
      rango: '±10%'
    },
    {
      variable: 'Tasa Descuento',
      impacto_negativo: -8,
      impacto_positivo: 10,
      rango: '±2%'
    }
  ];

  // Datos para evolución temporal por escenario
  const temporalData = [
    { periodo: 'Año 1', pesimista: 380, base: 450, optimista: 580 },
    { periodo: 'Año 2', pesimista: 395, base: 472, optimista: 624 },
    { periodo: 'Año 3', pesimista: 410, base: 495, optimista: 672 },
    { periodo: 'Año 4', pesimista: 425, base: 520, optimista: 725 },
    { periodo: 'Año 5', pesimista: 442, base: 546, optimista: 783 }
  ];

  // Función para obtener color del heatmap
  const getHeatmapColor = (value: number) => {
    if (value < -20) return 'bg-red-600/80';
    if (value < -10) return 'bg-red-500/60';
    if (value < -5) return 'bg-orange-500/60';
    if (value < 5) return 'bg-gray-600/40';
    if (value < 10) return 'bg-green-500/60';
    if (value < 20) return 'bg-green-600/70';
    return 'bg-emerald-600/80';
  };

  return (
    <div className="flex min-h-screen bg-navy-800" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          {/* Header Section */}
          <section className="relative z-10">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Análisis de Sensibilidad y Escenarios</h1>
              <p className="text-gray-400">Evaluación de riesgos y planificación estratégica</p>
            </div>
          </section>

          {/* Tabs Navigation */}
          <section className="relative z-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border border-gray-600/50">
                <TabsTrigger value="configuracion" className="data-[state=active]:bg-teal-600">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </TabsTrigger>
                <TabsTrigger value="comparativa" className="data-[state=active]:bg-teal-600">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Comparativa
                </TabsTrigger>
                <TabsTrigger value="tornado" className="data-[state=active]:bg-teal-600">
                  <Gauge className="h-4 w-4 mr-2" />
                  Tornado
                </TabsTrigger>
                <TabsTrigger value="unifactorial" className="data-[state=active]:bg-teal-600">
                  <LineChartIcon className="h-4 w-4 mr-2" />
                  Unifactorial
                </TabsTrigger>
              </TabsList>

              {/* Configuración de Escenarios */}
              <TabsContent value="configuracion" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Simulador de Variables */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-teal-400" />
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

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Variación de Precios: {preciosVariacion[0] > 0 ? '+' : ''}{preciosVariacion[0]}%
                        </label>
                        <Slider
                          value={preciosVariacion}
                          onValueChange={setPreciosVariacion}
                          max={15}
                          min={-15}
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
                            <span>€{(450 + (ventasVariacion[0] * 25) - (costesVariacion[0] * 15) + (preciosVariacion[0] * 12)).toFixed(0)}K</span>
                          </div>
                          <div className="flex justify-between text-emerald-300">
                            <span>Variación:</span>
                            <span>{((((450 + (ventasVariacion[0] * 25) - (costesVariacion[0] * 15) + (preciosVariacion[0] * 12)) / 450) - 1) * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Escenarios Predefinidos */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Target className="h-5 w-5 text-emerald-400" />
                        Escenarios Predefinidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {scenarios.map((scenario) => (
                        <div 
                          key={scenario.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedScenario === scenario.id 
                              ? 'border-teal-400 bg-teal-400/10' 
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                          onClick={() => setSelectedScenario(scenario.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-semibold">{scenario.name}</h4>
                            <span className="text-sm text-gray-400">{scenario.probability}%</span>
                          </div>
                          <p className="text-sm text-gray-300 mb-3">{scenario.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-gray-400">
                              Ventas: <span style={{ color: scenario.color }}>{scenario.assumptions.ventas > 0 ? '+' : ''}{scenario.assumptions.ventas}%</span>
                            </div>
                            <div className="text-gray-400">
                              Costes: <span style={{ color: scenario.color }}>{scenario.assumptions.costes > 0 ? '+' : ''}{scenario.assumptions.costes}%</span>
                            </div>
                            <div className="text-gray-400">
                              EBITDA: <span style={{ color: scenario.color }}>€{scenario.results.ebitda}K</span>
                            </div>
                            <div className="text-gray-400">
                              Margen: <span style={{ color: scenario.color }}>{scenario.results.margen}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Comparativa de Escenarios */}
              <TabsContent value="comparativa" className="space-y-6">
                {/* Tabla Comparativa con Heatmap */}
                <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-orange-400" />
                      Comparativa de KPIs por Escenario
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-600">
                            <TableHead className="text-gray-300">KPI</TableHead>
                            <TableHead className="text-center text-red-400">Pesimista</TableHead>
                            <TableHead className="text-center text-blue-400">Base</TableHead>
                            <TableHead className="text-center text-green-400">Optimista</TableHead>
                            <TableHead className="text-center text-gray-300">Δ Pesi (%)</TableHead>
                            <TableHead className="text-center text-gray-300">Δ Opti (%)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {kpiComparison.map((row) => (
                            <TableRow key={row.kpi} className="border-gray-600">
                              <TableCell className="text-white font-medium">{row.kpi}</TableCell>
                              <TableCell className="text-center">
                                <span className={`px-2 py-1 rounded text-white ${getHeatmapColor(row.variacion_pesi)}`}>
                                  {row.pesimista}
                                </span>
                              </TableCell>
                              <TableCell className="text-center text-blue-300">{row.base}</TableCell>
                              <TableCell className="text-center">
                                <span className={`px-2 py-1 rounded text-white ${getHeatmapColor(row.variacion_opti)}`}>
                                  {row.optimista}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`px-2 py-1 rounded text-white ${getHeatmapColor(row.variacion_pesi)}`}>
                                  {row.variacion_pesi > 0 ? '+' : ''}{row.variacion_pesi}%
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`px-2 py-1 rounded text-white ${getHeatmapColor(row.variacion_opti)}`}>
                                  {row.variacion_opti > 0 ? '+' : ''}{row.variacion_opti}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico de Evolución Temporal */}
                <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <LineChartIcon className="h-5 w-5 text-purple-400" />
                      Evolución EBITDA por Escenario
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={temporalData}>
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
                          <Line type="monotone" dataKey="pesimista" stroke="#f87171" strokeWidth={3} name="Pesimista" />
                          <Line type="monotone" dataKey="base" stroke="#60a5fa" strokeWidth={3} name="Base" />
                          <Line type="monotone" dataKey="optimista" stroke="#34d399" strokeWidth={3} name="Optimista" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tornado Chart */}
              <TabsContent value="tornado" className="space-y-6">
                <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-yellow-400" />
                      Análisis Tornado - Sensibilidad de Variables
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tornadoData.map((item, index) => (
                        <div key={item.variable} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">{item.variable}</span>
                            <span className="text-gray-400 text-sm">{item.rango}</span>
                          </div>
                          <div className="relative h-8 bg-gray-700/50 rounded-lg overflow-hidden">
                            {/* Barra negativa */}
                            <div 
                              className="absolute left-1/2 h-full bg-red-500/80"
                              style={{
                                width: `${Math.abs(item.impacto_negativo) * 1.5}%`,
                                transform: `translateX(-100%)`
                              }}
                            />
                            {/* Barra positiva */}
                            <div 
                              className="absolute left-1/2 h-full bg-green-500/80"
                              style={{
                                width: `${item.impacto_positivo * 1.5}%`
                              }}
                            />
                            {/* Línea central */}
                            <div className="absolute left-1/2 w-0.5 h-full bg-white transform -translate-x-0.5" />
                            {/* Valores */}
                            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-xs font-semibold">
                              {item.impacto_negativo}%
                            </div>
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-xs font-semibold">
                              +{item.impacto_positivo}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Análisis Unifactorial */}
              <TabsContent value="unifactorial" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sensibilidad de Ventas */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-cyan-400" />
                        Sensibilidad a Ventas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { variacion: -30, ebitda: 200 },
                            { variacion: -20, ebitda: 275 },
                            { variacion: -10, ebitda: 350 },
                            { variacion: 0, ebitda: 450 },
                            { variacion: 10, ebitda: 550 },
                            { variacion: 20, ebitda: 650 },
                            { variacion: 30, ebitda: 750 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="variacion" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1F2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#fff'
                              }} 
                            />
                            <Line type="monotone" dataKey="ebitda" stroke="#06b6d4" strokeWidth={3} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sensibilidad de Costes */}
                  <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-orange-400" />
                        Sensibilidad a Costes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { variacion: -20, ebitda: 600 },
                            { variacion: -10, ebitda: 525 },
                            { variacion: 0, ebitda: 450 },
                            { variacion: 10, ebitda: 375 },
                            { variacion: 20, ebitda: 300 },
                            { variacion: 30, ebitda: 225 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="variacion" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1F2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#fff'
                              }} 
                            />
                            <Line type="monotone" dataKey="ebitda" stroke="#f59e0b" strokeWidth={3} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Matriz de Sensibilidad */}
                <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/50 p-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-400" />
                      Matriz de Sensibilidad Bidimensional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 gap-2 text-center text-sm">
                      {/* Headers */}
                      <div className="text-gray-400 font-medium">Ventas / Costes</div>
                      <div className="text-gray-400 font-medium">-10%</div>
                      <div className="text-gray-400 font-medium">-5%</div>
                      <div className="text-gray-400 font-medium">0%</div>
                      <div className="text-gray-400 font-medium">+5%</div>
                      <div className="text-gray-400 font-medium">+10%</div>
                      
                      {/* Filas de datos */}
                      {['-15%', '-10%', '-5%', '0%', '+5%', '+10%', '+15%'].map((ventas, i) => (
                        <>
                          <div key={`${ventas}-header`} className="text-gray-400 font-medium">{ventas}</div>
                          {[-10, -5, 0, 5, 10].map((costes, j) => {
                            const baseValue = 450;
                            const ventasImpact = (parseInt(ventas.replace('%', '')) / 100) * 250;
                            const costesImpact = (costes / 100) * -150;
                            const finalValue = baseValue + ventasImpact + costesImpact;
                            const isPositive = finalValue > baseValue;
                            return (
                              <div 
                                key={`${i}-${j}`} 
                                className={`p-2 rounded text-white text-xs ${
                                  finalValue > 500 ? 'bg-green-600/80' :
                                  finalValue > 450 ? 'bg-green-500/60' :
                                  finalValue > 400 ? 'bg-yellow-500/60' :
                                  finalValue > 350 ? 'bg-orange-500/60' :
                                  'bg-red-600/80'
                                }`}
                              >
                                {finalValue.toFixed(0)}
                              </div>
                            );
                          })}
                        </>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </main>
      </div>
    </div>
  );
};
