import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartProbeProps {
  rows: any[];
}

export const ChartProbe: React.FC<ChartProbeProps> = ({ rows }) => {
  // Mapear datos con coerción estricta
  const chartData = rows.map((row, index) => {
    let period = row.period_date || row.periodo || `2024-${(index + 1).toString().padStart(2, '0')}-01`;
    
    // Asegurar formato YYYY-MM-DD
    if (typeof period === 'string' && !period.includes('-')) {
      period = `${period}-01-01`;
    }

    // Coerción estricta del importe a número
    let amount = row.amount || row.importe || 0;
    if (typeof amount === 'string') {
      amount = parseFloat(amount.replace(',', '.'));
    }
    amount = Number(amount) || 0;

    return {
      x: period,
      y: amount,
      concept: row.concept || row.concepto || `Item ${index + 1}`,
      originalType: typeof (row.amount || row.importe)
    };
  });

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Prueba</CardTitle>
          <CardDescription>Sin datos</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <div className="text-4xl mb-2">📊</div>
            <div>No hay datos para mostrar</div>
            <div className="text-sm mt-2">Placeholder visible - funciona correctamente</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gráfico de Prueba - {rows.length} filas</CardTitle>
        <CardDescription>
          Validación de renderizado con coerción estricta de tipos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value: any, name: string, props: any) => [
                  `${Number(value).toLocaleString()} (${props.payload.originalType})`,
                  'Importe'
                ]}
                labelFormatter={(label) => `Periodo: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 space-y-2">
          <h4 className="font-semibold text-sm">Diagnóstico de Datos:</h4>
          {chartData.map((item, index) => (
            <div key={index} className="text-xs font-mono bg-gray-100 p-2 rounded">
              <span className="font-medium">{item.concept}:</span>{' '}
              <span className={typeof item.y === 'number' ? 'text-green-600' : 'text-red-600'}>
                {item.y} ({item.originalType} → {typeof item.y})
              </span>
              {' | '}<span className="text-blue-600">{item.x}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};