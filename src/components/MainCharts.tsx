
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
      <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6">
        <p className="text-[#111518] text-base font-medium leading-normal">Evolución de Ventas vs Presupuesto</p>
        <p className="text-[#111518] tracking-light text-[32px] font-bold leading-tight truncate">€2.5M</p>
        <div className="flex gap-1">
          <p className="text-[#637988] text-base font-normal leading-normal">Current Year</p>
          <p className="text-[#078838] text-base font-medium leading-normal">+12%</p>
        </div>
        <div className="flex min-h-[180px] flex-1 flex-col gap-8 py-4">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#637988" />
              <YAxis stroke="#637988" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="ventas" 
                stroke="#111518" 
                strokeWidth={3}
                name="Ventas Reales"
              />
              <Line 
                type="monotone" 
                dataKey="presupuesto" 
                stroke="#637988" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Presupuesto"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-around">
            {salesData.map((data) => (
              <p key={data.month} className="text-[#637988] text-[13px] font-bold leading-normal tracking-[0.015em]">{data.month}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#dce1e5] p-6">
        <p className="text-[#111518] text-base font-medium leading-normal">Generación vs Consumo de Caja</p>
        <p className="text-[#111518] tracking-light text-[32px] font-bold leading-tight truncate">€125K</p>
        <p className="text-[#637988] text-base font-normal leading-normal">Current</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#637988" />
            <YAxis stroke="#637988" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }} 
            />
            <Bar dataKey="generacion" fill="#f0f3f4" stroke="#637988" strokeWidth={2} name="Generación" />
            <Bar dataKey="consumo" fill="#f0f3f4" stroke="#637988" strokeWidth={2} name="Consumo" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
