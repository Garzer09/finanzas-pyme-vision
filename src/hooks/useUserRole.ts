import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { userRole, loading, isDemoMode, demoRole } = useAuth();
  
  // In demo mode, use demoRole; otherwise use userRole
  const effectiveRole = isDemoMode ? demoRole : userRole;
  
  return {
    userRole: effectiveRole,
    isAdmin: effectiveRole === 'admin',
    isUser: effectiveRole === 'user',
    loading,
    isDemoMode,
    hasRole: (role: 'admin' | 'user') => effectiveRole === role,
  };
};