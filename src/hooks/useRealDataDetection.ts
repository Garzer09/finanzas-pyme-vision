import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DataAvailability {
  hasFinancialData: boolean;
  hasBalanceData: boolean;
  hasPyGData: boolean;
  hasCashFlowData: boolean;
  hasOperationalData: boolean;
  hasCompanyData: boolean;
  dataRecordCount: number;
  lastDataUpdate: string | null;
  isDataReal: boolean;
}

export const useRealDataDetection = (companyId?: string) => {
  const [dataAvailability, setDataAvailability] = useState<DataAvailability>({
    hasFinancialData: false,
    hasBalanceData: false,
    hasPyGData: false,
    hasCashFlowData: false,
    hasOperationalData: false,
    hasCompanyData: false,
    dataRecordCount: 0,
    lastDataUpdate: null,
    isDataReal: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkDataAvailability = async () => {
    if (!companyId) {
      setDataAvailability(prev => ({ ...prev, isDataReal: false }));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check financial data - use fs_balance_lines as main financial data table
      const { count: financialCount, error: financialError } = await supabase
        .from('fs_balance_lines')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (financialError) throw financialError;

      // Check balance data  
      const { count: balanceCount, error: balanceError } = await supabase
        .from('fs_balance_lines')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (balanceError) throw balanceError;

      // Check P&G data
      const { count: pygCount, error: pygError } = await supabase
        .from('fs_pyg_lines')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (pygError) throw pygError;

      // Check cashflow data
      const { count: cashflowCount, error: cashflowError } = await supabase
        .from('fs_cashflow_lines')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (cashflowError) throw cashflowError;

      // Check operational data
      const { count: operationalCount, error: operationalError } = await supabase
        .from('operational_metrics')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (operationalError) throw operationalError;

      // Check company info
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError && companyError.code !== 'PGRST116') throw companyError;

      // Get latest data update
      const { data: latestUpdate, error: updateError } = await supabase
        .from('fs_balance_lines')
        .select('created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Calculate totals
      const totalRecords = (financialCount || 0) + (balanceCount || 0) + 
                          (pygCount || 0) + (cashflowCount || 0) + 
                          (operationalCount || 0);

      const hasAnyData = totalRecords > 0;

      setDataAvailability({
        hasFinancialData: (financialCount || 0) > 0,
        hasBalanceData: (balanceCount || 0) > 0,
        hasPyGData: (pygCount || 0) > 0,
        hasCashFlowData: (cashflowCount || 0) > 0,
        hasOperationalData: (operationalCount || 0) > 0,
        hasCompanyData: !!companyData,
        dataRecordCount: totalRecords,
        lastDataUpdate: latestUpdate?.created_at || null,
        isDataReal: hasAnyData
      });

    } catch (err) {
      console.error('Error checking data availability:', err);
      setError(err instanceof Error ? err.message : 'Error checking data availability');
      setDataAvailability(prev => ({ ...prev, isDataReal: false }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDataAvailability();
  }, [companyId]);

  const refreshDataAvailability = () => {
    checkDataAvailability();
  };

  return {
    dataAvailability,
    loading,
    error,
    refreshDataAvailability,
    hasRealData: dataAvailability.isDataReal && dataAvailability.dataRecordCount > 0
  };
};