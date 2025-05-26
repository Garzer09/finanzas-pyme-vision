
import { Card } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface DebtPoolChartsProps {
  debtByEntity: ChartData[];
  debtByType: ChartData[];
}

export const DebtPoolCharts = ({ debtByEntity, debtByType }: DebtPoolChartsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Composición por Entidad</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={debtByEntity}
                cx="50%"
                cy="50%"
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {debtByEntity.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => [formatCurrency(Number(value)), '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Composición por Tipo</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={debtByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => [formatCurrency(Number(value)), '']}
              />
              <Bar dataKey="value" fill="#3b82f6">
                {debtByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
