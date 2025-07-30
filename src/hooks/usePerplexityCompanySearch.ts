import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompanyInfo {
  name: string;
  description: string;
  sector: string;
  industry: string;
  foundedYear?: number;
  employees?: string;
  revenue?: string;
  headquarters?: string;
  website?: string;
  products?: string[];
  competitors?: string[];
  keyFacts?: string[];
  marketPosition?: string;
  businessModel?: string;
  dataFound: boolean;
  source: string;
}

interface SearchResult {
  companyInfo: CompanyInfo;
  rawSearchResult: string;
  searchQuery: string;
}

export const usePerplexityCompanySearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchCompany = useCallback(async (companyName: string, additionalContext?: string) => {
    if (!companyName.trim()) {
      setError('El nombre de la empresa es requerido');
      return null;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      console.log(`Searching for company: ${companyName}`);
      
      const { data, error: functionError } = await supabase.functions.invoke('company-search-perplexity', {
        body: {
          companyName: companyName.trim(),
          additionalContext
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Error en la búsqueda de Perplexity');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Search result received:', data);
      setSearchResult(data);
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido en la búsqueda';
      console.error('Error searching company:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResult(null);
    setError(null);
  }, []);

  return {
    searchCompany,
    isSearching,
    searchResult,
    error,
    clearSearch,
    hasResults: !!searchResult,
    dataFound: searchResult?.companyInfo?.dataFound || false
  };
};