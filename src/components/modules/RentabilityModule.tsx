
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export const RentabilityModule = () => {
  const plData = [
    { concepto: 'Ventas Netas', valor: 2500000, porcentaje: 100 },
    { concepto: 'Coste de Ventas', valor: -1500000, porcentaje: -60 },
    { concepto: 'MARGEN BRUTO', valor: 1000000, porcentaje: 40, destacar: true },
    { concepto: 'Gastos Personal', valor: -400000, porcentaje: -16 },
    { concepto: 'Otros Gastos Explotación', valor: -150000, porcentaje: -6 },
    { concepto: 'EBITDA', valor: 450000, porcentaje: 18, destacar: true },
    { concepto: 'Amortizaciones', valor: -80000, porcentaje: -3.2 },
    { concepto: 'EBIT', valor: 370000, porcentaje: 14.8, destacar: true },
    { concepto: 'Gastos Financieros', valor: -45000, porcentaje: -1.8 },
    { concepto: 'BAI', valor: 325000, porcentaje: 13 },
    { concepto: 'Impuestos', valor: -81250, porcentaje: -3.25 },
    { concepto: 'BENEFICIO NETO', valor: 243750, porcentaje: 9.75, destacar: true },
  ];

  const marginsData = [
    { name: 'Margen Bruto', value: 40, color: '#A5D7E8' }, // Azul pastel
    { name: 'EBITDA', value: 18, color: '#B4E4FF' }, // Azul claro pastel
    { name: 'EBIT', value: 14.8, color: '#BDCDD6' }, // Gris azulado pastel
    { name: 'Beneficio Neto', value: 9.75, color: '#EEE9DA' }, // Beige pastel
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const breakEvenData = {
    fixedCosts: 550000,
    variableCosts: 60, // 60% sobre ventas
    breakEven: 1375000,
    contributionMargin: 40, // 40% sobre ventas
    operatingLeverage: 2.5
  };

  return (
    <div className="space-y-6" style={{ fontFamily: '"Noto Sans", sans-serif' }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="text-slate-800">Cuenta de Resultados Analítica</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {plData.map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center py-2.5 px-4 border-b border-slate-100 ${
                      item.destacar
                        ? 'bg-blue-50 font-semibold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`${item.destacar ? 'text-blue-800' : 'text-slate-700'}`}>
                      {item.concepto}
                    </span>
                    <div className="flex space-x-4 text-right">
                      <span className={`font-mono ${
                        item.valor >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      } ${item.destacar ? 'font-bold' : ''}`}>
                        {formatCurrency(item.valor)}
                      </span>
                      <span className={`text-slate-500 w-12 ${item.destacar ? 'font-semibold' : ''}`}>
                        {item.porcentaje.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="text-slate-800">Distribución de Márgenes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={marginsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {marginsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="mt-4 space-y-2">
                {marginsData.map((margin, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: margin.color }}
                      ></div>
                      <span className="text-sm text-slate-600">{margin.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{margin.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="text-slate-800">Análisis de Punto Muerto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-slate-800">Break-Even Point Analysis</h3>
            
            <div className="mb-6">
              <div className="flex flex-col mb-2">
                <span className="text-slate-600 mb-1">Break-Even Point</span>
                <span className="text-3xl font-bold text-slate-800">{formatCurrency(breakEvenData.breakEven)}</span>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-slate-500">Current</span>
                  <span className="text-emerald-600 font-medium">+10%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 rounded-lg p-4 flex flex-col">
                  <div className="h-16 bg-blue-100 w-full rounded-md mb-2"></div>
                  <span className="text-center text-sm text-slate-600">Sales</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 flex flex-col">
                  <div className="h-16 bg-blue-100 w-full rounded-md mb-2"></div>
                  <span className="text-center text-sm text-slate-600">Fixed Costs</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 flex flex-col">
                  <div className="h-16 bg-blue-100 w-full rounded-md mb-2"></div>
                  <span className="text-center text-sm text-slate-600">Variable Costs</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">Fixed Costs</span>
                  <span className="text-slate-800 font-medium">€{breakEvenData.fixedCosts.toLocaleString()}</span>
                </div>
                <Slider defaultValue={[50]} max={100} step={1} className="py-4" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">Variable Costs</span>
                  <span className="text-slate-800 font-medium">{breakEvenData.variableCosts}%</span>
                </div>
                <Slider defaultValue={[60]} max={100} step={1} className="py-4" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Break-Even Point</h4>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(breakEvenData.breakEven)}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <h4 className="font-semibold text-emerald-800 mb-2">Contribution Margin</h4>
                <p className="text-2xl font-bold text-slate-800">{breakEvenData.contributionMargin}%</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">Operating Leverage</h4>
                <p className="text-2xl font-bold text-slate-800">{breakEvenData.operatingLeverage}</p>
              </div>
            </div>
          </div>
          
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-amber-800">Alert: Nearing Break-Even Point</AlertTitle>
            <AlertDescription className="text-amber-700">
              Your company is approaching its break-even point. Current break-even point is {formatCurrency(breakEvenData.breakEven)}, equivalent to 20 days of sales.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

// Importamos el componente AlertCircle que necesitamos
import { AlertCircle } from 'lucide-react';
