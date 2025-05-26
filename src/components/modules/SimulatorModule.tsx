import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Play, RotateCcw, Target, TrendingUp } from 'lucide-react';

export const SimulatorModule = () => {
  const [salesChange, setSalesChange] = useState([0]);
  const [costsChange, setCostsChange] = useState([0]);
  const [collectionDays, setCollectionDays] = useState([62]);
  const [paymentDays, setPaymentDays] = useState([41]);

  // Datos base
  const baseData = {
    sales: 2500000,
    costs: 1500000,
    ebitda: 450000,
    currentCash: 125000,
    currentNOF: 320000,
  };

  // Cálculos simulados
  const simulatedSales = baseData.sales * (1 + salesChange[0] / 100);
  const simulatedCosts = baseData.costs * (1 + costsChange[0] / 100);
  const simulatedEbitda = simulatedSales - simulatedCosts - 550000; // Costes fijos
  const nofChange = (collectionDays[0] - 62) * (simulatedSales / 365) + (paymentDays[0] - 41) * (simulatedCosts / 365);
  const simulatedNOF = baseData.currentNOF + nofChange;
  const cashImpact = -nofChange;

  const simulatedPyG = [
    { concepto: 'Ingresos', actual: 2500, proyectado: simulatedSales / 1000 },
    { concepto: 'Costes', actual: -1500, proyectado: -simulatedCosts / 1000 },
    { concepto: 'EBITDA', actual: 450, proyectado: simulatedEbitda / 1000 },
    { concepto: 'Beneficio Neto', actual: 195, proyectado: (simulatedEbitda * 0.6) / 1000 },
  ];

  const simulatedBalance = [
    { item: 'Activo Fijo', valor: 1200 },
    { item: 'Activo Circulante', valor: 800 + (nofChange / 1000) },
    { item: 'Patrimonio Neto', valor: 1100 + (cashImpact / 1000) },
    { item: 'Pasivo L/P', valor: 650 },
    { item: 'Pasivo C/P', valor: 250 },
  ];

  const simulatedCashFlow = [
    { concepto: 'EBITDA', valor: simulatedEbitda / 1000 },
    { concepto: 'Var. NOF', valor: -nofChange / 1000 },
    { concepto: 'CAPEX', valor: -220 },
    { concepto: 'Free Cash Flow', valor: (simulatedEbitda - Math.abs(nofChange) - 220000) / 1000 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value * 1000);
  };

  const resetSimulation = () => {
    setSalesChange([0]);
    setCostsChange([0]);
    setCollectionDays([62]);
    setPaymentDays([41]);
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-dashboard-green-50 to-dashboard-orange-50 min-h-screen p-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-dashboard-green-600 tracking-light text-[32px] font-bold leading-tight">Simulador What-If Avanzado</p>
          <p className="text-dashboard-green-500 text-sm font-normal leading-normal">Modela diferentes escenarios y ve el impacto en todas las áreas financieras</p>
        </div>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-dashboard-green-600">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Parámetros de Simulación
            </span>
            <Button variant="outline" onClick={resetSimulation} className="border-dashboard-green-200 text-dashboard-green-600 hover:bg-dashboard-green-50">
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-dashboard-green-50 p-4 rounded-xl">
                <label className="block text-sm font-medium text-dashboard-green-700 mb-3">
                  Variación de Ventas: {salesChange[0] > 0 ? '+' : ''}{salesChange[0]}%
                </label>
                <Slider
                  value={salesChange}
                  onValueChange={setSalesChange}
                  max={50}
                  min={-30}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="bg-dashboard-orange-50 p-4 rounded-xl">
                <label className="block text-sm font-medium text-dashboard-orange-700 mb-3">
                  Variación de Costes: {costsChange[0] > 0 ? '+' : ''}{costsChange[0]}%
                </label>
                <Slider
                  value={costsChange}
                  onValueChange={setCostsChange}
                  max={30}
                  min={-20}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="bg-dashboard-blue-50 p-4 rounded-xl">
                <label className="block text-sm font-medium text-dashboard-blue-700 mb-3">
                  Días de Cobro: {collectionDays[0]} días
                </label>
                <Slider
                  value={collectionDays}
                  onValueChange={setCollectionDays}
                  max={90}
                  min={30}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="bg-dashboard-red-50 p-4 rounded-xl">
                <label className="block text-sm font-medium text-dashboard-red-700 mb-3">
                  Días de Pago: {paymentDays[0]} días
                </label>
                <Slider
                  value={paymentDays}
                  onValueChange={setPaymentDays}
                  max={60}
                  min={20}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-dashboard-green-700 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Impacto Proyectado
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-dashboard-green-100 to-dashboard-green-200 p-4 rounded-xl border border-dashboard-green-300">
                  <p className="text-sm text-dashboard-green-700 mb-1">Ventas</p>
                  <p className="text-lg font-bold text-dashboard-green-600">
                    {formatCurrency(simulatedSales)}
                  </p>
                  <p className="text-xs text-dashboard-green-500">
                    {salesChange[0] > 0 ? '+' : ''}{formatCurrency(simulatedSales - baseData.sales)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-dashboard-orange-100 to-dashboard-orange-200 p-4 rounded-xl border border-dashboard-orange-300">
                  <p className="text-sm text-dashboard-orange-700 mb-1">EBITDA</p>
                  <p className="text-lg font-bold text-dashboard-orange-600">
                    {formatCurrency(simulatedEbitda)}
                  </p>
                  <p className="text-xs text-dashboard-orange-500">
                    {simulatedEbitda > baseData.ebitda ? '+' : ''}{formatCurrency(simulatedEbitda - baseData.ebitda)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-dashboard-blue-100 to-dashboard-blue-200 p-4 rounded-xl border border-dashboard-blue-300">
                  <p className="text-sm text-dashboard-blue-700 mb-1">NOF</p>
                  <p className="text-lg font-bold text-dashboard-blue-600">
                    {formatCurrency(simulatedNOF)}
                  </p>
                  <p className="text-xs text-dashboard-blue-500">
                    {nofChange > 0 ? '+' : ''}{formatCurrency(nofChange)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-dashboard-red-100 to-dashboard-red-200 p-4 rounded-xl border border-dashboard-red-300">
                  <p className="text-sm text-dashboard-red-700 mb-1">Impacto Caja</p>
                  <p className="text-lg font-bold text-dashboard-red-600">
                    {formatCurrency(cashImpact)}
                  </p>
                  <p className="text-xs text-dashboard-red-500">
                    {cashImpact > 0 ? 'Generación' : 'Consumo'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pyg" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-dashboard-green-100 rounded-xl p-1">
          <TabsTrigger value="pyg" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">P&G Simulado</TabsTrigger>
          <TabsTrigger value="balance" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">Balance</TabsTrigger>
          <TabsTrigger value="flujos" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">Flujos</TabsTrigger>
          <TabsTrigger value="ratios" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">Ratios</TabsTrigger>
          <TabsTrigger value="nof" className="rounded-lg data-[state=active]:bg-dashboard-green-300 data-[state=active]:text-dashboard-green-700">NOF</TabsTrigger>
        </TabsList>

        <TabsContent value="pyg" className="pt-6">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-dashboard-green-600">Proyección P&G Simulada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={simulatedPyG}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#B5D5C5" opacity={0.3} />
                    <XAxis dataKey="concepto" stroke="#4A7C59" />
                    <YAxis stroke="#4A7C59" tickFormatter={(value) => `${value}K`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), '']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #B5D5C5',
                        borderRadius: '12px'
                      }}
                    />
                    <Bar dataKey="actual" fill="#B5D5C5" name="Actual" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="proyectado" fill="#F8CBA6" name="Simulado" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="pt-6">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-dashboard-green-600">Balance Simulado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={simulatedBalance}
                      dataKey="valor"
                      nameKey="item"
                      cx="50%"
                      cy="50%"
                      outerRadius={160}
                      fill="#8884d8"
                      label
                    >
                      <Cell fill="#B5D5C5" name="Activo Fijo" />
                      <Cell fill="#F8CBA6" name="Activo Circulante" />
                      <Cell fill="#A5D7E8" name="Patrimonio Neto" />
                      <Cell fill="#FFB5B5" name="Pasivo L/P" />
                      <Cell fill="#EEE9DA" name="Pasivo C/P" />
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), '']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #B5D5C5',
                        borderRadius: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flujos" className="pt-6">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-dashboard-green-600">Flujos de Caja Simulado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={simulatedCashFlow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#B5D5C5" opacity={0.3} />
                    <XAxis dataKey="concepto" stroke="#4A7C59" />
                    <YAxis stroke="#4A7C59" tickFormatter={(value) => `${value}K`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), '']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #B5D5C5',
                        borderRadius: '12px'
                      }}
                    />
                    <Bar dataKey="valor" fill="#A5D7E8" name="Valor" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratios" className="pt-6">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-dashboard-green-600">Ratios Simulado</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Contenido de Ratios Simulado</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nof" className="pt-6">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-dashboard-green-600">NOF Simulado</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Contenido de NOF Simulado</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
