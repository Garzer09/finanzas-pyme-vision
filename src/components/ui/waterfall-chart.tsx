
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface WaterfallData {
  name: string;
  value: number;
  cumulative?: number;
  type: 'positive' | 'negative' | 'total';
}

interface WaterfallChartProps {
  data: WaterfallData[];
  height?: number;
  className?: string;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({
  data,
  height = 400,
  className = ''
}) => {
  // Process data for waterfall effect
  const processedData = data.map((item, index) => {
    let cumulative = 0;
    
    // Calculate cumulative value up to this point
    for (let i = 0; i <= index; i++) {
      if (data[i].type === 'total') {
        cumulative = data[i].value;
      } else {
        cumulative += data[i].value;
      }
    }
    
    // For display purposes, we need start and end values
    const prevCumulative = index === 0 ? 0 : (data[index - 1].cumulative || 0);
    const start = item.type === 'total' ? 0 : prevCumulative;
    const end = item.type === 'total' ? item.value : cumulative;
    
    return {
      ...item,
      cumulative,
      start,
      end,
      displayValue: Math.abs(item.value)
    };
  });

  const getBarColor = (type: string) => {
    switch (type) {
      case 'positive':
        return '#10B981'; // Success green
      case 'negative':
        return '#EF4444'; // Danger red
      case 'total':
        return '#4682B4'; // Steel blue
      default:
        return '#6B7280'; // Gray
    }
  };

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
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800">{label}</p>
          <p className="text-slate-600">
            Valor: <span className="font-medium">{formatCurrency(data.value)}</span>
          </p>
          {data.cumulative !== undefined && (
            <p className="text-slate-600">
              Acumulado: <span className="font-medium">{formatCurrency(data.cumulative)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={processedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
            stroke="#6B7280"
          />
          <YAxis 
            tickFormatter={formatCurrency}
            fontSize={12}
            stroke="#6B7280"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="displayValue" radius={[4, 4, 0, 0]}>
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
