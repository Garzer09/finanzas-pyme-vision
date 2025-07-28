import { useState, useEffect } from 'react';
import { usePeriodContext } from '@/contexts/PeriodContext';

interface UsePeriodFilteredDataResult {
  data: any[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePeriodFilteredData = (dataType?: string): UsePeriodFilteredDataResult => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getPeriodFilteredData, selectedPeriods, availablePeriods } = usePeriodContext();

  const fetchData = async () => {
    if (!dataType) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getPeriodFilteredData(dataType);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
      console.error('Error fetching period filtered data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dataType, selectedPeriods, availablePeriods]);

  const refetch = async () => {
    await fetchData();
  };

  return {
    data,
    loading,
    error,
    refetch
  };
};