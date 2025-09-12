import useSWR from 'swr';
import { supabase } from '@/integrations/supabase/client';
import { supabaseLogger } from '@/utils/supabaseLogger';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface DashboardData {
  financialData: any[];
  companies: any[];
  recentUploads: any[];
  stats: {
    totalCompanies: number;
    totalUploads: number;
    recentErrors: number;
  };
}

const fetcher = async (key: string): Promise<DashboardData> => {
  const startTime = Date.now();
  
  try {
    // Fetch financial data
    const { data: financialData, error: financialError } = await supabase
      .from('fs_pyg_lines')
      .select('*')
      .limit(100);
    
    supabaseLogger.logSelect('fs_pyg_lines', { limit: 100 }, financialError, Date.now() - startTime);
    
    if (financialError) throw financialError;

    // Fetch companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(50);
    
    supabaseLogger.logSelect('companies', { limit: 50 }, companiesError);
    
    if (companiesError) throw companiesError;

    // Fetch recent uploads
    const { data: recentUploads, error: uploadsError } = await supabase
      .from('excel_files')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    supabaseLogger.logSelect('excel_files', { limit: 20, order: 'created_at desc' }, uploadsError);

    return {
      financialData: financialData || [],
      companies: companies || [],
      recentUploads: recentUploads || [],
      stats: {
        totalCompanies: companies?.length || 0,
        totalUploads: recentUploads?.length || 0,
        recentErrors: 0 // Calculate from logs if needed
      }
    };
    
  } catch (error) {
    supabaseLogger.log('DASHBOARD_FETCH_ERROR', undefined, key, error, Date.now() - startTime);
    throw error;
  }
};

export const useDashboardSWR = () => {
  const { user, session } = useAuth();
  
  // Don't fetch until session is hydrated
  const shouldFetch = !!session && !!user;
  
  const {
    data,
    error,
    mutate,
    isLoading,
    isValidating
  } = useSWR<DashboardData>(
    shouldFetch ? 'dashboard-data' : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onError: (error) => {
        console.error('Dashboard SWR Error:', error);
        toast({
          title: "Error cargando datos",
          description: error.message || "Error desconocido al cargar el dashboard",
          variant: "destructive"
        });
      },
      onSuccess: (data) => {
        console.log('Dashboard data loaded successfully:', {
          financialRecords: data.financialData.length,
          companies: data.companies.length,
          uploads: data.recentUploads.length
        });
      }
    }
  );

  const refreshData = () => {
    mutate();
    toast({
      title: "Datos refrescados",
      description: "El dashboard ha sido actualizado con los últimos datos",
    });
  };

  return {
    data,
    error,
    isLoading,
    isValidating,
    refreshData,
    mutate,
    sessionReady: shouldFetch
  };
};