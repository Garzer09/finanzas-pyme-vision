import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';

export interface FinancialRatio {
  name: string;
  value: number;
  unit: string;
  category: string;
  description: string;
  formula: string;
  benchmark: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

interface UseFinancialRatiosOptimizedResult {
  ratios: FinancialRatio[];
  loading: boolean;
  error: string | null;
  hasRealData: boolean;
  refreshRatios: () => Promise<void>;
}

export const useFinancialRatiosOptimized = (): UseFinancialRatiosOptimizedResult => {
  const [ratios, setRatios] = useState<FinancialRatio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRealData, setHasRealData] = useState(false);
  const { companyId } = useCompanyContext();

  const fetchRatiosData = async () => {
    if (!companyId) {
      setRatios([]);
      setLoading(false);
      setHasRealData(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.debug('[useFinancialRatiosOptimized] Fetching data for company:', companyId);

      // SINGLE QUERY: Fetch both balance and P&L data in parallel
      const [balanceResult, pygResult] = await Promise.all([
        supabase
          .from('fs_balance_lines')
          .select('*')
          .eq('company_id', companyId)
          .order('period_year', { ascending: false }),
        supabase
          .from('fs_pyg_lines')
          .select('*')
          .eq('company_id', companyId)
          .order('period_year', { ascending: false })
      ]);

      if (balanceResult.error) throw balanceResult.error;
      if (pygResult.error) throw pygResult.error;

      const balanceData = balanceResult.data || [];
      const pygData = pygResult.data || [];

      if (balanceData.length === 0 && pygData.length === 0) {
        setRatios([]);
        setHasRealData(false);
        setLoading(false);
        return;
      }

      // Get latest year data
      const latestYear = Math.max(
        ...balanceData.map(item => item.period_year),
        ...pygData.map(item => item.period_year)
      );

      const latestBalanceData = balanceData.filter(item => item.period_year === latestYear);
      const latestPygData = pygData.filter(item => item.period_year === latestYear);

      // Build data map for efficient lookups
      const balanceMap = new Map(latestBalanceData.map(item => [item.concept, item.amount]));
      const pygMap = new Map(latestPygData.map(item => [item.concept, item.amount]));

      // Helper function to find values with multiple key variations
      const findValue = (map: Map<string, number>, keys: string[]): number => {
        for (const key of keys) {
          const value = map.get(key) || map.get(key.toLowerCase()) || map.get(key.replace(/_/g, ' '));
          if (value !== undefined && value !== null) {
            return Number(value) || 0;
          }
        }
        return 0;
      };

      // Calculate all ratios from single data fetch
      const calculatedRatios: FinancialRatio[] = [
        // LIQUIDEZ
        {
          name: 'Ratio Corriente',
          value: calculateRatio(
            () => findValue(balanceMap, ['activo_corriente', 'activo corriente']),
            () => findValue(balanceMap, ['pasivo_corriente', 'pasivo corriente']),
            (activo, pasivo) => pasivo > 0 ? activo / pasivo : 0
          ),
          unit: '',
          category: 'Liquidez',
          description: 'Capacidad para cubrir deudas a corto plazo',
          formula: 'Activo Corriente / Pasivo Corriente',
          benchmark: 1.5,
          status: getRatioStatus(1.5, 1.0, 1.5)
        },
        {
          name: 'Prueba Ácida',
          value: calculateRatio(
            () => findValue(balanceMap, ['activo_corriente', 'activo corriente']),
            () => findValue(balanceMap, ['existencias']),
            () => findValue(balanceMap, ['pasivo_corriente', 'pasivo corriente']),
            (activo, existencias, pasivo) => pasivo > 0 ? (activo - existencias) / pasivo : 0
          ),
          unit: '',
          category: 'Liquidez',
          description: 'Liquidez sin considerar existencias',
          formula: '(Activo Corriente - Existencias) / Pasivo Corriente',
          benchmark: 1.0,
          status: getRatioStatus(1.0, 0.8, 1.0)
        },
        {
          name: 'Ratio Tesorería',
          value: calculateRatio(
            () => findValue(balanceMap, ['efectivo_equivalentes', 'efectivo y equivalentes', 'tesoreria']),
            () => findValue(balanceMap, ['pasivo_corriente', 'pasivo corriente']),
            (efectivo, pasivo) => pasivo > 0 ? efectivo / pasivo : 0
          ),
          unit: '',
          category: 'Liquidez',
          description: 'Capacidad inmediata de pago',
          formula: 'Efectivo / Pasivo Corriente',
          benchmark: 0.3,
          status: getRatioStatus(0.3, 0.2, 0.3)
        },

        // ENDEUDAMIENTO
        {
          name: 'Ratio Endeudamiento Total',
          value: calculateRatio(
            () => findValue(balanceMap, ['pasivo_total', 'total_pasivo']),
            () => findValue(balanceMap, ['activo_total', 'total_activo']),
            (pasivo, activo) => activo > 0 ? (pasivo / activo) * 100 : 0
          ),
          unit: '%',
          category: 'Endeudamiento',
          description: 'Proporción de activos financiados con deuda',
          formula: '(Total Pasivo / Total Activo) × 100',
          benchmark: 40.0,
          status: getRatioStatus(40.0, 50.0, 40.0, true) // Lower is better
        },
        {
          name: 'Autonomía Financiera',
          value: calculateRatio(
            () => findValue(balanceMap, ['patrimonio_neto', 'patrimonio neto']),
            () => findValue(balanceMap, ['activo_total', 'total_activo']),
            (patrimonio, activo) => activo > 0 ? (patrimonio / activo) * 100 : 0
          ),
          unit: '%',
          category: 'Endeudamiento',
          description: 'Proporción de activos financiados con recursos propios',
          formula: '(Patrimonio Neto / Total Activo) × 100',
          benchmark: 60.0,
          status: getRatioStatus(60.0, 50.0, 60.0)
        },
        {
          name: 'Ratio Solvencia',
          value: calculateRatio(
            () => findValue(balanceMap, ['activo_total', 'total_activo']),
            () => findValue(balanceMap, ['pasivo_total', 'total_pasivo']),
            (activo, pasivo) => pasivo > 0 ? activo / pasivo : 0
          ),
          unit: '',
          category: 'Endeudamiento',
          description: 'Capacidad de pago a largo plazo',
          formula: 'Activo Total / Pasivo Total',
          benchmark: 2.0,
          status: getRatioStatus(2.0, 1.5, 2.0)
        },

        // RENTABILIDAD
        {
          name: 'ROA (Return on Assets)',
          value: calculateRatio(
            () => findValue(pygMap, ['resultado_ejercicio', 'resultado del ejercicio', 'beneficio_neto']),
            () => findValue(balanceMap, ['activo_total', 'total_activo']),
            (resultado, activo) => activo > 0 ? (resultado / activo) * 100 : 0
          ),
          unit: '%',
          category: 'Rentabilidad',
          description: 'Rentabilidad sobre activos',
          formula: '(Resultado Neto / Total Activo) × 100',
          benchmark: 8.0,
          status: getRatioStatus(8.0, 5.0, 8.0)
        },
        {
          name: 'ROE (Return on Equity)',
          value: calculateRatio(
            () => findValue(pygMap, ['resultado_ejercicio', 'resultado del ejercicio', 'beneficio_neto']),
            () => findValue(balanceMap, ['patrimonio_neto', 'patrimonio neto']),
            (resultado, patrimonio) => patrimonio > 0 ? (resultado / patrimonio) * 100 : 0
          ),
          unit: '%',
          category: 'Rentabilidad',
          description: 'Rentabilidad sobre patrimonio neto',
          formula: '(Resultado Neto / Patrimonio Neto) × 100',
          benchmark: 15.0,
          status: getRatioStatus(15.0, 10.0, 15.0)
        },
        {
          name: 'Margen Neto',
          value: calculateRatio(
            () => findValue(pygMap, ['resultado_ejercicio', 'resultado del ejercicio', 'beneficio_neto']),
            () => findValue(pygMap, ['importe_neto_cifra_negocios', 'ventas', 'ingresos']),
            (resultado, ventas) => ventas > 0 ? (resultado / ventas) * 100 : 0
          ),
          unit: '%',
          category: 'Rentabilidad',
          description: 'Margen de beneficio sobre ventas',
          formula: '(Resultado Neto / Ventas) × 100',
          benchmark: 12.0,
          status: getRatioStatus(12.0, 8.0, 12.0)
        },

        // ACTIVIDAD
        {
          name: 'Rotación de Activos',
          value: calculateRatio(
            () => findValue(pygMap, ['importe_neto_cifra_negocios', 'ventas', 'ingresos']),
            () => findValue(balanceMap, ['activo_total', 'total_activo']),
            (ventas, activo) => activo > 0 ? ventas / activo : 0
          ),
          unit: 'x',
          category: 'Actividad',
          description: 'Eficiencia en el uso de activos',
          formula: 'Ventas / Total Activo',
          benchmark: 0.9,
          status: getRatioStatus(0.9, 0.7, 0.9)
        }
      ];

      console.debug('[useFinancialRatiosOptimized] Calculated ratios:', calculatedRatios.length);
      setRatios(calculatedRatios);
      setHasRealData(true);
    } catch (err) {
      console.error('Error fetching ratios data:', err);
      setError(err instanceof Error ? err.message : 'Error loading ratios data');
      setHasRealData(false);
      setRatios([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate ratios with flexible parameters
  const calculateRatio = (
    ...getters: (() => number)[]
  ): number => {
    const values = getters.map(getter => getter());
    if (values.length === 2) {
      const [a, b] = values;
      return b !== 0 ? a / b : 0;
    } else if (values.length === 3) {
      const [a, b, c] = values;
      return c !== 0 ? (a - b) / c : 0;
    }
    return 0;
  };

  // Helper function to determine ratio status
  const getRatioStatus = (
    benchmark: number, 
    warning: number, 
    excellent: number, 
    lowerIsBetter: boolean = false
  ): 'excellent' | 'good' | 'warning' | 'danger' => {
    return (value: number) => {
      if (lowerIsBetter) {
        if (value <= benchmark) return 'excellent';
        if (value <= warning) return 'good';
        if (value <= excellent) return 'warning';
        return 'danger';
      } else {
        if (value >= excellent) return 'excellent';
        if (value >= benchmark) return 'good';
        if (value >= warning) return 'warning';
        return 'danger';
      }
    };
  };

  useEffect(() => {
    fetchRatiosData();
  }, [companyId]);

  const refreshRatios = async () => {
    await fetchRatiosData();
  };

  return {
    ratios,
    loading,
    error,
    hasRealData,
    refreshRatios
  };
};
