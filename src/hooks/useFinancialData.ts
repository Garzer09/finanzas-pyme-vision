import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { debugManager } from '@/utils/debugManager';

export interface FinancialDataPoint {
  id: string;
  data_type: string;
  period_date: string;
  period_type: string;
  data_content: any;
  created_at: string;
}

// Note: Mock data removed - only real data from database will be displayed

export const useFinancialData = (dataType?: string, companyId?: string) => {
  const [data, setData] = useState<FinancialDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRealData, setHasRealData] = useState(false);
  const mounted = useRef(true);
  const lastFetchRef = useRef<string>('');
  const cacheRef = useRef<Map<string, { data: FinancialDataPoint[]; timestamp: number }>>(new Map());

  const fetchFinancialData = useCallback(async () => {
    const fetchKey = `${companyId || 'no-company'}_${dataType || 'all'}_${Date.now()}`;
    lastFetchRef.current = fetchKey;
    
    if (!mounted.current) return;

    // Verificar cache (válido por 5 minutos)
    const cacheKey = `${companyId || 'no-company'}_${dataType || 'all'}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 300000) {
      setData(cached.data);
      setHasRealData(cached.data.length > 0);
      setLoading(false);
      return;
    }
    
    const endTimer = debugManager.startTimer('financial_data_fetch');
    
    try {
      debugManager.logInfo(`Fetching financial data from specific tables: ${dataType || 'all'}`, undefined, 'useFinancialData');
      setLoading(true);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      );
      
      let result: any[] = [];
      let error = null;

      // Fetch from specific financial tables based on dataType
      if (dataType === 'estado_pyg' || !dataType) {
        let pygQuery = supabase
          .from('fs_pyg_lines')
          .select('*')
          .order('period_year', { ascending: false });
        
        if (companyId) {
          pygQuery = pygQuery.eq('company_id', companyId);
        }
        
        const { data: pygData, error: pygError } = await Promise.race([pygQuery, timeoutPromise]) as any;
        if (pygError) error = pygError;
        if (pygData && pygData.length > 0) {
          const grouped = groupFinancialData(pygData, 'estado_pyg');
          result.push(...grouped);
        }
      }

      if (dataType === 'balance_situacion' || !dataType) {
        let balanceQuery = supabase
          .from('fs_balance_lines')
          .select('*')
          .order('period_year', { ascending: false });
        
        if (companyId) {
          balanceQuery = balanceQuery.eq('company_id', companyId);
        }
        
        const { data: balanceData, error: balanceError } = await Promise.race([balanceQuery, timeoutPromise]) as any;
        if (balanceError) error = balanceError;
        if (balanceData && balanceData.length > 0) {
          const grouped = groupFinancialData(balanceData, 'balance_situacion');
          result.push(...grouped);
        }
      }

      if (dataType === 'estado_flujos' || !dataType) {
        let cashflowQuery = supabase
          .from('fs_cashflow_lines')
          .select('*')
          .order('period_year', { ascending: false });
        
        if (companyId) {
          cashflowQuery = cashflowQuery.eq('company_id', companyId);
        }
        
        const { data: cashflowData, error: cashflowError } = await Promise.race([cashflowQuery, timeoutPromise]) as any;
        if (cashflowError) error = cashflowError;
        if (cashflowData && cashflowData.length > 0) {
          const grouped = groupFinancialData(cashflowData, 'estado_flujos');
          result.push(...grouped);
        }
      }

      // Check if this is still the latest fetch
      if (lastFetchRef.current !== fetchKey || !mounted.current) return;

      if (error) throw error;
      
      const hasRealDBData = result && result.length > 0;
      setHasRealData(hasRealDBData);
      
      let finalData: FinancialDataPoint[] = [];
      
      if (hasRealDBData) {
        finalData = processRealData(result);
        
        // Guardar en cache
        cacheRef.current.set(cacheKey, {
          data: finalData,
          timestamp: Date.now()
        });

        // Limpiar cache viejo (mantener solo últimas 5 entradas)
        if (cacheRef.current.size > 5) {
          const oldestKey = Array.from(cacheRef.current.entries())
            .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
          cacheRef.current.delete(oldestKey);
        }
      }
      
      debugManager.logInfo(`Financial data fetched successfully: ${finalData.length} records`, { hasRealData: hasRealDBData }, 'useFinancialData');
      setData(finalData);
    } catch (err) {
      endTimer();
      if (lastFetchRef.current !== fetchKey || !mounted.current) return;
      
      debugManager.logError('Failed to fetch financial data', err, { dataType }, 'useFinancialData');
      const errorMessage = err instanceof Error ? err.message : 'Error fetching data';
      setError(errorMessage);
      setHasRealData(false);
      setData([]);
    } finally {
      if (lastFetchRef.current === fetchKey && mounted.current) {
        endTimer();
        setLoading(false);
      }
    }
  }, [dataType, companyId]);

  // Group financial data by year and data type
  const groupFinancialData = (data: any[], type: string): FinancialDataPoint[] => {
    if (!data || data.length === 0) return [];
    
    const grouped = data.reduce((acc, item) => {
      const year = item.period_year;
      const key = `${type}_${year}`;
      
      if (!acc[key]) {
        acc[key] = {
          id: key,
          data_type: type,
          period_date: `${year}-12-31`,
          period_type: 'annual',
          data_content: {},
          created_at: item.created_at || new Date().toISOString()
        };
      }
      
      acc[key].data_content[item.concept] = item.amount;
      return acc;
    }, {} as Record<string, FinancialDataPoint>);
    
    return Object.values(grouped);
  };

  useEffect(() => {
    mounted.current = true;
    fetchFinancialData();
    
    return () => {
      mounted.current = false;
    };
  }, [fetchFinancialData]);


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

  const hasRealDataForPeriod = (year?: string): boolean => {
    if (!hasRealData) return false;
    if (!year) return true;
    
    return data.some(item => {
      const itemYear = new Date(item.period_date).getFullYear().toString();
      return itemYear === year;
    });
  };

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const getProcessedDataForAnalysis = useCallback(() => {
    return data.reduce((acc, item) => {
      acc[item.data_type] = item.data_content;
      return acc;
    }, {} as Record<string, any>);
  }, [data]);

  return {
    data,
    loading,
    error,
    hasRealData,
    hasRealDataForPeriod,
    getLatestData,
    getPeriodComparison,
    getMultiYearData,
    calculateGrowth,
    safeNumber,
    clearCache,
    getProcessedDataForAnalysis,
    refetch: fetchFinancialData
  };
};