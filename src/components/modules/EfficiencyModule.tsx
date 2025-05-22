
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export const EfficiencyModule = () => {
  const rotationsData = [
    { concepto: 'Rotación Existencias', empresa: 8.2, sector: 10.5, unidad: 'veces/año' },
    { concepto: 'Rotación Clientes', empresa: 5.9, sector: 7.2, unidad: 'veces/año' },
    { concepto: 'Rotación Proveedores', empresa: 8.9, sector: 8.1, unidad: 'veces/año' },
    { concepto: 'Rotación Activos', empresa: 1.3, sector: 1.8, unidad: 'veces/año' },
  ];

  const productivityData = [
    { concepto: 'Ventas por Empleado', valor: 125000, benchmark: 150000 },
    { concepto: 'EBITDA por Empleado', valor: 22500, benchmark: 27000 },
    { concepto: 'Gastos Personal/Ventas', valor: 16, benchmark: 14 },
  ];

  const cycleData = [
    { indicador: 'Días Existencias', value: 44, fullMark: 60 },
    { indicador: 'Días Clientes', value: 62, fullMark: 60 },
    { indicador: 'Días Proveedores', value: 41, fullMark: 60 },
    { indicador: 'Ciclo Caja', value: 65, fullMark: 60 },
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Rotaciones vs Sector</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rotationsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="concepto" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="empresa" fill="#3b82f6" name="Empresa" />
                <Bar dataKey="sector" fill="#10b981" name="Sector" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Ciclo Operativo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={cycleData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="indicador" className="text-sm" />
                <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
                <Radar
                  name="Días"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-sm text-blue-700 mb-1">Ciclo Total</p>
                <p className="text-xl font-bold text-blue-600">65 días</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-sm text-green-700 mb-1">Objetivo</p>
                <p className="text-xl font-bold text-green-600">50 días</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Análisis de Productividad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productivityData.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-slate-700">{item.concepto}</span>
                  <div className="flex space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Empresa</p>
                      <p className="font-bold text-slate-800">
                        {item.concepto.includes('%') || item.concepto.includes('/Ventas') 
                          ? `${item.valor}%` 
                          : formatCurrency(item.valor)
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Benchmark</p>
                      <p className="font-bold text-green-600">
                        {item.concepto.includes('%') || item.concepto.includes('/Ventas') 
                          ? `${item.benchmark}%` 
                          : formatCurrency(item.benchmark)
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (item.concepto.includes('/Ventas') ? item.valor <= item.benchmark : item.valor >= item.benchmark)
                        ? 'bg-green-500' 
                        : 'bg-yellow-500'
                    }`}
                    style={{ 
                      width: `${Math.min(
                        item.concepto.includes('/Ventas') 
                          ? (item.benchmark / item.valor) * 100
                          : (item.valor / item.benchmark) * 100, 
                        100
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Oportunidades de Mejora</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Reducir período medio de cobro en 12 días</li>
                <li>• Optimizar rotación de existencias</li>
                <li>• Mejorar productividad por empleado</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Fortalezas</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Gestión eficiente de proveedores</li>
                <li>• Control adecuado de gastos operativos</li>
                <li>• Rotación de activos estable</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
