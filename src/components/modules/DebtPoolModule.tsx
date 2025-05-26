
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Building2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Timeline
} from 'recharts';
import { useState } from 'react';

interface DebtItem {
  id: string;
  entidad: string;
  tipo: string;
  capitalInicial: number;
  capitalPendiente: number;
  tipoInteres: number;
  plazoRestante: number;
  cuota: number;
  proximoVencimiento: string;
  ultimoVencimiento: string;
  frecuencia: string;
  garantias?: string;
}

export const DebtPoolModule = () => {
  const [debtItems, setDebtItems] = useState<DebtItem[]>([
    {
      id: '1',
      entidad: 'Banco Santander',
      tipo: 'Préstamo ICO',
      capitalInicial: 500000,
      capitalPendiente: 320000,
      tipoInteres: 3.5,
      plazoRestante: 36,
      cuota: 9500,
      proximoVencimiento: '2024-02-15',
      ultimoVencimiento: '2027-02-15',
      frecuencia: 'Mensual',
      garantias: 'Hipoteca sobre inmueble'
    },
    {
      id: '2',
      entidad: 'BBVA',
      tipo: 'Línea de Crédito',
      capitalInicial: 200000,
      capitalPendiente: 150000,
      tipoInteres: 4.2,
      plazoRestante: 12,
      cuota: 0,
      proximoVencimiento: '2024-12-31',
      ultimoVencimiento: '2024-12-31',
      frecuencia: 'A vencimiento',
      garantias: 'Aval personal'
    },
    {
      id: '3',
      entidad: 'CaixaBank',
      tipo: 'Leasing',
      capitalInicial: 180000,
      capitalPendiente: 95000,
      tipoInteres: 3.8,
      plazoRestante: 24,
      cuota: 4200,
      proximoVencimiento: '2024-02-01',
      ultimoVencimiento: '2026-02-01',
      frecuencia: 'Mensual',
      garantias: 'Bien objeto de leasing'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  // Cálculos del pool bancario
  const totalCapitalPendiente = debtItems.reduce((sum, item) => sum + item.capitalPendiente, 0);
  const totalCuotasMensuales = debtItems.reduce((sum, item) => 
    sum + (item.frecuencia === 'Mensual' ? item.cuota : 0), 0);
  const tipoInteresPromedio = debtItems.reduce((sum, item, _, arr) => 
    sum + (item.tipoInteres * item.capitalPendiente) / totalCapitalPendiente, 0);

  // Datos para gráficos
  const debtByEntity = debtItems.map(item => ({
    name: item.entidad,
    value: item.capitalPendiente,
    color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][debtItems.indexOf(item) % 5]
  }));

  const debtByType = debtItems.reduce((acc: any[], item) => {
    const existing = acc.find(d => d.name === item.tipo);
    if (existing) {
      existing.value += item.capitalPendiente;
    } else {
      acc.push({
        name: item.tipo,
        value: item.capitalPendiente,
        color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][acc.length % 5]
      });
    }
    return acc;
  }, []);

  // Timeline de vencimientos
  const vencimientos = debtItems
    .filter(item => item.cuota > 0)
    .map(item => ({
      entidad: item.entidad,
      fecha: item.proximoVencimiento,
      cuota: item.cuota,
      tipo: item.tipo,
      urgencia: getDaysUntil(item.proximoVencimiento)
    }))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  function getDaysUntil(dateStr: string): 'alta' | 'media' | 'baja' {
    const days = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7) return 'alta';
    if (days <= 30) return 'media';
    return 'baja';
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return 'text-red-400 bg-red-500/20';
      case 'media': return 'text-yellow-400 bg-yellow-500/20';
      case 'baja': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
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
                <h1 className="text-2xl font-bold text-white mb-2">Pool Bancario y Detalle del Endeudamiento</h1>
                <p className="text-gray-400">Gestión y análisis detallado de todas las deudas financieras</p>
              </div>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Deuda
              </Button>
            </div>
          </section>

          {/* Resumen KPIs */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-red-500/30 to-pink-500/30 backdrop-blur-sm border border-red-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <CreditCard className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="font-semibold text-white">Capital Pendiente Total</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalCapitalPendiente)}</p>
                  <p className="text-sm text-gray-300">{debtItems.length} instrumentos</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Tipo Interés Promedio</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{tipoInteresPromedio.toFixed(2)}%</p>
                  <p className="text-sm text-gray-300">ponderado por capital</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/30 to-yellow-500/30 backdrop-blur-sm border border-orange-400/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                    <Calendar className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-white">Cuotas Mensuales</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalCuotasMensuales)}</p>
                  <p className="text-sm text-gray-300">compromisos regulares</p>
                </div>
              </Card>
            </div>
          </section>

          {/* Tabla detallada de deudas */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Detalle del Pool Bancario</h2>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300">Entidad</TableHead>
                      <TableHead className="text-gray-300">Tipo</TableHead>
                      <TableHead className="text-gray-300 text-right">Capital Pendiente</TableHead>
                      <TableHead className="text-gray-300 text-center">Tipo Interés</TableHead>
                      <TableHead className="text-gray-300 text-center">Plazo Restante</TableHead>
                      <TableHead className="text-gray-300 text-right">Cuota</TableHead>
                      <TableHead className="text-gray-300">Próximo Vencimiento</TableHead>
                      <TableHead className="text-gray-300 text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debtItems.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell className="text-white font-medium">{debt.entidad}</TableCell>
                        <TableCell className="text-gray-300">{debt.tipo}</TableCell>
                        <TableCell className="text-right text-white">{formatCurrency(debt.capitalPendiente)}</TableCell>
                        <TableCell className="text-center text-gray-300">{debt.tipoInteres}%</TableCell>
                        <TableCell className="text-center text-gray-300">{debt.plazoRestante} meses</TableCell>
                        <TableCell className="text-right text-gray-300">
                          {debt.cuota > 0 ? formatCurrency(debt.cuota) : 'A vencimiento'}
                        </TableCell>
                        <TableCell className="text-gray-300">{debt.proximoVencimiento}</TableCell>
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

          {/* Gráficos de composición */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Composición por Entidad</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={debtByEntity}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {debtByEntity.map((entry, index) => (
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

              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Composición por Tipo</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={debtByType}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value) => [formatCurrency(Number(value)), '']}
                      />
                      <Bar dataKey="value" fill="#3b82f6">
                        {debtByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </section>

          {/* Timeline de vencimientos */}
          <section className="relative z-10">
            <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Calendario de Vencimientos</h2>
              
              <div className="space-y-4">
                {vencimientos.map((venc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getUrgencyColor(venc.urgencia)}`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{venc.entidad}</p>
                        <p className="text-gray-400 text-sm">{venc.tipo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(venc.cuota)}</p>
                      <p className="text-gray-400 text-sm">{venc.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};
