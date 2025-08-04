import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { 
  shouldNavigateAfterAuth, 
  canAccessProtectedRoute, 
  isAuthLoading, 
  getAuthError, 
  getAuthRetry 
} from '@/types/auth';

/**
 * Enhanced useAuth hook with utility functions
 * Provides both the raw context and convenient helpers
 */
export function useAuth() {
  const context = useAuthContext();
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return {
    ...context,
    
    // Utility functions
    shouldNavigateAfterAuth: (currentPath: string) => 
      shouldNavigateAfterAuth(context.authState, currentPath),
    
    canAccessProtectedRoute: () => 
      canAccessProtectedRoute(context.authState),
    
    isLoading: () => 
      isAuthLoading(context.authState),
    
    error: getAuthError(context.authState),
    
    retry: getAuthRetry(context.authState),
    
    // Computed properties for convenience
    isAuthenticated: context.authState.status === 'authenticated',
    isUnauthenticated: context.authState.status === 'unauthenticated',
    isInitializing: context.authState.status === 'initializing',
    isAuthenticating: context.authState.status === 'authenticating',
    hasError: context.authState.status === 'error',
  };
}

export default useAuth;