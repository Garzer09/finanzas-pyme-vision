import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Treemap,
  ResponsiveContainer,
  Tooltip,
  Cell
} from 'recharts';
import { Building2, PieChart } from 'lucide-react';
import { ComposicionEntidadChart } from './ComposicionEntidadChart';

interface ChartData {
  name: string;
  value: number;
  percentage: number;
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


  const TreemapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800">{data.name}</p>
          <p className="text-slate-600">
            Importe: <span className="font-medium">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-slate-600">
            Porcentaje: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for treemap
  const renderTreemapContent = (props: any) => {
    const { x, y, width, height, name, value, percentage } = props;
    
    // Only show label if cell is large enough
    if (width < 80 || height < 60) return null;
    
    return (
      <text 
        x={x + width / 2} 
        y={y + height / 2} 
        textAnchor="middle" 
        fill="white" 
        fontSize="12"
        fontWeight="500"
      >
        <tspan x={x + width / 2} dy="0">{name}</tspan>
        <tspan x={x + width / 2} dy="16">{percentage.toFixed(1)}%</tspan>
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Composición por entidad - Nuevo componente */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#005E8A]" />
            Composición por Entidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ComposicionEntidadChart debtByEntity={debtByEntity} />
        </CardContent>
      </Card>

      {/* Treemap por tipo */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-[#005E8A]" />
            Composición por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={debtByType}
                dataKey="value"
                aspectRatio={4/3}
                stroke="#fff"
              >
                <Tooltip content={<TreemapTooltip />} />
                {debtByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Treemap>
            </ResponsiveContainer>
          </div>
          
          {/* Legend for treemap */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {debtByType.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-slate-600">
                  {item.name} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};