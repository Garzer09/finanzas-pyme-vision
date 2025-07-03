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
      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
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
    const currentValue = Number(current?.[field]) || 0;
    const previousValue = Number(previous?.[field]) || 0;
    
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
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