import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useMachine } from '@xstate/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { authMachine } from '@/machines/authMachine';
import { useUserRole, useSetCachedUserRole } from '@/queries/authQueries';
import { useAuthNavigation } from '@/hooks/useAuthNavigation';
import { Role } from '@/types/auth';
import { securityService } from '@/services/securityService';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});

interface AuthContextType {
  // Current state
  user: User | null;
  session: Session | null;
  role: Role;
  isAuthenticated: boolean;
  hasJustLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, data?: any) => Promise<{ error: any }>;
  signOut: (redirectTo?: string) => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  refreshRole: () => Promise<void>;
  retry: () => void;
  
  // Backward compatibility for components that still use these
  authState: any;
  inactivityWarning: boolean;
  timeUntilLogout: number | null;
  resetInactivityTimer: () => void;
  
  // Legacy compatibility
  authStatus: 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated';
  roleStatus: 'idle' | 'resolving' | 'ready' | 'error';
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProviderInner: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, send] = useMachine(authMachine);
  const setCachedUserRole = useSetCachedUserRole();
  
  // Use React Query for role fetching
  const userId = state.context.user?.id || null;
  const {
    data: queriedRole,
    isLoading: roleLoading,
    error: roleError,
    refetch: refetchRole,
  } = useUserRole(userId, state.matches('authenticated'));

  // Update role when query succeeds
  useEffect(() => {
    if (queriedRole && state.matches('authenticated') && state.context.role !== queriedRole) {
      console.debug('[AUTH-CONTEXT] Role query result:', queriedRole);
      send({ type: 'ROLE_UPDATED', role: queriedRole });
    }
  }, [queriedRole, send]);

  // Handle role query errors
  useEffect(() => {
    if (roleError && state.matches('authenticated')) {
      console.error('[AUTH-CONTEXT] Role query error:', roleError);
      send({ type: 'ROLE_ERROR', error: (roleError as Error).message });
    }
  }, [roleError, send]);

  // Auth navigation hook
  useAuthNavigation({
    isAuthenticated: state.matches('authenticated'),
    role: (state.context.role as Role) || 'none',
    hasJustLoggedIn: state.context.hasJustLoggedIn,
  });

  // Initialize auth and set up listeners
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          console.debug('[AUTH-CONTEXT] Found existing session');
          send({
            type: 'SESSION_RECOVERED',
            user: session.user,
            session,
          });
        } else {
          console.debug('[AUTH-CONTEXT] No existing session');
          send({ type: 'SIGN_OUT' });
        }
      } catch (error) {
        console.error('[AUTH-CONTEXT] Init error:', error);
        if (mounted) {
          send({ type: 'SIGN_OUT' });
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.debug('[AUTH-CONTEXT] Auth state change:', event);

        if (event === 'SIGNED_OUT') {
          send({ type: 'SIGN_OUT' });
        } else if (event === 'SIGNED_IN' && session?.user) {
          const logger = securityService.getLogger();
          logger.info('[AUTH-CONTEXT] User signed in', {
            userId: session.user.id,
            email: session.user.email?.replace(/(.{2}).*@/, '$1***@')
          });
          
          send({
            type: 'SIGN_IN_SUCCESS',
            user: session.user,
            session,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          send({
            type: 'SESSION_RECOVERED',
            user: session.user,
            session,
          });
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [send]);

  // Actions
  const signIn = async (email: string, password: string) => {
    const logger = securityService.getLogger();
    const clientIP = 'client-ip';
    
    // Rate limiting
    const rateLimitCheck = securityService.checkAuthRateLimit(clientIP);
    if (!rateLimitCheck.allowed) {
      const error = `Too many login attempts. Please try again in ${rateLimitCheck.retryAfter} seconds.`;
      logger.warn('[AUTH-CONTEXT] Rate limit exceeded', { 
        email: email.replace(/(.{2}).*@/, '$1***@'),
        retryAfter: rateLimitCheck.retryAfter 
      });
      send({ type: 'SIGN_IN_ERROR', error });
      return { error: { message: error } };
    }

    send({ type: 'SIGN_IN', email, password });
    securityService.recordAuthAttempt(clientIP, email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn('[AUTH-CONTEXT] Sign in failed', {
        email: email.replace(/(.{2}).*@/, '$1***@'),
        error: error.message
      });
      securityService.recordAuthFailure(clientIP, email, error.message);
      send({ type: 'SIGN_IN_ERROR', error: error.message });
      return { error };
    }

    logger.info('[AUTH-CONTEXT] Sign in successful', {
      email: email.replace(/(.{2}).*@/, '$1***@')
    });
    
    return { error: null };
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/',
        data: userData
      }
    });
    return { error };
  };

  const signOut = async (redirectTo: string = '/') => {
    await supabase.auth.signOut();
    send({ type: 'SIGN_OUT' });
    if (redirectTo !== '/') {
      window.location.href = redirectTo;
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const refreshRole = async () => {
    if (state.matches('authenticated') && userId) {
      refetchRole();
    }
  };

  const retry = () => {
    if (state.matches('error')) {
      send({ type: 'RETRY' });
    } else if (state.matches('authenticated') && roleError) {
      refetchRole();
    }
  };

  // Computed values
  const isAuthenticated = state.matches('authenticated');
  const isLoading = state.matches('initializing') || state.matches('authenticating') || roleLoading;
  const currentRole = state.context.role !== 'none' ? state.context.role : (queriedRole || 'none');

  // Legacy compatibility
  const authStatus = state.matches('authenticating') ? 'authenticating' :
                    state.matches('authenticated') ? 'authenticated' :
                    state.matches('unauthenticated') ? 'unauthenticated' : 'idle';

  const roleStatus = roleLoading ? 'resolving' :
                    roleError ? 'error' :
                    currentRole !== 'none' ? 'ready' : 'idle';

  const contextValue: AuthContextType = {
    user: state.context.user,
    session: state.context.session,
    role: (currentRole as Role),
    isAuthenticated,
    hasJustLoggedIn: state.context.hasJustLoggedIn,
    isLoading,
    error: state.context.error || (roleError ? (roleError as Error).message : null),
    signIn,
    signUp,
    signOut,
    updatePassword,
    refreshRole,
    retry,
    
    // Backward compatibility props (simplified)
    authState: { 
      status: isAuthenticated ? 'authenticated' : 'unauthenticated',
      user: state.context.user,
      session: state.context.session,
      role: currentRole 
    },
    inactivityWarning: false,
    timeUntilLogout: null,
    resetInactivityTimer: () => {},
    
    authStatus,
    roleStatus,
    initialized: !state.matches('initializing'),
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </QueryClientProvider>
  );
};