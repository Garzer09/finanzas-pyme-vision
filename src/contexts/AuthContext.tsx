import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Unified auth state to prevent race conditions
type AuthState = 
  | { status: 'initializing'; user: null; role: 'none' }
  | { status: 'unauthenticated'; user: null; role: 'none' }
  | { status: 'authenticating'; user: User | null; role: 'none' }
  | { status: 'resolving-role'; user: User; role: 'none' }
  | { status: 'authenticated'; user: User; role: 'admin' | 'viewer' }
  | { status: 'error'; user: User | null; role: 'admin' | 'viewer' | 'none'; error: string };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authState: AuthState;
  // Legacy compatibility - derived from authState
  authStatus: 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated';
  role: 'admin' | 'viewer' | 'none';
  roleStatus: 'idle' | 'resolving' | 'ready' | 'error';
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, data?: any) => Promise<{ error: any }>;
  signOut: (redirectTo?: string) => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  refreshRole: () => Promise<void>;
  // Remove problematic hasJustLoggedIn state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthState>({ status: 'initializing', user: null, role: 'none' });
  
  // Derived states for backward compatibility
  const authStatus = authState.status === 'initializing' ? 'idle' :
                    authState.status === 'unauthenticated' ? 'unauthenticated' :
                    authState.status === 'authenticating' ? 'authenticating' :
                    authState.status === 'resolving-role' ? 'authenticated' :
                    authState.status === 'authenticated' ? 'authenticated' :
                    'unauthenticated';
  
  const role = authState.role;
  const roleStatus = authState.status === 'resolving-role' ? 'resolving' :
                    authState.status === 'error' ? 'error' :
                    authState.status === 'authenticated' ? 'ready' :
                    'idle';
  
  const initialized = authState.status !== 'initializing';
  
  // ✅ Locking and concurrency control
  const lastKnownRoleRef = useRef<'admin' | 'viewer' | 'none'>('none');
  const roleReqIdRef = useRef(0); // Serial ID to ignore stale responses
  const inFlightRef = useRef<Promise<'admin' | 'viewer'> | null>(null); // Prevent concurrent calls
  
  // Session recovery state for timeout scenarios
  const sessionRecoveryRef = useRef<{ email?: string; lastActivity?: number }>({});

  const fetchUserRole = useCallback(async (userId: string, reqId: number): Promise<'admin' | 'viewer'> => {
    if (!userId) {
      console.log('❌ fetchUserRole: No userId provided');
      return 'viewer';
    }
    
    // ✅ Check if we already have a request in flight - reuse it
    if (inFlightRef.current) {
      console.log('🔄 [AUTH-CTX] Reusing in-flight request for userId:', userId, 'reqId:', reqId);
      try {
        return await inFlightRef.current;
      } catch (error) {
        console.error('❌ [AUTH-CTX] In-flight request failed:', error);
        // Continue with new request
      }
    }
    
    console.log('🔍 [AUTH-CTX] fetchUserRole called for userId:', userId, 'reqId:', reqId);
    
    // ✅ Create new request with timeout and retry logic
    const rolePromise = (async (): Promise<'admin' | 'viewer'> => {
      const maxRetries = 3;
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 [AUTH-CTX] Role fetch attempt ${attempt}/${maxRetries}`);
          
          // Check if this response is still relevant before each attempt
          if (reqId !== roleReqIdRef.current) {
            console.log('🚫 [AUTH-CTX] Request cancelled, reqId:', reqId, 'current:', roleReqIdRef.current);
            return lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
          }
          
          // ✅ 10 second timeout per attempt
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Role fetch timeout on attempt ${attempt}`)), 10000)
          );
          
          const rpcPromise = supabase.rpc('get_user_role');
          
          const { data: rpcData, error: rpcError } = await Promise.race([rpcPromise, timeoutPromise]);
          
          console.log(`🔧 [AUTH-CTX] RPC result attempt ${attempt}:`, { rpcData, rpcError, reqId });
          
          if (!rpcError && rpcData === 'admin') {
            console.log('✅ [AUTH-CTX] Role from RPC: admin');
            return 'admin';
          }
          
          // Fallback: check table directly
          const { data: tableData, error: tableError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle();
          
          console.log(`📊 [AUTH-CTX] Table query result attempt ${attempt}:`, { tableData, tableError, reqId });
          
          if (!tableError && tableData?.role === 'admin') {
            console.log('✅ [AUTH-CTX] Role from table: admin');
            return 'admin';
          }
          
          if (tableError) {
            throw tableError;
          }
          
          console.log('ℹ️ [AUTH-CTX] No admin role found, defaulting to viewer');
          return 'viewer';
          
        } catch (error) {
          lastError = error;
          console.error(`❌ [AUTH-CTX] Error in fetchUserRole attempt ${attempt}:`, error, 'reqId:', reqId);
          
          // If it's the last attempt, use fallback
          if (attempt === maxRetries) {
            console.log('🛡️ [AUTH-CTX] All attempts failed, using fallback role');
            return lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
          }
          
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ [AUTH-CTX] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // This should never be reached, but just in case
      return lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
    })();
    
    // ✅ Store the promise to prevent concurrent requests
    inFlightRef.current = rolePromise;
    
    try {
      const result = await rolePromise;
      return result;
    } finally {
      // ✅ Clear the in-flight reference when done
      inFlightRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initAuth = async () => {
      try {
        console.log('🚀 [AUTH-CTX] Initializing Auth...');
        
        // Check for existing session first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AUTH-CTX] Session check error:', error);
          if (!mounted) return;
          setAuthState({ status: 'unauthenticated', user: null, role: 'none' });
          return;
        }
        
        console.log('📋 [AUTH-CTX] Session check result:', { hasSession: !!session, user: session?.user?.email });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          // Store session recovery info for timeout scenarios
          sessionRecoveryRef.current = {
            email: session.user.email,
            lastActivity: Date.now()
          };
          
          // For existing sessions, go directly to resolving role
          console.log('👤 [AUTH-CTX] Existing session found, resolving role');
          setAuthState({ status: 'resolving-role', user: session.user, role: 'none' });
          
          const reqId = ++roleReqIdRef.current;
          try {
            const userRole = await fetchUserRole(session.user.id, reqId);
            if (mounted && reqId === roleReqIdRef.current) {
              console.log('✅ [AUTH-CTX] Role resolved for existing session:', userRole);
              setAuthState({ status: 'authenticated', user: session.user, role: userRole });
              lastKnownRoleRef.current = userRole;
            }
          } catch (error) {
            console.error('❌ [AUTH-CTX] Error resolving role for existing session:', error);
            if (mounted && reqId === roleReqIdRef.current) {
              const fallbackRole = lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
              setAuthState({ status: 'error', user: session.user, role: fallbackRole, error: 'Failed to resolve role' });
            }
          }
        } else {
          console.log('❌ [AUTH-CTX] No existing session');
          setAuthState({ status: 'unauthenticated', user: null, role: 'none' });
        }
        
      } catch (error) {
        console.error('❌ [AUTH-CTX] Auth initialization error:', error);
        if (mounted) {
          setAuthState({ status: 'unauthenticated', user: null, role: 'none' });
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AUTH-CTX] Auth state change:', { event, user: session?.user?.email, path: window.location.pathname });
        console.log('📊 [AUTH-CTX] Current state before:', authState);
        
        if (!mounted) return;
        
        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          console.log('🚪 [AUTH-CTX] SIGNED_OUT event');
          setSession(null);
          setUser(null);
          setAuthState({ status: 'unauthenticated', user: null, role: 'none' });
          lastKnownRoleRef.current = 'none';
          sessionRecoveryRef.current = {};
          return;
        }
        
        if (event === 'SIGNED_IN') {
          console.log('🔐 [AUTH-CTX] SIGNED_IN event - explicit login');
          
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user?.id) {
            // Store session recovery info
            sessionRecoveryRef.current = {
              email: session.user.email,
              lastActivity: Date.now()
            };
            
            setAuthState({ status: 'resolving-role', user: session.user, role: 'none' });
            
            const reqId = ++roleReqIdRef.current;
            try {
              const userRole = await fetchUserRole(session.user.id, reqId);
              if (mounted && reqId === roleReqIdRef.current) {
                console.log('✅ [AUTH-CTX] Role resolved for new login:', userRole);
                setAuthState({ status: 'authenticated', user: session.user, role: userRole });
                lastKnownRoleRef.current = userRole;
              }
            } catch (error) {
              console.error('❌ [AUTH-CTX] Error resolving role for new login:', error);
              if (mounted && reqId === roleReqIdRef.current) {
                const fallbackRole = lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
                setAuthState({ status: 'error', user: session.user, role: fallbackRole, error: 'Failed to resolve role' });
              }
            }
          } else {
            console.log('❌ [AUTH-CTX] No user in session');
            setAuthState({ status: 'unauthenticated', user: null, role: 'none' });
            lastKnownRoleRef.current = 'none';
          }
        } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          console.log(`🔄 [AUTH-CTX] ${event} event - updating session only`);
          setSession(session);
          setUser(session?.user ?? null);
          // Update session recovery info if still valid
          if (session?.user?.email && sessionRecoveryRef.current.email === session.user.email) {
            sessionRecoveryRef.current.lastActivity = Date.now();
          }
        }
        
        console.log('📊 [AUTH-CTX] State after change:', authState);
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
  }, [fetchUserRole]);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 [AUTH-CTX] signIn called');
    setAuthState({ status: 'authenticating', user: null, role: 'none' });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setAuthState({ status: 'unauthenticated', user: null, role: 'none' });
    }
    // Success case handled by auth state change listener
    return { error };
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });
    return { error };
  };

  const signOut = async (redirectTo: string = '/') => {
    console.log('🚪 [AUTH-CTX] Signing out...');
    await supabase.auth.signOut();
    setAuthState({ status: 'unauthenticated', user: null, role: 'none' });
    sessionRecoveryRef.current = {};
    
    // Redirect to specified path
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    return { error };
  };

  // ✅ Expose refreshRole function for manual retries
  const refreshRole = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ [AUTH-CTX] refreshRole: No user to refresh role for');
      return;
    }

    console.log('🔄 [AUTH-CTX] Manual role refresh triggered');
    setAuthState(prev => prev.status === 'authenticated' ? 
      { status: 'resolving-role', user: prev.user, role: 'none' } : prev);
    
    const reqId = ++roleReqIdRef.current;
    
    try {
      const userRole = await fetchUserRole(user.id, reqId);
      if (reqId === roleReqIdRef.current) {
        setAuthState({ status: 'authenticated', user, role: userRole });
        lastKnownRoleRef.current = userRole;
        console.log('✅ [AUTH-CTX] Role refreshed successfully:', userRole);
      }
    } catch (error) {
      console.error('❌ [AUTH-CTX] Error during manual role refresh:', error);
      if (reqId === roleReqIdRef.current) {
        const fallbackRole = lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
        setAuthState({ status: 'error', user, role: fallbackRole, error: 'Failed to refresh role' });
      }
    }
  }, [user?.id, fetchUserRole]);

  const value: AuthContextType = {
    user,
    session,
    authState,
    // Legacy compatibility - derived from authState
    authStatus,
    role,
    roleStatus,
    initialized,
    signIn,
    signUp,
    signOut,
    updatePassword,
    refreshRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};