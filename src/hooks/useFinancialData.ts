import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialDataPoint {
  id: string;
  data_type: string;
  period_date: string;
  period_type: string;
  data_content: any;
  created_at: string;
}

// Demo data for visualization when no real data is available
const demoFinancialData: FinancialDataPoint[] = [
  {
    id: 'demo-pyg-2024',
    data_type: 'estado_pyg',
    period_date: '2024-12-31',
    period_type: 'annual',
    data_content: {
      ingresos_explotacion: 2840000,
      gastos_explotacion: 2100000,
      resultado_explotacion: 740000,
      gastos_financieros: 45000,
      resultado_neto: 520000
    },
    created_at: '2024-12-01T10:00:00Z'
  },
  {
    id: 'demo-pyg-2023',
    data_type: 'estado_pyg',
    period_date: '2023-12-31',
    period_type: 'annual',
    data_content: {
      ingresos_explotacion: 2450000,
      gastos_explotacion: 1850000,
      resultado_explotacion: 600000,
      gastos_financieros: 38000,
      resultado_neto: 420000
    },
    created_at: '2023-12-01T10:00:00Z'
  },
  {
    id: 'demo-balance-2024',
    data_type: 'estado_balance',
    period_date: '2024-12-31',
    period_type: 'annual',
    data_content: {
      activo_corriente: 1250000,
      activo_no_corriente: 1850000,
      pasivo_corriente: 650000,
      pasivo_no_corriente: 980000,
      patrimonio_neto: 1470000
    },
    created_at: '2024-12-01T10:00:00Z'
  },
  {
    id: 'demo-ratios-2024',
    data_type: 'ratios_financieros',
    period_date: '2024-12-31',
    period_type: 'annual',
    data_content: {
      liquidez: {
        ratio_corriente: 1.92,
        ratio_acido: 1.45,
        ratio_tesoreria: 0.68
      },
      endeudamiento: {
        ratio_endeudamiento: 52.5,
        deuda_patrimonio: 1.11,
        cobertura_intereses: 16.4
      },
      rentabilidad: {
        roe: 35.4,
        roa: 16.8,
        margen_neto: 18.3
      }
    },
    created_at: '2024-12-01T10:00:00Z'
  }
];

export const useFinancialData = (dataType?: string) => {
  const [data, setData] = useState<FinancialDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, [dataType]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      // Get latest financial data without user filtering for anonymous uploads
      let query = supabase
        .from('financial_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (dataType) {
        query = query.eq('data_type', dataType);
      }

      const { data: result, error } = await query;

      if (error) throw error;
      
      // Check if we have real data
      const hasRealDBData = result && result.length > 0;
      setHasRealData(hasRealDBData);
      
      // Process real data to extract latest year values or use demo data
      const finalData = hasRealDBData ? processRealData(result) : demoFinancialData;
      setData(finalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
      setHasRealData(false);
      setData(demoFinancialData);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract the latest year value from year-structured data
  const extractLatestValue = (yearData: any): number => {
    if (typeof yearData === 'number') return yearData;
    if (typeof yearData === 'object' && yearData !== null) {
      const years = Object.keys(yearData).sort().reverse();
      if (years.length > 0) {
        return Number(yearData[years[0]]) || 0;
      }
    }
    return 0;
  };

  // Helper function to get all years from year-structured data
  const getAllYearValues = (yearData: any): Record<string, number> => {
    if (typeof yearData === 'object' && yearData !== null && !Array.isArray(yearData)) {
      return yearData;
    }
    return {};
  };

  // Process real data to flatten year-structured values
  const processRealData = (realData: any[]): FinancialDataPoint[] => {
    return realData.map(item => {
      const flattenedContent: any = {};
      
      if (item.data_content && typeof item.data_content === 'object') {
        Object.keys(item.data_content).forEach(key => {
          const value = item.data_content[key];
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Handle nested objects (like liquidez, endeudamiento in ratios)
            if (item.data_type === 'ratios_financieros') {
              flattenedContent[key] = value;
            } else {
              // For other data types, extract latest year value
              flattenedContent[key] = extractLatestValue(value);
            }
          } else {
            flattenedContent[key] = value;
          }
        });
      }
      
      return {
        ...item,
        data_content: flattenedContent
      };
    });
  };

  const getLatestData = (type: string) => {
    return data.find(item => item.data_type === type);
  };

  const getPeriodComparison = (type: string) => {
    const typeData = data.filter(item => item.data_type === type);
    return typeData.slice(0, 2); // Current and previous period
  };

  // Get multi-year data for charts
  const getMultiYearData = (type: string) => {
    const item = data.find(d => d.data_type === type);
    if (!item?.data_content) return [];
    
    const years = new Set<string>();
    Object.values(item.data_content).forEach(value => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.keys(value).forEach(year => {
          if (!isNaN(Number(year))) years.add(year);
        });
      }
    });
    
    return Array.from(years).sort().map(year => {
      const yearData: any = { year };
      Object.keys(item.data_content).forEach(key => {
        const value = item.data_content[key];
        if (typeof value === 'object' && value !== null && value[year] !== undefined) {
          yearData[key] = value[year];
        }
      });
      return yearData;
    });
  };

  const calculateGrowth = (current: any, previous: any, field: string) => {
    // Validaciones robustas para evitar NaN
    if (!current || !previous || !field) return 0;
    
    const currentValue = Number(current?.[field]);
    const previousValue = Number(previous?.[field]);
    
    // Verificar que ambos valores sean números válidos y finitos
    if (!isFinite(currentValue) || !isFinite(previousValue)) return 0;
    if (isNaN(currentValue) || isNaN(previousValue)) return 0;
    if (previousValue === 0) return 0;
    
    const growth = ((currentValue - previousValue) / previousValue) * 100;
    
    // Verificar que el crecimiento calculado sea válido
    if (!isFinite(growth) || isNaN(growth)) return 0;
    
    // Limitar valores extremos para evitar outliers
    return Math.max(-99.9, Math.min(999.9, growth));
  };

  // Función auxiliar para validar números
  const safeNumber = (value: any, fallback: number = 0): number => {
    const num = Number(value);
    return isFinite(num) && !isNaN(num) ? num : fallback;
  };

  return {
    data,
    loading,
    error,
    hasRealData,
    getLatestData,
    getPeriodComparison,
    getMultiYearData,
    calculateGrowth,
    safeNumber,
    refetch: fetchFinancialData
  };
};