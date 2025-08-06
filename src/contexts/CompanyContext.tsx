import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  currency_code: string;
  accounting_standard: string;
  sector?: string;
  logo_url?: string;
}

interface CompanyContextType {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  loading: boolean;
  error: string | null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Load company from URL parameter
  useEffect(() => {
    const companyId = searchParams.get('companyId');
    if (companyId && (!selectedCompany || selectedCompany.id !== companyId)) {
      loadCompany(companyId);
    }
  }, [searchParams, selectedCompany]);

  const loadCompany = async (companyId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) {
        throw new Error(`Error loading company: ${companyError.message}`);
      }

      setSelectedCompanyState(company);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error loading company:', err);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedCompany = (company: Company | null) => {
    setSelectedCompanyState(company);
    setError(null);
  };

  return (
    <CompanyContext.Provider value={{
      selectedCompany,
      setSelectedCompany,
      loading,
      error
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};