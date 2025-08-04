import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  AuthState, 
  AuthContextType, 
  Role, 
  DEFAULT_RETRY_CONFIG,
  type RetryConfig 
} from '@/types/auth';
import { useInactivityDetection, createRetryWithBackoff } from '@/hooks/useInactivityDetection';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ✅ Unified state machine replaces multiple states
  const [authState, setAuthState] = useState<AuthState>({ status: 'initializing' });
  
  // ✅ Inactivity detection
  const [inactivityWarning, setInactivityWarning] = useState(false);
  
  // ✅ Simple refs for internal state management
  const retryConfigRef = useRef<RetryConfig>(DEFAULT_RETRY_CONFIG);
  const lastKnownRoleRef = useRef<Role>('none');
  const roleReqIdRef = useRef(0);
  const inFlightRef = useRef<Promise<Role> | null>(null);

  // ✅ Inactivity detection setup
  const { isWarning, timeRemaining, resetTimer: resetInactivityTimer } = useInactivityDetection(
    () => {
      console.log('🕐 [AUTH] Inactivity warning triggered');
      setInactivityWarning(true);
    },
    () => {
      console.log('🕐 [AUTH] Inactivity timeout - signing out');
      handleSignOut();
    }
  );

  // Update inactivity warning state
  useEffect(() => {
    setInactivityWarning(isWarning);
  }, [isWarning]);

  // ✅ Retry utility with exponential backoff
  const retryOperation = useCallback(createRetryWithBackoff(
    retryConfigRef.current.maxAttempts,
    retryConfigRef.current.baseDelayMs,
    retryConfigRef.current.maxDelayMs
  ), []);

  // ✅ Simplified role fetching with retry logic
  const fetchUserRole = useCallback(async (userId: string, reqId: number): Promise<Role> => {
    if (!userId) {
      console.log('❌ fetchUserRole: No userId provided');
      return 'viewer';
    }
    
    // Check if we already have a request in flight - reuse it
    if (inFlightRef.current) {
      console.log('🔄 [AUTH] Reusing in-flight request for userId:', userId, 'reqId:', reqId);
      try {
        return await inFlightRef.current;
      } catch (error) {
        console.error('❌ [AUTH] In-flight request failed:', error);
      }
    }
    
    console.log('🔍 [AUTH] fetchUserRole called for userId:', userId, 'reqId:', reqId);
    
    // Create new request with retry logic
    const rolePromise = retryOperation(async (): Promise<Role> => {
      // Check if this response is still relevant
      if (reqId !== roleReqIdRef.current) {
        console.log('🚫 [AUTH] Ignoring stale response, reqId:', reqId, 'current:', roleReqIdRef.current);
        return lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
      }
      
      // Try RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_role');
      
      console.log('🔧 [AUTH] RPC result:', { rpcData, rpcError, reqId });
      
      if (!rpcError && rpcData === 'admin') {
        console.log('✅ [AUTH] Role from RPC: admin');
        return 'admin';
      }
      
      // Fallback: check table directly
      const { data: tableData, error: tableError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('📊 [AUTH] Table query result:', { tableData, tableError, reqId });
      
      if (!tableError && tableData?.role === 'admin') {
        console.log('✅ [AUTH] Role from table: admin');
        return 'admin';
      }
      
      console.log('ℹ️ [AUTH] No admin role found, defaulting to viewer');
      return 'viewer';
    });
    
    // Store the promise to prevent concurrent requests
    inFlightRef.current = rolePromise;
    
    try {
      const result = await rolePromise;
      return result;
    } finally {
      // Clear the in-flight reference when done
      inFlightRef.current = null;
    }
  }, [retryOperation]);

  // ✅ Unified state transition function
  const transitionState = useCallback((newState: AuthState) => {
    console.log('🔄 [AUTH] State transition:', authState.status, '->', newState.status);
    setAuthState(newState);
    
    // Reset inactivity timer on successful authentication
    if (newState.status === 'authenticated') {
      resetInactivityTimer();
    }
  }, [authState.status, resetInactivityTimer]);

  // ✅ Simplified authentication handlers
  const handleSignIn = useCallback(async (email: string, password: string) => {
    console.log('🔐 [AUTH] signIn called');
    transitionState({ status: 'authenticating' });
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        transitionState({ 
          status: 'error', 
          error: error.message, 
          retry: () => handleSignIn(email, password)
        });
        return { error };
      }
      
      // State will be updated by auth state change listener
      return { error: null };
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error during sign in';
      transitionState({ 
        status: 'error', 
        error: errorMsg, 
        retry: () => handleSignIn(email, password)
      });
      return { error: { message: errorMsg } };
    }
  }, [transitionState]);

  const handleSignUp = useCallback(async (email: string, password: string, userData?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });
      return { error };
    } catch (error: any) {
      return { error: { message: error.message || 'Unknown error during sign up' } };
    }
  }, []);

  const handleSignOut = useCallback(async (redirectTo: string = '/') => {
    console.log('🚪 [AUTH] Signing out...');
    
    try {
      await supabase.auth.signOut();
      transitionState({ status: 'unauthenticated' });
      lastKnownRoleRef.current = 'none';
      
      // Redirect to specified path
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    } catch (error) {
      console.error('❌ [AUTH] Error during sign out:', error);
      // Force logout on error
      transitionState({ status: 'unauthenticated' });
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [transitionState]);

  const handleUpdatePassword = useCallback(async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (error: any) {
      return { error: { message: error.message || 'Unknown error updating password' } };
    }
  }, []);

  const handleRefreshRole = useCallback(async () => {
    if (authState.status !== 'authenticated') {
      console.log('❌ refreshRole: Not authenticated');
      return;
    }

    console.log('🔄 [AUTH] Manual role refresh triggered');
    const reqId = ++roleReqIdRef.current;
    
    try {
      const userRole = await fetchUserRole(authState.user.id, reqId);
      if (reqId === roleReqIdRef.current) {
        lastKnownRoleRef.current = userRole;
        transitionState({
          status: 'authenticated',
          user: authState.user,
          session: authState.session,
          role: userRole
        });
        console.log('✅ [AUTH] Role refreshed successfully:', userRole);
      }
    } catch (error) {
      console.error('❌ [AUTH] Error during manual role refresh:', error);
      // Keep current state but could add error handling here if needed
    }
  }, [authState, fetchUserRole, transitionState]);

  // ✅ Initialize authentication and handle state changes
  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initAuth = async () => {
      try {
        console.log('🚀 [AUTH] Initializing Auth...');
        
        // Check for existing session first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AUTH] Session check error:', error);
          if (mounted) {
            transitionState({ status: 'unauthenticated' });
          }
          return;
        }
        
        console.log('📋 [AUTH] Session check result:', { hasSession: !!session, user: session?.user?.email });
        
        if (!mounted) return;

        if (session?.user?.id) {
          // ✅ Resolve role for existing session (removes inconsistency)
          console.log('👤 [AUTH] Existing user found, resolving role...');
          const reqId = ++roleReqIdRef.current;
          
          try {
            const userRole = await fetchUserRole(session.user.id, reqId);
            if (mounted && reqId === roleReqIdRef.current) {
              lastKnownRoleRef.current = userRole;
              transitionState({
                status: 'authenticated',
                user: session.user,
                session,
                role: userRole
              });
            }
          } catch (error) {
            console.error('❌ [AUTH] Error resolving existing session role:', error);
            if (mounted) {
              const fallbackRole = lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
              transitionState({
                status: 'authenticated',
                user: session.user,
                session,
                role: fallbackRole
              });
            }
          }
        } else {
          console.log('❌ [AUTH] No existing user');
          transitionState({ status: 'unauthenticated' });
        }
        
      } catch (error) {
        console.error('❌ [AUTH] Auth initialization error:', error);
        if (mounted) {
          transitionState({ status: 'unauthenticated' });
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AUTH] Auth state change:', { event, user: session?.user?.email, path: window.location.pathname });
        
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT') {
          console.log('🚪 [AUTH] SIGNED_OUT event');
          transitionState({ status: 'unauthenticated' });
          lastKnownRoleRef.current = 'none';
          return;
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log(`🔐 [AUTH] ${event} event`);
          
          if (session?.user?.id) {
            const reqId = ++roleReqIdRef.current;
            
            try {
              const userRole = await fetchUserRole(session.user.id, reqId);
              if (mounted && reqId === roleReqIdRef.current) {
                console.log(`✅ [AUTH] Role fetched after ${event}:`, userRole, 'reqId:', reqId);
                lastKnownRoleRef.current = userRole;
                transitionState({
                  status: 'authenticated',
                  user: session.user,
                  session,
                  role: userRole
                });
              }
            } catch (error) {
              console.error(`❌ [AUTH] Error fetching role during ${event}:`, error, 'reqId:', reqId);
              if (mounted && reqId === roleReqIdRef.current) {
                const fallbackRole = lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
                console.log(`🛡️ [AUTH] Using fallback role:`, fallbackRole);
                transitionState({
                  status: 'authenticated',
                  user: session.user,
                  session,
                  role: fallbackRole
                });
              }
            }
          } else {
            console.log('❌ [AUTH] No user in session');
            transitionState({ status: 'unauthenticated' });
          }
        }
      }
    );
    
    authSubscription = subscription;
    initAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [fetchUserRole, transitionState]);

  // ✅ Backward compatibility getters
  const user = authState.status === 'authenticated' ? authState.user : null;
  const session = authState.status === 'authenticated' ? authState.session : null;
  const role = authState.status === 'authenticated' ? authState.role : 'none';
  
  const authStatus: 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated' = (() => {
    switch (authState.status) {
      case 'initializing': return 'idle';
      case 'authenticating': return 'authenticating';
      case 'authenticated': return 'authenticated';
      case 'unauthenticated': return 'unauthenticated';
      case 'error': return 'unauthenticated';
    }
  })();
  
  const roleStatus: 'idle' | 'resolving' | 'ready' | 'error' = (() => {
    if (authState.status === 'authenticated') return 'ready';
    if (authState.status === 'authenticating') return 'resolving';
    if (authState.status === 'error') return 'error';
    return 'idle';
  })();
  
  const initialized = authState.status !== 'initializing';

  const value: AuthContextType = {
    // New unified state
    authState,
    
    // Backward compatibility
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
    
    // Inactivity management
    inactivityWarning,
    timeUntilLogout: timeRemaining,
    resetInactivityTimer
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};