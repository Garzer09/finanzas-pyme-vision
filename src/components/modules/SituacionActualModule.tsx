import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Calendar, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Info,
  Building2,
  Target,
  Gauge,
  PiggyBank,
  CreditCard,
  Banknote,
  Calculator,
  Calendar as CalendarIcon
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
  Cell,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { useState } from 'react';

export const SituacionActualModule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('anual');
  const [expandedSections, setExpandedSections] = useState({
    pyg: true,
    analytical: false,
    balance: false,
    cashflow: false,
    ratios: false,
    breakeven: false,
    debt: false,
    debtService: false,
    treasury: false,
    nof: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const metricas = [
    {
      title: 'Ingresos Totales',
      value: '€2.5M',
      change: '+12%',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-500/30 to-teal-500/30',
      borderColor: 'border-emerald-400/50'
    },
    {
      title: 'EBITDA',
      value: '€450K',
      change: '-5%',
      icon: TrendingUp,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/30 to-cyan-500/30',
      borderColor: 'border-blue-400/50'
    },
    {
      title: 'Margen EBITDA',
      value: '18%',
      change: '-2.5pp',
      icon: Percent,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/30 to-red-500/30',
      borderColor: 'border-orange-400/50'
    },
    {
      title: 'Ratio Deuda/EBITDA',
      value: '2.1x',
      change: '+0.3x',
      icon: BarChart3,
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/30 to-pink-500/30',
      borderColor: 'border-purple-400/50'
    }
  ];

  // P&G Data
  const pygData = [
    { concepto: 'Ventas Netas', valor: 2500000, porcentaje: 100 },
    { concepto: 'Coste de Ventas', valor: -1750000, porcentaje: 70 },
    { concepto: 'Margen Bruto', valor: 750000, porcentaje: 30 },
    { concepto: 'Gastos de Explotación', valor: -300000, porcentaje: 12 },
    { concepto: 'EBITDA', valor: 450000, porcentaje: 18 },
    { concepto: 'Amortizaciones', valor: -100000, porcentaje: 4 },
    { concepto: 'EBIT', valor: 350000, porcentaje: 14 },
    { concepto: 'Gastos Financieros', valor: -50000, porcentaje: 2 },
    { concepto: 'Resultado antes Impuestos', valor: 300000, porcentaje: 12 },
    { concepto: 'Impuestos', valor: -75000, porcentaje: 3 },
    { concepto: 'Resultado Neto', valor: 225000, porcentaje: 9 }
  ];

  // Waterfall Chart Data - Fixed with proper color assignment
  const waterfallData = [
    { name: 'Ventas', value: 2500000, fill: '#10b981' },
    { name: 'Coste Ventas', value: -1750000, fill: '#ef4444' },
    { name: 'Gastos Operativos', value: -300000, fill: '#ef4444' },
    { name: 'Amortizaciones', value: -100000, fill: '#ef4444' },
    { name: 'Gastos Financieros', value: -50000, fill: '#ef4444' },
    { name: 'Impuestos', value: -75000, fill: '#ef4444' },
    { name: 'Resultado Neto', value: 225000, fill: '#3b82f6' }
  ];

  // Expense Composition
  const expenseData = [
    { name: 'Coste de Ventas', value: 1750000, color: '#ef4444' },
    { name: 'Gastos Operativos', value: 300000, color: '#f97316' },
    { name: 'Amortizaciones', value: 100000, color: '#eab308' },
    { name: 'Gastos Financieros', value: 50000, color: '#3b82f6' }
  ];

  // Balance Sheet Data
  const balanceData = {
    activo: [
      { concepto: 'Inmovilizado Material', valor: 1200000, tipo: 'no_corriente' },
      { concepto: 'Inmovilizado Intangible', valor: 200000, tipo: 'no_corriente' },
      { concepto: 'Existencias', valor: 350000, tipo: 'corriente' },
      { concepto: 'Clientes', valor: 420000, tipo: 'corriente' },
      { concepto: 'Tesorería', valor: 125000, tipo: 'corriente' }
    ],
    pasivo: [
      { concepto: 'Capital Social', valor: 500000, tipo: 'patrimonio' },
      { concepto: 'Reservas', valor: 300000, tipo: 'patrimonio' },
      { concepto: 'Resultado del Ejercicio', valor: 225000, tipo: 'patrimonio' },
      { concepto: 'Deuda a Largo Plazo', valor: 800000, tipo: 'no_corriente' },
      { concepto: 'Proveedores', valor: 280000, tipo: 'corriente' },
      { concepto: 'Deuda a Corto Plazo', valor: 190000, tipo: 'corriente' }
    ]
  };

  // Cash Flow Data
  const cashFlowData = [
    { month: 'Ene', operativo: 45000, inversion: -15000, financiacion: -10000, neto: 20000 },
    { month: 'Feb', operativo: 52000, inversion: -8000, financiacion: -12000, neto: 32000 },
    { month: 'Mar', operativo: 48000, inversion: -25000, financiacion: 50000, neto: 73000 },
    { month: 'Abr', operativo: 38000, inversion: -5000, financiacion: -15000, neto: 18000 },
    { month: 'May', operativo: 55000, inversion: -12000, financiacion: -8000, neto: 35000 }
  ];

  // Financial Ratios
  const ratios = [
    { 
      categoria: 'Liquidez',
      ratios: [
        { nombre: 'Ratio Corriente', valor: 1.95, umbral: 1.5, formula: 'Activo Corriente / Pasivo Corriente', estado: 'bueno' },
        { nombre: 'Test Ácido', valor: 1.23, umbral: 1.0, formula: '(AC - Existencias) / PC', estado: 'bueno' },
        { nombre: 'Ratio Tesorería', valor: 0.27, umbral: 0.2, formula: 'Disponible / PC', estado: 'bueno' }
      ]
    },
    {
      categoria: 'Rentabilidad',
      ratios: [
        { nombre: 'ROE', valor: 22.0, umbral: 15.0, formula: 'Resultado Neto / Patrimonio Neto', estado: 'bueno' },
        { nombre: 'ROA', valor: 9.6, umbral: 8.0, formula: 'Resultado Neto / Activo Total', estado: 'bueno' },
        { nombre: 'Margen Neto', valor: 9.0, umbral: 5.0, formula: 'Resultado Neto / Ventas', estado: 'bueno' }
      ]
    },
    {
      categoria: 'Endeudamiento',
      ratios: [
        { nombre: 'Ratio Endeudamiento', valor: 56.2, umbral: 60.0, formula: 'Pasivo Total / Activo Total', estado: 'bueno' },
        { nombre: 'Ratio Autonomía', valor: 43.8, umbral: 40.0, formula: 'Patrimonio Neto / Activo Total', estado: 'bueno' },
        { nombre: 'Deuda/EBITDA', valor: 2.2, umbral: 3.0, formula: 'Deuda Financiera / EBITDA', estado: 'bueno' }
      ]
    }
  ];

  // Debt Pool Data
  const debtPool = [
    {
      entidad: 'Banco Santander',
      tipo: 'Préstamo ICO',
      capitalInicial: 500000,
      capitalPendiente: 320000,
      tipoInteres: 3.5,
      plazoRestante: 36,
      cuota: 9500,
      proximoVencimiento: '2024-02-15',
      frecuencia: 'Mensual'
    },
    {
      entidad: 'BBVA',
      tipo: 'Línea de Crédito',
      capitalInicial: 200000,
      capitalPendiente: 150000,
      tipoInteres: 4.2,
      plazoRestante: 12,
      cuota: 0,
      proximoVencimiento: '2024-12-31',
      frecuencia: 'A vencimiento'
    },
    {
      entidad: 'CaixaBank',
      tipo: 'Leasing',
      capitalInicial: 180000,
      capitalPendiente: 95000,
      tipoInteres: 3.8,
      plazoRestante: 24,
      cuota: 4200,
      proximoVencimiento: '2024-02-01',
      frecuencia: 'Mensual'
    }
  ];

  // Treasury Data
  const treasuryAccounts = [
    { entidad: 'Santander - Cuenta Corriente', saldo: 85000, tipo: 'corriente' },
    { entidad: 'BBVA - Cuenta Operativa', saldo: 25000, tipo: 'corriente' },
    { entidad: 'CaixaBank - Cuenta Ahorro', saldo: 15000, tipo: 'ahorro' }
  ];

  // NOF Data
  const nofData = {
    existencias: 350000,
    clientes: 420000,
    proveedores: 280000,
    nofTotal: 490000,
    pmc: 61.3, // días
    pmp: 58.4, // días
    pme: 73.0, // días
    pmm: 76.0  // días
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'bueno': return 'text-green-400';
      case 'regular': return 'text-yellow-400';
      case 'malo': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSectionIcon = (section: string) => {
    const iconMap = {
      pyg: BarChart3,
      analytical: Calculator,
      balance: Building2,
      cashflow: TrendingUp,
      ratios: Gauge,
      breakeven: Target,
      debt: CreditCard,
      debtService: Banknote,
      treasury: PiggyBank,
      nof: Calendar
    };
    const Icon = iconMap[section as keyof typeof iconMap] || AlertCircle;
    return <Icon className="h-5 w-5" />;
  };

  const getSectionTitle = (section: string) => {
    const titleMap = {
      pyg: 'Cuenta de Pérdidas y Ganancias',
      analytical: 'P&G Analítico',
      balance: 'Balance de Situación',
      cashflow: 'Estado de Flujos de Caja',
      ratios: 'Ratios Financieros',
      breakeven: 'Análisis Punto Muerto',
      debt: 'Pool Bancario',
      debtService: 'Servicio de Deuda',
      treasury: 'Situación de Tesorería',
      nof: 'Análisis NOF'
    };
    return titleMap[section as keyof typeof titleMap] || 'Sección';
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
              <h1 className="text-2xl font-bold text-white mb-2">Análisis de Situación Financiera Actual</h1>
              <p className="text-gray-400">Estado financiero y operativo del año base (Año 0)</p>
              
              {/* Period Selector */}
              <div className="mt-4 flex gap-2">
                {['mensual', 'trimestral', 'anual'].map((period) => (
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
          </section>

          {/* KPI Cards */}
          <section className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metricas.map((metrica, index) => {
                const Icon = metrica.icon;
                
                return (
                  <Card 
                    key={index} 
                    className={`bg-gradient-to-br ${metrica.bgGradient} backdrop-blur-sm border ${metrica.borderColor} hover:scale-105 transition-all duration-300 p-6`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                        <Icon className={`h-5 w-5 ${metrica.color}`} />
                      </div>
                      <h3 className="font-semibold text-white">{metrica.title}</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-white">{metrica.value}</p>
                      <p className="text-sm text-gray-300">{metrica.change}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Financial Sections */}
          {Object.entries(expandedSections).map(([section, isExpanded]) => (
            <section key={section} className="relative z-10">
              <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30">
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors"
                  onClick={() => toggleSection(section)}
                >
                  <div className="flex items-center gap-3">
                    {getSectionIcon(section)}
                    <h2 className="text-xl font-semibold text-white">{getSectionTitle(section)}</h2>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-teal-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-teal-400" />
                  )}
                </div>
                
                {isExpanded && (
                  <div className="p-6 pt-0 space-y-6">
                    {section === 'pyg' && (
                      <>
                        {/* P&G Table */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="bg-black/20 border-gray-600">
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-white mb-4">Estado de Resultados</h3>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-gray-300">Concepto</TableHead>
                                      <TableHead className="text-gray-300 text-right">Valor</TableHead>
                                      <TableHead className="text-gray-300 text-right">% s/Ventas</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {pygData.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell className="text-white font-medium">{item.concepto}</TableCell>
                                        <TableCell className={`text-right ${item.valor >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                          {formatCurrency(item.valor)}
                                        </TableCell>
                                        <TableCell className="text-gray-300 text-right">{item.porcentaje}%</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </Card>

                          {/* Waterfall Chart - Fixed */}
                          <Card className="bg-black/20 border-gray-600">
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-white mb-4">Análisis Waterfall</h3>
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={waterfallData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="name" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
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
                                      {waterfallData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </Card>
                        </div>

                        {/* Expense Composition */}
                        <Card className="bg-black/20 border-gray-600">
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Composición de Gastos</h3>
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={expenseData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {expenseData.map((entry, index) => (
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
                          </div>
                        </Card>
                      </>
                    )}

                    {section === 'cashflow' && (
                      <Card className="bg-black/20 border-gray-600">
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-white mb-4">Evolución de Flujos de Caja</h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={cashFlowData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#1f2937', 
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: '#fff'
                                  }}
                                />
                                <Bar dataKey="operativo" fill="#10b981" name="Operativo" />
                                <Bar dataKey="inversion" fill="#ef4444" name="Inversión" />
                                <Bar dataKey="financiacion" fill="#3b82f6" name="Financiación" />
                                <Line 
                                  type="monotone" 
                                  dataKey="neto" 
                                  stroke="#f59e0b" 
                                  strokeWidth={3}
                                  name="Flujo Neto"
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </Card>
                    )}

                    {section === 'ratios' && (
                      <div className="space-y-6">
                        {ratios.map((categoria, catIndex) => (
                          <Card key={catIndex} className="bg-black/20 border-gray-600">
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-white mb-4">{categoria.categoria}</h3>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-gray-300">Ratio</TableHead>
                                      <TableHead className="text-gray-300 text-center">Valor</TableHead>
                                      <TableHead className="text-gray-300 text-center">Umbral</TableHead>
                                      <TableHead className="text-gray-300 text-center">Estado</TableHead>
                                      <TableHead className="text-gray-300">Fórmula</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {categoria.ratios.map((ratio, index) => (
                                      <TableRow key={index}>
                                        <TableCell className="text-white font-medium">{ratio.nombre}</TableCell>
                                        <TableCell className="text-center text-white">{ratio.valor}%</TableCell>
                                        <TableCell className="text-center text-gray-300">{ratio.umbral}%</TableCell>
                                        <TableCell className="text-center">
                                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(ratio.estado)}`}>
                                            {ratio.estado === 'bueno' ? '✓' : ratio.estado === 'regular' ? '⚠' : '✗'}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-gray-400 text-sm">{ratio.formula}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {section === 'debt' && (
                      <div className="space-y-6">
                        <Card className="bg-black/20 border-gray-600">
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Detalle del Pool Bancario</h3>
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
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {debtPool.map((debt, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="text-white font-medium">{debt.entidad}</TableCell>
                                      <TableCell className="text-gray-300">{debt.tipo}</TableCell>
                                      <TableCell className="text-right text-white">{formatCurrency(debt.capitalPendiente)}</TableCell>
                                      <TableCell className="text-center text-gray-300">{debt.tipoInteres}%</TableCell>
                                      <TableCell className="text-center text-gray-300">{debt.plazoRestante} meses</TableCell>
                                      <TableCell className="text-right text-gray-300">
                                        {debt.cuota > 0 ? formatCurrency(debt.cuota) : 'A vencimiento'}
                                      </TableCell>
                                      <TableCell className="text-gray-300">{debt.proximoVencimiento}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </Card>

                        {/* Debt Composition Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="bg-black/20 border-gray-600">
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-white mb-4">Composición por Entidad</h3>
                              <div className="h-60">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={debtPool.map(debt => ({ name: debt.entidad, value: debt.capitalPendiente }))}
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {debtPool.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b'][index % 3]} />
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
                            </div>
                          </Card>

                          <Card className="bg-black/20 border-gray-600">
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-white mb-4">Composición por Tipo</h3>
                              <div className="h-60">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={debtPool.map(debt => ({ name: debt.tipo, value: debt.capitalPendiente }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="name" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip 
                                      contentStyle={{ 
                                        backgroundColor: '#1f2937', 
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        color: '#fff'
                                      }}
                                      formatter={(value) => [formatCurrency(Number(value)), '']}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    )}

                    {section === 'treasury' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <Card className="bg-black/20 border-gray-600">
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-white mb-2">Saldo Total</h3>
                              <p className="text-2xl font-bold text-green-400">{formatCurrency(125000)}</p>
                            </div>
                          </Card>
                          <Card className="bg-black/20 border-gray-600">
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-white mb-2">Tesorería Neta</h3>
                              <p className="text-2xl font-bold text-blue-400">{formatCurrency(-65000)}</p>
                            </div>
                          </Card>
                          <Card className="bg-black/20 border-gray-600">
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-white mb-2">Días de Cobertura</h3>
                              <p className="text-2xl font-bold text-yellow-400">15 días</p>
                            </div>
                          </Card>
                        </div>

                        <Card className="bg-black/20 border-gray-600">
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Detalle por Cuenta</h3>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-gray-300">Entidad/Cuenta</TableHead>
                                    <TableHead className="text-gray-300 text-right">Saldo</TableHead>
                                    <TableHead className="text-gray-300 text-center">Tipo</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {treasuryAccounts.map((account, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="text-white font-medium">{account.entidad}</TableCell>
                                      <TableCell className="text-right text-green-400">{formatCurrency(account.saldo)}</TableCell>
                                      <TableCell className="text-center text-gray-300 capitalize">{account.tipo}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </Card>
                      </div>
                    )}

                    {section === 'nof' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="bg-black/20 border-gray-600">
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-white mb-4">Composición NOF</h3>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg">
                                  <span className="text-white">Existencias</span>
                                  <span className="text-green-400 font-bold">{formatCurrency(nofData.existencias)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg">
                                  <span className="text-white">Clientes</span>
                                  <span className="text-blue-400 font-bold">{formatCurrency(nofData.clientes)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-500/20 rounded-lg">
                                  <span className="text-white">Proveedores</span>
                                  <span className="text-red-400 font-bold">-{formatCurrency(nofData.proveedores)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-teal-500/30 rounded-lg border border-teal-500/50">
                                  <span className="text-white font-semibold">NOF Total</span>
                                  <span className="text-teal-400 font-bold text-lg">{formatCurrency(nofData.nofTotal)}</span>
                                </div>
                              </div>
                            </div>
                          </Card>

                          <Card className="bg-black/20 border-gray-600">
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-white mb-4">Períodos Medios</h3>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-yellow-500/20 rounded-lg">
                                  <span className="text-white">PME (Existencias)</span>
                                  <span className="text-yellow-400 font-bold">{nofData.pme} días</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg">
                                  <span className="text-white">PMC (Cobro)</span>
                                  <span className="text-blue-400 font-bold">{nofData.pmc} días</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-500/20 rounded-lg">
                                  <span className="text-white">PMP (Pago)</span>
                                  <span className="text-red-400 font-bold">{nofData.pmp} días</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-purple-500/30 rounded-lg border border-purple-500/50">
                                  <span className="text-white font-semibold">PMM (Maduración)</span>
                                  <span className="text-purple-400 font-bold text-lg">{nofData.pmm} días</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
};
