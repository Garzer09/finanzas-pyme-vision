import { useCompanyFinancialData } from '@/hooks/useOptimizedQueries';
import { useCompany } from '@/contexts/CompanyContext';
import { useMemo } from 'react';

interface UsePeriodFilteredDataResult {
  data: any[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePeriodFilteredData = (dataType?: string): UsePeriodFilteredDataResult => {
  const { selectedCompany } = useCompany();
  const queries = useCompanyFinancialData(selectedCompany?.id || '');
  
  const result = useMemo(() => {

    if (!selectedCompany?.id) {
      return {
        data: [],
        loading: false,
        error: null,
        refetch: async () => {}
      };
    }

    // Map dataType to appropriate query
    let queryIndex = -1;
    let targetData: any[] = [];
    
    if (dataType === 'pyg' || dataType === 'profit_loss') {
      queryIndex = 0;
    } else if (dataType === 'balance' || dataType === 'balance_sheet') {
      queryIndex = 1;
    }

    if (queryIndex >= 0 && queries[queryIndex]) {
      const query = queries[queryIndex];
      targetData = query.data || [];
      
      return {
        data: targetData,
        loading: query.isLoading,
        error: query.error?.message || null,
        refetch: async () => { await query.refetch(); }
      };
    }

    // Default case - combine all data
    const allData = queries.reduce((acc, query) => {
      if (query.data) {
        acc.push(...query.data);
      }
      return acc;
    }, [] as any[]);

    const isLoading = queries.some(query => query.isLoading);
    const errorMessages = queries
      .filter(query => query.error)
      .map(query => query.error?.message)
      .join(', ');

    return {
      data: allData,
      loading: isLoading,
      error: errorMessages || null,
      refetch: async () => {
        await Promise.all(queries.map(query => query.refetch()));
      }
    };
  }, [queries, dataType, selectedCompany?.id]);

  return result;
};