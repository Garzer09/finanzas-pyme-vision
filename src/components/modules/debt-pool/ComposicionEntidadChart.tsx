import { useIsMobile } from '@/hooks/use-mobile';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ComposicionEntidadChartProps {
  /** Array de datos de deuda por entidad */
  debtByEntity: ChartData[];
}

/**
 * Gráfico de barras horizontales que muestra la composición del capital pendiente por entidad bancaria.
 * Las barras están ordenadas por importe descendente y las entidades menores al 5% se agrupan en "Otros".
 * 
 * @component
 * @param {ChartData[]} debtByEntity - Array con los datos de deuda por entidad
 * @example
 * ```tsx
 * <ComposicionEntidadChart debtByEntity={debtData} />
 * ```
 */
export const ComposicionEntidadChart = ({ debtByEntity }: ComposicionEntidadChartProps) => {
  const isMobile = useIsMobile();

  // Colores corporativos fijos
  const CORPORATE_COLORS = ['#005E8A', '#6BD1FF', '#93C5FD', '#C1DBFF'];

  // Procesar datos: ordenar y agrupar entidades <5%
  const processedData = () => {
    // Ordenar por importe descendente
    const sorted = [...debtByEntity].sort((a, b) => b.value - a.value);
    
    // Separar entidades principales (≥5%) y menores (<5%)
    const mainEntities = sorted.filter(item => item.percentage >= 5);
    const minorEntities = sorted.filter(item => item.percentage < 5);
    
    // Crear entrada "Otros" si hay entidades menores
    const otherEntities = minorEntities.length > 0 ? [{
      name: 'Otros',
      value: minorEntities.reduce((sum, item) => sum + item.value, 0),
      percentage: minorEntities.reduce((sum, item) => sum + item.percentage, 0),
      color: CORPORATE_COLORS[3] // Último color para "Otros"
    }] : [];
    
    // Combinar y asignar colores corporativos
    const finalData = [...mainEntities, ...otherEntities].map((item, index) => ({
      ...item,
      color: CORPORATE_COLORS[index % CORPORATE_COLORS.length]
    }));
    
    return finalData;
  };

  const chartData = processedData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Tooltip minimal en esquina derecha
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-slate-200 rounded-md shadow-lg text-xs min-w-[140px]">
          <p className="font-semibold text-slate-800 mb-1">{data.name}</p>
          <p className="text-slate-600">
            <span className="font-medium">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-slate-600">
            <span className="font-medium">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Etiquetas internas con contraste AA
  const CustomLabel = (props: any) => {
    const { x, y, width, height, value, payload } = props;
    
    // Solo mostrar etiqueta si hay espacio suficiente
    if (width < 60) return null;
    
    const labelX = x + width / 2;
    const labelY = y + height / 2;
    
    return (
      <g>
        <text 
          x={labelX} 
          y={labelY - 4} 
          textAnchor="middle" 
          fill="white" 
          fontSize={isMobile ? "10" : "11"}
          fontWeight="600"
        >
          {`${(value / 1000).toFixed(0)}K€`}
        </text>
        <text 
          x={labelX} 
          y={labelY + 8} 
          textAnchor="middle" 
          fill="white" 
          fontSize={isMobile ? "9" : "10"}
          fontWeight="500"
        >
          {`${payload.percentage.toFixed(1)}%`}
        </text>
      </g>
    );
  };

  return (
    <div className="h-80">
      <ResponsiveContainer 
        width="100%" 
        height="100%"
        aspect={isMobile ? 1 / 1.2 : 2 / 1}
      >
        <BarChart 
          data={chartData} 
          layout="horizontal"
          margin={{ 
            top: 20, 
            right: 30, 
            left: isMobile ? 100 : 120, 
            bottom: 20 
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            type="number" 
            stroke="#64748b"
            fontSize={isMobile ? 10 : 12}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M€`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="#64748b"
            fontSize={isMobile ? 10 : 11}
            width={isMobile ? 90 : 110}
          />
          <Tooltip 
            content={<CustomTooltip />}
            position={{ x: -10, y: 10 }}
            offset={10}
          />
          <Bar 
            dataKey="value" 
            radius={[0, 4, 4, 0]}
            label={<CustomLabel />}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};