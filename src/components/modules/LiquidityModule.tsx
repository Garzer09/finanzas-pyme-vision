import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { CheckCircle, AlertTriangle, XCircle, Droplets, TrendingDown, Calendar, Shield } from 'lucide-react';

export const LiquidityModule = () => {
  const kpiData = [
    {
      title: 'Ratio de Liquidez',
      value: '1.35',
      subtitle: 'Capacidad de pago',
      trend: 'up' as const,
      trendValue: '+0.15',
      icon: Droplets,
      variant: 'success' as const
    },
    {
      title: 'Test Ácido',
      value: '0.92',
      subtitle: 'Liquidez inmediata',
      trend: 'down' as const,
      trendValue: '-0.08',
      icon: TrendingDown,
      variant: 'warning' as const
    },
    {
      title: 'Días de Tesorería',
      value: '15 días',
      subtitle: 'Operación normal',
      trend: 'neutral' as const,
      trendValue: '0 días',
      icon: Calendar,
      variant: 'default' as const
    },
    {
      title: 'Ciclo de Caja',
      value: '82 días',
      subtitle: 'Conversión efectivo',
      trend: 'up' as const,
      trendValue: '+12 días',
      icon: Shield,
      variant: 'danger' as const
    }
  ];

  const treasuryData = [
    { dia: 'Hoy', saldoInicial: 125, cobros: 45, pagos: -65, saldoFinal: 105 },
    { dia: '+7d', saldoInicial: 105, cobros: 85, pagos: -75, saldoFinal: 115 },
    { dia: '+14d', saldoInicial: 115, cobros: 35, pagos: -95, saldoFinal: 55 },
    { dia: '+21d', saldoInicial: 55, cobros: 125, pagos: -85, saldoFinal: 95 },
    { dia: '+30d', saldoInicial: 95, cobros: 75, pagos: -105, saldoFinal: 65 },
  ];

  const nofData = [
    { concepto: 'Existencias', valor: 180000 },
    { concepto: 'Clientes', valor: 420000 },
    { concepto: 'Proveedores', valor: -280000 },
    { concepto: 'NOF Total', valor: 320000 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Data for cash flow by month
  const cashFlowData = [
    { month: 'Ene', generacion: 45, consumo: -35 },
    { month: 'Feb', generacion: 52, consumo: -42 },
    { month: 'Mar', generacion: 48, consumo: -38 },
    { month: 'Abr', generacion: 38, consumo: -45 },
    { month: 'May', generacion: 55, consumo: -40 },
    { month: 'Jun', generacion: 42, consumo: -48 },
    { month: 'Jul', generacion: 50, consumo: -38 },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-8 overflow-auto">
          {/* Header Section */}
          <section className="relative">
            <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel/5 via-cadet/3 to-slate-100/5 rounded-3xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-steel/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-cadet/8 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-steel-800 bg-clip-text text-transparent">
                  Análisis de Liquidez
                </h1>
                <p className="text-slate-700 text-lg font-medium">Gestión de tesorería y necesidades operativas de financiación</p>
              </div>
            </div>
          </section>

          {/* KPIs Grid */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiData.map((kpi, index) => (
                <ModernKPICard key={index} {...kpi} />
              ))}
            </div>
          </section>

          <h2 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Indicadores de Liquidez</h2>
          <div className="flex flex-wrap gap-4 p-4">
            <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-blue bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">Ratio de Liquidez</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">1.35</p>
              <p className="text-[#078838] text-base font-medium leading-normal">+0.15</p>
            </div>
            <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-green bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">Test Ácido</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">0.92</p>
              <p className="text-[#e73508] text-base font-medium leading-normal">-0.08</p>
            </div>
            <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-yellow bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">Días de Tesorería</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">15 días</p>
              <p className="text-[#637988] text-base font-medium leading-normal">Operación</p>
            </div>
            <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5] bg-pastel-pink bg-opacity-10">
              <p className="text-[#111518] text-base font-medium leading-normal">Ciclo de Caja</p>
              <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">82 días</p>
              <p className="text-[#e73508] text-base font-medium leading-normal">+12 días</p>
            </div>
          </div>

          <h2 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Previsión de Tesorería</h2>
          <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6 mx-4">
            <p className="text-[#111518] text-base font-medium leading-normal">Evolución de Saldo de Tesorería (30 días)</p>
            <p className="text-[#111518] tracking-light text-[32px] font-bold leading-tight truncate">€105K</p>
            <div className="flex gap-1">
              <p className="text-[#637988] text-base font-normal leading-normal">Previsión a 30 días</p>
              <p className="text-[#e73508] text-base font-medium leading-normal">-40%</p>
            </div>
            <div className="flex min-h-[280px] flex-1 flex-col gap-8 py-4">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={treasuryData}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A5D7E8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#A5D7E8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dia" stroke="#637988" />
                  <YAxis stroke="#637988" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [formatCurrency(Number(value) * 1000), '']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="saldoFinal" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    name="Saldo Final"
                    dot={{ r: 6 }}
                    activeDot={{ r: 8 }}
                    fill="url(#colorSaldo)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cobros" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Cobros"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pagos" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Pagos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <h2 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Necesidades Operativas de Financiación</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4">
            <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6">
              <p className="text-[#111518] text-base font-medium leading-normal">Composición NOF</p>
              <p className="text-[#111518] tracking-light text-[32px] font-bold leading-tight truncate">{formatCurrency(320000)}</p>
              <div className="space-y-4 mt-4">
                {nofData.map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center py-3 px-4 rounded-lg ${
                      item.concepto === 'NOF Total'
                        ? 'bg-pastel-blue bg-opacity-20 border border-pastel-blue'
                        : 'bg-gray-50'
                    }`}
                  >
                    <span className={`font-medium ${
                      item.concepto === 'NOF Total' ? 'text-blue-800' : 'text-slate-700'
                    }`}>
                      {item.concepto}
                    </span>
                    <span className={`font-bold ${
                      item.valor >= 0 ? 'text-green-600' : 'text-red-600'
                    } ${item.concepto === 'NOF Total' ? 'text-lg' : ''}`}>
                      {formatCurrency(item.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6">
              <p className="text-[#111518] text-base font-medium leading-normal">Generación vs Consumo de Caja</p>
              <p className="text-[#111518] tracking-light text-[32px] font-bold leading-tight truncate">€125K</p>
              <p className="text-[#637988] text-base font-normal leading-normal">Saldo Actual</p>
              <div className="min-h-[220px] mt-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#637988" />
                    <YAxis stroke="#637988" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="generacion" fill="#B5D5C5" name="Generación" />
                    <Bar dataKey="consumo" fill="#F8CBA6" name="Consumo" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <h2 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Ciclo de Caja</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 mb-6">
            <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6">
              <p className="text-[#111518] text-base font-medium leading-normal">Composición del Ciclo</p>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div className="bg-pastel-yellow bg-opacity-20 p-4 rounded-lg">
                  <p className="text-sm text-yellow-700 mb-1 font-medium">Período Medio de Maduración (PMM)</p>
                  <div className="flex justify-between">
                    <p className="text-xl font-bold text-yellow-800">82 días</p>
                    <p className="text-sm text-yellow-700">Ciclo operativo total</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-pastel-yellow bg-opacity-10 p-3 rounded-lg text-center">
                    <p className="text-sm text-yellow-700 mb-1">Período Medio de Existencias</p>
                    <p className="text-xl font-bold text-yellow-600">61 días</p>
                  </div>
                  <div className="bg-pastel-green bg-opacity-10 p-3 rounded-lg text-center">
                    <p className="text-sm text-green-700 mb-1">Período Medio Cobro</p>
                    <p className="text-xl font-bold text-green-600">62 días</p>
                  </div>
                  <div className="bg-pastel-blue bg-opacity-10 p-3 rounded-lg text-center">
                    <p className="text-sm text-blue-700 mb-1">Período Medio Pago</p>
                    <p className="text-xl font-bold text-blue-600">41 días</p>
                  </div>
                  <div className="bg-pastel-pink bg-opacity-10 p-3 rounded-lg text-center">
                    <p className="text-sm text-pink-700 mb-1">Ciclo de Caja</p>
                    <p className="text-xl font-bold text-pink-600">82 días</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6">
              <p className="text-[#111518] text-base font-medium leading-normal">Alertas de Liquidez</p>
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800 mb-2">Tensión Crítica</h4>
                      <p className="text-sm text-red-600 mb-2">Día +14: Saldo previsto €55K</p>
                      <p className="text-xs text-red-500">Acción: Acelerar cobros pendientes</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">Ciclo de Caja</h4>
                      <p className="text-sm text-yellow-600 mb-2">82 días de conversión</p>
                      <p className="text-xs text-yellow-500">Superior a media sectorial (65d)</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-2">Recomendación</h4>
                      <p className="text-sm text-blue-600 mb-2">Línea de crédito preventiva</p>
                      <p className="text-xs text-blue-500">€200K para situaciones críticas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
