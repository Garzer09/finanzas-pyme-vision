import { useState, useEffect } from 'react';
import { usePeriodContext } from '@/contexts/PeriodContext';
import { useCompany } from '@/contexts/CompanyContext';

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
  const { selectedCompany } = useCompany();

  const fetchData = async () => {
    if (!dataType || !selectedCompany?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Pass company filter to the period context
      const result = await getPeriodFilteredData(dataType, selectedCompany.id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
      console.error('Error fetching company-filtered data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dataType, selectedPeriods, availablePeriods, selectedCompany?.id]);

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