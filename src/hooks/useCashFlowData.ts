import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/contexts/CompanyContext';

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

interface MonthlyCashFlow {
  mes: string;
  operativo: number;
  inversion: number;
  financiacion: number;
  neto: number;
}

interface UseCashFlowDataResult {
  cashFlowData: CashFlowData[];
  monthlyData: MonthlyCashFlow[];
  kpis: CashFlowKPIs;
  isLoading: boolean;
  error: string | null;
  hasRealData: boolean;
  refetch: () => Promise<void>;
  getYearData: (year: number) => CashFlowData[];
  getMonthlyBreakdown: (year: number) => MonthlyCashFlow[];
}

// Función para normalizar categorías de flujos de caja
const normalizeCategory = (category: string): string => {
  const normalized = category.toLowerCase().trim();
  
  if (normalized.includes('operativo') || normalized.includes('explotación') || normalized.includes('operaciones')) {
    return 'OPERATIVO';
  }
  if (normalized.includes('inversión') || normalized.includes('inversion') || normalized.includes('inmovilizado')) {
    return 'INVERSION';
  }
  if (normalized.includes('financiación') || normalized.includes('financiacion') || normalized.includes('financiero')) {
    return 'FINANCIACION';
  }
  
  return category.toUpperCase(); // Mantener original si no coincide
};

// Función para generar datos mensuales
const generateMonthlyData = (cashFlowData: CashFlowData[]): MonthlyCashFlow[] => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthlyData: { [key: string]: MonthlyCashFlow } = {};

  // Inicializar todos los meses
  months.forEach(month => {
    monthlyData[month] = { mes: month, operativo: 0, inversion: 0, financiacion: 0, neto: 0 };
  });

  // Agrupar datos reales por mes
  cashFlowData.forEach(item => {
    if (item.period_month && item.period_month >= 1 && item.period_month <= 12) {
      const monthKey = months[item.period_month - 1];
      const category = normalizeCategory(item.category);
      
      if (category === 'OPERATIVO') {
        monthlyData[monthKey].operativo += item.amount;
      } else if (category === 'INVERSION') {
        monthlyData[monthKey].inversion += item.amount;
      } else if (category === 'FINANCIACION') {
        monthlyData[monthKey].financiacion += item.amount;
      }
    }
  });

  // Calcular neto y convertir a array
  return months.map(month => {
    const monthData = monthlyData[month];
    monthData.neto = monthData.operativo + monthData.inversion + monthData.financiacion;
    return monthData;
  });
};

export const useCashFlowData = (companyId?: string): UseCashFlowDataResult => {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { validateCompanyAccess } = useCompanyContext();

  const fetchCashFlowData = useCallback(async () => {
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
        setCashFlowData([]);
        setIsLoading(false);
        return;
      }

      const allowed = await validateCompanyAccess(companyId);
      if (!allowed) {
        setError('Unauthorized company access');
        setCashFlowData([]);
        setIsLoading(false);
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
        category: normalizeCategory(item.category),
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
  }, [user, companyId, validateCompanyAccess]);

  useEffect(() => {
    fetchCashFlowData();
  }, [fetchCashFlowData]);

  // Datos mensuales calculados
  const monthlyData = useMemo(() => generateMonthlyData(cashFlowData), [cashFlowData]);

  // KPIs calculados
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

    // Calculate cash flows by normalized category
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

    // Derived KPIs strictly from available real cash flow aggregates (no estimates)
    const flujoOperativoPctVentas = 0;
    const calidadFCO = 0;
    const autofinanciacion = Math.abs(flujoInversion) > 0 ? (flujoOperativo / Math.abs(flujoInversion)) * 100 : 0;
    const coberturaDeuda = 0;

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

  // Funciones auxiliares
  const getYearData = useCallback((year: number): CashFlowData[] => {
    return cashFlowData.filter(item => item.period_year === year);
  }, [cashFlowData]);

  const getMonthlyBreakdown = useCallback((year: number): MonthlyCashFlow[] => {
    const yearData = getYearData(year);
    return generateMonthlyData(yearData);
  }, [getYearData]);

  const hasRealData = cashFlowData.length > 0;

  const refetch = useCallback(async () => {
    await fetchCashFlowData();
  }, [fetchCashFlowData]);

  return {
    cashFlowData,
    monthlyData,
    kpis,
    isLoading,
    error,
    hasRealData,
    refetch,
    getYearData,
    getMonthlyBreakdown
  };
};