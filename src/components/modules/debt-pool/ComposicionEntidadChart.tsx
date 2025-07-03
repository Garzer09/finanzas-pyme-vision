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

  // Procesar datos: ordenar y agrupar entidades <5% para gráfico apilado
  const processedEntities = () => {
    // Ordenar por importe descendente
    const sorted = [...debtByEntity].sort((a, b) => b.value - a.value);
    
    // Separar entidades principales (≥5%) y menores (<5%)
    const mainEntities = sorted.filter(item => item.percentage >= 5);
    const minorEntities = sorted.filter(item => item.percentage < 5);
    
    // Crear entrada "Otros" si hay entidades menores
    const otherEntities = minorEntities.length > 0 ? [{
      name: 'Otros',
      value: minorEntities.reduce((sum, item) => sum + item.value, 0),
      percentage: minorEntities.reduce((sum, item) => sum + item.percentage, 0)
    }] : [];
    
    // Combinar entidades finales
    return [...mainEntities, ...otherEntities];
  };

  // Transformar datos para barra apilada horizontal al 100%
  const stackedData = () => {
    const entities = processedEntities();
    
    // Crear un objeto con todas las entidades como propiedades
    const dataPoint: any = { category: 'Capital Pendiente' };
    
    entities.forEach((entity, index) => {
      dataPoint[entity.name] = entity.value;
      dataPoint[`${entity.name}_percentage`] = entity.percentage;
      dataPoint[`${entity.name}_color`] = CORPORATE_COLORS[index % CORPORATE_COLORS.length];
    });
    
    return [dataPoint];
  };

  const chartData = stackedData();
  const entities = processedEntities();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Tooltip minimal para gráfico apilado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const entidad = data.dataKey;
      const value = data.value;
      const percentage = data.payload[`${entidad}_percentage`];
      
      return (
        <div className="bg-white p-2 border border-slate-200 rounded-md shadow-lg text-xs min-w-[140px]">
          <p className="font-semibold text-slate-800 mb-1">{entidad}</p>
          <p className="text-slate-600">
            <span className="font-medium">{formatCurrency(value)}</span>
          </p>
          <p className="text-slate-600">
            <span className="font-medium">{percentage?.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Etiquetas internas para segmentos apilados
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    
    // Solo mostrar etiqueta si el segmento es lo suficientemente grande
    if (width < 80) return null;
    
    const labelX = x + width / 2;
    const labelY = y + height / 2;
    
    // Encontrar la entidad correspondiente para obtener el porcentaje
    const entity = entities.find(e => e.value === value);
    if (!entity) return null;
    
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
          {`${entity.percentage.toFixed(1)}%`}
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
            left: isMobile ? 40 : 60, 
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
            dataKey="category" 
            stroke="#64748b"
            fontSize={isMobile ? 10 : 11}
            width={isMobile ? 30 : 50}
          />
          <Tooltip 
            content={<CustomTooltip />}
            position={{ x: -10, y: 10 }}
            offset={10}
          />
          {entities.map((entity, index) => (
            <Bar
              key={entity.name}
              dataKey={entity.name}
              stackId="debt"
              fill={CORPORATE_COLORS[index % CORPORATE_COLORS.length]}
              radius={index === 0 ? [4, 0, 0, 4] : index === entities.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
              label={renderCustomLabel}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};