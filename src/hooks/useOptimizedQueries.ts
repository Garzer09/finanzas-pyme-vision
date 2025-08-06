import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Query keys for consistent caching
export const queryKeys = {
  companies: (userId: string) => ['companies', userId],
  companyData: (companyId: string, dataType: string) => ['company-data', companyId, dataType],
  processingStatus: (companyId: string) => ['processing-status', companyId],
  userRole: (userId: string) => ['user-role', userId],
  membership: (userId: string, companyId: string) => ['membership', userId, companyId],
};

// Optimized hook for fetching company financial data
export const useCompanyFinancialData = (companyId: string) => {
  return useQueries({
    queries: [
      {
        queryKey: queryKeys.companyData(companyId, 'pyg'),
        queryFn: async () => {
          const { data, error } = await supabase
            .from('fs_pyg_lines')
            .select('*')
            .eq('company_id', companyId)
            .order('period_date', { ascending: false });
          if (error) throw error;
          return data || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        enabled: !!companyId,
      },
      {
        queryKey: queryKeys.companyData(companyId, 'balance'),
        queryFn: async () => {
          const { data, error } = await supabase
            .from('fs_balance_lines')
            .select('*')
            .eq('company_id', companyId)
            .order('period_date', { ascending: false });
          if (error) throw error;
          return data || [];
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: !!companyId,
      },
    ],
  });
};

// Optimized hook for processing status
export const useProcessingStatus = (companyId: string) => {
  return useQuery({
    queryKey: queryKeys.processingStatus(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('created_at, status')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    enabled: !!companyId,
  });
};

// Optimized hook for user companies with batched data
export const useUserCompanies = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.companies(user?.id || ''),
    queryFn: async () => {
      if (!user) return [];
      
      // Fetch companies with memberships in a single query
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select(`
          company_id,
          company:companies!inner (
            id,
            name,
            currency_code,
            accounting_standard,
            sector,
            created_at,
            logo_url
          )
        `)
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      return memberships?.map(m => m.company).filter(Boolean) || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!user,
  });
};

// Optimized membership check with caching
export const useMembershipCheck = (companyId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.membership(user?.id || '', companyId),
    queryFn: async () => {
      if (!user || !companyId) return null;
      
      const { data, error } = await supabase
        .from('memberships')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - membership changes rarely
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!user && !!companyId,
  });
};

// Hook for batching company data for dashboard
export const useBatchedCompanyData = (companyIds: string[]) => {
  return useQueries({
    queries: companyIds.map(companyId => ({
      queryKey: ['company-summary', companyId],
      queryFn: async () => {
        // Single query to get basic company info and latest data availability
        const [pygCheck, balanceCheck, processingStatus] = await Promise.allSettled([
          supabase
            .from('fs_pyg_lines')
            .select('period_year')
            .eq('company_id', companyId)
            .order('period_year', { ascending: false })
            .limit(1),
          supabase
            .from('fs_balance_lines')
            .select('period_year')
            .eq('company_id', companyId)
            .order('period_year', { ascending: false })
            .limit(1),
          supabase
            .from('processing_jobs')
            .select('created_at, status')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        return {
          companyId,
          hasPygData: pygCheck.status === 'fulfilled' && pygCheck.value.data?.length > 0,
          hasBalanceData: balanceCheck.status === 'fulfilled' && balanceCheck.value.data?.length > 0,
          lastProcessing: processingStatus.status === 'fulfilled' ? processingStatus.value.data : null,
        };
      },
      staleTime: 3 * 60 * 1000, // 3 minutes
      gcTime: 10 * 60 * 1000,
      enabled: !!companyId,
    })),
  });
};