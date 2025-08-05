import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { 
  shouldNavigateAfterAuth, 
  canAccessProtectedRoute, 
  isAuthLoading, 
  getAuthError, 
  getAuthRetry 
} from '@/types/auth';
import { validateSession, createSessionRecovery } from '@/utils/authHelpers';
import { useCallback } from 'react';

/**
 * Enhanced useAuth hook with utility functions and session management
 * Provides both the raw context and convenient helpers
 */
export function useAuth() {
  const context = useAuthContext();
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Enhanced session validation
  const validateCurrentSession = useCallback(() => {
    if (context.authState.status === 'authenticated') {
      return validateSession(context.authState.user, context.authState.session);
    }
    return { isValid: false, needsRefresh: false, reason: 'Not authenticated' };
  }, [context.authState]);

  // Session recovery with automatic retry
  const recoverSession = useCallback(async () => {
    const sessionRecovery = createSessionRecovery(
      async () => {
        // Refresh the session via Supabase
        await context.refreshRole();
      }
    );
    return sessionRecovery();
  }, [context.refreshRole]);

  // Enhanced retry with session recovery
  const enhancedRetry = useCallback(async () => {
    console.debug('[USE-AUTH] Enhanced retry triggered');
    try {
      const originalRetry = getAuthRetry(context.authState);
      
      if (originalRetry) {
        console.debug('[USE-AUTH] Using original retry function');
        originalRetry();
      } else {
        console.debug('[USE-AUTH] No original retry, attempting session recovery');
        // Attempt session recovery
        const recovered = await recoverSession();
        if (!recovered) {
          console.debug('[USE-AUTH] Session recovery failed, forcing sign out');
          // If recovery fails, force re-authentication
          await context.signOut('/auth');
        }
      }
    } catch (error) {
      console.error('[USE-AUTH] Enhanced retry failed:', error);
      // Fallback to sign out
      await context.signOut('/auth');
    }
  }, [context.authState, context.signOut, recoverSession]);

  return {
    ...context,
    
    // Enhanced utility functions
    shouldNavigateAfterAuth: (currentPath: string) => 
      shouldNavigateAfterAuth(context.authState, currentPath),
    
    canAccessProtectedRoute: () => 
      canAccessProtectedRoute(context.authState),
    
    isLoading: () => 
      isAuthLoading(context.authState),
    
    error: getAuthError(context.authState),
    
    retry: enhancedRetry,
    
    // Session management
    validateCurrentSession,
    recoverSession,
    
    // Computed properties for convenience
    isAuthenticated: context.authState.status === 'authenticated',
    isUnauthenticated: context.authState.status === 'unauthenticated',
    isInitializing: context.authState.status === 'initializing',
    isAuthenticating: context.authState.status === 'authenticating',
    hasError: context.authState.status === 'error',
    
    // Session status indicators
    sessionValid: validateCurrentSession().isValid,
    sessionNeedsRefresh: validateCurrentSession().needsRefresh,
  };
}

export default useAuth;