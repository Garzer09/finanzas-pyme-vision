
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import { useState } from 'react';

export const BreakevenCurrentModule = () => {
  const [costesFijos, setCostesFijos] = useState(300000);
  const [costesVariables, setCostesVariables] = useState(70); // % sobre ventas
  const [precioVentaUnitario, setPrecioVentaUnitario] = useState(25);
  const [unidadesVendidas, setUnidadesVendidas] = useState(120000);

  // Cálculos del punto muerto
  const margenContribucion = 100 - costesVariables;
  const puntoMuertoUnidades = Math.round(costesFijos / (precioVentaUnitario * (margenContribucion / 100)));
  const puntoMuertoValor = puntoMuertoUnidades * precioVentaUnitario;
  const ventasActuales = unidadesVendidas * precioVentaUnitario;
  const margenSeguridad = ((ventasActuales - puntoMuertoValor) / ventasActuales) * 100;

  // Datos para el gráfico
  const generateChartData = () => {
    const maxUnidades = Math.max(puntoMuertoUnidades * 1.5, unidadesVendidas * 1.2);
    const step = maxUnidades / 20;
    const data = [];
    
    for (let unidades = 0; unidades <= maxUnidades; unidades += step) {
      const ingresos = unidades * precioVentaUnitario;
      const costesTotales = costesFijos + (ingresos * costesVariables / 100);
      
      data.push({
        unidades: Math.round(unidades),
        ingresos,
        costesTotales,
        costesFijos,
        beneficio: ingresos - costesTotales
      });
    }
    return data;
  };

  const chartData = generateChartData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex min-h-screen bg-navy-800" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          <section className="relative z-10">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Análisis del Punto Muerto Actual</h1>
              <p className="text-gray-400">Determinación del nivel de ventas donde la empresa no incurre en pérdidas ni obtiene beneficios</p>
            </div>
          </section>

          {/* KPI Cards */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Target className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white">Punto Muerto (Unidades)</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{puntoMuertoUnidades.toLocaleString()}</p>
                  <p className="text-sm text-gray-300">unidades</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Calculator className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Punto Muerto (Valor)</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatCurrency(puntoMuertoValor)}</p>
                  <p className="text-sm text-gray-300">en ventas</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/30 to-red-500/30 backdrop-blur-sm border border-orange-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <TrendingUp className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-white">Margen de Seguridad</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{margenSeguridad.toFixed(1)}%</p>
                  <p className="text-sm text-gray-300">sobre ventas actuales</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <AlertCircle className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">Margen Contribución</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{margenContribucion.toFixed(1)}%</p>
                  <p className="text-sm text-gray-300">por unidad vendida</p>
                </div>
              </Card>
            </div>
          </section>

          {/* Interactive Controls */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Simulación Interactiva</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <Label className="text-white text-sm font-medium mb-2 block">Costes Fijos Totales</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[costesFijos]}
                        onValueChange={(value) => setCostesFijos(value[0])}
                        max={500000}
                        min={100000}
                        step={10000}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={costesFijos}
                        onChange={(e) => setCostesFijos(Number(e.target.value))}
                        className="w-32 bg-black/20 border-gray-600 text-white"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(costesFijos)}</p>
                  </div>

                  <div>
                    <Label className="text-white text-sm font-medium mb-2 block">Costes Variables (% sobre ventas)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[costesVariables]}
                        onValueChange={(value) => setCostesVariables(value[0])}
                        max={90}
                        min={30}
                        step={1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={costesVariables}
                        onChange={(e) => setCostesVariables(Number(e.target.value))}
                        className="w-32 bg-black/20 border-gray-600 text-white"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{costesVariables}%</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="text-white text-sm font-medium mb-2 block">Precio de Venta Unitario</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[precioVentaUnitario]}
                        onValueChange={(value) => setPrecioVentaUnitario(value[0])}
                        max={50}
                        min={10}
                        step={0.5}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={precioVentaUnitario}
                        onChange={(e) => setPrecioVentaUnitario(Number(e.target.value))}
                        className="w-32 bg-black/20 border-gray-600 text-white"
                        step="0.5"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(precioVentaUnitario)}</p>
                  </div>

                  <div>
                    <Label className="text-white text-sm font-medium mb-2 block">Unidades Vendidas Actuales</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[unidadesVendidas]}
                        onValueChange={(value) => setUnidadesVendidas(value[0])}
                        max={200000}
                        min={50000}
                        step={5000}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={unidadesVendidas}
                        onChange={(e) => setUnidadesVendidas(Number(e.target.value))}
                        className="w-32 bg-black/20 border-gray-600 text-white"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{unidadesVendidas.toLocaleString()} unidades</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Breakeven Chart */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Gráfico de Punto Muerto</h2>
              
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="unidades" 
                      stroke="#9ca3af"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K€`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value, name) => {
                        if (name === 'unidades') return [value.toLocaleString(), 'Unidades'];
                        return [formatCurrency(Number(value)), name === 'ingresos' ? 'Ingresos Totales' : 
                               name === 'costesTotales' ? 'Costes Totales' : 
                               name === 'costesFijos' ? 'Costes Fijos' : 'Beneficio'];
                      }}
                    />
                    
                    {/* Área de pérdidas */}
                    <defs>
                      <linearGradient id="lossArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="profitArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    
                    <Line 
                      type="monotone" 
                      dataKey="costesFijos" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Costes Fijos"
                      strokeDasharray="5 5"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="costesTotales" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      name="Costes Totales"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Ingresos Totales"
                    />
                    
                    <ReferenceLine 
                      x={puntoMuertoUnidades} 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      label={{ value: "Punto Muerto", position: "top", fill: "#3b82f6" }}
                    />
                    <ReferenceLine 
                      x={unidadesVendidas} 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      label={{ value: "Ventas Actuales", position: "top", fill: "#8b5cf6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-yellow-400"></div>
                  <span className="text-sm text-gray-300">Costes Fijos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-red-400"></div>
                  <span className="text-sm text-gray-300">Costes Totales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-green-400"></div>
                  <span className="text-sm text-gray-300">Ingresos Totales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-400 border-dashed"></div>
                  <span className="text-sm text-gray-300">Punto Muerto</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-purple-400 border-dashed"></div>
                  <span className="text-sm text-gray-300">Ventas Actuales</span>
                </div>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
