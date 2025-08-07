import React, { useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useCompanyContext } from '@/contexts/CompanyContext';

interface CompanyProviderProps {
  children: React.ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const { setCurrentCompany } = useCompanyContext();
  const { companyId: paramCompanyId } = useParams<{ companyId: string }>();
  const queryCompanyId = searchParams.get('companyId');
  const effectiveCompanyId = paramCompanyId || queryCompanyId;

  useEffect(() => {
    if (effectiveCompanyId) {
      setCurrentCompany(effectiveCompanyId);
    }
    // Intentionally do NOT clear when missing to avoid loops during route changes
  }, [effectiveCompanyId, setCurrentCompany]);

  return <>{children}</>;
};