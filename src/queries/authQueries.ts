import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Role } from '@/types/auth';

// React Query key for user role
export const USER_ROLE_QUERY_KEY = 'user-role';

// Fetch user role function with optimizations
export const fetchUserRole = async (userId: string): Promise<Role> => {
  if (!userId) {
    console.debug('[AUTH-QUERY] No userId provided, defaulting to viewer');
    return 'viewer';
  }

  console.debug('[AUTH-QUERY] Fetching role for user:', userId);

  try {
    // First, try RPC function for admin check
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_role');
    
    if (!rpcError && rpcData === 'admin') {
      console.debug('[AUTH-QUERY] RPC confirmed admin role');
      return 'admin';
    } else if (rpcError) {
      console.debug('[AUTH-QUERY] RPC error:', rpcError.message);
    } else {
      console.debug('[AUTH-QUERY] RPC returned non-admin:', rpcData);
    }

    // Fallback to direct table query
    console.debug('[AUTH-QUERY] Attempting direct table query...');
    const { data: tableData, error: tableError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (!tableError && tableData?.role === 'admin') {
      console.debug('[AUTH-QUERY] Table query confirmed admin role');
      return 'admin';
    } else if (tableError) {
      console.debug('[AUTH-QUERY] Table query error:', tableError.message);
    } else {
      console.debug('[AUTH-QUERY] Table query returned:', tableData?.role || 'no role found');
    }
    
    // Default to viewer
    console.debug('[AUTH-QUERY] Defaulting to viewer role');
    return 'viewer';
  } catch (error) {
    console.error('[AUTH-QUERY] Unexpected error:', error);
    return 'viewer';
  }
};

// React Query hook for user role with caching and retries
export const useUserRole = (userId: string | null, enabled = true) => {
  return useQuery({
    queryKey: [USER_ROLE_QUERY_KEY, userId],
    queryFn: () => fetchUserRole(userId!),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    onSuccess: (role) => {
      console.debug('[AUTH-QUERY] Role query successful:', role);
    },
    onError: (error) => {
      console.error('[AUTH-QUERY] Role query failed:', error);
    },
  });
};

// Function to invalidate user role cache
export const useInvalidateUserRole = () => {
  const queryClient = useQueryClient();
  
  return (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries([USER_ROLE_QUERY_KEY, userId]);
    } else {
      queryClient.invalidateQueries([USER_ROLE_QUERY_KEY]);
    }
  };
};

// Function to set cached user role
export const useSetCachedUserRole = () => {
  const queryClient = useQueryClient();
  
  return (userId: string, role: Role) => {
    queryClient.setQueryData([USER_ROLE_QUERY_KEY, userId], role);
    console.debug('[AUTH-QUERY] Cached role updated:', { userId, role });
  };
};