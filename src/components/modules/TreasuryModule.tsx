
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Plus,
  Edit,
  Trash2,
  Building2,
  DollarSign
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
  Cell
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

  // Evolución histórica simulada
  const evolucionTesoreria = [
    { fecha: '2024-01-01', saldo: 95000 },
    { fecha: '2024-01-02', saldo: 88000 },
    { fecha: '2024-01-03', saldo: 92000 },
    { fecha: '2024-01-04', saldo: 87000 },
    { fecha: '2024-01-05', saldo: 84000 },
    { fecha: '2024-01-08', saldo: 89000 },
    { fecha: '2024-01-09', saldo: 91000 },
    { fecha: '2024-01-10', saldo: 86000 },
    { fecha: '2024-01-11', saldo: 93000 },
    { fecha: '2024-01-12', saldo: 97000 },
    { fecha: '2024-01-15', saldo: 104500 }
  ];

  // Cálculos
  const saldoTesoreriaTotal = cuentas.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
  const saldoPositivo = cuentas.filter(c => c.saldo > 0).reduce((sum, cuenta) => sum + cuenta.saldo, 0);
  const deudaCortoPlazo = Math.abs(cuentas.filter(c => c.saldo < 0).reduce((sum, cuenta) => sum + cuenta.saldo, 0));
  const tesoreriaNeta = saldoPositivo - deudaCortoPlazo;
  const lineasCreditoDisponibles = cuentas
    .filter(c => c.limite && c.dispuesto !== undefined)
    .reduce((sum, c) => sum + (c.limite! - c.dispuesto!), 0);

  // Datos para gráficos
  const composicionCuentas = cuentas
    .filter(c => c.saldo > 0)
    .map((cuenta, index) => ({
      name: cuenta.entidad,
      value: cuenta.saldo,
      color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]
    }));

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
                <h1 className="text-2xl font-bold text-white mb-2">Situación de Tesorería</h1>
                <p className="text-gray-400">Consolidación y seguimiento de la posición de liquidez inmediata</p>
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

          {/* KPIs principales */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Wallet className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white">Saldo Total</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatCurrency(saldoTesoreriaTotal)}</p>
                  <p className="text-sm text-gray-300">todas las cuentas</p>
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
                  <p className={`text-2xl font-bold ${tesoreriaNeta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(tesoreriaNeta)}
                  </p>
                  <p className="text-sm text-gray-300">disponible - dispuesto</p>
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
                    <Building2 className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">Cuentas Activas</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{cuentas.length}</p>
                  <p className="text-sm text-gray-300">entidades bancarias</p>
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
                      <TableHead className="text-gray-300 text-center">Límite</TableHead>
                      <TableHead className="text-gray-300">Última Actualización</TableHead>
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
                              <p>{formatCurrency(cuenta.limite)}</p>
                              <p className="text-xs text-gray-500">
                                Dispuesto: {formatCurrency(cuenta.dispuesto || 0)}
                              </p>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-gray-300">{formatDate(cuenta.fechaActualizacion)}</TableCell>
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

          {/* Gráficos */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Evolución temporal */}
              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Evolución de Tesorería</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolucionTesoreria}>
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
                        formatter={(value) => [formatCurrency(Number(value)), 'Saldo']}
                        labelFormatter={(value) => formatDate(value)}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="saldo" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Composición por entidad */}
              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Composición por Entidad</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={composicionCuentas}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {composicionCuentas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value) => [formatCurrency(Number(value)), '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
