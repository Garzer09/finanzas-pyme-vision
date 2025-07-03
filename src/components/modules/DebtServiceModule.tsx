import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SliderInput } from '@/components/ui/slider-input';
import { NumberInput } from '@/components/ui/number-input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ModalMonthDetail } from '@/components/debt-service/ModalMonthDetail';
import { 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  Calculator,
  Shield,
  HelpCircle,
  Download,
  Save,
  RotateCcw,
  TrendingDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
  Area,
  ComposedChart
} from 'recharts';
import { useState } from 'react';
import { useDscr } from '@/hooks/useDscr';

export const DebtServiceModule = () => {
  const {
    ebitdaAnnual,
    ocfAnnual,
    setEbitdaAnnual,
    setOcfAnnual,
    servicioDeudaAnual,
    flujoDisponibleAnual,
    dscrPromedio,
    dscrMinimo,
    mesesEnRiesgo,
    monthlyData,
    applyStressTest,
    resetToBase
  } = useDscr(450000, 380000);

  const [selectedMonth, setSelectedMonth] = useState<typeof monthlyData[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyK = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // KPI Data simplified - sin duplicaciones
  const kpiData = [
    {
      title: 'Servicio de Deuda Anual',
      value: formatCurrencyK(servicioDeudaAnual),
      subtitle: 'Principal + intereses',
      icon: CreditCard,
      variant: 'default' as const
    },
    {
      title: 'DSCR Promedio',
      value: `${dscrPromedio.toFixed(2)}x`,
      subtitle: 'Cobertura media',
      trend: dscrPromedio >= 1.2 ? 'up' as const : dscrPromedio >= 1.0 ? 'neutral' as const : 'down' as const,
      trendValue: dscrPromedio >= 1.2 ? 'Bueno' : dscrPromedio >= 1.0 ? 'Aceptable' : 'Riesgo',
      icon: Calculator,
      variant: dscrPromedio >= 1.2 ? 'success' as const : dscrPromedio >= 1.0 ? 'warning' as const : 'danger' as const
    },
    {
      title: 'DSCR Mínimo',
      value: `${dscrMinimo.toFixed(2)}x`,
      subtitle: 'Peor mes del año',
      trend: dscrMinimo >= 1.0 ? 'neutral' as const : 'down' as const,
      trendValue: dscrMinimo >= 1.2 ? 'Bueno' : dscrMinimo >= 1.0 ? 'Aceptable' : 'Crítico',
      icon: AlertTriangle,
      variant: dscrMinimo >= 1.2 ? 'success' as const : dscrMinimo >= 1.0 ? 'warning' as const : 'danger' as const
    },
    {
      title: 'Meses en Riesgo',
      value: mesesEnRiesgo.toString(),
      subtitle: 'DSCR menor a 1.0',
      trend: mesesEnRiesgo === 0 ? 'up' as const : 'down' as const,
      trendValue: mesesEnRiesgo === 0 ? 'Saludable' : 'Crítico',
      icon: Shield,
      variant: mesesEnRiesgo === 0 ? 'success' as const : 'danger' as const
    }
  ];

  const handleBarClick = (data: any, index: number) => {
    if (data && data.dscr < 1.0) {
      setSelectedMonth(data);
      setIsModalOpen(true);
    }
  };

  const handleStressTest = (type: 'ebitda_decrease' | 'interest_increase') => {
    applyStressTest(type);
  };

  return (
    <TooltipProvider>
      <main 
        className="flex-1 p-6 space-y-8 overflow-auto bg-gradient-to-br from-slate-50 via-white to-[hsl(var(--secondary)/0.1)]" 
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {/* Header Section */}
        <section className="relative">
          <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-[hsl(var(--primary)/0.1)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary)/0.05)] via-[hsl(var(--secondary)/0.03)] to-slate-100/5 rounded-3xl"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-[hsl(var(--primary))] to-slate-800 bg-clip-text text-transparent">
                  Análisis del Servicio de Deuda
                </h1>
                <p className="text-slate-700 text-lg font-medium">Evaluación de la capacidad para hacer frente a las obligaciones de deuda</p>
              </div>
              
              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Escenario
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={resetToBase}>
                  <RotateCcw className="h-4 w-4" />
                  Restaurar Base
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs Grid simplificado */}
        <section>
          <div className="grid grid-cols-4 lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 gap-6">
            {kpiData.map((kpi, index) => (
              <div key={index} className="relative">
                <ModernKPICard {...kpi} />
                {kpi.title.includes('DSCR') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="absolute top-2 right-2 h-4 w-4 text-slate-400 hover:text-[hsl(var(--primary))] cursor-help transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-medium">DSCR = Flujo Disponible / Servicio de Deuda</p>
                        <p className="text-sm text-slate-600">
                          Mide la capacidad de generar suficiente flujo de caja para cubrir las obligaciones de deuda.
                        </p>
                        <a href="#" className="text-sm text-[hsl(var(--primary))] hover:underline">
                          Ver política crediticia →
                        </a>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Simulación de Flujos */}
        <section>
          <Card className="bg-white border-slate-200 p-6 shadow-sm">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[hsl(var(--primary))]" />
                Simulación de Flujos de Caja
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Controles de parámetros */}
                <div className="space-y-6">
                  <SliderInput
                    label="EBITDA Anual"
                    value={ebitdaAnnual}
                    onValueChange={setEbitdaAnnual}
                    min={100000}
                    max={2000000}
                    step={10000}
                    formatValue={formatCurrency}
                    aria-label="EBITDA anual input"
                  />
                  
                  <SliderInput
                    label="Flujo de Caja Operativo Anual"
                    value={ocfAnnual}
                    onValueChange={setOcfAnnual}
                    min={100000}
                    max={2000000}
                    step={10000}
                    formatValue={formatCurrency}
                    aria-label="OCF anual input"
                  />
                </div>

                {/* Botones de stress test */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Análisis de Estrés</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      variant="outline" 
                      className="justify-start gap-2 h-12"
                      onClick={() => handleStressTest('ebitda_decrease')}
                    >
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <div className="text-left">
                        <div className="font-medium">-10% EBITDA</div>
                        <div className="text-xs text-slate-500">Escenario pesimista</div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="justify-start gap-2 h-12"
                      onClick={() => handleStressTest('interest_increase')}
                    >
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <div className="text-left">
                        <div className="font-medium">+100 pb Tipo</div>
                        <div className="text-xs text-slate-500">Subida de tipos</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Gráfico mejorado con área roja */}
        <section>
          <Card className="bg-white border-slate-200 p-6 shadow-sm">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Servicio de Deuda vs Flujo Disponible
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%" aspect={2/1}>
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="mes" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K€`}
                      fontSize={12}
                    />
                    <RechartsTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                              <p className="font-semibold text-slate-800">{label}</p>
                              {payload.map((entry, index) => (
                                <p key={index} className="text-slate-600">
                                  <span style={{ color: entry.color }}>
                                    {entry.name === 'servicio' ? 'Servicio' : 'Flujo Disponible'}: {formatCurrency(Number(entry.value))}
                                  </span>
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    {/* Área roja cuando servicio > flujo */}
                    <Area
                      type="monotone"
                      dataKey={(data) => data.servicio > data.flujoDisponible ? data.servicio : 0}
                      fill="rgba(239, 68, 68, 0.2)"
                      stroke="none"
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="servicio" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={3}
                      name="servicio"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="flujoDisponible" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="flujoDisponible"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Gráfico DSCR mejorado con bandas y modal */}
        <section>
          <Card className="bg-white border-slate-200 p-6 shadow-sm">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-semibold text-slate-900">
                DSCR (Debt Service Coverage Ratio)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%" aspect={2/1}>
                  <BarChart data={monthlyData}>
                    {/* Bandas de fondo */}
                    <defs>
                      <pattern id="green-band" patternUnits="userSpaceOnUse" width="4" height="4">
                        <rect width="4" height="4" fill="rgba(34, 197, 94, 0.1)" />
                      </pattern>
                      <pattern id="yellow-band" patternUnits="userSpaceOnUse" width="4" height="4">
                        <rect width="4" height="4" fill="rgba(234, 179, 8, 0.1)" />
                      </pattern>
                      <pattern id="red-band" patternUnits="userSpaceOnUse" width="4" height="4">
                        <rect width="4" height="4" fill="rgba(239, 68, 68, 0.1)" />
                      </pattern>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="mes" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                    />
                    <RechartsTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                              <p className="font-semibold text-slate-800">{label}</p>
                              <p className="text-slate-600">
                                DSCR: <span className="font-medium">{data.dscr.toFixed(2)}x</span>
                              </p>
                              {data.dscr < 1.0 && (
                                <p className="text-red-600 text-sm">
                                  ⚠️ Haz clic para ver detalles
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    {/* Línea punteada en 1.2 */}
                    <ReferenceLine 
                      y={1.2} 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      label={{ 
                        value: "Umbral recomendado (1.2)", 
                        position: "top", 
                        fill: "hsl(var(--primary))",
                        fontSize: 12
                      }}
                    />
                    
                     <Bar 
                       dataKey="dscr"
                       onClick={handleBarClick}
                       cursor="pointer"
                     >
                       {monthlyData.map((entry, index) => {
                         let fillColor = "hsl(var(--success))"; // Verde para DSCR bueno
                         if (entry.dscr < 1.0) fillColor = "hsl(var(--destructive))"; // Rojo para crítico
                         else if (entry.dscr < 1.2) fillColor = "hsl(var(--warning))"; // Ámbar para aceptable
                         
                         return <Cell key={`cell-${index}`} fill={fillColor} />;
                       })}
                     </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
               {/* Leyenda */}
               <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                 <div className="flex items-center justify-center gap-2">
                   <div className="w-4 h-4 bg-[hsl(var(--success))] rounded"></div>
                   <span className="text-sm text-slate-600">DSCR ≥ 1.2 (Bueno)</span>
                 </div>
                 <div className="flex items-center justify-center gap-2">
                   <div className="w-4 h-4 bg-[hsl(var(--warning))] rounded"></div>
                   <span className="text-sm text-slate-600">1.0 ≤ DSCR &lt; 1.2 (Aceptable)</span>
                 </div>
                 <div className="flex items-center justify-center gap-2">
                   <div className="w-4 h-4 bg-[hsl(var(--destructive))] rounded"></div>
                   <span className="text-sm text-slate-600">DSCR &lt; 1.0 (Riesgo)</span>
                 </div>
               </div>
            </CardContent>
          </Card>
        </section>

        {/* Modal de detalles del mes */}
        <ModalMonthDetail
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          monthData={selectedMonth}
        />
      </main>
    </TooltipProvider>
  );
};
