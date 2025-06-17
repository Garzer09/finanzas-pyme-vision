
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const MainCharts = () => {
  const salesData = [
    { month: 'Ene', ventas: 180, presupuesto: 200 },
    { month: 'Feb', ventas: 220, presupuesto: 210 },
    { month: 'Mar', ventas: 240, presupuesto: 220 },
    { month: 'Abr', ventas: 210, presupuesto: 230 },
    { month: 'May', ventas: 250, presupuesto: 240 },
  ];

  const cashFlowData = [
    { month: 'Ene', generacion: 45, consumo: -35 },
    { month: 'Feb', generacion: 52, consumo: -42 },
    { month: 'Mar', generacion: 48, consumo: -38 },
    { month: 'Abr', generacion: 38, consumo: -45 },
    { month: 'May', generacion: 55, consumo: -40 },
  ];

  return (
    <div className="flex flex-wrap gap-4 py-6">
      <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-light-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
        <p className="text-gray-900 text-base font-semibold leading-normal">Evolución de Ventas vs Presupuesto</p>
        <p className="text-gray-900 tracking-light text-[32px] font-bold leading-tight truncate">€2.5M</p>
        <div className="flex gap-1">
          <p className="text-gray-600 text-base font-normal leading-normal">Current Year</p>
          <p className="text-green-700 text-base font-semibold leading-normal">+12%</p>
        </div>
        <div className="flex min-h-[180px] flex-1 flex-col gap-8 py-4">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--light-gray-200))" />
              <XAxis dataKey="month" stroke="hsl(var(--steel-blue-dark))" fontSize={12} />
              <YAxis stroke="hsl(var(--steel-blue-dark))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid hsl(var(--light-gray-200))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '14px'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="ventas" 
                stroke="hsl(var(--steel-blue))" 
                strokeWidth={3}
                name="Ventas Reales"
                dot={{ fill: 'hsl(var(--steel-blue))', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="presupuesto" 
                stroke="hsl(var(--steel-blue-dark))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Presupuesto"
                dot={{ fill: 'hsl(var(--steel-blue-dark))', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-around">
            {salesData.map((data) => (
              <p key={data.month} className="text-gray-600 text-[13px] font-semibold leading-normal tracking-[0.015em]">{data.month}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-light-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
        <p className="text-gray-900 text-base font-semibold leading-normal">Generación vs Consumo de Caja</p>
        <p className="text-gray-900 tracking-light text-[32px] font-bold leading-tight truncate">€125K</p>
        <p className="text-gray-600 text-base font-normal leading-normal">Current</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--light-gray-200))" />
            <XAxis dataKey="month" stroke="hsl(var(--steel-blue-dark))" fontSize={12} />
            <YAxis stroke="hsl(var(--steel-blue-dark))" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid hsl(var(--light-gray-200))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                fontSize: '14px'
              }} 
            />
            <Bar 
              dataKey="generacion" 
              fill="hsl(var(--steel-blue))" 
              stroke="hsl(var(--steel-blue-dark))" 
              strokeWidth={1} 
              name="Generación" 
            />
            <Bar 
              dataKey="consumo" 
              fill="hsl(var(--light-gray-300))" 
              stroke="hsl(var(--steel-blue-dark))" 
              strokeWidth={1} 
              name="Consumo" 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
