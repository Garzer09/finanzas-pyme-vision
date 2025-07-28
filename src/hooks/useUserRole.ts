import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { userRole, loading } = useAuth();
  
  return {
    userRole,
    isAdmin: userRole === 'admin',
    isUser: userRole === 'user',
    loading,
    hasRole: (role: 'admin' | 'user') => userRole === role,
  };
};