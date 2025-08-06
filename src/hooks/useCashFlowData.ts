import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CashFlowData {
  id: number;
  period_date: string;
  period_year: number;
  period_month?: number;
  category: string;
  concept: string;
  amount: number;
}

interface CashFlowKPIs {
  flujoOperativo: number;
  flujoInversion: number;
  flujoFinanciacion: number;
  flujoNeto: number;
  flujoOperativoPctVentas: number;
  calidadFCO: number;
  autofinanciacion: number;
  coberturaDeuda: number;
}

interface UseCashFlowDataResult {
  cashFlowData: CashFlowData[];
  kpis: CashFlowKPIs;
  isLoading: boolean;
  error: string | null;
  hasRealData: boolean;
  refetch: () => Promise<void>;
}

export const useCashFlowData = (companyId?: string): UseCashFlowDataResult => {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCashFlowData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('fs_cashflow_lines')
        .select('*');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
        // If no companyId provided, don't fetch any data for now
        setCashFlowData([]);
        return;
      }
      
      const { data, error: supabaseError } = await query.order('period_date', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const transformedData: CashFlowData[] = (data || []).map(item => ({
        id: item.id,
        period_date: item.period_date,
        period_year: item.period_year,
        period_month: item.period_month,
        category: item.category,
        concept: item.concept,
        amount: Number(item.amount)
      }));

      setCashFlowData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading cash flow data');
      console.error('Error fetching cash flow data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlowData();
  }, [user, companyId]);

  const kpis = useMemo((): CashFlowKPIs => {
    if (cashFlowData.length === 0) {
      return {
        flujoOperativo: 0,
        flujoInversion: 0,
        flujoFinanciacion: 0,
        flujoNeto: 0,
        flujoOperativoPctVentas: 0,
        calidadFCO: 0,
        autofinanciacion: 0,
        coberturaDeuda: 0
      };
    }

    // Get latest year data
    const latestYear = Math.max(...cashFlowData.map(item => item.period_year));
    const latestData = cashFlowData.filter(item => item.period_year === latestYear);

    // Calculate cash flows by category
    const flujoOperativo = latestData
      .filter(item => item.category === 'OPERATIVO')
      .reduce((sum, item) => sum + item.amount, 0);

    const flujoInversion = latestData
      .filter(item => item.category === 'INVERSION')
      .reduce((sum, item) => sum + item.amount, 0);

    const flujoFinanciacion = latestData
      .filter(item => item.category === 'FINANCIACION')
      .reduce((sum, item) => sum + item.amount, 0);

    const flujoNeto = flujoOperativo + flujoInversion + flujoFinanciacion;

    // Get net income for quality calculation (from P&G data)
    // This would ideally come from P&G lines, but for now we'll estimate
    const beneficioNeto = flujoOperativo * 0.65; // Rough estimate

    // Calculate derived KPIs
    const flujoOperativoPctVentas = flujoOperativo > 0 ? (flujoOperativo / (flujoOperativo * 2.5)) * 100 : 0;
    const calidadFCO = beneficioNeto > 0 ? ((flujoOperativo - beneficioNeto) / beneficioNeto) * 100 : 0;
    const autofinanciacion = Math.abs(flujoInversion) > 0 ? (flujoOperativo / Math.abs(flujoInversion)) * 100 : 0;
    const coberturaDeuda = flujoOperativo / 85000; // Assuming service debt of 85K

    return {
      flujoOperativo,
      flujoInversion,
      flujoFinanciacion,
      flujoNeto,
      flujoOperativoPctVentas,
      calidadFCO,
      autofinanciacion,
      coberturaDeuda
    };
  }, [cashFlowData]);

  const hasRealData = cashFlowData.length > 0;

  const refetch = async () => {
    await fetchCashFlowData();
  };

  return {
    cashFlowData,
    kpis,
    isLoading,
    error,
    hasRealData,
    refetch
  };
};