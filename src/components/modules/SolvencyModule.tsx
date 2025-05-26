
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const SolvencyModule = () => {
  const balanceData = [
    { categoria: 'Activo Fijo', valor: 1200, tipo: 'activo' },
    { categoria: 'Activo Circulante', valor: 800, tipo: 'activo' },
    { categoria: 'Patrimonio Neto', valor: 1100, tipo: 'pasivo' },
    { categoria: 'Pasivo LP', valor: 650, tipo: 'pasivo' },
    { categoria: 'Pasivo CP', valor: 250, tipo: 'pasivo' },
  ];

  // Datos para gráficos de barras apiladas
  const activoData = [
    {
      categoria: 'Activo',
      'Activo Fijo': 1200,
      'Activo Circulante': 800,
      total: 2000
    }
  ];

  const pasivoData = [
    {
      categoria: 'Pasivo y Patrimonio',
      'Patrimonio Neto': 1100,
      'Pasivo L/P': 650,
      'Pasivo C/P': 250,
      total: 2000
    }
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
      case 'bueno': return 'text-dashboard-green-500';
      case 'regular': return 'text-dashboard-orange-500';
      case 'malo': return 'text-dashboard-red-500';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = (estado: string) => {
    switch (estado) {
      case 'bueno': return 'bg-dashboard-green-300';
      case 'regular': return 'bg-dashboard-orange-200';
      case 'malo': return 'bg-dashboard-red-200';
      default: return 'bg-gray-500';
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
            <CardTitle className="text-[#111518] font-bold">Estructura del Activo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={activoData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="categoria" stroke="#637988" />
                <YAxis stroke="#637988" />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="Activo Fijo" stackId="activo" fill="#7CB342" name="Activo Fijo" />
                <Bar dataKey="Activo Circulante" stackId="activo" fill="#9CCC65" name="Activo Circulante" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#7CB342]"></div>
                <span className="text-slate-700">Activo Fijo: {formatCurrency(1200)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#9CCC65]"></div>
                <span className="text-slate-700">Activo Circulante: {formatCurrency(800)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-[#111518] font-bold">Estructura del Pasivo y Patrimonio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={pasivoData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="categoria" stroke="#637988" />
                <YAxis stroke="#637988" />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="Patrimonio Neto" stackId="pasivo" fill="#FF8A65" name="Patrimonio Neto" />
                <Bar dataKey="Pasivo L/P" stackId="pasivo" fill="#FFAB91" name="Pasivo L/P" />
                <Bar dataKey="Pasivo C/P" stackId="pasivo" fill="#FFCC9C" name="Pasivo C/P" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#FF8A65]"></div>
                <span className="text-slate-700">Patrimonio Neto: {formatCurrency(1100)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#FFAB91]"></div>
                <span className="text-slate-700">Pasivo L/P: {formatCurrency(650)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#FFCC9C]"></div>
                <span className="text-slate-700">Pasivo C/P: {formatCurrency(250)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-[#111518] font-bold">Ratios de Solvencia</CardTitle>
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
                    className={`h-2 rounded-full ${getProgressColor(ratio.estado)}`}
                    style={{ width: `${Math.min((ratio.valor / ratio.referencia) * 50, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-[#111518] font-bold">Estructura de Deuda y Vencimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {debtStructure.map((debt, index) => (
              <div key={index} className="bg-dashboard-green-200 bg-opacity-50 p-4 rounded-lg border border-dashboard-green-200">
                <h4 className="font-semibold text-dashboard-green-500 mb-2">{debt.tipo}</h4>
                <p className="text-xl font-bold text-dashboard-green-500 mb-1">
                  {formatCurrency(debt.valor)}
                </p>
                <p className="text-sm text-dashboard-green-500">Vencimiento: {debt.vencimiento}</p>
              </div>
            ))}
          </div>

          <div className="bg-dashboard-orange-200 bg-opacity-50 border border-dashboard-orange-200 p-4 rounded-lg">
            <h4 className="font-semibold text-dashboard-orange-500 mb-2">Cobertura del Servicio de Deuda</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-dashboard-orange-500">DSCR Actual</p>
                <p className="text-2xl font-bold text-dashboard-orange-500">1.85</p>
              </div>
              <div>
                <p className="text-sm text-dashboard-orange-500">Mínimo Recomendado</p>
                <p className="text-2xl font-bold text-dashboard-orange-500">1.25</p>
              </div>
            </div>
            <p className="text-xs text-dashboard-orange-500 mt-2">
              Estado: Bueno - Capacidad adecuada para cubrir el servicio de deuda
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
