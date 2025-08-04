import { useAuth } from '@/contexts/AuthContext';

// Simplified useUserRole that just reads from AuthContext
export const useUserRole = () => {
  const { role, initialized } = useAuth();
  
  console.log('🎭 useUserRole (simplified):', { role, initialized });
  
  return {
    userRole: role === 'admin' ? 'admin' : (role === 'viewer' ? 'user' : null),
    isAdmin: role === 'admin',
    isUser: role === 'viewer',
    loading: !initialized,
    hasRole: (checkRole: 'admin' | 'user') => {
      if (checkRole === 'admin') return role === 'admin';
      if (checkRole === 'user') return role === 'viewer';
      return false;
    },
  };
};