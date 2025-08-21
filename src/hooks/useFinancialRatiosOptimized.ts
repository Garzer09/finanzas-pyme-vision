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
          value: (() => {
            const activo = findValue(balanceMap, ['activo_corriente', 'activo corriente']);
            const pasivo = findValue(balanceMap, ['pasivo_corriente', 'pasivo corriente']);
            return pasivo > 0 ? activo / pasivo : 0;
          })(),
          unit: '',
          category: 'Liquidez',
          description: 'Capacidad para cubrir deudas a corto plazo',
          formula: 'Activo Corriente / Pasivo Corriente',
          benchmark: 1.5,
          status: 'good'
        },
        {
          name: 'Prueba Ácida',
          value: (() => {
            const activo = findValue(balanceMap, ['activo_corriente', 'activo corriente']);
            const existencias = findValue(balanceMap, ['existencias']);
            const pasivo = findValue(balanceMap, ['pasivo_corriente', 'pasivo corriente']);
            return pasivo > 0 ? (activo - existencias) / pasivo : 0;
          })(),
          unit: '',
          category: 'Liquidez',
          description: 'Liquidez sin considerar existencias',
          formula: '(Activo Corriente - Existencias) / Pasivo Corriente',
          benchmark: 1.0,
          status: 'good'
        },
        {
          name: 'Ratio Tesorería',
          value: (() => {
            const efectivo = findValue(balanceMap, ['efectivo_equivalentes', 'efectivo y equivalentes', 'tesoreria']);
            const pasivo = findValue(balanceMap, ['pasivo_corriente', 'pasivo corriente']);
            return pasivo > 0 ? efectivo / pasivo : 0;
          })(),
          unit: '',
          category: 'Liquidez',
          description: 'Capacidad inmediata de pago',
          formula: 'Efectivo / Pasivo Corriente',
          benchmark: 0.3,
          status: 'good'
        },

        // ENDEUDAMIENTO
        {
          name: 'Ratio Endeudamiento Total',
          value: (() => {
            const pasivo = findValue(balanceMap, ['pasivo_total', 'total_pasivo']);
            const activo = findValue(balanceMap, ['activo_total', 'total_activo']);
            return activo > 0 ? (pasivo / activo) * 100 : 0;
          })(),
          unit: '%',
          category: 'Endeudamiento',
          description: 'Proporción de activos financiados con deuda',
          formula: '(Total Pasivo / Total Activo) × 100',
          benchmark: 40.0,
          status: 'good'
        },
        {
          name: 'Autonomía Financiera',
          value: (() => {
            const patrimonio = findValue(balanceMap, ['patrimonio_neto', 'patrimonio neto']);
            const activo = findValue(balanceMap, ['activo_total', 'total_activo']);
            return activo > 0 ? (patrimonio / activo) * 100 : 0;
          })(),
          unit: '%',
          category: 'Endeudamiento',
          description: 'Proporción de activos financiados con recursos propios',
          formula: '(Patrimonio Neto / Total Activo) × 100',
          benchmark: 60.0,
          status: 'good'
        },
        {
          name: 'Ratio Solvencia',
          value: (() => {
            const activo = findValue(balanceMap, ['activo_total', 'total_activo']);
            const pasivo = findValue(balanceMap, ['pasivo_total', 'total_pasivo']);
            return pasivo > 0 ? activo / pasivo : 0;
          })(),
          unit: '',
          category: 'Endeudamiento',
          description: 'Capacidad de pago a largo plazo',
          formula: 'Activo Total / Pasivo Total',
          benchmark: 2.0,
          status: 'good'
        },

        // RENTABILIDAD
        {
          name: 'ROA (Return on Assets)',
          value: (() => {
            const resultado = findValue(pygMap, ['resultado_ejercicio', 'resultado del ejercicio', 'beneficio_neto']);
            const activo = findValue(balanceMap, ['activo_total', 'total_activo']);
            return activo > 0 ? (resultado / activo) * 100 : 0;
          })(),
          unit: '%',
          category: 'Rentabilidad',
          description: 'Rentabilidad sobre activos',
          formula: '(Resultado Neto / Total Activo) × 100',
          benchmark: 8.0,
          status: 'good'
        },
        {
          name: 'ROE (Return on Equity)',
          value: (() => {
            const resultado = findValue(pygMap, ['resultado_ejercicio', 'resultado del ejercicio', 'beneficio_neto']);
            const patrimonio = findValue(balanceMap, ['patrimonio_neto', 'patrimonio neto']);
            return patrimonio > 0 ? (resultado / patrimonio) * 100 : 0;
          })(),
          unit: '%',
          category: 'Rentabilidad',
          description: 'Rentabilidad sobre patrimonio neto',
          formula: '(Resultado Neto / Patrimonio Neto) × 100',
          benchmark: 15.0,
          status: 'good'
        },
        {
          name: 'Margen Neto',
          value: (() => {
            const resultado = findValue(pygMap, ['resultado_ejercicio', 'resultado del ejercicio', 'beneficio_neto']);
            const ventas = findValue(pygMap, ['importe_neto_cifra_negocios', 'ventas', 'ingresos']);
            return ventas > 0 ? (resultado / ventas) * 100 : 0;
          })(),
          unit: '%',
          category: 'Rentabilidad',
          description: 'Margen de beneficio sobre ventas',
          formula: '(Resultado Neto / Ventas) × 100',
          benchmark: 12.0,
          status: 'good'
        },

        // ACTIVIDAD
        {
          name: 'Rotación de Activos',
          value: (() => {
            const ventas = findValue(pygMap, ['importe_neto_cifra_negocios', 'ventas', 'ingresos']);
            const activo = findValue(balanceMap, ['activo_total', 'total_activo']);
            return activo > 0 ? ventas / activo : 0;
          })(),
          unit: 'x',
          category: 'Actividad',
          description: 'Eficiencia en el uso de activos',
          formula: 'Ventas / Total Activo',
          benchmark: 0.9,
          status: 'good'
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
