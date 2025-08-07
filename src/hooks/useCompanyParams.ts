import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useCompanyContext } from '@/contexts/CompanyContext';

/**
 * Hook to get companyId from URL parameters and automatically set it in context
 */
export const useCompanyParams = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { setCurrentCompany } = useCompanyContext();

  useEffect(() => {
    if (companyId) {
      setCurrentCompany(companyId);
    }
  }, [companyId, setCurrentCompany]);

  return {
    companyId: companyId || null
  };
};