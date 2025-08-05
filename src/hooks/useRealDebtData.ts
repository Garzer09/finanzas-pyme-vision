import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RealDebtItem {
  id: string;
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

export interface DebtMaturity {
  id: string;
  maturity_year: number;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
}

export interface RiskMetrics {
  dscr: number;
  netDebtEbitda: number;
  interestCoverage: number;
}

export const useRealDebtData = (companyId?: string) => {
  const [debtLoans, setDebtLoans] = useState<RealDebtItem[]>([]);
  const [debtMaturities, setDebtMaturities] = useState<DebtMaturity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && companyId) {
      fetchDebtData();
    } else {
      setIsLoading(false);
    }
  }, [user, companyId]);

  const fetchDebtData = async () => {
    if (!companyId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Fetch debt loans
      const { data: loansData, error: loansError } = await supabase
        .from('debt_loans')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;

      // Fetch debt maturities
      const { data: maturitiesData, error: maturitiesError } = await supabase
        .from('debt_maturities')
        .select('*')
        .eq('company_id', companyId)
        .order('maturity_year', { ascending: true });

      if (maturitiesError) throw maturitiesError;

      // Transform loans data
      const transformedLoans: RealDebtItem[] = loansData.map(loan => ({
        id: loan.id.toString(),
        entity_name: loan.entity_name,
        loan_type: loan.loan_type,
        initial_amount: Number(loan.initial_amount),
        current_balance: Number(loan.initial_amount), // TODO: Calculate from balances
        interest_rate: Number(loan.interest_rate),
        maturity_date: loan.maturity_date,
        guarantees: loan.guarantees,
        observations: loan.observations,
        currency_code: loan.currency_code
      }));

      // Transform maturities data
      const transformedMaturities: DebtMaturity[] = maturitiesData.map(maturity => ({
        id: maturity.id.toString(),
        maturity_year: maturity.maturity_year,
        principal_amount: Number(maturity.principal_amount),
        interest_amount: Number(maturity.interest_amount),
        total_amount: Number(maturity.total_amount)
      }));

      setDebtLoans(transformedLoans);
      setDebtMaturities(transformedMaturities);
    } catch (err) {
      console.error('Error fetching debt data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos de deuda');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate aggregated metrics
  const totalCapitalPendiente = useMemo(() => 
    debtLoans.reduce((sum, item) => sum + item.current_balance, 0)
  , [debtLoans]);

  const tirPromedio = useMemo(() => {
    if (totalCapitalPendiente === 0) return 0;
    return debtLoans.reduce((sum, item) => 
      sum + (item.interest_rate * item.current_balance) / totalCapitalPendiente, 0)
  }, [debtLoans, totalCapitalPendiente]);

  // Data for charts
  const debtByEntity = useMemo(() => 
    debtLoans.map((item, index) => ({
      name: item.entity_name,
      value: item.current_balance,
      percentage: totalCapitalPendiente > 0 ? (item.current_balance / totalCapitalPendiente) * 100 : 0,
      color: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'][index % 5]
    }))
  , [debtLoans, totalCapitalPendiente]);

  const debtByType = useMemo(() => {
    const typeGroups = debtLoans.reduce((acc: any[], item) => {
      const existing = acc.find(d => d.name === item.loan_type);
      if (existing) {
        existing.value += item.current_balance;
      } else {
        acc.push({
          name: item.loan_type,
          value: item.current_balance,
          color: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'][acc.length % 5]
        });
      }
      return acc;
    }, []);

    return typeGroups.map(group => ({
      ...group,
      percentage: totalCapitalPendiente > 0 ? (group.value / totalCapitalPendiente) * 100 : 0
    }));
  }, [debtLoans, totalCapitalPendiente]);

  // Maturities timeline
  const vencimientos = useMemo(() => {
    return debtMaturities.map(maturity => ({
      id: maturity.id,
      year: maturity.maturity_year,
      principal: maturity.principal_amount,
      interest: maturity.interest_amount,
      total: maturity.total_amount,
      urgency: maturity.maturity_year <= new Date().getFullYear() + 1 ? 'alta' : 
               maturity.maturity_year <= new Date().getFullYear() + 2 ? 'media' : 'baja'
    }));
  }, [debtMaturities]);

  // Risk metrics (using simulated EBITDA for now)
  const riskMetrics = useMemo((): RiskMetrics => {
    const ebitda = 450000; // TODO: Get from real financial data
    const totalAnnualInterest = debtLoans.reduce((sum, item) => 
      sum + (item.current_balance * item.interest_rate / 100), 0);
    const totalAnnualDebtService = totalAnnualInterest; // Simplified

    return {
      dscr: totalAnnualDebtService > 0 ? ebitda / totalAnnualDebtService : 0,
      netDebtEbitda: ebitda > 0 ? totalCapitalPendiente / ebitda : 0,
      interestCoverage: totalAnnualInterest > 0 ? ebitda / totalAnnualInterest : 0
    };
  }, [debtLoans, totalCapitalPendiente]);

  const hasRealData = () => debtLoans.length > 0;

  return {
    debtLoans,
    debtMaturities,
    totalCapitalPendiente,
    tirPromedio,
    debtByEntity,
    debtByType,
    vencimientos,
    riskMetrics,
    isLoading,
    error,
    hasRealData,
    refetch: fetchDebtData
  };
};