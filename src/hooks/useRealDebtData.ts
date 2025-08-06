import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RealDebtItem {
  id: string;
  company_id: string;
  loan_key: string;
  entity_name: string;
  loan_type: string;
  initial_amount: number;
  current_balance: number;
  interest_rate: number;
  maturity_date: string;
  guarantees?: string;
  observations?: string;
  currency_code: string;
}

export interface RiskMetrics {
  dscr: number; // Debt Service Coverage Ratio
  netDebtEbitda: number; // Net Debt / EBITDA
  interestCoverage: number; // EBITDA / Interest Payments
}

export const useRealDebtData = (companyId?: string) => {
  const [debtData, setDebtData] = useState<RealDebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDebtData = async () => {
    if (!user || !companyId) {
      setDebtData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch debt loans data
      const { data: loansData, error: loansError } = await supabase
        .from('debt_loans')
        .select(`
          id,
          company_id,
          loan_key,
          entity_name,
          loan_type,
          initial_amount,
          interest_rate,
          maturity_date,
          guarantees,
          observations,
          currency_code
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;

      // Fetch debt balances for current balances
      const { data: balancesData, error: balancesError } = await supabase
        .from('debt_balances')
        .select('loan_id, year, year_end_balance')
        .eq('company_id', companyId)
        .order('year', { ascending: false });

      if (balancesError) throw balancesError;

      // Combine loans with their current balances
      const enrichedData: RealDebtItem[] = (loansData || []).map(loan => {
        const latestBalance = balancesData?.find(b => b.loan_id === loan.id);
        return {
          id: loan.id.toString(),
          company_id: loan.company_id,
          loan_key: loan.loan_key,
          entity_name: loan.entity_name,
          loan_type: loan.loan_type,
          initial_amount: loan.initial_amount,
          current_balance: latestBalance?.year_end_balance || loan.initial_amount,
          interest_rate: loan.interest_rate,
          maturity_date: loan.maturity_date,
          guarantees: loan.guarantees,
          observations: loan.observations,
          currency_code: loan.currency_code
        };
      });

      setDebtData(enrichedData);
    } catch (err) {
      console.error('Error fetching debt data:', err);
      setError(err instanceof Error ? err.message : 'Error fetching debt data');
      setDebtData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebtData();
  }, [user, companyId]);

  // Calculate metrics
  const totalCapitalPendiente = useMemo(() => 
    debtData.reduce((sum, item) => sum + item.current_balance, 0)
  , [debtData]);

  const tirPromedio = useMemo(() => {
    if (totalCapitalPendiente === 0) return 0;
    return debtData.reduce((sum, item) => 
      sum + (item.interest_rate * item.current_balance) / totalCapitalPendiente, 0);
  }, [debtData, totalCapitalPendiente]);

  // Risk metrics calculation (using simulated EBITDA for now)
  const riskMetrics = useMemo((): RiskMetrics => {
    const ebitda = 450000; // This should come from financial data
    const totalInterest = debtData.reduce((sum, item) => 
      sum + (item.current_balance * item.interest_rate / 100), 0);

    return {
      dscr: ebitda > 0 ? ebitda / (totalInterest * 1.2) : 0, // Assuming 20% principal payments
      netDebtEbitda: ebitda > 0 ? totalCapitalPendiente / ebitda : 0,
      interestCoverage: totalInterest > 0 ? ebitda / totalInterest : 0
    };
  }, [debtData, totalCapitalPendiente]);

  // Additional calculations for compatibility
  const debtByEntity = useMemo(() => 
    debtData.map((item, index) => ({
      name: item.entity_name,
      value: item.current_balance,
      percentage: totalCapitalPendiente > 0 ? (item.current_balance / totalCapitalPendiente) * 100 : 0,
      color: ['#005E8A', '#6BD1FF', '#0ea5e9', '#0284c7', '#0369a1'][index % 5]
    }))
  , [debtData, totalCapitalPendiente]);

  const debtByType = useMemo(() => {
    const typeGroups = debtData.reduce((acc: any[], item) => {
      const existing = acc.find(d => d.name === item.loan_type);
      if (existing) {
        existing.value += item.current_balance;
      } else {
        acc.push({
          name: item.loan_type,
          value: item.current_balance,
          color: ['#005E8A', '#6BD1FF', '#0ea5e9', '#0284c7', '#0369a1'][acc.length % 5]
        });
      }
      return acc;
    }, []);

    return typeGroups.map(group => ({
      ...group,
      percentage: totalCapitalPendiente > 0 ? (group.value / totalCapitalPendiente) * 100 : 0
    }));
  }, [debtData, totalCapitalPendiente]);

  const vencimientos = useMemo(() => {
    const getDaysUntil = (dateStr: string): number => {
      return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    };

    const getUrgency = (days: number): 'alta' | 'media' | 'baja' => {
      if (days <= 30) return 'alta';
      if (days <= 90) return 'media';
      return 'baja';
    };

    return debtData.map(item => {
      const daysUntil = getDaysUntil(item.maturity_date);
      const maturityYear = new Date(item.maturity_date).getFullYear();
      return {
        id: item.id,
        entidad: item.entity_name,
        tipo: item.loan_type,
        importe: item.current_balance,
        fecha: item.maturity_date,
        daysUntil,
        urgency: getUrgency(daysUntil),
        year: maturityYear,
        total: item.current_balance
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [debtData]);

  const hasRealData = () => debtData.length > 0;

  return {
    debtData,
    debtLoans: debtData, // Compatibility alias
    loading,
    isLoading: loading, // Compatibility alias
    error,
    totalCapitalPendiente,
    tirPromedio,
    riskMetrics,
    debtByEntity,
    debtByType,
    vencimientos,
    hasRealData,
    refetch: fetchDebtData
  };
};