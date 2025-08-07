import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PLData {
  id: number;
  period_date: string;
  period_year: number;
  period_month?: number;
  concept: string;
  amount: number;
}

interface AnalyticalPLItem {
  concept: string;
  currentPeriod: number;
  previousPeriod: number;
  marginPercent: number;
  variationPercent: number;
  sparklineData: number[];
  category: 'revenue' | 'variable_costs' | 'fixed_costs' | 'margin';
  level: number;
}

interface UseAnalyticalPLDataResult {
  plData: PLData[];
  analyticalData: AnalyticalPLItem[];
  isLoading: boolean;
  error: string | null;
  hasRealData: boolean;
  refetch: () => Promise<void>;
}

export const useAnalyticalPLData = (companyId?: string): UseAnalyticalPLDataResult => {
  const [plData, setPLData] = useState<PLData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPLData = async () => {
    if (!user || !companyId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('fs_pyg_lines')
        .select('*')
        .eq('company_id', companyId)
        .order('period_date', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const transformedData: PLData[] = (data || []).map(item => ({
        id: item.id,
        period_date: item.period_date,
        period_year: item.period_year,
        period_month: item.period_month,
        concept: item.concept,
        amount: Number(item.amount)
      }));

      setPLData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading P&L data');
      console.error('Error fetching P&L data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPLData();
  }, [user, companyId]);

  const analyticalData = useMemo((): AnalyticalPLItem[] => {
    if (plData.length === 0) {
      return [];
    }

    // Get latest two years for comparison
    const years = [...new Set(plData.map(item => item.period_year))].sort((a, b) => b - a);
    const latestYear = years[0];
    const previousYear = years[1] || latestYear;

    const latestData = plData.filter(item => item.period_year === latestYear);
    const previousData = plData.filter(item => item.period_year === previousYear);

    // Helper function to sum amounts by concept pattern
    const sumByPattern = (data: PLData[], patterns: string[]) => {
      return data
        .filter(item => 
          patterns.some(pattern => 
            item.concept.toLowerCase().includes(pattern.toLowerCase())
          )
        )
        .reduce((sum, item) => sum + item.amount, 0);
    };

    // Calculate key P&L components
    const currentVentas = sumByPattern(latestData, ['ventas', 'ingresos', 'facturación']);
    const previousVentas = sumByPattern(previousData, ['ventas', 'ingresos', 'facturación']);

    const currentCostesVariables = sumByPattern(latestData, [
      'coste de ventas', 'materias primas', 'mano de obra directa', 'costes variables'
    ]);
    const previousCostesVariables = sumByPattern(previousData, [
      'coste de ventas', 'materias primas', 'mano de obra directa', 'costes variables'
    ]);

    const currentCostesFijos = sumByPattern(latestData, [
      'gastos de personal', 'alquileres', 'amortizaciones', 'gastos generales', 'costes fijos'
    ]);
    const previousCostesFijos = sumByPattern(previousData, [
      'gastos de personal', 'alquileres', 'amortizaciones', 'gastos generales', 'costes fijos'
    ]);

    // Calculate margins
    const currentMargenContribucion = currentVentas + currentCostesVariables; // Costs are negative
    const previousMargenContribucion = previousVentas + previousCostesVariables;

    const currentEBIT = currentMargenContribucion + currentCostesFijos; // Fixed costs are negative
    const previousEBIT = previousMargenContribucion + previousCostesFijos;

    // Helper function to calculate variation percentage
    const calcVariation = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / Math.abs(previous)) * 100;
    };

    // Helper function to calculate margin percentage
    const calcMargin = (amount: number, sales: number) => {
      if (sales === 0) return 0;
      return (amount / sales) * 100;
    };

    // Helper function to generate sparkline data based on trend
    const generateSparkline = (current: number, previous: number) => {
      const trend = (current - previous) / 8; // 8 data points
      return Array.from({ length: 8 }, (_, i) => previous + (trend * i));
    };

    const items: AnalyticalPLItem[] = [
      {
        concept: 'Ventas Netas',
        currentPeriod: currentVentas,
        previousPeriod: previousVentas,
        marginPercent: 100.0,
        variationPercent: calcVariation(currentVentas, previousVentas),
        sparklineData: generateSparkline(currentVentas, previousVentas),
        category: 'revenue',
        level: 1
      },
      {
        concept: 'Costes Variables',
        currentPeriod: currentCostesVariables,
        previousPeriod: previousCostesVariables,
        marginPercent: calcMargin(currentCostesVariables, currentVentas),
        variationPercent: calcVariation(Math.abs(currentCostesVariables), Math.abs(previousCostesVariables)),
        sparklineData: generateSparkline(currentCostesVariables, previousCostesVariables),
        category: 'variable_costs',
        level: 1
      },
      {
        concept: 'MARGEN DE CONTRIBUCIÓN',
        currentPeriod: currentMargenContribucion,
        previousPeriod: previousMargenContribucion,
        marginPercent: calcMargin(currentMargenContribucion, currentVentas),
        variationPercent: calcVariation(currentMargenContribucion, previousMargenContribucion),
        sparklineData: generateSparkline(currentMargenContribucion, previousMargenContribucion),
        category: 'margin',
        level: 1
      },
      {
        concept: 'Costes Fijos',
        currentPeriod: currentCostesFijos,
        previousPeriod: previousCostesFijos,
        marginPercent: calcMargin(currentCostesFijos, currentVentas),
        variationPercent: calcVariation(Math.abs(currentCostesFijos), Math.abs(previousCostesFijos)),
        sparklineData: generateSparkline(currentCostesFijos, previousCostesFijos),
        category: 'fixed_costs',
        level: 1
      },
      {
        concept: 'RESULTADO OPERATIVO (EBIT)',
        currentPeriod: currentEBIT,
        previousPeriod: previousEBIT,
        marginPercent: calcMargin(currentEBIT, currentVentas),
        variationPercent: calcVariation(currentEBIT, previousEBIT),
        sparklineData: generateSparkline(currentEBIT, previousEBIT),
        category: 'margin',
        level: 1
      }
    ];

    return items;
  }, [plData]);

  const hasRealData = plData.length > 0;

  const refetch = async () => {
    await fetchPLData();
  };

  return {
    plData,
    analyticalData,
    isLoading,
    error,
    hasRealData,
    refetch
  };
};