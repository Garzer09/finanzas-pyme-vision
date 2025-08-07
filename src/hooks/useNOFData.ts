import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BalanceData {
  id: number;
  period_date: string;
  period_year: number;
  period_month?: number;
  section: string;
  concept: string;
  amount: number;
}

interface NOFComponents {
  existencias: number;
  clientes: number;
  otrosDeudores: number;
  proveedores: number;
  acreedores: number;
  nofTotal: number;
}

interface NOFAnalysis {
  nofTotal: number;
  nofAnterior: number;
  impactoCaja: number;
  diasVentas: number;
  eficiencia: 'Alta' | 'Media' | 'Baja';
  components: NOFComponents;
}

interface UseNOFDataResult {
  balanceData: BalanceData[];
  nofAnalysis: NOFAnalysis;
  isLoading: boolean;
  error: string | null;
  hasRealData: boolean;
  refetch: () => Promise<void>;
}

export const useNOFData = (companyId?: string): UseNOFDataResult => {
  const [balanceData, setBalanceData] = useState<BalanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBalanceData = async () => {
    if (!user || !companyId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('fs_balance_lines')
        .select('*')
        .eq('company_id', companyId)
        .order('period_date', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const transformedData: BalanceData[] = (data || []).map(item => ({
        id: item.id,
        period_date: item.period_date,
        period_year: item.period_year,
        period_month: item.period_month,
        section: item.section,
        concept: item.concept,
        amount: Number(item.amount)
      }));

      setBalanceData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading balance data');
      console.error('Error fetching balance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceData();
  }, [user, companyId]);

  const nofAnalysis = useMemo((): NOFAnalysis => {
    if (balanceData.length === 0) {
      return {
        nofTotal: 0,
        nofAnterior: 0,
        impactoCaja: 0,
        diasVentas: 0,
        eficiencia: 'Baja',
        components: {
          existencias: 0,
          clientes: 0,
          otrosDeudores: 0,
          proveedores: 0,
          acreedores: 0,
          nofTotal: 0
        }
      };
    }

    // Get latest two years for comparison
    const years = [...new Set(balanceData.map(item => item.period_year))].sort((a, b) => b - a);
    const latestYear = years[0];
    const previousYear = years[1] || latestYear;

    const latestData = balanceData.filter(item => item.period_year === latestYear);
    const previousData = balanceData.filter(item => item.period_year === previousYear);

    // Calculate NOF components for latest period
    const mapConceptToNOF = (data: BalanceData[]) => {
      const existencias = data
        .filter(item => 
          item.concept.toLowerCase().includes('existencias') ||
          item.concept.toLowerCase().includes('inventarios') ||
          item.concept.toLowerCase().includes('stocks')
        )
        .reduce((sum, item) => sum + item.amount, 0);

      const clientes = data
        .filter(item => 
          item.concept.toLowerCase().includes('clientes') ||
          item.concept.toLowerCase().includes('deudores comerciales') ||
          item.concept.toLowerCase().includes('cuentas por cobrar')
        )
        .reduce((sum, item) => sum + item.amount, 0);

      const otrosDeudores = data
        .filter(item => 
          item.concept.toLowerCase().includes('otros deudores') ||
          item.concept.toLowerCase().includes('deudores diversos')
        )
        .reduce((sum, item) => sum + item.amount, 0);

      const proveedores = data
        .filter(item => 
          item.concept.toLowerCase().includes('proveedores') ||
          item.concept.toLowerCase().includes('acreedores comerciales') ||
          item.concept.toLowerCase().includes('cuentas por pagar')
        )
        .reduce((sum, item) => sum + Math.abs(item.amount), 0);

      const acreedores = data
        .filter(item => 
          item.concept.toLowerCase().includes('acreedores') ||
          item.concept.toLowerCase().includes('otros acreedores')
        )
        .reduce((sum, item) => sum + Math.abs(item.amount), 0);

      const nofTotal = existencias + clientes + otrosDeudores - proveedores - acreedores;

      return {
        existencias,
        clientes,
        otrosDeudores,
        proveedores,
        acreedores,
        nofTotal
      };
    };

    const currentNOF = mapConceptToNOF(latestData);
    const previousNOF = mapConceptToNOF(previousData);

    const impactoCaja = currentNOF.nofTotal - previousNOF.nofTotal;
    
    // Estimate annual sales (would ideally come from P&G data)
    const ventasAnuales = Math.abs(currentNOF.nofTotal) * 10; // Rough estimate
    const diasVentas = ventasAnuales > 0 ? Math.round((currentNOF.nofTotal / ventasAnuales) * 365) : 0;
    
    const eficiencia: 'Alta' | 'Media' | 'Baja' = 
      diasVentas <= 30 ? 'Alta' : 
      diasVentas <= 45 ? 'Media' : 'Baja';

    return {
      nofTotal: currentNOF.nofTotal,
      nofAnterior: previousNOF.nofTotal,
      impactoCaja,
      diasVentas,
      eficiencia,
      components: currentNOF
    };
  }, [balanceData]);

  const hasRealData = balanceData.length > 0;

  const refetch = async () => {
    await fetchBalanceData();
  };

  return {
    balanceData,
    nofAnalysis,
    isLoading,
    error,
    hasRealData,
    refetch
  };
};