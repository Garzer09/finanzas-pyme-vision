import { useSearchParams } from 'react-router-dom';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useFinancialData } from '@/hooks/useFinancialData';

export const useCompanyData = (dataType?: string) => {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId');
  const { currentCompany } = useCompanyContext();
  
  // Use the enhanced useFinancialData with companyId
  const financialData = useFinancialData(dataType, companyId || undefined);
  
  return {
    companyId,
    currentCompany,
    ...financialData,
    hasCompanyContext: !!companyId
  };
};