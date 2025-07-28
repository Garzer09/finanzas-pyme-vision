import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DebtStackedChartProps {
  data: Array<{
    periodo: string;
    deudaCorto: number;
    deudaLargo: number;
  }>;
}

export const DebtStackedChart = ({ data }: DebtStackedChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.dataKey === 'deudaCorto' ? 'Corto Plazo' : 'Largo Plazo'}:</span>
              <span className="text-sm font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2">
            <span className="text-sm font-semibold">Total: {formatCurrency(total)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
          <XAxis 
            dataKey="periodo" 
            className="text-xs fill-gray-600"
          />
          <YAxis 
            className="text-xs fill-gray-600"
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="deudaCorto" 
            stackId="debt" 
            name="Deuda Corto Plazo"
            fill="hsl(var(--warning))"
            radius={[0, 0, 4, 4]}
          />
          <Bar 
            dataKey="deudaLargo" 
            stackId="debt" 
            name="Deuda Largo Plazo"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};