import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompanyInfo {
  id: string;
  name: string;
  sector: string | null;
  currency_code: string;
  logo_url: string | null;
}

export const useCompanyInfo = (companyId: string | null) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setCompanyInfo(null);
      return;
    }

    const fetchCompanyInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('companies')
          .select('id, name, sector, currency_code, logo_url')
          .eq('id', companyId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setCompanyInfo(data);
      } catch (err: any) {
        console.error('Error fetching company info:', err);
        setError(err.message);
        setCompanyInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [companyId]);

  return { companyInfo, loading, error };
};