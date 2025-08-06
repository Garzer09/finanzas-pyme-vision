import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCompanyContext } from '@/contexts/CompanyContext';

interface CompanyProviderProps {
  children: React.ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const { setCurrentCompany, clearCurrentCompany } = useCompanyContext();
  const companyId = searchParams.get('companyId');

  useEffect(() => {
    if (companyId) {
      setCurrentCompany(companyId);
    } else {
      clearCurrentCompany();
    }
  }, [companyId, setCurrentCompany, clearCurrentCompany]);

  return <>{children}</>;
};