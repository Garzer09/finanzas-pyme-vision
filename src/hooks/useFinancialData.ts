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
      
      // Use real data if available, otherwise fall back to demo data
      const finalData = result && result.length > 0 ? result : demoFinancialData;
      setData(finalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
      // On error, still show demo data
      setData(demoFinancialData);
    } finally {
      setLoading(false);
    }
  };

  const getLatestData = (type: string) => {
    return data.find(item => item.data_type === type);
  };

  const getPeriodComparison = (type: string) => {
    const typeData = data.filter(item => item.data_type === type);
    return typeData.slice(0, 2); // Current and previous period
  };

  const calculateGrowth = (current: any, previous: any, field: string) => {
    if (!current || !previous) return 0;
    
    const currentValue = Number(current?.[field]) || 0;
    const previousValue = Number(previous?.[field]) || 0;
    
    if (previousValue === 0 || isNaN(currentValue) || isNaN(previousValue)) return 0;
    
    const growth = ((currentValue - previousValue) / previousValue) * 100;
    return isNaN(growth) ? 0 : growth;
  };

  return {
    data,
    loading,
    error,
    getLatestData,
    getPeriodComparison,
    calculateGrowth,
    refetch: fetchFinancialData
  };
};