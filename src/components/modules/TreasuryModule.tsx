
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  PiggyBank, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Building2,
  CreditCard
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
  ReferenceLine
} from 'recharts';
import { useState } from 'react';

interface CuentaBancaria {
  id: string;
  entidad: string;
  tipoCuenta: string;
  numeroCuenta: string;
  saldo: number;
  tipo: 'corriente' | 'ahorro' | 'plazo';
  limiteSobregiro?: number;
  saldoSobregiro?: number;
}

export const TreasuryModule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('mensual');
  const [showAddForm, setShowAddForm] = useState(false);

  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([
    {
      id: '1',
      entidad: 'Banco Santander',
      tipoCuenta: 'Cuenta Corriente Empresarial',
      numeroCuenta: '****8452',
      saldo: 85000,
      tipo: 'corriente',
      limiteSobregiro: 50000,
      saldoSobregiro: 0
    },
    {
      id: '2',
      entidad: 'BBVA',
      tipoCuenta: 'Cuenta Operativa',
      numeroCuenta: '****2134',
      saldo: 25000,
      tipo: 'corriente',
      limiteSobregiro: 30000,
      saldoSobregiro: 0
    },
    {
      id: '3',
      entidad: 'CaixaBank',
      tipoCuenta: 'Cuenta de Ahorro',
      numeroCuenta: '****9876',
      saldo: 15000,
      tipo: 'ahorro'
    },
    {
      id: '4',
      entidad: 'Banco Sabadell',
      tipoCuenta: 'Línea de Crédito',
      numeroCuenta: '****5567',
      saldo: -12000,
      tipo: 'corriente',
      limiteSobregiro: 75000,
      saldoSobregiro: 12000
    }
  ]);

  // Evolución histórica de tesorería
  const evolucionTesoreria = [
    { fecha: '2024-01-01', saldo: 95000, entradas: 180000, salidas: -165000 },
    { fecha: '2024-01-08', saldo: 110000, entradas: 120000, salidas: -105000 },
    { fecha: '2024-01-15', saldo: 125000, entradas: 95000, salidas: -80000 },
    { fecha: '2024-01-22', saldo: 140000, entradas: 110000, salidas: -95000 },
    { fecha: '2024-01-29', saldo: 113000, entradas: 85000, salidas: -112000 },
    { fecha: '2024-02-05', saldo: 128000, entradas: 145000, salidas: -130000 },
    { fecha: '2024-02-12', saldo: 115000, entradas: 90000, salidas: -103000 },
    { fecha: '2024-02-19', saldo: 102000, entradas: 75000, salidas: -88000 }
  ];

  // Cálculos principales
  const saldoTotal = cuentas.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
  const saldoDisponible = cuentas.filter(c => c.saldo > 0).reduce((sum, cuenta) => sum + cuenta.saldo, 0);
  const deudaCortoPlayoDispuesta = Math.abs(cuentas.filter(c => c.saldo < 0).reduce((sum, cuenta) => sum + cuenta.saldo, 0));
  const tesoreriaNeta = saldoTotal; // Simplificado, en realidad sería disponible - deuda CP dispuesta
  const limitesDisponibles = cuentas.reduce((sum, cuenta) => sum + (cuenta.limiteSobregiro || 0) - (cuenta.saldoSobregiro || 0), 0);
  
  // Análisis de días de cobertura (simplificado)
  const gastoOperativoDiario = 8500; // Estimado
  const diasCobertura = Math.max(0, saldoDisponible / gastoOperativoDiario);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'corriente': return Building2;
      case 'ahorro': return PiggyBank;
      case 'plazo': return CreditCard;
      default: return Building2;
    }
  };

  const getSaldoColor = (saldo: number) => {
    if (saldo > 50000) return 'text-green-400';
    if (saldo > 0) return 'text-blue-400';
    return 'text-red-400';
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
                <h1 className="text-2xl font-bold text-white mb-2">Situación de Tesorería</h1>
                <p className="text-gray-400">Consolidación y análisis de la posición de liquidez inmediata</p>
              </div>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Cuenta
              </Button>
            </div>
          </section>

          {/* KPI Cards */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <PiggyBank className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white">Saldo Total</h3>
                </div>
                <div className="space-y-2">
                  <p className={`text-2xl font-bold ${getSaldoColor(saldoTotal)}`}>{formatCurrency(saldoTotal)}</p>
                  <p className="text-sm text-gray-300">{cuentas.length} cuentas</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Tesorería Neta</h3>
                </div>
                <div className="space-y-2">
                  <p className={`text-2xl font-bold ${getSaldoColor(tesoreriaNeta)}`}>{formatCurrency(tesoreriaNeta)}</p>
                  <p className="text-sm text-gray-300">disponible - deuda CP</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/30 to-red-500/30 backdrop-blur-sm border border-orange-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <AlertCircle className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-white">Días de Cobertura</h3>
                </div>
                <div className="space-y-2">
                  <p className={`text-2xl font-bold ${diasCobertura > 30 ? 'text-green-400' : diasCobertura > 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {diasCobertura.toFixed(0)}
                  </p>
                  <p className="text-sm text-gray-300">días operativos</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <CreditCard className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">Límites Disponibles</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatCurrency(limitesDisponibles)}</p>
                  <p className="text-sm text-gray-300">crédito disponible</p>
                </div>
              </Card>
            </div>
          </section>

          {/* Detalle por cuenta */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Detalle por Cuenta</h2>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300">Entidad</TableHead>
                      <TableHead className="text-gray-300">Tipo de Cuenta</TableHead>
                      <TableHead className="text-gray-300">Número</TableHead>
                      <TableHead className="text-gray-300 text-right">Saldo</TableHead>
                      <TableHead className="text-gray-300 text-right">Límite Sobregiro</TableHead>
                      <TableHead className="text-gray-300 text-right">Disponible Total</TableHead>
                      <TableHead className="text-gray-300 text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuentas.map((cuenta) => {
                      const Icon = getTipoIcon(cuenta.tipo);
                      const disponibleTotal = cuenta.saldo + (cuenta.limiteSobregiro || 0) - (cuenta.saldoSobregiro || 0);
                      
                      return (
                        <TableRow key={cuenta.id}>
                          <TableCell className="text-white font-medium">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-gray-400" />
                              {cuenta.entidad}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{cuenta.tipoCuenta}</TableCell>
                          <TableCell className="text-gray-300">{cuenta.numeroCuenta}</TableCell>
                          <TableCell className={`text-right font-medium ${getSaldoColor(cuenta.saldo)}`}>
                            {formatCurrency(cuenta.saldo)}
                          </TableCell>
                          <TableCell className="text-right text-gray-300">
                            {cuenta.limiteSobregiro ? formatCurrency(cuenta.limiteSobregiro) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-white font-medium">
                            {formatCurrency(disponibleTotal)}
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </section>

          {/* Evolución de tesorería */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Evolución de Tesorería</h2>
                <div className="flex gap-2">
                  {['semanal', 'mensual', 'trimestral'].map((period) => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                      className="capitalize"
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucionTesoreria}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="fecha" 
                      stroke="#9ca3af"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
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
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === 'saldo' ? 'Saldo' : name === 'entradas' ? 'Entradas' : 'Salidas'
                      ]}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                      name="Saldo"
                    />
                    
                    {/* Línea de referencia para el nivel crítico */}
                    <ReferenceLine y={50000} stroke="#f59e0b" strokeDasharray="5 5" label="Nivel Crítico" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </section>

          {/* Composición de tesorería */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Composición por Entidad</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cuentas.filter(c => c.saldo > 0)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="entidad" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value) => [formatCurrency(Number(value)), 'Saldo']}
                      />
                      <Bar dataKey="saldo" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Utilización de Líneas de Crédito</h3>
                <div className="space-y-4">
                  {cuentas.filter(c => c.limiteSobregiro).map((cuenta) => {
                    const utilizacion = ((cuenta.saldoSobregiro || 0) / cuenta.limiteSobregiro!) * 100;
                    
                    return (
                      <div key={cuenta.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white text-sm">{cuenta.entidad}</span>
                          <span className="text-gray-300 text-sm">{utilizacion.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${utilizacion > 80 ? 'bg-red-500' : utilizacion > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(utilizacion, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Utilizado: {formatCurrency(cuenta.saldoSobregiro || 0)}</span>
                          <span>Límite: {formatCurrency(cuenta.limiteSobregiro!)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
