import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNOFData } from '@/hooks/useNOFData';
import { MissingFinancialData } from '@/components/ui/missing-financial-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Download, 
  Target, 
  Lightbulb,
  TrendingUp, 
  TrendingDown,
  Calculator,
  DollarSign,
  Clock,
  Package,
  Users,
  Truck,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Activity,
  RotateCcw
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
  Cell,
  ComposedChart,
  Area
} from 'recharts';
import { useState } from 'react';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { WaterfallChart } from '@/components/ui/waterfall-chart';

export const NOFModule = () => {
  // Use real data hook
  const { nofAnalysis, isLoading, error, hasRealData } = useNOFData();
  
  const [periodo, setPeriodo] = useState('anual');
  const [cobro, setCobro] = useState([33]);
  const [inventario, setInventario] = useState([37]);
  const [pago, setPago] = useState([35]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showInventoryDetails, setShowInventoryDetails] = useState(false);

  // Show missing data indicator if no real data
  if (!hasRealData && !isLoading) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center bg-background">
        <div className="max-w-lg w-full">
          <MissingFinancialData 
            dataType="balance"
            onUploadClick={() => console.log('Navigate to upload')}
          />
        </div>
      </main>
    );
  }

  // Use real NOF calculations
  const nofTotal = nofAnalysis.nofTotal;
  const nofAnterior = nofAnalysis.nofAnterior;
  const impactoCaja = nofAnalysis.impactoCaja;
  const ventasAnuales = 2400000; // This could come from P&G data
  const diasVentas = nofAnalysis.diasVentas;
  const eficiencia = nofAnalysis.eficiencia;
  
  // Optimized calculations
  const nofOptimizado = nofTotal * 0.75; // 25% reduction target
  const liberacionCaja = nofTotal - nofOptimizado;
  const mejorcaROCE = 3.5;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Datos para gráfico waterfall usando datos reales
  const waterfallData = [
    { name: 'Existencias', value: nofAnalysis.components.existencias, type: 'positive' as const },
    { name: 'Clientes', value: nofAnalysis.components.clientes, type: 'positive' as const },
    { name: 'Otros deudores', value: nofAnalysis.components.otrosDeudores, type: 'positive' as const },
    { name: 'Proveedores', value: -nofAnalysis.components.proveedores, type: 'negative' as const },
    { name: 'Acreedores', value: -nofAnalysis.components.acreedores, type: 'negative' as const },
    { name: 'NOF Total', value: nofTotal, type: 'total' as const }
  ];

  // Datos de evolución
  const evolucionNOF = [
    { mes: 'Ene', nof: 230000, sector: 280000 },
    { mes: 'Feb', nof: 226000, sector: 275000 },
    { mes: 'Mar', nof: 239000, sector: 285000 },
    { mes: 'Abr', nof: 245000, sector: 290000 },
    { mes: 'May', nof: 238000, sector: 285000 },
    { mes: 'Jun', nof: 242000, sector: 288000 },
    { mes: 'Jul', nof: 240000, sector: 290000 }
  ];

  // Datos aging de cuentas por cobrar
  const agingData = [
    { rango: '0-30 días', importe: 250000, porcentaje: 62 },
    { rango: '31-60 días', importe: 100000, porcentaje: 25 },
    { rango: '61-90 días', importe: 40000, porcentaje: 10 },
    { rango: '>90 días', importe: 10000, porcentaje: 3 }
  ];

  const getEfficiencyColor = (eff: string) => {
    switch (eff) {
      case 'Alta': return 'default';
      case 'Media': return 'secondary';
      case 'Baja': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <main className="flex-1 p-6 space-y-6 overflow-auto bg-background">
      {/* Header Contextual */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Necesidades Operativas de Financiación (NOF)
            </h1>
            <p className="text-lg text-muted-foreground">
              Impacto en tesorería: <span className="font-semibold text-foreground">{formatCurrency(impactoCaja)}</span> | 
              <span className="font-semibold text-foreground"> {diasVentas} días</span> de ventas
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            <Button variant="outline" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Simular
            </Button>
            
            <Button variant="outline" size="sm">
              <Lightbulb className="h-4 w-4 mr-2" />
              Recomendaciones
            </Button>
            
            <Badge variant={getEfficiencyColor(eficiencia)}>
              Eficiencia: {eficiencia}
            </Badge>
          </div>
        </div>
      </section>

      {/* KPIs Críticos - Grid 2x3 */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ModernKPICard
          title="NOF Total"
          value={formatCurrency(nofTotal)}
          subtitle={`${((nofTotal / ventasAnuales) * 100).toFixed(1)}% sobre ventas`}
          trend={impactoCaja > 0 ? 'up' : 'down'}
          trendValue={formatCurrency(Math.abs(impactoCaja))}
          icon={Calculator}
          variant={eficiencia === 'Alta' ? 'success' : eficiencia === 'Media' ? 'warning' : 'danger'}
        />

        <ModernKPICard
          title="Impacto en Caja"
          value={formatCurrency(Math.abs(impactoCaja))}
          subtitle={impactoCaja > 0 ? 'Consumo caja' : 'Liberación caja'}
          trend={impactoCaja > 0 ? 'down' : 'up'}
          trendValue="vs período anterior"
          icon={DollarSign}
          variant={impactoCaja > 0 ? 'warning' : 'success'}
        />

        <ModernKPICard
          title="Días de Ciclo"
          value={`${diasVentas} días`}
          subtitle="vs Sector: +5 días"
          trend="down"
          trendValue="Objetivo: 30 días"
          icon={Clock}
          variant={diasVentas <= 30 ? 'success' : 'warning'}
        />

        <ModernKPICard
          title="Rotación Inventario"
          value="9.8x"
          subtitle="Días inventario: 37"
          trend="up"
          trendValue="vs año anterior"
          icon={Package}
          variant="default"
        />

        <ModernKPICard
          title="Calidad Cobros"
          value="33 días"
          subtitle="Morosidad: 3%"
          trend="neutral"
          trendValue="Cobros vencidos: €50k"
          icon={Users}
          variant="success"
        />

        <ModernKPICard
          title="Poder Negociación"
          value="35 días"
          subtitle="Rating proveedores: A"
          trend="up"
          trendValue="Descuentos p.p: €15k"
          icon={Truck}
          variant="warning"
        />
      </section>

      {/* Visualización Principal - Layout 60/40 */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Izquierda 60% - Gráficos principales */}
        <div className="lg:col-span-3 space-y-6">
          {/* Gráfico Waterfall NOF */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Composición NOF - Análisis Waterfall
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WaterfallChart data={waterfallData} height={300} />
            </CardContent>
          </Card>

          {/* Evolución histórica */}
          <Card>
            <CardHeader>
              <CardTitle>Evolución NOF vs Sector</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={evolucionNOF}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K€`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area dataKey="sector" fill="hsl(var(--muted))" fillOpacity={0.3} />
                    <Line 
                      type="monotone" 
                      dataKey="nof" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sector" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Derecha 40% - Panels de análisis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Benchmarking */}
          <Card>
            <CardHeader>
              <CardTitle>Benchmarking Sector</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">65%</div>
                <div className="text-sm text-muted-foreground">Percentil en el sector</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">DSO: 33 días</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sector: 45d</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">DIO: 37 días</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sector: 30d</span>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">DPO: 35 días</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sector: 60d</span>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Oportunidades */}
          <Card>
            <CardHeader>
              <CardTitle>Cálculo de Oportunidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Reducir cobro 5 días:</span>
                  <span className="font-semibold text-green-600">+€65,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Reducir stock 10%:</span>
                  <span className="font-semibold text-green-600">+€30,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Negociar +15 días pago:</span>
                  <span className="font-semibold text-green-600">+€95,000</span>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold">
                  <span>TOTAL POTENCIAL:</span>
                  <span className="text-green-600">€190,000</span>
                </div>
              </div>
              
              <Button size="sm" className="w-full">
                Ver plan de acción
              </Button>
            </CardContent>
          </Card>

          {/* Alertas */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas Inteligentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Incremento NOF</div>
                  <div className="text-muted-foreground">Consume 45% del EBIT</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Stock obsoleto</div>
                  <div className="text-muted-foreground">Estimado: €25,000</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Simulador Interactivo */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Optimizador de NOF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Días de cobro</label>
                    <span className="text-sm font-bold">{cobro[0]} días ({cobro[0] - 33 >= 0 ? '+' : ''}{cobro[0] - 33})</span>
                  </div>
                  <Slider
                    value={cobro}
                    onValueChange={setCobro}
                    max={60}
                    min={15}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Días de inventario</label>
                    <span className="text-sm font-bold">{inventario[0]} días ({inventario[0] - 37 >= 0 ? '+' : ''}{inventario[0] - 37})</span>
                  </div>
                  <Slider
                    value={inventario}
                    onValueChange={setInventario}
                    max={60}
                    min={20}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Días de pago</label>
                    <span className="text-sm font-bold">{pago[0]} días ({pago[0] - 35 >= 0 ? '+' : ''}{pago[0] - 35})</span>
                  </div>
                  <Slider
                    value={pago}
                    onValueChange={setPago}
                    max={90}
                    min={15}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Resultado en Tiempo Real</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>NOF actual:</span>
                      <span className="font-semibold">{formatCurrency(nofTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NOF optimizado:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(nofOptimizado)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Liberación de caja:</span>
                      <span className="font-bold text-green-600">{formatCurrency(liberacionCaja)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mejora ROCE:</span>
                      <span className="font-semibold text-blue-600">+{mejorcaROCE}%</span>
                    </div>
                  </div>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      Generar plan de implementación
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Plan de Implementación NOF</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Resumen del plan */}
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Resumen Ejecutivo</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Liberación de caja total</div>
                            <div className="text-xl font-bold text-green-600">{formatCurrency(liberacionCaja)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Mejora ROCE</div>
                            <div className="text-xl font-bold text-blue-600">+{mejorcaROCE}%</div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Wins */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          Quick Wins (0-30 días)
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">Campaña cobro facturas vencidas</div>
                              <div className="text-sm text-muted-foreground">Gestión proactiva de morosos</div>
                            </div>
                            <div className="text-green-600 font-semibold">€40,000</div>
                          </div>
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">Liquidación stock obsoleto</div>
                              <div className="text-sm text-muted-foreground">Promociones y descuentos</div>
                            </div>
                            <div className="text-green-600 font-semibold">€15,000</div>
                          </div>
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">Activar descuentos pronto pago</div>
                              <div className="text-sm text-muted-foreground">2% descuento a 10 días</div>
                            </div>
                            <div className="text-green-600 font-semibold">€5,000</div>
                          </div>
                        </div>
                      </div>

                      {/* Mejoras Medio Plazo */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-orange-500" />
                          Mejoras Medio Plazo (1-3 meses)
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium">Renegociar términos top 10 proveedores</div>
                            <div className="text-sm text-muted-foreground">Extender plazos de 35 a 50 días</div>
                            <div className="text-blue-600 font-semibold">Impacto: €45,000</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium">Implementar gestión categorías A</div>
                            <div className="text-sm text-muted-foreground">Just-in-time para productos críticos</div>
                            <div className="text-blue-600 font-semibold">Impacto: €25,000</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium">Automatizar procesos de cobro</div>
                            <div className="text-sm text-muted-foreground">CRM y recordatorios automáticos</div>
                            <div className="text-blue-600 font-semibold">Impacto: €20,000</div>
                          </div>
                        </div>
                      </div>

                      {/* Transformación */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Target className="h-5 w-5 text-purple-500" />
                          Transformación (3-6 meses)
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium">Sistema S&OP integrado</div>
                            <div className="text-sm text-muted-foreground">Planificación demanda-suministro</div>
                            <div className="text-purple-600 font-semibold">ROI: 300%</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium">Factoring sin recurso selectivo</div>
                            <div className="text-sm text-muted-foreground">Para clientes A con rating alto</div>
                            <div className="text-purple-600 font-semibold">Liquidez: €100,000</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium">Centralización de compras</div>
                            <div className="text-sm text-muted-foreground">Poder negociación y economías de escala</div>
                            <div className="text-purple-600 font-semibold">Ahorro: 5-8%</div>
                          </div>
                        </div>
                      </div>

                      {/* Cronograma */}
                      <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-semibold mb-3">Cronograma de Implementación</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Mes 1: Quick wins + análisis detallado</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="text-sm">Mes 2-3: Negociaciones y automatización</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className="text-sm">Mes 4-6: Transformación digital</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Análisis Detallado - Tabs */}
      <section>
        <Tabs defaultValue="cobros" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cobros">Gestión de Cobros</TabsTrigger>
            <TabsTrigger value="inventarios">Gestión de Inventarios</TabsTrigger>
            <TabsTrigger value="pagos">Gestión de Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="cobros" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aging de Cuentas por Cobrar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {agingData.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">{item.rango}</div>
                          <Badge variant="outline">{item.porcentaje}%</Badge>
                        </div>
                        <div className="font-semibold">{formatCurrency(item.importe)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Acciones Recomendadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="text-sm">Implementar descuentos p.p</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <div className="text-sm">Automatizar recordatorios</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Target className="h-5 w-5 text-blue-500" />
                      <div className="text-sm">Revisar límites de crédito</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventarios" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plan de Reducción de Inventarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                          <Package className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                          <div className="font-semibold">Análisis ABC</div>
                          <div className="text-sm text-muted-foreground">Categorización productos</div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Análisis ABC de Inventarios</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-green-50 rounded-lg">
                              <div className="font-semibold text-green-800">Categoría A</div>
                              <div className="text-sm text-green-600">80% valor, 20% productos</div>
                              <div className="text-lg font-bold">€240,000</div>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg">
                              <div className="font-semibold text-yellow-800">Categoría B</div>
                              <div className="text-sm text-yellow-600">15% valor, 30% productos</div>
                              <div className="text-lg font-bold">€45,000</div>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                              <div className="font-semibold text-red-800">Categoría C</div>
                              <div className="text-sm text-red-600">5% valor, 50% productos</div>
                              <div className="text-lg font-bold">€15,000</div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="font-semibold">Estrategias por Categoría:</h4>
                            <div className="space-y-2 text-sm">
                              <div>• <strong>Categoría A:</strong> Control estricto, just-in-time, proveedores premium</div>
                              <div>• <strong>Categoría B:</strong> Control moderado, revisión mensual, múltiples proveedores</div>
                              <div>• <strong>Categoría C:</strong> Control simple, pedidos en lotes, minimizar costes gestión</div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                          <RotateCcw className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <div className="font-semibold">Rotación</div>
                          <div className="text-sm text-muted-foreground">Por categoría</div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Análisis de Rotación por Categoría</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <h4 className="font-semibold">Rotación Actual</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Productos A:</span>
                                  <span className="font-semibold text-green-600">12.5x/año</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Productos B:</span>
                                  <span className="font-semibold text-yellow-600">8.2x/año</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Productos C:</span>
                                  <span className="font-semibold text-red-600">3.1x/año</span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-semibold">Objetivo Sector</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Productos A:</span>
                                  <span className="font-semibold">15.0x/año</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Productos B:</span>
                                  <span className="font-semibold">10.0x/año</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Productos C:</span>
                                  <span className="font-semibold">6.0x/año</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h5 className="font-semibold mb-2">Potencial de Mejora:</h5>
                            <div className="text-sm">
                              Alcanzar los objetivos del sector liberaría <strong>€35,000</strong> adicionales en caja
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                          <div className="font-semibold">Stock obsoleto</div>
                          <div className="text-sm text-muted-foreground">Sin movimiento</div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Gestión de Stock Obsoleto</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-red-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-red-800 mb-2">Stock Sin Movimiento</h4>
                            <div className="text-red-700">
                              <div>Total identificado: <strong>€25,000</strong></div>
                              <div>Productos afectados: <strong>156 referencias</strong></div>
                              <div>Antigüedad promedio: <strong>8 meses</strong></div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-semibold">Plan de Liquidación:</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <div className="font-medium">Descuento 30% (0-3 meses)</div>
                                  <div className="text-sm text-muted-foreground">Productos recientes</div>
                                </div>
                                <div className="text-green-600 font-semibold">€12,000</div>
                              </div>
                              <div className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <div className="font-medium">Descuento 50% (3-6 meses)</div>
                                  <div className="text-sm text-muted-foreground">Stock medio</div>
                                </div>
                                <div className="text-orange-600 font-semibold">€8,000</div>
                              </div>
                              <div className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <div className="font-medium">Liquidación 70% (+6 meses)</div>
                                  <div className="text-sm text-muted-foreground">Stock obsoleto</div>
                                </div>
                                <div className="text-red-600 font-semibold">€5,000</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Stock de seguridad</div>
                        <div className="text-lg font-bold">€45,000</div>
                        <div className="text-xs text-green-600">15% del total</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Coste almacenamiento</div>
                        <div className="text-lg font-bold">€18,000/año</div>
                        <div className="text-xs text-orange-600">6% del inventario</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Top 5 Productos sin Movimiento</h4>
                      <div className="space-y-2">
                        {['Producto A-123', 'Producto B-456', 'Producto C-789', 'Producto D-012', 'Producto E-345'].map((producto, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded">
                            <span className="text-sm">{producto}</span>
                            <span className="text-xs text-red-600">{8 + index} meses</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pagos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estrategias de Optimización</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <ArrowRight className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Centralizar compras</div>
                      <div className="text-sm text-muted-foreground">Mejor poder de negociación</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <ArrowRight className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Negociar volumen</div>
                      <div className="text-sm text-muted-foreground">Descuentos por cantidad</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <ArrowRight className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="font-medium">Confirming bancario</div>
                      <div className="text-sm text-muted-foreground">Extender plazos de pago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};