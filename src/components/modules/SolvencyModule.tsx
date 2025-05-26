
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

  const balanceComposition = [
    { name: 'Activo Fijo', value: 1200, color: '#B5D5C5' },
    { name: 'Activo Circulante', value: 800, color: '#A5D7E8' },
    { name: 'Patrimonio Neto', value: 1100, color: '#9DC88D' },
    { name: 'Pasivo L/P', value: 650, color: '#F8CBA6' },
    { name: 'Pasivo C/P', value: 250, color: '#FFB5B5' },
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

  const getProgressColor = (estado: string) => {
    switch (estado) {
      case 'bueno': return 'bg-[#9DC88D]';
      case 'regular': return 'bg-[#F8CBA6]';
      case 'malo': return 'bg-[#FFB5B5]';
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

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12" fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-[#111518] font-bold">Estructura de Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={balanceComposition}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {balanceComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {balanceComposition.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-slate-700">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-[#111518] font-bold">Estructura de Deuda y Vencimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {debtStructure.map((debt, index) => (
              <div key={index} className="bg-[#B5D5C5] bg-opacity-20 p-4 rounded-lg border border-[#B5D5C5]">
                <h4 className="font-semibold text-[#4A7C59] mb-2">{debt.tipo}</h4>
                <p className="text-xl font-bold text-[#4A7C59] mb-1">
                  {formatCurrency(debt.valor)}
                </p>
                <p className="text-sm text-[#4A7C59]">Vencimiento: {debt.vencimiento}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#F8CBA6] bg-opacity-20 border border-[#F8CBA6] p-4 rounded-lg">
            <h4 className="font-semibold text-[#8B4513] mb-2">Cobertura del Servicio de Deuda</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#8B4513]">DSCR Actual</p>
                <p className="text-2xl font-bold text-[#8B4513]">1.85</p>
              </div>
              <div>
                <p className="text-sm text-[#8B4513]">Mínimo Recomendado</p>
                <p className="text-2xl font-bold text-[#8B4513]">1.25</p>
              </div>
            </div>
            <p className="text-xs text-[#8B4513] mt-2">
              Estado: Bueno - Capacidad adecuada para cubrir el servicio de deuda
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
