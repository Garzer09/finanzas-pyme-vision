import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePerplexitySearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Search for company shareholder information
  const searchCompanyInfo = async (companyName: string, searchType: 'full' | 'shareholders' | 'management' | 'board' = 'full') => {
    if (!companyName) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es requerido",
        variant: "destructive",
      });
      return null;
    }

    setIsSearching(true);
    setError(null);

    try {
      const { data: response, error: functionError } = await supabase.functions.invoke(
        'company-shareholder-search',
        {
          body: {
            company_name: companyName,
            search_type: searchType
          }
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!response.success) {
        throw new Error(response.error || 'Error en la búsqueda');
      }

      toast({
        title: "Búsqueda completada",
        description: `Se encontró información de ${companyName}`,
      });

      // Fetch updated search history
      await fetchSearchHistory();

      return response.data;
    } catch (err) {
      console.error('Error in Perplexity search:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      toast({
        title: "Error en la búsqueda",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch search history
  const fetchSearchHistory = async () => {
    try {
      const { data: history, error: historyError } = await supabase
        .from('shareholder_search_history')
        .select('*')
        .order('search_date', { ascending: false })
        .limit(10);

      if (historyError) {
        throw historyError;
      }

      setSearchHistory(history || []);
    } catch (err) {
      console.error('Error fetching search history:', err);
    }
  };

  // Get recent searches for a specific company
  const getRecentSearches = (companyName: string) => {
    return searchHistory.filter(search => 
      search.company_name.toLowerCase().includes(companyName.toLowerCase())
    );
  };

  // Clear search history
  const clearSearchHistory = async () => {
    try {
      const { error } = await supabase
        .from('shareholder_search_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        throw error;
      }

      setSearchHistory([]);
      toast({
        title: "Historial eliminado",
        description: "Se ha eliminado el historial de búsquedas",
      });
    } catch (err) {
      console.error('Error clearing search history:', err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el historial",
        variant: "destructive",
      });
    }
  };

  return {
    searchCompanyInfo,
    fetchSearchHistory,
    getRecentSearches,
    clearSearchHistory,
    isSearching,
    searchHistory,
    error
  };
};