
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const LiquidityModule = () => {
  const treasuryData = [
    { dia: 'Hoy', saldoInicial: 125, cobros: 45, pagos: -65, saldoFinal: 105 },
    { dia: '+7d', saldoInicial: 105, cobros: 85, pagos: -75, saldoFinal: 115 },
    { dia: '+14d', saldoInicial: 115, cobros: 35, pagos: -95, saldoFinal: 55 },
    { dia: '+21d', saldoInicial: 55, cobros: 125, pagos: -85, saldoFinal: 95 },
    { dia: '+30d', saldoInicial: 95, cobros: 75, pagos: -105, saldoFinal: 65 },
  ];

  const nofData = [
    { concepto: 'Existencias', valor: 180000 },
    { concepto: 'Clientes', valor: 420000 },
    { concepto: 'Proveedores', valor: -280000 },
    { concepto: 'NOF Total', valor: 320000 },
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
            <CardTitle>Previsión de Tesorería</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={treasuryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dia" stroke="#64748b" />
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
                  dataKey="saldoFinal" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  name="Saldo Final"
                />
                <Line 
                  type="monotone" 
                  dataKey="cobros" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Cobros"
                />
                <Line 
                  type="monotone" 
                  dataKey="pagos" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Pagos"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Análisis NOF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nofData.map((item, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center py-3 px-4 rounded-lg ${
                    item.concepto === 'NOF Total'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <span className={`font-medium ${
                    item.concepto === 'NOF Total' ? 'text-blue-800' : 'text-slate-700'
                  }`}>
                    {item.concepto}
                  </span>
                  <span className={`font-bold ${
                    item.valor >= 0 ? 'text-green-600' : 'text-red-600'
                  } ${item.concepto === 'NOF Total' ? 'text-lg' : ''}`}>
                    {formatCurrency(item.valor)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <p className="text-sm text-yellow-700 mb-1">Período Medio Cobro</p>
                <p className="text-xl font-bold text-yellow-600">62 días</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-sm text-green-700 mb-1">Período Medio Pago</p>
                <p className="text-xl font-bold text-green-600">41 días</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Alertas de Liquidez</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Tensión Crítica</h4>
              <p className="text-sm text-red-600 mb-2">Día +14: Saldo previsto €55K</p>
              <p className="text-xs text-red-500">Acción: Acelerar cobros pendientes</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Ciclo de Caja</h4>
              <p className="text-sm text-yellow-600 mb-2">82 días de conversión</p>
              <p className="text-xs text-yellow-500">Superior a media sectorial (65d)</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Recomendación</h4>
              <p className="text-sm text-blue-600 mb-2">Línea de crédito preventiva</p>
              <p className="text-xs text-blue-500">€200K para situaciones críticas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
