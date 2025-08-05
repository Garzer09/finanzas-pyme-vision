import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import {
  AuthState,
  AuthContextType,
  Role,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig
} from '@/types/auth';
import {
  useInactivityDetection,
  createRetryWithBackoff
} from '@/hooks/useInactivityDetection';
import { securityService } from '@/services/securityService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  // Unified auth state machine
  const [authState, setAuthState] = useState<AuthState>({
    status: 'initializing'
  });

  // Track if user just logged in for proper redirection
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState(false);

  // Inactivity detection
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const {
    isWarning,
    timeRemaining,
    resetTimer: resetInactivityTimer
  } = useInactivityDetection(
    () => {
      setInactivityWarning(true);
    },
    () => {
      handleSignOut();
    }
  );
  useEffect(() => {
    setInactivityWarning(isWarning);
  }, [isWarning]);

  // Retry/backoff config
  const retryConfigRef = useRef<RetryConfig>(DEFAULT_RETRY_CONFIG);
  const retryOperation = useCallback(
    createRetryWithBackoff(
      retryConfigRef.current.maxAttempts,
      retryConfigRef.current.baseDelayMs,
      retryConfigRef.current.maxDelayMs
    ),
    []
  );

  // Concurrency guards for role fetch
  const lastKnownRoleRef = useRef<Role>('none');
  const roleReqIdRef = useRef(0);
  const inFlightRef = useRef<Promise<Role> | null>(null);

  // Fetch user role with retry & timeout
  const fetchUserRole = useCallback(
    async (userId: string, reqId: number): Promise<Role> => {
      if (!userId) return 'viewer';

      console.debug('[AUTH] Fetching role for user:', userId);

      // reuse in-flight
      if (inFlightRef.current) {
        try {
          const result = await inFlightRef.current;
          console.debug('[AUTH] Reused in-flight role request result:', result);
          return result;
        } catch {
          console.debug('[AUTH] In-flight request failed, creating new request');
          /* fall through to new request */
        }
      }

      const promise = retryOperation(async () => {
        // stale check
        if (reqId !== roleReqIdRef.current) {
          console.debug('[AUTH] Request is stale, returning last known role:', lastKnownRoleRef.current);
          return lastKnownRoleRef.current;
        }

        console.debug('[AUTH] Attempting RPC role fetch...');
        // try RPC
        const { data: rpcData, error: rpcErr } = await supabase.rpc(
          'get_user_role'
        );

        if (!rpcErr && rpcData === 'admin') {
          console.debug('[AUTH] RPC returned admin role');
          return 'admin';
        } else if (rpcErr) {
          console.debug('[AUTH] RPC error:', rpcErr.message);
        } else {
          console.debug('[AUTH] RPC returned non-admin role:', rpcData);
        }

        console.debug('[AUTH] Attempting table lookup fallback...');
        // fallback to table
        const { data: tbl, error: tblErr } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (!tblErr && tbl?.role === 'admin') {
          console.debug('[AUTH] Table lookup confirmed admin role');
          return 'admin';
        } else if (tblErr) {
          console.debug('[AUTH] Table lookup error:', tblErr.message);
        } else {
          console.debug('[AUTH] Table lookup returned:', tbl?.role || 'no role found');
        }
        
        console.debug('[AUTH] Defaulting to viewer role');
        return 'viewer';
      });

      inFlightRef.current = promise;
      try {
        const role = await promise;
        console.debug('[AUTH] Final role resolved:', role);
        return role;
      } finally {
        inFlightRef.current = null;
      }
    },
    [retryOperation]
  );

  // Centralized state transitions
  const transitionState = useCallback(
    (newState: AuthState) => {
      setAuthState(newState);
      if (newState.status === 'authenticated') {
        resetInactivityTimer();
      }
    },
    [resetInactivityTimer]
  );

  // === Auth actions ===

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      const logger = securityService.getLogger();
      const clientIP = 'client-ip'; // In production, this would come from headers/proxy
      
      logger.debug('[AUTH] Starting sign in process', { email: email.replace(/(.{2}).*@/, '$1***@') });
      
      // Check rate limiting
      const rateLimitCheck = securityService.checkAuthRateLimit(clientIP);
      if (!rateLimitCheck.allowed) {
        const error = `Too many login attempts. Please try again in ${rateLimitCheck.retryAfter} seconds.`;
        logger.warn('[AUTH] Rate limit exceeded', { 
          email: email.replace(/(.{2}).*@/, '$1***@'), 
          retryAfter: rateLimitCheck.retryAfter 
        });
        transitionState({
          status: 'error',
          error,
          retry: () => handleSignIn(email, password)
        });
        return { error: { message: error } };
      }

      transitionState({ status: 'authenticating' });
      setHasJustLoggedIn(false); // Reset flag
      
      // Record the attempt
      securityService.recordAuthAttempt(clientIP, email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        logger.warn('[AUTH] Sign in failed', { 
          email: email.replace(/(.{2}).*@/, '$1***@'),
          error: error.message 
        });
        securityService.recordAuthFailure(clientIP, email, error.message);
        transitionState({
          status: 'error',
          error: error.message,
          retry: () => handleSignIn(email, password)
        });
        return { error };
      }
      
      logger.info('[AUTH] Sign in successful', { 
        email: email.replace(/(.{2}).*@/, '$1***@') 
      });
      setHasJustLoggedIn(true); // Set flag for proper redirection
      return { error: null };
    },
    [transitionState]
  );

  const handleSignUp = useCallback(
    async (email: string, password: string, userData?: any) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/',
          data: userData
        }
      });
      return { error };
    },
    []
  );

  const handleSignOut = useCallback(
    async (redirectTo: string = '/') => {
      console.debug('[AUTH] Signing out...');
      await supabase.auth.signOut();
      transitionState({ status: 'unauthenticated' });
      lastKnownRoleRef.current = 'none';
      setHasJustLoggedIn(false); // Reset flag
      window.location.href = redirectTo;
    },
    [transitionState]
  );

  const handleUpdatePassword = useCallback(
    async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    },
    []
  );

  const handleRefreshRole = useCallback(async () => {
    if (authState.status !== 'authenticated') return;
    const reqId = ++roleReqIdRef.current;
    try {
      const userRole = await fetchUserRole(
        authState.user.id,
        reqId
      );
      if (reqId === roleReqIdRef.current) {
        lastKnownRoleRef.current = userRole;
        transitionState({
          status: 'authenticated',
          user: authState.user,
          session: authState.session,
          role: userRole
        });
      }
    } catch {
      /* swallow */
    }
  }, [authState, fetchUserRole, transitionState]);

  // === Role resolution timeout handler ===
  useEffect(() => {
    if (authState.status === 'resolving-role') {
      console.debug('[AUTH] Starting role resolution timeout (15s)');
      const timeout = setTimeout(() => {
        console.warn('[AUTH] Role resolution timeout, defaulting to viewer');
        transitionState({
          status: 'authenticated',
          user: authState.user,
          session: authState.session,
          role: 'viewer'
        });
        // Don't reset hasJustLoggedIn here - keep it for redirection
      }, 15000); // 15 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [authState.status, authState, transitionState]);

  // === Initialization & listener ===

  useEffect(() => {
    let mounted = true;
    let sub: any;

    const init = async () => {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error('Auth session error:', error);
        transitionState({ status: 'unauthenticated' });
        return;
      }

      if (session?.user?.id) {
        // existing session
        console.debug('[AUTH] Found existing session for user:', session.user.id);
        transitionState({
          status: 'resolving-role',
          user: session.user,
          session,
          role: 'none'
        });
        setHasJustLoggedIn(false); // Existing session, not a fresh login
        
        const reqId = ++roleReqIdRef.current;
        try {
          const userRole = await fetchUserRole(
            session.user.id,
            reqId
          );
          if (mounted && reqId === roleReqIdRef.current) {
            lastKnownRoleRef.current = userRole;
            console.debug('[AUTH] Initial role resolution successful:', userRole);
            transitionState({
              status: 'authenticated',
              user: session.user,
              session,
              role: userRole
            });
          }
        } catch {
          if (mounted && reqId === roleReqIdRef.current) {
            console.warn('[AUTH] Initial role resolution failed, transitioning to unauthenticated');
            transitionState({
              status: 'unauthenticated'
            });
          }
        }
      } else {
        console.debug('[AUTH] No existing session found');
        transitionState({ status: 'unauthenticated' });
      }
    };

    sub = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.debug('[AUTH] Auth state change event:', event, { 
          userId: session?.user?.id, 
          hasSession: !!session 
        });

        if (event === 'SIGNED_OUT') {
          console.debug('[AUTH] Processing SIGNED_OUT event');
          transitionState({ status: 'unauthenticated' });
          lastKnownRoleRef.current = 'none';
          setHasJustLoggedIn(false);
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.debug('[AUTH] Processing', event, 'event');
          if (session?.user?.id) {
            const logger = securityService.getLogger();
            const userId = session.user.id;
            const email = session.user.email || 'unknown';
            
            transitionState({
              status: 'resolving-role',
              user: session.user,
              session,
              role: 'none'
            });
            // Keep hasJustLoggedIn for SIGNED_IN, but reset for TOKEN_REFRESHED
            if (event === 'TOKEN_REFRESHED') {
              setHasJustLoggedIn(false);
            } else if (event === 'SIGNED_IN') {
              // Record successful authentication
              const clientIP = 'client-ip'; // In production, this would come from headers/proxy
              securityService.recordAuthSuccess(clientIP, email, userId);
            }
            
            const reqId = ++roleReqIdRef.current;
            try {
              const userRole = await fetchUserRole(
                session.user.id,
                reqId
              );
              if (
                mounted &&
                reqId === roleReqIdRef.current
              ) {
                lastKnownRoleRef.current = userRole;
                logger.info('[AUTH] Successfully resolved role after ' + event, { 
                  userId, 
                  role: userRole,
                  email: email.replace(/(.{2}).*@/, '$1***@')
                });
                transitionState({
                  status: 'authenticated',
                  user: session.user,
                  session,
                  role: userRole
                });
              }
            } catch {
              if (
                mounted &&
                reqId === roleReqIdRef.current
              ) {
                logger.warn('[AUTH] Role resolution failed after ' + event + ', using last known role', {
                  userId,
                  lastKnownRole: lastKnownRoleRef.current,
                  email: email.replace(/(.{2}).*@/, '$1***@')
                });
                transitionState({
                  status: 'authenticated',
                  user: session.user,
                  session,
                  role: lastKnownRoleRef.current
                });
              }
            }
          } else {
            console.debug('[AUTH] No user ID in session, transitioning to unauthenticated');
            transitionState({ status: 'unauthenticated' });
            setHasJustLoggedIn(false);
          }
        }
      }
    );

    init();
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [fetchUserRole, transitionState]);

  // === Backward-compatible getters ===

  const user =
    authState.status === 'authenticated'
      ? authState.user
      : null;
  const session =
    authState.status === 'authenticated'
      ? authState.session
      : null;
  const role =
    authState.status === 'authenticated'
      ? authState.role
      : 'none';

  const authStatus: 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated' = (() => {
    switch (authState.status) {
      case 'initializing':
        return 'idle';
      case 'authenticating':
        return 'authenticating';
      case 'authenticated':
        return 'authenticated';
      case 'unauthenticated':
      case 'error':
        return 'unauthenticated';
    }
  })();

  const roleStatus: 'idle' | 'resolving' | 'ready' | 'error' = (() => {
    if (authState.status === 'authenticated') return 'ready';
    if (authState.status === 'resolving-role') return 'resolving';
    if (authState.status === 'error') return 'error';
    return 'idle';
  })();

  const initialized = authState.status !== 'initializing';

  // === Context value ===

  const value: AuthContextType = {
    // Unified
    authState,

    // Legacy
    user,
    session,
    authStatus,
    role,
    roleStatus,
    initialized,
    hasJustLoggedIn,

    // Actions
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    updatePassword: handleUpdatePassword,
    refreshRole: handleRefreshRole,

    // Inactivity
    inactivityWarning,
    timeUntilLogout: timeRemaining,
    resetInactivityTimer
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
