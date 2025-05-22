
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const SolvencyModule = () => {
  const balanceData = [
    { categoria: 'Activo Fijo', valor: 1200 },
    { categoria: 'Activo Circulante', valor: 800 },
    { categoria: 'Patrimonio Neto', valor: 1100 },
    { categoria: 'Pasivo LP', valor: 650 },
    { categoria: 'Pasivo CP', valor: 250 },
  ];

  const ratiosData = [
    { ratio: 'Liquidez General', valor: 3.2, referencia: 1.5, estado: 'bueno' },
    { ratio: 'Test Ácido', valor: 2.1, referencia: 1.0, estado: 'bueno' },
    { ratio: 'Solvencia Total', valor: 2.1, referencia: 1.5, estado: 'bueno' },
    { ratio: 'Endeudamiento/EBITDA', valor: 2.1, referencia: 3.0, estado: 'bueno' },
  ];

  const debtStructure = [
    { tipo: 'Deuda Bancaria LP', valor: 650, vencimiento: '2027' },
    { tipo: 'Proveedores', valor: 180, vencimiento: '< 30d' },
    { tipo: 'Otras deudas CP', valor: 70, vencimiento: '< 90d' },
  ];

  const getStateColor = (estado: string) => {
    switch (estado) {
      case 'bueno': return 'text-green-600';
      case 'regular': return 'text-yellow-600';
      case 'malo': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value * 1000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Estructura de Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={balanceData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis type="category" dataKey="categoria" stroke="#64748b" width={120} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="valor" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Ratios de Solvencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ratiosData.map((ratio, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-slate-700">{ratio.ratio}</span>
                    <span className={`font-bold ${getStateColor(ratio.estado)}`}>
                      {ratio.valor.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Referencia: {ratio.referencia}</span>
                    <span className={`font-medium ${getStateColor(ratio.estado)}`}>
                      {ratio.estado.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        ratio.estado === 'bueno' ? 'bg-green-500' : 
                        ratio.estado === 'regular' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((ratio.valor / ratio.referencia) * 50, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Estructura de Deuda y Vencimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {debtStructure.map((debt, index) => (
              <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">{debt.tipo}</h4>
                <p className="text-xl font-bold text-blue-600 mb-1">
                  {formatCurrency(debt.valor)}
                </p>
                <p className="text-sm text-blue-700">Vencimiento: {debt.vencimiento}</p>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Cobertura del Servicio de Deuda</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-yellow-700">DSCR Actual</p>
                <p className="text-2xl font-bold text-yellow-600">1.85</p>
              </div>
              <div>
                <p className="text-sm text-yellow-700">Mínimo Recomendado</p>
                <p className="text-2xl font-bold text-yellow-500">1.25</p>
              </div>
            </div>
            <p className="text-xs text-yellow-600 mt-2">
              Estado: Bueno - Capacidad adecuada para cubrir el servicio de deuda
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
