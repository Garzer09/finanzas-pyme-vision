import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Role } from '@/types/auth';

// React Query key for user role
export const USER_ROLE_QUERY_KEY = 'user-role';

// Fetch user role function with improved reliability and error handling
export const fetchUserRole = async (userId: string): Promise<Role> => {
  if (!userId) {
    console.debug('[AUTH-QUERY] No userId provided, defaulting to viewer');
    return 'viewer';
  }

  console.debug('[AUTH-QUERY] Fetching role for user:', userId);
  const startTime = Date.now();

  try {
    // Create a timeout promise for better error handling
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Role fetch timeout')), 10000); // 10 second timeout
    });

    // First, try RPC function for admin check with timeout
    console.debug('[AUTH-QUERY] Attempting RPC call...');
    const rpcPromise = supabase.rpc('get_user_role');
    
    try {
      const { data: rpcData, error: rpcError } = await Promise.race([rpcPromise, timeoutPromise]);
      
      if (!rpcError && rpcData === 'admin') {
        const duration = Date.now() - startTime;
        console.debug(`[AUTH-QUERY] RPC confirmed admin role (${duration}ms)`);
        return 'admin';
      } else if (rpcError) {
        console.warn('[AUTH-QUERY] RPC error:', rpcError.message);
      } else {
        console.debug('[AUTH-QUERY] RPC returned non-admin:', rpcData);
      }
    } catch (rpcTimeoutError) {
      console.warn('[AUTH-QUERY] RPC timeout or error:', rpcTimeoutError.message);
    }

    // Fallback to direct table query with timeout
    console.debug('[AUTH-QUERY] Attempting direct table query...');
    const tablePromise = supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    try {
      const { data: tableData, error: tableError } = await Promise.race([tablePromise, timeoutPromise]);

      if (!tableError && tableData?.role === 'admin') {
        const duration = Date.now() - startTime;
        console.debug(`[AUTH-QUERY] Table query confirmed admin role (${duration}ms)`);
        return 'admin';
      } else if (!tableError && tableData?.role) {
        const duration = Date.now() - startTime;
        console.debug(`[AUTH-QUERY] Table query returned role: ${tableData.role} (${duration}ms)`);
        return tableData.role as Role;
      } else if (tableError) {
        console.warn('[AUTH-QUERY] Table query error:', tableError.message);
      } else {
        console.debug('[AUTH-QUERY] Table query returned no role data');
      }
    } catch (tableTimeoutError) {
      console.warn('[AUTH-QUERY] Table query timeout or error:', tableTimeoutError.message);
    }
    
    // Default to viewer with timing info
    const duration = Date.now() - startTime;
    console.debug(`[AUTH-QUERY] Defaulting to viewer role after ${duration}ms`);
    return 'viewer';
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AUTH-QUERY] Unexpected error after ${duration}ms:`, error);
    return 'viewer';
  }
};

// React Query hook for user role with enhanced caching and retries
export const useUserRole = (userId: string | null, enabled = true) => {
  return useQuery({
    queryKey: [USER_ROLE_QUERY_KEY, userId],
    queryFn: () => fetchUserRole(userId!),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    retry: (failureCount, error) => {
      // Retry up to 3 times, but not for certain errors
      if (failureCount >= 3) return false;
      
      // Don't retry if it's a user ID issue or timeout
      const errorMessage = error?.message || '';
      if (errorMessage.includes('No userId') || errorMessage.includes('timeout')) {
        console.debug('[AUTH-QUERY] Not retrying due to error type:', errorMessage);
        return false;
      }
      
      console.debug(`[AUTH-QUERY] Retrying role fetch, attempt ${failureCount + 1}`);
      return true;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s with some jitter
      const baseDelay = Math.min(1000 * 2 ** attemptIndex, 5000);
      const jitter = Math.random() * 0.1 * baseDelay; // Add 10% jitter
      return baseDelay + jitter;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Function to invalidate user role cache
export const useInvalidateUserRole = () => {
  const queryClient = useQueryClient();
  
  return (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: [USER_ROLE_QUERY_KEY, userId] });
    } else {
      queryClient.invalidateQueries({ queryKey: [USER_ROLE_QUERY_KEY] });
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