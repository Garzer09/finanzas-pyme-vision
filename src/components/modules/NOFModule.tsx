
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RotateCcw, 
  TrendingUp, 
  Clock,
  Calculator,
  ShoppingCart,
  Users,
  Truck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useState } from 'react';

export const NOFModule = () => {
  const [periodo, setPeriodo] = useState('anual');
  
  // Datos de entrada
  const [existencias, setExistencias] = useState(180000);
  const [clientes, setClientes] = useState(220000);
  const [proveedores, setProveedores] = useState(160000);
  const [ventas, setVentas] = useState(2400000);
  const [compras, setCompras] = useState(1680000);
  const [costeVentas, setCosteVentas] = useState(1800000);

  // Cálculos NOF
  const nof = existencias + clientes - proveedores;
  const pmc = Math.round((clientes / ventas) * 365); // Periodo Medio de Cobro
  const pmp = Math.round((proveedores / compras) * 365); // Periodo Medio de Pago
  const pme = Math.round((existencias / costeVentas) * 365); // Periodo Medio de Existencias
  const pmm = pme + pmc - pmp; // Periodo Medio de Maduración

  // Datos históricos simulados
  const evolucionNOF = [
    { mes: 'Ene', existencias: 175000, clientes: 200000, proveedores: 145000, nof: 230000 },
    { mes: 'Feb', existencias: 168000, clientes: 210000, proveedores: 152000, nof: 226000 },
    { mes: 'Mar', existencias: 172000, clientes: 215000, proveedores: 148000, nof: 239000 },
    { mes: 'Abr', existencias: 185000, clientes: 225000, proveedores: 165000, nof: 245000 },
    { mes: 'May', existencias: 178000, clientes: 218000, proveedores: 158000, nof: 238000 },
    { mes: 'Jun', existencias: 182000, clientes: 222000, proveedores: 162000, nof: 242000 },
    { mes: 'Jul', existencias: 180000, clientes: 220000, proveedores: 160000, nof: 240000 }
  ];

  const evolucionPeriodos = [
    { mes: 'Ene', pme: 35, pmc: 30, pmp: 31, pmm: 34 },
    { mes: 'Feb', pme: 34, pmc: 32, pmp: 33, pmm: 33 },
    { mes: 'Mar', pme: 35, pmc: 33, pmp: 32, pmm: 36 },
    { mes: 'Abr', pme: 37, pmc: 34, pmp: 35, pmm: 36 },
    { mes: 'May', pme: 36, pmc: 33, pmp: 34, pmm: 35 },
    { mes: 'Jun', pme: 37, pmc: 34, pmp: 35, pmm: 36 },
    { mes: 'Jul', pme: 37, pmc: 33, pmp: 35, pmm: 35 }
  ];

  // Composición de NOF
  const composicionNOF = [
    { name: 'Existencias', value: existencias, color: '#3b82f6' },
    { name: 'Clientes', value: clientes, color: '#10b981' },
    { name: 'Proveedores', value: -proveedores, color: '#ef4444' }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDays = (days: number) => {
    return `${days} días`;
  };

  const getNOFColor = (nof: number) => {
    if (nof > 0) return 'text-orange-400';
    return 'text-green-400';
  };

  const getPMMColor = (pmm: number) => {
    if (pmm <= 30) return 'text-green-400';
    if (pmm <= 45) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <main className="flex-1 p-6 space-y-6 overflow-auto bg-navy-800" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          <section className="relative z-10">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Necesidades Operativas de Financiación (NOF)</h1>
                <p className="text-gray-400">Análisis del capital circulante y periodos de maduración</p>
              </div>
              <div className="flex gap-3">
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger className="w-40 bg-black/20 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* KPIs principales */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className={`backdrop-blur-sm border p-6 ${nof > 0 
                ? 'bg-gradient-to-br from-orange-500/30 to-red-500/30 border-orange-400/50' 
                : 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-400/50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Calculator className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white">NOF Total</h3>
                </div>
                <div className="space-y-2">
                  <p className={`text-2xl font-bold ${getNOFColor(nof)}`}>{formatCurrency(nof)}</p>
                  <p className="text-sm text-gray-300">{nof > 0 ? 'inversión necesaria' : 'financiación obtenida'}</p>
                </div>
              </Card>

              <Card className={`backdrop-blur-sm border p-6 ${pmm <= 30 
                ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-400/50' 
                : pmm <= 45 
                ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-yellow-400/50'
                : 'bg-gradient-to-br from-red-500/30 to-pink-500/30 border-red-400/50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <RotateCcw className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white">Periodo Maduración</h3>
                </div>
                <div className="space-y-2">
                  <p className={`text-2xl font-bold ${getPMMColor(pmm)}`}>{formatDays(pmm)}</p>
                  <p className="text-sm text-gray-300">ciclo de conversión</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Periodo Medio Cobro</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatDays(pmc)}</p>
                  <p className="text-sm text-gray-300">tiempo de cobro</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Truck className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">Periodo Medio Pago</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatDays(pmp)}</p>
                  <p className="text-sm text-gray-300">tiempo de pago</p>
                </div>
              </Card>
            </div>
          </section>

          {/* Parámetros de entrada */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Datos de Balance y P&G</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Activos Circulantes</h3>
                  
                  <div>
                    <Label className="text-white text-sm font-medium mb-2 block">Existencias</Label>
                    <Input
                      type="number"
                      value={existencias}
                      onChange={(e) => setExistencias(Number(e.target.value))}
                      className="bg-black/20 border-gray-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(existencias)}</p>
                  </div>

                  <div>
                    <Label className="text-white text-sm font-medium mb-2 block">Clientes</Label>
                    <Input
                      type="number"
                      value={clientes}
                      onChange={(e) => setClientes(Number(e.target.value))}
                      className="bg-black/20 border-gray-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(clientes)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Pasivos Circulantes</h3>
                  
                  <div>
                    <Label className="text-white text-sm font-medium mb-2 block">Proveedores</Label>
                    <Input
                      type="number"
                      value={proveedores}
                      onChange={(e) => setProveedores(Number(e.target.value))}
                      className="bg-black/20 border-gray-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(proveedores)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Datos del P&G</h3>
                  
                  <div>
                    <Label className="text-white text-sm font-medium mb-2 block">Ventas Netas</Label>
                    <Input
                      type="number"
                      value={ventas}
                      onChange={(e) => setVentas(Number(e.target.value))}
                      className="bg-black/20 border-gray-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(ventas)}</p>
                  </div>

                  <div>
                    <Label className="text-white text-sm font-medium mb-2 block">Compras</Label>
                    <Input
                      type="number"
                      value={compras}
                      onChange={(e) => setCompras(Number(e.target.value))}
                      className="bg-black/20 border-gray-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(compras)}</p>
                  </div>

                  <div>
                    <Label className="text-white text-sm font-medium mb-2 block">Coste de Ventas</Label>
                    <Input
                      type="number"
                      value={costeVentas}
                      onChange={(e) => setCosteVentas(Number(e.target.value))}
                      className="bg-black/20 border-gray-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(costeVentas)}</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Gráficos */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Evolución de NOF */}
              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Evolución de NOF y Componentes</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evolucionNOF}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="mes" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K€`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value, name) => [
                          formatCurrency(Number(value)), 
                          name === 'existencias' ? 'Existencias' :
                          name === 'clientes' ? 'Clientes' :
                          name === 'proveedores' ? 'Proveedores' : 'NOF'
                        ]}
                      />
                      <Bar dataKey="existencias" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="clientes" stackId="a" fill="#10b981" />
                      <Bar dataKey="proveedores" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Evolución de periodos */}
              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Evolución de Periodos Medios</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolucionPeriodos}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="mes" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" label={{ value: 'Días', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value, name) => [
                          `${value} días`, 
                          name === 'pme' ? 'PM Existencias' :
                          name === 'pmc' ? 'PM Cobro' :
                          name === 'pmp' ? 'PM Pago' : 'PM Maduración'
                        ]}
                      />
                      <Line type="monotone" dataKey="pme" stroke="#3b82f6" strokeWidth={2} name="pme" />
                      <Line type="monotone" dataKey="pmc" stroke="#10b981" strokeWidth={2} name="pmc" />
                      <Line type="monotone" dataKey="pmp" stroke="#ef4444" strokeWidth={2} name="pmp" />
                      <Line type="monotone" dataKey="pmm" stroke="#f59e0b" strokeWidth={3} name="pmm" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </section>

          {/* Ciclo de conversión de efectivo */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Ciclo de Conversión de Efectivo</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <ShoppingCart className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">PM Existencias</p>
                  <p className="text-2xl font-bold text-white">{formatDays(pme)}</p>
                </div>
                
                <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-400/30">
                  <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">PM Cobro</p>
                  <p className="text-2xl font-bold text-white">+ {formatDays(pmc)}</p>
                </div>
                
                <div className="text-center p-4 bg-red-500/20 rounded-lg border border-red-400/30">
                  <Truck className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">PM Pago</p>
                  <p className="text-2xl font-bold text-white">- {formatDays(pmp)}</p>
                </div>
                
                <div className="text-center p-4 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                  <Clock className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">PM Maduración</p>
                  <p className={`text-2xl font-bold ${getPMMColor(pmm)}`}>= {formatDays(pmm)}</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-300 mb-2">
                  Tiempo que tarda la empresa en convertir sus inversiones en capital circulante en efectivo
                </p>
                <p className="text-sm text-gray-400">
                  {pmm > 0 
                    ? `La empresa necesita financiar ${formatDays(pmm)} de operaciones`
                    : `La empresa obtiene financiación durante ${formatDays(Math.abs(pmm))} de sus proveedores`
                  }
                </p>
              </div>
            </Card>
          </section>
    </main>
  );
};
