
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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
    { name: 'Margen Bruto', value: 40, color: '#10b981' },
    { name: 'EBITDA', value: 18, color: '#3b82f6' },
    { name: 'EBIT', value: 14.8, color: '#8b5cf6' },
    { name: 'Beneficio Neto', value: 9.75, color: '#f59e0b' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Cuenta de Resultados Analítica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {plData.map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center py-2 px-3 rounded ${
                      item.destacar
                        ? 'bg-blue-50 border border-blue-200 font-semibold'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`${item.destacar ? 'text-blue-800' : 'text-slate-700'}`}>
                      {item.concepto}
                    </span>
                    <div className="flex space-x-4 text-right">
                      <span className={`font-mono ${
                        item.valor >= 0 ? 'text-green-600' : 'text-red-600'
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
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Distribución de Márgenes</CardTitle>
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
        <CardHeader>
          <CardTitle>Análisis de Punto Muerto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Costes Fijos</h4>
              <p className="text-2xl font-bold text-blue-600">€550K</p>
              <p className="text-sm text-blue-700">Anuales</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Margen Contribución</h4>
              <p className="text-2xl font-bold text-green-600">40%</p>
              <p className="text-sm text-green-700">Sobre ventas</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Punto Equilibrio</h4>
              <p className="text-2xl font-bold text-orange-600">€1.375M</p>
              <p className="text-sm text-orange-700">Ventas anuales</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
