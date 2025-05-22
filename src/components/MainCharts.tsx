
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Evolución de Ventas vs Presupuesto</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
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
                stroke="#2563eb" 
                strokeWidth={3}
                name="Ventas Reales"
              />
              <Line 
                type="monotone" 
                dataKey="presupuesto" 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Presupuesto"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Generación vs Consumo de Caja</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="generacion" fill="#10b981" name="Generación" />
              <Bar dataKey="consumo" fill="#ef4444" name="Consumo" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
