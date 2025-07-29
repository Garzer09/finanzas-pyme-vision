import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface PhysicalUnitsData {
  has_physical_data: boolean;
  units_sold?: number;
  units_produced?: number;
  unit_type?: string;
  average_unit_price?: number;
  unit_cost?: number;
  production_volume?: number;
  inventory_units?: number;
  quality_metrics?: {
    yield_rate?: number;
    waste_percentage?: number;
  };
  periods?: Record<string, {
    units: number;
    revenue: number;
  }>;
}

export interface PhysicalUnitsKPI {
  title: string;
  value: string | number;
  unit: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  subtitle?: string;
}

export const usePhysicalUnitsData = () => {
  const [physicalData, setPhysicalData] = useState<PhysicalUnitsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPhysicalData();
    }
  }, [user]);

  const fetchPhysicalData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('financial_data')
        .select('physical_units_data, period_date, data_content')
        .not('physical_units_data', 'eq', '{}')
        .order('period_date', { ascending: false })
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        // Verificar si realmente hay datos físicos (no vacíos)
        const hasActualPhysicalData = data.some(item => {
          const physicalData = item.physical_units_data;
          return physicalData && 
                 typeof physicalData === 'object' && 
                 !Array.isArray(physicalData) &&
                 (physicalData as any).has_physical_data === true &&
                 Object.keys((physicalData as any).datos_detallados || {}).length > 0;
        });
        
        if (hasActualPhysicalData) {
          const latestData = data[0];
          const processedData = processPhysicalData(latestData.physical_units_data);
          setPhysicalData(processedData);
        } else {
          // No hay datos físicos reales, dejar physicalData como null
          setPhysicalData(null);
        }
      } else {
        setPhysicalData(null);
      }
    } catch (err) {
      console.error('Error fetching physical units data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos de unidades');
      setPhysicalData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to process year-structured physical data
  const processPhysicalData = (rawData: any): PhysicalUnitsData => {
    const processed: PhysicalUnitsData = {
      has_physical_data: rawData.has_physical_data || false
    };

    if (rawData.datos_detallados) {
      const details = rawData.datos_detallados;
      
      // Extract latest year values
      const getLatestValue = (data: any): number => {
        if (typeof data === 'number') return data;
        if (typeof data === 'object' && data !== null) {
          const years = Object.keys(data).filter(k => !isNaN(Number(k))).sort().reverse();
          if (years.length > 0) {
            return Number(data[years[0]]) || 0;
          }
        }
        return 0;
      };

      // Process each field
      if (details.ventas_unidades) {
        processed.units_sold = getLatestValue(details.ventas_unidades);
      }
      
      if (details.produccion) {
        processed.units_produced = getLatestValue(details.produccion);
        processed.production_volume = processed.units_produced;
      }
      
      if (details.precio_medio_venta) {
        processed.average_unit_price = getLatestValue(details.precio_medio_venta);
      }
      
      if (details.coste_medio_produccion) {
        processed.unit_cost = getLatestValue(details.coste_medio_produccion);
      }
      
      // Extract unit type
      if (details.ventas_unidades?.unidad) {
        processed.unit_type = details.ventas_unidades.unidad;
      } else if (details.produccion?.unidad) {
        processed.unit_type = details.produccion.unidad;
      }
      
      // Calculate inventory (assuming production - sales)
      if (processed.units_produced && processed.units_sold) {
        processed.inventory_units = processed.units_produced - processed.units_sold;
      }
      
      // Quality metrics from capacity utilization
      if (details.utilizacion_capacidad) {
        const utilizacion = getLatestValue(details.utilizacion_capacidad);
        processed.quality_metrics = {
          yield_rate: utilizacion,
          waste_percentage: Math.max(0, 100 - utilizacion)
        };
      }
    }

    return processed;
  };

  const getPhysicalKPIs = (): PhysicalUnitsKPI[] => {
    if (!physicalData || !physicalData.has_physical_data) {
      return [];
    }

    const kpis: PhysicalUnitsKPI[] = [];

    // Unidades vendidas
    if (physicalData.units_sold) {
      kpis.push({
        title: 'Unidades Vendidas',
        value: physicalData.units_sold.toLocaleString(),
        unit: physicalData.unit_type || 'ud',
        subtitle: 'Total del período'
      });
    }

    // Precio unitario promedio
    if (physicalData.average_unit_price) {
      kpis.push({
        title: 'Precio Unitario Promedio',
        value: `${physicalData.average_unit_price.toFixed(2)}€`,
        unit: `/ ${physicalData.unit_type || 'ud'}`,
        subtitle: 'Precio medio de venta'
      });
    }

    // Volumen de producción
    if (physicalData.production_volume) {
      kpis.push({
        title: 'Volumen Producido',
        value: physicalData.production_volume.toLocaleString(),
        unit: physicalData.unit_type || 'ud',
        subtitle: 'Capacidad utilizada'
      });
    }

    // Coste unitario
    if (physicalData.unit_cost) {
      kpis.push({
        title: 'Coste Unitario',
        value: `${physicalData.unit_cost.toFixed(2)}€`,
        unit: `/ ${physicalData.unit_type || 'ud'}`,
        subtitle: 'Coste promedio'
      });
    }

    // Margen unitario
    if (physicalData.average_unit_price && physicalData.unit_cost) {
      const margin = physicalData.average_unit_price - physicalData.unit_cost;
      const marginPercentage = ((margin / physicalData.average_unit_price) * 100).toFixed(1);
      
      kpis.push({
        title: 'Margen Unitario',
        value: `${margin.toFixed(2)}€`,
        unit: `(${marginPercentage}%)`,
        subtitle: 'Beneficio por unidad'
      });
    }

    // Tasa de rendimiento
    if (physicalData.quality_metrics?.yield_rate) {
      kpis.push({
        title: 'Tasa de Rendimiento',
        value: `${physicalData.quality_metrics.yield_rate.toFixed(1)}%`,
        unit: '',
        subtitle: 'Eficiencia productiva'
      });
    }

    return kpis;
  };

  const hasPhysicalData = () => {
    return physicalData?.has_physical_data === true;
  };

  const getUnitType = () => {
    return physicalData?.unit_type || 'unidades';
  };

  return {
    physicalData,
    isLoading,
    error,
    getPhysicalKPIs,
    hasPhysicalData,
    getUnitType,
    refetch: fetchPhysicalData
  };
};