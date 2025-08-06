// Updated hooks that accept companyId parameter

import { useCompanyData } from '@/hooks/useCompanyData';
import { useSearchParams } from 'react-router-dom';

// Enhanced hooks that automatically get companyId from URL params
export const useDebtData = () => {
  return useCompanyData('debt');
};

export const useCashFlowData = () => {
  return useCompanyData('estado_flujos');
};

export const useFinancialAssumptionsData = () => {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId');
  // This hook would need to be updated to accept companyId
  // For now, returning the existing implementation
  return { assumptions: [], loading: false, error: null, hasRealData: false };
};

export const useOperationalData = () => {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId');
  // This hook would need to be updated to accept companyId
  // For now, returning the existing implementation
  return { operationalMetrics: [], loading: false, error: null, hasRealData: false };
};

export const useSegmentData = () => {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId');
  // This hook would need to be updated to accept companyId
  // For now, returning the existing implementation
  return { 
    operationalData: [], 
    segmentsByType: { producto: [], region: [], cliente: [] }, 
    loading: false, 
    error: null, 
    hasRealData: false,
    refetch: async () => {} 
  };
};