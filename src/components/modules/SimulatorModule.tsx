
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  const projectionData = [
    { month: 'Actual', ventas: 2500, ebitda: 450, caja: 125 },
    { month: 'Proyección', ventas: simulatedSales / 1000, ebitda: simulatedEbitda / 1000, caja: (baseData.currentCash + cashImpact) / 1000 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const resetSimulation = () => {
    setSalesChange([0]);
    setCostsChange([0]);
    setCollectionDays([62]);
    setPaymentDays([41]);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Simulador What-If</span>
            <Button variant="outline" onClick={resetSimulation}>
              Resetear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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
              <h3 className="text-lg font-semibold text-slate-800">Impacto Proyectado</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Ventas</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(simulatedSales)}
                  </p>
                  <p className="text-xs text-blue-500">
                    {salesChange[0] > 0 ? '+' : ''}{formatCurrency(simulatedSales - baseData.sales)}
                  </p>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">EBITDA</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(simulatedEbitda)}
                  </p>
                  <p className="text-xs text-green-500">
                    {simulatedEbitda > baseData.ebitda ? '+' : ''}{formatCurrency(simulatedEbitda - baseData.ebitda)}
                  </p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-700 mb-1">NOF</p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(simulatedNOF)}
                  </p>
                  <p className="text-xs text-purple-500">
                    {nofChange > 0 ? '+' : ''}{formatCurrency(nofChange)}
                  </p>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm text-orange-700 mb-1">Impacto Caja</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatCurrency(cashImpact)}
                  </p>
                  <p className="text-xs text-orange-500">
                    {cashImpact > 0 ? 'Generación' : 'Consumo'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Proyección Comparativa</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value) => [formatCurrency(Number(value) * 1000), '']}
              />
              <Line 
                type="monotone" 
                dataKey="ventas" 
                stroke="#2563eb" 
                strokeWidth={3}
                name="Ventas (K€)"
              />
              <Line 
                type="monotone" 
                dataKey="ebitda" 
                stroke="#10b981" 
                strokeWidth={3}
                name="EBITDA (K€)"
              />
              <Line 
                type="monotone" 
                dataKey="caja" 
                stroke="#f59e0b" 
                strokeWidth={3}
                name="Caja (K€)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Análisis de Sensibilidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">Escenario Optimista (+20% ventas)</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">EBITDA:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(950000)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Margen:</span>
                  <span className="font-bold text-blue-600">31.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">ROE:</span>
                  <span className="font-bold text-blue-600">86.4%</span>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-3">Escenario Pesimista (-15% ventas)</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-red-700">EBITDA:</span>
                  <span className="font-bold text-red-600">{formatCurrency(75000)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Margen:</span>
                  <span className="font-bold text-red-600">3.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Alerta:</span>
                  <span className="font-bold text-red-600">Punto muerto</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
