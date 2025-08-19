import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FinancialAssumption {
  id: string;
  assumption_category: string;
  assumption_name: string;
  assumption_value: number;
  unit: string;
  period_year: number;
  period_type: string;
  notes?: string;
}

export interface AssumptionsByCategory {
  category: string;
  assumptions: FinancialAssumption[];
}

export const useFinancialAssumptionsData = (companyId?: string) => {
  const [assumptions, setAssumptions] = useState<FinancialAssumption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && companyId) {
      fetchAssumptionsData();
    } else {
      setIsLoading(false);
    }
  }, [user, companyId]);

  const fetchAssumptionsData = async () => {
    if (!companyId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('financial_assumptions_normalized')
        .select('*')
        .eq('company_id', companyId)
        .order('period_year', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedAssumptions: FinancialAssumption[] = data.map(assumption => ({
        id: assumption.id.toString(),
        assumption_category: assumption.assumption_category,
        assumption_name: assumption.assumption_name,
        assumption_value: Number(assumption.assumption_value),
        unit: assumption.unit,
        period_year: assumption.period_year,
        period_type: assumption.period_type,
        notes: assumption.notes
      }));

      setAssumptions(transformedAssumptions);
    } catch (err) {
      console.error('Error fetching financial assumptions:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar supuestos financieros');
    } finally {
      setIsLoading(false);
    }
  };

  // Get assumptions grouped by category
  const getAssumptionsByCategory = (): AssumptionsByCategory[] => {
    const categories = new Map<string, FinancialAssumption[]>();
    
    assumptions.forEach(assumption => {
      const category = assumption.assumption_category;
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(assumption);
    });

    return Array.from(categories.entries()).map(([category, categoryAssumptions]) => ({
      category,
      assumptions: categoryAssumptions.sort((a, b) => b.period_year - a.period_year)
    }));
  };

  // Get latest assumption by name
  const getLatestAssumption = (assumptionName: string) => {
    return assumptions
      .filter(a => a.assumption_name === assumptionName)
      .sort((a, b) => b.period_year - a.period_year)[0];
  };

  // Get key assumptions for display
  const getKeyAssumptions = () => {
    const keyNames = [
      'crecimiento_ingresos',
      'costes_variables',
      'costes_fijos',
      'capex',
      'wacc',
      'crecimiento_terminal'
    ];

    return keyNames.map(name => getLatestAssumption(name)).filter(Boolean);
  };

  // Calculate projection impact
  const getProjectionImpact = (baseValue: number, growthRate: number, years: number) => {
    return baseValue * Math.pow(1 + (growthRate / 100), years);
  };

  const hasRealData = () => assumptions.length > 0;

  const upsertAssumption = async (
    assumption_name: string,
    assumption_value: number,
    options?: { unit?: string; category?: string; period_year?: number; period_type?: string }
  ) => {
    if (!companyId) throw new Error('companyId requerido para guardar supuestos');
    const period_year = options?.period_year ?? new Date().getFullYear();
    const period_type = options?.period_type ?? 'annual';
    const unit = options?.unit ?? '%';
    const category = options?.category ?? 'segment';

    const { error } = await supabase
      .from('financial_assumptions_normalized')
      .upsert({
        company_id: companyId,
        assumption_category: category,
        assumption_name,
        assumption_value,
        unit,
        period_year,
        period_type
      }, { onConflict: 'company_id,assumption_name,period_year,period_type' });

    if (error) throw error;
    await fetchAssumptionsData();
  };

  const upsertSegmentMargins = async (margins: {
    premium: number;
    estandar: number;
    basicos: number;
    servicios: number;
  }) => {
    await upsertAssumption('margen_segmento_premium', margins.premium, { unit: '%', category: 'segment' });
    await upsertAssumption('margen_segmento_estandar', margins.estandar, { unit: '%', category: 'segment' });
    await upsertAssumption('margen_segmento_basicos', margins.basicos, { unit: '%', category: 'segment' });
    await upsertAssumption('margen_segmento_servicios', margins.servicios, { unit: '%', category: 'segment' });
  };

  return {
    assumptions,
    getAssumptionsByCategory,
    getLatestAssumption,
    getKeyAssumptions,
    getProjectionImpact,
    isLoading,
    error,
    hasRealData,
    refetch: fetchAssumptionsData,
    upsertAssumption,
    upsertSegmentMargins
  };
};