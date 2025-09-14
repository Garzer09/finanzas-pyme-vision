import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Role } from '@/types/auth';

// React Query key for user role
export const USER_ROLE_QUERY_KEY = 'user-role';

// Simplified user role fetch that's more reliable
export const fetchUserRole = async (userId: string): Promise<Role> => {
  if (!userId) {
    console.debug('[AUTH-QUERY] No userId provided, defaulting to viewer');
    return 'viewer';
  }

  console.debug('[AUTH-QUERY] Fetching role for user:', userId);

  try {
    // Simple direct query with shorter timeout
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[AUTH-QUERY] Role query error:', error.message);
      // If RLS blocks this, user is likely a viewer
      return 'viewer';
    }

    const role = data?.role as Role || 'viewer';
    console.debug('[AUTH-QUERY] Role resolved:', role);
    return role;
  } catch (error) {
    console.error('[AUTH-QUERY] Role fetch failed:', error);
    return 'viewer';
  }
};

// React Query hook for user role - simplified with shorter timeout
export const useUserRole = (userId: string | null, enabled = true) => {
  return useQuery({
    queryKey: [USER_ROLE_QUERY_KEY, userId],
    queryFn: () => fetchUserRole(userId!),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Only retry once to avoid infinite loops
    retryDelay: 1000, // 1 second delay
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