
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Plus,
  Edit,
  Trash2,
  Building2,
  DollarSign,
  AlertTriangle,
  Target,
  Clock,
  Shield
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { useState } from 'react';

interface CuentaBancaria {
  id: string;
  entidad: string;
  tipoCuenta: string;
  numeroCuenta: string;
  saldo: number;
  fechaActualizacion: string;
  limite?: number;
  dispuesto?: number;
}

interface FlujoPrevisto {
  fecha: string;
  ingresos: number;
  gastos: number;
  saldoAcumulado: number;
  saldoMinimo: number;
}

export const TreasuryModule = () => {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([
    {
      id: '1',
      entidad: 'Banco Santander',
      tipoCuenta: 'Cuenta Corriente',
      numeroCuenta: 'ES76 0049 0001 5000 0000 0001',
      saldo: 85000,
      fechaActualizacion: '2024-01-15'
    },
    {
      id: '2',
      entidad: 'BBVA',
      tipoCuenta: 'Cuenta Vista',
      numeroCuenta: 'ES21 0182 0001 2000 0000 0002',
      saldo: 32000,
      fechaActualizacion: '2024-01-15'
    },
    {
      id: '3',
      entidad: 'CaixaBank',
      tipoCuenta: 'Línea de Crédito',
      numeroCuenta: 'ES65 2100 0001 1800 0000 0003',
      saldo: -15000,
      fechaActualizacion: '2024-01-15',
      limite: 50000,
      dispuesto: 15000
    },
    {
      id: '4',
      entidad: 'Caja Física',
      tipoCuenta: 'Efectivo',
      numeroCuenta: 'CASH-001',
      saldo: 2500,
      fechaActualizacion: '2024-01-15'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [saldoMinimoObjetivo, setSaldoMinimoObjetivo] = useState(30000);
  const [saldoMaximoObjetivo, setSaldoMaximoObjetivo] = useState(150000);

  // Previsión de flujos de caja para los próximos 30 días
  const previsionFlujos: FlujoPrevisto[] = [
    { fecha: '2024-01-16', ingresos: 45000, gastos: 38000, saldoAcumulado: 111500, saldoMinimo: 30000 },
    { fecha: '2024-01-17', ingresos: 12000, gastos: 15000, saldoAcumulado: 108500, saldoMinimo: 30000 },
    { fecha: '2024-01-18', ingresos: 25000, gastos: 22000, saldoAcumulado: 111500, saldoMinimo: 30000 },
    { fecha: '2024-01-19', ingresos: 8000, gastos: 35000, saldoAcumulado: 84500, saldoMinimo: 30000 },
    { fecha: '2024-01-20', ingresos: 55000, gastos: 18000, saldoAcumulado: 121500, saldoMinimo: 30000 },
    { fecha: '2024-01-23', ingresos: 15000, gastos: 42000, saldoAcumulado: 94500, saldoMinimo: 30000 },
    { fecha: '2024-01-24', ingresos: 35000, gastos: 28000, saldoAcumulado: 101500, saldoMinimo: 30000 },
    { fecha: '2024-01-25', ingresos: 20000, gastos: 33000, saldoAcumulado: 88500, saldoMinimo: 30000 },
    { fecha: '2024-01-26', ingresos: 48000, gastos: 25000, saldoAcumulado: 111500, saldoMinimo: 30000 },
    { fecha: '2024-01-27', ingresos: 18000, gastos: 40000, saldoAcumulado: 89500, saldoMinimo: 30000 },
    { fecha: '2024-01-30', ingresos: 62000, gastos: 35000, saldoAcumulado: 116500, saldoMinimo: 30000 },
    { fecha: '2024-01-31', ingresos: 25000, gastos: 45000, saldoAcumulado: 96500, saldoMinimo: 30000 },
    { fecha: '2024-02-01', ingresos: 38000, gastos: 28000, saldoAcumulado: 106500, saldoMinimo: 30000 },
    { fecha: '2024-02-02', ingresos: 15000, gastos: 38000, saldoAcumulado: 83500, saldoMinimo: 30000 },
    { fecha: '2024-02-05', ingresos: 52000, gastos: 22000, saldoAcumulado: 113500, saldoMinimo: 30000 }
  ];

  // Evolución histórica (últimos 30 días)
  const evolucionTesoreria = [
    { fecha: '2023-12-16', saldo: 95000, objetivo: 90000 },
    { fecha: '2023-12-17', saldo: 88000, objetivo: 90000 },
    { fecha: '2023-12-18', saldo: 92000, objetivo: 90000 },
    { fecha: '2023-12-19', saldo: 87000, objetivo: 90000 },
    { fecha: '2023-12-20', saldo: 84000, objetivo: 90000 },
    { fecha: '2023-12-23', saldo: 89000, objetivo: 90000 },
    { fecha: '2023-12-24', saldo: 91000, objetivo: 90000 },
    { fecha: '2023-12-27', saldo: 86000, objetivo: 90000 },
    { fecha: '2023-12-28', saldo: 93000, objetivo: 90000 },
    { fecha: '2023-12-29', saldo: 97000, objetivo: 90000 },
    { fecha: '2024-01-02', saldo: 102000, objetivo: 90000 },
    { fecha: '2024-01-03', saldo: 98000, objetivo: 90000 },
    { fecha: '2024-01-04', saldo: 105000, objetivo: 90000 },
    { fecha: '2024-01-05', saldo: 101000, objetivo: 90000 },
    { fecha: '2024-01-08', saldo: 108000, objetivo: 90000 },
    { fecha: '2024-01-09', saldo: 104000, objetivo: 90000 },
    { fecha: '2024-01-10', saldo: 99000, objetivo: 90000 },
    { fecha: '2024-01-11', saldo: 106000, objetivo: 90000 },
    { fecha: '2024-01-12', saldo: 103000, objetivo: 90000 },
    { fecha: '2024-01-15', saldo: 104500, objetivo: 90000 }
  ];

  // Cálculos de liquidez
  const saldoTesoreriaTotal = cuentas.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
  const saldoPositivo = cuentas.filter(c => c.saldo > 0).reduce((sum, cuenta) => sum + cuenta.saldo, 0);
  const deudaCortoPlazo = Math.abs(cuentas.filter(c => c.saldo < 0).reduce((sum, cuenta) => sum + cuenta.saldo, 0));
  const tesoreriaNeta = saldoPositivo - deudaCortoPlazo;
  const lineasCreditoDisponibles = cuentas
    .filter(c => c.limite && c.dispuesto !== undefined)
    .reduce((sum, c) => sum + (c.limite! - c.dispuesto!), 0);

  // Ratios de liquidez
  const ratioLiquidezInmediata = saldoPositivo / 50000; // Asumiendo gastos mensuales de 50K
  const ratioCoberturaMensual = saldoTesoreriaTotal / 50000;
  const diasCobertura = Math.floor(ratioCoberturaMensual * 30);

  // Análisis de alertas
  const alertas = [];
  if (saldoTesoreriaTotal < saldoMinimoObjetivo) {
    alertas.push({ tipo: 'danger', mensaje: `Saldo por debajo del mínimo objetivo (${formatCurrency(saldoMinimoObjetivo)})` });
  }
  if (saldoTesoreriaTotal > saldoMaximoObjetivo) {
    alertas.push({ tipo: 'warning', mensaje: `Exceso de liquidez - considerar inversión temporal` });
  }
  if (diasCobertura < 15) {
    alertas.push({ tipo: 'danger', mensaje: `Cobertura insuficiente: solo ${diasCobertura} días` });
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Cuenta Corriente':
      case 'Cuenta Vista':
        return 'text-blue-400 bg-blue-500/20';
      case 'Línea de Crédito':
        return 'text-orange-400 bg-orange-500/20';
      case 'Efectivo':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="flex min-h-screen bg-navy-800" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="data-wave-bg absolute inset-0 pointer-events-none opacity-10" />
          
          <section className="relative z-10">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Gestión de Tesorería</h1>
                <p className="text-gray-400">Análisis integral de liquidez, previsiones y optimización de cash management</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Cuenta
                </Button>
              </div>
            </div>
          </section>

          {/* Alertas de tesorería */}
          {alertas.length > 0 && (
            <section className="relative z-10">
              <div className="space-y-3">
                {alertas.map((alerta, index) => (
                  <Alert key={index} className={`${alerta.tipo === 'danger' ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-white">
                      {alerta.mensaje}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </section>
          )}

          {/* KPIs principales */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Wallet className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white">Posición Total</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatCurrency(saldoTesoreriaTotal)}</p>
                  <p className="text-sm text-gray-300">liquidez inmediata</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Cobertura</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{diasCobertura}</p>
                  <p className="text-sm text-gray-300">días de cobertura</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/30 to-yellow-500/30 backdrop-blur-sm border border-orange-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <CreditCard className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-white">Líneas Disponibles</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatCurrency(lineasCreditoDisponibles)}</p>
                  <p className="text-sm text-gray-300">crédito no dispuesto</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Target className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">Ratio Liquidez</h3>
                </div>
                <div className="space-y-2">
                  <p className={`text-2xl font-bold ${ratioLiquidezInmediata >= 2 ? 'text-green-400' : ratioLiquidezInmediata >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {ratioLiquidezInmediata.toFixed(1)}x
                  </p>
                  <p className="text-sm text-gray-300">vs gastos mensuales</p>
                </div>
              </Card>
            </div>
          </section>

          {/* Configuración de objetivos */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Objetivos de Tesorería</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white text-sm font-medium mb-2 block">Saldo Mínimo Objetivo</Label>
                  <Input
                    type="number"
                    value={saldoMinimoObjetivo}
                    onChange={(e) => setSaldoMinimoObjetivo(Number(e.target.value))}
                    className="bg-black/20 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formatCurrency(saldoMinimoObjetivo)}</p>
                </div>

                <div>
                  <Label className="text-white text-sm font-medium mb-2 block">Saldo Máximo Objetivo</Label>
                  <Input
                    type="number"
                    value={saldoMaximoObjetivo}
                    onChange={(e) => setSaldoMaximoObjetivo(Number(e.target.value))}
                    className="bg-black/20 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formatCurrency(saldoMaximoObjetivo)}</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Gráficos de análisis */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Previsión de flujos */}
              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Previsión de Flujos (Próximos 15 días)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={previsionFlujos}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="fecha" 
                        stroke="#9ca3af"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                      />
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
                          name === 'saldoAcumulado' ? 'Saldo Acumulado' : 
                          name === 'ingresos' ? 'Ingresos' : 'Gastos'
                        ]}
                        labelFormatter={(value) => formatDate(value)}
                      />
                      <Bar dataKey="ingresos" fill="#10b981" />
                      <Bar dataKey="gastos" fill="#ef4444" />
                      <Line 
                        type="monotone" 
                        dataKey="saldoAcumulado" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                      <ReferenceLine y={saldoMinimoObjetivo} stroke="#f59e0b" strokeDasharray="3 3" 
                        label={{ value: "Mínimo", position: "left", fill: "#f59e0b" }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Evolución histórica */}
              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Evolución Histórica (30 días)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolucionTesoreria}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="fecha" 
                        stroke="#9ca3af"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                      />
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
                          name === 'saldo' ? 'Saldo Real' : 'Objetivo'
                        ]}
                        labelFormatter={(value) => formatDate(value)}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="saldo" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="objetivo" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        strokeDasharray="3 3"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </section>

          {/* Tabla de cuentas */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Detalle de Cuentas</h2>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300">Entidad</TableHead>
                      <TableHead className="text-gray-300">Tipo</TableHead>
                      <TableHead className="text-gray-300">Número de Cuenta</TableHead>
                      <TableHead className="text-gray-300 text-right">Saldo</TableHead>
                      <TableHead className="text-gray-300 text-center">Límite/Dispuesto</TableHead>
                      <TableHead className="text-gray-300">Última Actualización</TableHead>
                      <TableHead className="text-gray-300 text-center">Estado</TableHead>
                      <TableHead className="text-gray-300 text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuentas.map((cuenta) => (
                      <TableRow key={cuenta.id}>
                        <TableCell className="text-white font-medium">{cuenta.entidad}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${getTipoColor(cuenta.tipoCuenta)}`}>
                            {cuenta.tipoCuenta}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-300 font-mono text-sm">{cuenta.numeroCuenta}</TableCell>
                        <TableCell className={`text-right font-medium ${cuenta.saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(cuenta.saldo)}
                        </TableCell>
                        <TableCell className="text-center text-gray-300">
                          {cuenta.limite ? (
                            <div>
                              <p className="text-sm">{formatCurrency(cuenta.limite)}</p>
                              <p className="text-xs text-orange-400">
                                Dispuesto: {formatCurrency(cuenta.dispuesto || 0)}
                              </p>
                              <p className="text-xs text-green-400">
                                Disponible: {formatCurrency(cuenta.limite - (cuenta.dispuesto || 0))}
                              </p>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm">{formatDate(cuenta.fechaActualizacion)}</TableCell>
                        <TableCell className="text-center">
                          {cuenta.saldo >= 0 ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-400">
                              Activo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-400">
                              Dispuesto
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-400">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
