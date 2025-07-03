import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Calculator, 
  TrendingUp, 
  AlertCircle, 
  Info, 
  Download,
  BarChart3 
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { useState } from 'react';
import { useBreakeven } from '@/hooks/useBreakeven';

export const BreakevenCurrentModule = () => {
  const [scenario, setScenario] = useState('base');
  
  const initialInputs = {
    fixedCost: 300000,
    variableCostPct: 70,
    pricePerUnit: 25,
    unitsSold: 120000
  };

  const { inputs, results, updateInput } = useBreakeven(initialInputs);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatUnits = (value: number) => {
    return new Intl.NumberFormat('es-ES').format(value);
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 20) return 'bg-green-50 border-green-200';
    if (margin >= 10) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getMarginTextColor = (margin: number) => {
    if (margin >= 20) return 'text-green-700';
    if (margin >= 10) return 'text-yellow-700';
    return 'text-red-700';
  };

  const handleExportPDF = () => {
    console.log('Exporting breakeven analysis to PDF...');
    // TODO: Implement PDF export functionality
  };

  return (
    <TooltipProvider>
      <main className="flex-1 p-6 space-y-6 overflow-auto bg-background">
        {/* Header Section */}
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Análisis del Punto Muerto
              </h1>
              <p className="text-muted-foreground">
                Determinación del nivel de ventas donde la empresa no incurre en pérdidas ni obtiene beneficios
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Escenario Base</SelectItem>
                  <SelectItem value="optimista">Optimista</SelectItem>
                  <SelectItem value="pesimista">Pesimista</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </section>

        {/* KPIs Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Punto Muerto (Unidades) - Destacado */}
          <Card className="bg-white border-slate-200 relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#005E8A]" />
                  <CardTitle className="text-sm font-medium text-slate-700">
                    Punto Muerto (Unidades)
                  </CardTitle>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      <strong>Fórmula:</strong> Costes Fijos ÷ Margen de Contribución por unidad
                    </p>
                    <p className="text-xs mt-1">
                      <strong>Fuente:</strong> Estados Financieros
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-[#005E8A]">
                  {formatUnits(results.breakevenUnits)}
                </p>
                <p className="text-sm text-slate-500">unidades</p>
                <Badge variant="outline" className="text-xs">
                  Nivel crítico
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Punto Muerto (Valor) */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#005E8A] opacity-70" />
                  <CardTitle className="text-sm font-medium text-slate-700">
                    Valor
                  </CardTitle>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      <strong>Fórmula:</strong> Punto Muerto (unidades) × Precio unitario
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(results.breakevenValue)}
                </p>
                <p className="text-sm text-slate-500">en ventas</p>
              </div>
            </CardContent>
          </Card>

          {/* Margen de Seguridad */}
          <Card className={`border ${getMarginColor(results.marginOfSafety)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#005E8A] opacity-70" />
                  <CardTitle className="text-sm font-medium text-slate-700">
                    Margen de Seguridad
                  </CardTitle>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      <strong>Fórmula:</strong> (Ventas actuales - Punto muerto) ÷ Ventas actuales × 100
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className={`text-2xl font-bold ${getMarginTextColor(results.marginOfSafety)}`}>
                  {results.marginOfSafety.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-500">sobre ventas actuales</p>
                <Badge 
                  variant={results.marginOfSafety >= 20 ? "default" : results.marginOfSafety >= 10 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {results.marginOfSafety >= 20 ? 'Seguro' : results.marginOfSafety >= 10 ? 'Moderado' : 'Riesgo'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Margen de Contribución */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[#005E8A] opacity-70" />
                  <CardTitle className="text-sm font-medium text-slate-700">
                    Margen Contribución
                  </CardTitle>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      <strong>Fórmula:</strong> 100% - % Costes Variables
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-slate-900">
                  {results.contributionMargin.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-500">por unidad vendida</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Simulación Interactiva */}
        <section>
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#005E8A]" />
                Simulación Interactiva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Costes Fijos */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">
                      Costes Fijos Totales
                    </Label>
                    <div className="space-y-3">
                      <Slider
                        value={[inputs.fixedCost]}
                        onValueChange={(value) => updateInput('fixedCost', value[0])}
                        max={500000}
                        min={100000}
                        step={10000}
                        className="w-full"
                      />
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={inputs.fixedCost}
                          onChange={(e) => updateInput('fixedCost', Number(e.target.value))}
                          className="flex-1"
                          min={100000}
                          max={500000}
                          step={10000}
                        />
                        <span className="text-sm text-slate-500 min-w-0 flex-shrink-0">
                          {formatCurrency(inputs.fixedCost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Costes Variables */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">
                      Costes Variables (% sobre ventas)
                    </Label>
                    <div className="space-y-3">
                      <Slider
                        value={[inputs.variableCostPct]}
                        onValueChange={(value) => updateInput('variableCostPct', value[0])}
                        max={90}
                        min={30}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={inputs.variableCostPct}
                          onChange={(e) => updateInput('variableCostPct', Number(e.target.value))}
                          className="flex-1"
                          min={30}
                          max={90}
                          step={1}
                        />
                        <span className="text-sm text-slate-500 min-w-0 flex-shrink-0">
                          {inputs.variableCostPct}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Precio Unitario */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">
                      Precio de Venta Unitario
                    </Label>
                    <div className="space-y-3">
                      <Slider
                        value={[inputs.pricePerUnit]}
                        onValueChange={(value) => updateInput('pricePerUnit', value[0])}
                        max={50}
                        min={10}
                        step={0.5}
                        className="w-full"
                      />
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={inputs.pricePerUnit}
                          onChange={(e) => updateInput('pricePerUnit', Number(e.target.value))}
                          className="flex-1"
                          min={10}
                          max={50}
                          step={0.5}
                        />
                        <span className="text-sm text-slate-500 min-w-0 flex-shrink-0">
                          {formatCurrency(inputs.pricePerUnit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Unidades Vendidas */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">
                      Unidades Vendidas Actuales
                    </Label>
                    <div className="space-y-3">
                      <Slider
                        value={[inputs.unitsSold]}
                        onValueChange={(value) => updateInput('unitsSold', value[0])}
                        max={200000}
                        min={50000}
                        step={5000}
                        className="w-full"
                      />
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={inputs.unitsSold}
                          onChange={(e) => updateInput('unitsSold', Number(e.target.value))}
                          className="flex-1"
                          min={50000}
                          max={200000}
                          step={5000}
                        />
                        <span className="text-sm text-slate-500 min-w-0 flex-shrink-0">
                          {formatUnits(inputs.unitsSold)} unidades
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Gráfico Break-Even */}
        <section>
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Gráfico de Punto Muerto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#e2e8f0" 
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="units" 
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K€`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number, name: string) => {
                        const formattedValue = name === 'units' 
                          ? formatUnits(value) 
                          : formatCurrency(value);
                        const label = name === 'revenue' ? 'Ingresos' :
                                     name === 'totalCosts' ? 'Costes Totales' :
                                     name === 'fixedCosts' ? 'Costes Fijos' : name;
                        return [formattedValue, label];
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      iconType="line"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    
                    {/* Líneas del gráfico */}
                    <Line 
                      type="monotone" 
                      dataKey="fixedCosts" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Costes Fijos"
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalCosts" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      name="Costes Totales"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Ingresos"
                      dot={false}
                    />
                    
                    {/* Línea vertical del punto muerto */}
                    <ReferenceLine 
                      x={results.breakevenUnits} 
                      stroke="#005E8A" 
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      label={{ 
                        value: "Punto Muerto", 
                        position: "top",
                        style: { fill: "#005E8A", fontSize: "12px", fontWeight: "500" }
                      }}
                    />
                    
                    {/* Línea de ventas actuales */}
                    <ReferenceLine 
                      x={inputs.unitsSold} 
                      stroke="#6BD1FF" 
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      label={{ 
                        value: "Ventas Actuales", 
                        position: "top",
                        style: { fill: "#6BD1FF", fontSize: "12px", fontWeight: "500" }
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </TooltipProvider>
  );
};