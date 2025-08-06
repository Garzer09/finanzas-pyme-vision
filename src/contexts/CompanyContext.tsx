import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Company {
  id: string;
  name: string;
  currency_code: string;
  sector?: string;
  logo_url?: string;
  accounting_standard?: string;
  created_at: string;
  updated_at: string;
}

interface CompanyContextType {
  // Current company state
  currentCompany: Company | null;
  companyId: string | null;
  loading: boolean;
  error: string | null;
  
  // Available companies for user
  userCompanies: Company[];
  
  // Functions
  setCurrentCompany: (companyId: string) => Promise<void>;
  validateCompanyAccess: (companyId: string) => Promise<boolean>;
  refreshCompanyData: () => Promise<void>;
  clearCurrentCompany: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompanyContext = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load user's available companies
  const loadUserCompanies = async () => {
    if (!user) {
      setUserCompanies([]);
      return;
    }

    try {
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select(`
          company_id,
          companies (
            id,
            name,
            currency_code,
            sector,
            logo_url,
            accounting_standard,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (membershipError) {
        console.error('Error loading user companies:', membershipError);
        return;
      }

      const companies: Company[] = [];
      if (memberships && Array.isArray(memberships)) {
        memberships.forEach(membership => {
          if (membership.companies && typeof membership.companies === 'object') {
            companies.push(membership.companies as Company);
          }
        });
      }
      setUserCompanies(companies);
    } catch (err) {
      console.error('Error loading user companies:', err);
    }
  };

  // Validate if user has access to a specific company
  const validateCompanyAccess = async (targetCompanyId: string): Promise<boolean> => {
    if (!user || !targetCompanyId) return false;

    // Check if user is admin first
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Admins have access to all companies
    if (userRole?.role === 'admin') {
      return true;
    }

    try {
      const { data: membership, error } = await supabase
        .from('memberships')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', targetCompanyId)
        .single();

      return !error && !!membership;
    } catch (err) {
      console.error('Error validating company access:', err);
      return false;
    }
  };

  // Set current company and load its data
  const setCurrentCompany = async (targetCompanyId: string) => {
    if (!targetCompanyId) {
      clearCurrentCompany();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate access first
      const hasAccess = await validateCompanyAccess(targetCompanyId);
      if (!hasAccess) {
        setError('No tienes permisos para acceder a esta empresa');
        return;
      }

      // Load company data
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', targetCompanyId)
        .single();

      if (companyError) {
        throw companyError;
      }

      setCurrentCompanyState(company);
      setCompanyId(targetCompanyId);
    } catch (err) {
      console.error('Error setting current company:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar la empresa');
      toast({
        title: "Error",
        description: "Error al cargar los datos de la empresa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh current company data
  const refreshCompanyData = async () => {
    if (companyId) {
      await setCurrentCompany(companyId);
    }
    await loadUserCompanies();
  };

  // Clear current company
  const clearCurrentCompany = () => {
    setCurrentCompanyState(null);
    setCompanyId(null);
    setError(null);
  };

  // Load user companies when user changes
  useEffect(() => {
    loadUserCompanies();
  }, [user]);

  const value: CompanyContextType = {
    currentCompany,
    companyId,
    loading,
    error,
    userCompanies,
    setCurrentCompany,
    validateCompanyAccess,
    refreshCompanyData,
    clearCurrentCompany
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};