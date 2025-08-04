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

  // Inactivity detection
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const {
    isWarning,
    timeRemaining,
    resetTimer: resetInactivityTimer
  } = useInactivityDetection(
    () => {
      console.log('🕐 [AUTH] Inactivity warning');
      setInactivityWarning(true);
    },
    () => {
      console.log('🕐 [AUTH] Inactivity timeout — signing out');
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

      // reuse in-flight
      if (inFlightRef.current) {
        console.log('🔄 [AUTH] Reusing in-flight role fetch');
        try {
          return await inFlightRef.current;
        } catch {
          /* fall through to new request */
        }
      }

      console.log('🔍 [AUTH] fetchUserRole:', userId, 'reqId=', reqId);
      const promise = retryOperation(async () => {
        // stale check
        if (reqId !== roleReqIdRef.current) {
          console.log('🚫 [AUTH] Stale role fetch');
          return lastKnownRoleRef.current;
        }

        // try RPC
        const { data: rpcData, error: rpcErr } = await supabase.rpc(
          'get_user_role'
        );
        console.log('🔧 [AUTH] RPC result', { rpcData, rpcErr });

        if (!rpcErr && rpcData === 'admin') return 'admin';

        // fallback to table
        const { data: tbl, error: tblErr } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        console.log('📊 [AUTH] Table result', { tbl, tblErr });

        if (!tblErr && tbl?.role === 'admin') return 'admin';
        return 'viewer';
      });

      inFlightRef.current = promise;
      try {
        const role = await promise;
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
      console.log('🔄 [AUTH] ', authState.status, '→', newState.status);
      setAuthState(newState);
      if (newState.status === 'authenticated') {
        resetInactivityTimer();
      }
    },
    [authState.status, resetInactivityTimer]
  );

  // === Auth actions ===

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      console.log('🔐 [AUTH] signIn');
      transitionState({ status: 'authenticating' });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        transitionState({
          status: 'error',
          error: error.message,
          retry: () => handleSignIn(email, password)
        });
        return { error };
      }
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
      console.log('🚪 [AUTH] signOut');
      await supabase.auth.signOut();
      transitionState({ status: 'unauthenticated' });
      lastKnownRoleRef.current = 'none';
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
    console.log('🔄 [AUTH] manual role refresh');
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

  // === Initialization & listener ===

  useEffect(() => {
    let mounted = true;
    let sub: any;

    const init = async () => {
      console.log('🚀 [AUTH] initializing');
      const {
        data: { session },
        error
      } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error('❌ [AUTH] getSession error', error);
        transitionState({ status: 'unauthenticated' });
        return;
      }

      if (session?.user?.id) {
        // existing session
        transitionState({
          status: 'resolving-role',
          user: session.user,
          session,
          role: 'none'
        });
        const reqId = ++roleReqIdRef.current;
        try {
          const userRole = await fetchUserRole(
            session.user.id,
            reqId
          );
          if (mounted && reqId === roleReqIdRef.current) {
            lastKnownRoleRef.current = userRole;
            transitionState({
              status: 'authenticated',
              user: session.user,
              session,
              role: userRole
            });
          }
        } catch {
          if (mounted && reqId === roleReqIdRef.current) {
            transitionState({
              status: 'unauthenticated'
            });
          }
        }
      } else {
        transitionState({ status: 'unauthenticated' });
      }
    };

    sub = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('🔄 [AUTH] onAuthStateChange', event);

        if (event === 'SIGNED_OUT') {
          transitionState({ status: 'unauthenticated' });
          lastKnownRoleRef.current = 'none';
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user?.id) {
            transitionState({
              status: 'resolving-role',
              user: session.user,
              session,
              role: 'none'
            });
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
                transitionState({
                  status: 'authenticated',
                  user: session.user,
                  session,
                  role: lastKnownRoleRef.current
                });
              }
            }
          } else {
            transitionState({ status: 'unauthenticated' });
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
