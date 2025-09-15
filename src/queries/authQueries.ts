import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Role } from '@/types/auth';

// React Query key for user role
export const USER_ROLE_QUERY_KEY = 'user-role';

// Optimized and fast user role fetching
export const fetchUserRole = async (userId: string): Promise<Role> => {
  if (!userId) {
    console.debug('[AUTH-QUERY] No userId provided, defaulting to viewer');
    return 'viewer';
  }

  console.debug('[AUTH-QUERY] Fetching role for user:', userId);
  const startTime = Date.now();

  try {
    // Quick check - admins table first (fastest query)
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!adminError && adminData) {
      const duration = Date.now() - startTime;
      console.debug(`[AUTH-QUERY] Admin confirmed via admins table (${duration}ms)`);
      return 'admin';
    }

    // Fallback to user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (!roleError && roleData?.role) {
      const duration = Date.now() - startTime;
      console.debug(`[AUTH-QUERY] Role found: ${roleData.role} (${duration}ms)`);
      return roleData.role as Role;
    }

    // Default to viewer
    const duration = Date.now() - startTime;
    console.debug(`[AUTH-QUERY] Defaulting to viewer role (${duration}ms)`);
    return 'viewer';
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AUTH-QUERY] Error fetching role (${duration}ms):`, error);
    return 'viewer';
  }
};

// Optimized React Query hook for user role
export const useUserRole = (userId: string | null, enabled = true) => {
  return useQuery({
    queryKey: [USER_ROLE_QUERY_KEY, userId],
    queryFn: () => fetchUserRole(userId!),
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes - cache longer since roles don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2, // Only retry twice
    retryDelay: 500, // Quick retry - 500ms
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    networkMode: 'always', // Always try even if offline
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