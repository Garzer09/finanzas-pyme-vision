import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authStatus: 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated';
  role: 'admin' | 'viewer' | 'none';
  roleStatus: 'idle' | 'resolving' | 'ready' | 'error';
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, data?: any) => Promise<{ error: any }>;
  signOut: (redirectTo?: string) => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  refreshRole: () => Promise<void>;
  hasJustLoggedIn: boolean;
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
  const [authStatus, setAuthStatus] = useState<'idle' | 'authenticating' | 'authenticated' | 'unauthenticated'>('idle');
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState(false);
  const [role, setRole] = useState<'admin' | 'viewer' | 'none'>('none');
  const [roleStatus, setRoleStatus] = useState<'idle' | 'resolving' | 'ready' | 'error'>('idle');
  const [initialized, setInitialized] = useState(false);
  
  // ✅ Locking and concurrency control
  const lastKnownRoleRef = useRef<'admin' | 'viewer' | 'none'>('none');
  const roleReqIdRef = useRef(0); // Serial ID to ignore stale responses
  const inFlightRef = useRef<Promise<'admin' | 'viewer'> | null>(null); // Prevent concurrent calls

  const fetchUserRole = useCallback(async (userId: string, reqId: number): Promise<'admin' | 'viewer'> => {
    if (!userId) {
      console.log('❌ fetchUserRole: No userId provided');
      return 'viewer';
    }
    
    // ✅ Check if we already have a request in flight - reuse it
    if (inFlightRef.current) {
      console.log('🔄 [INSTRUMENTATION] Reusing in-flight request for userId:', userId, 'reqId:', reqId);
      try {
        return await inFlightRef.current;
      } catch (error) {
        console.error('❌ [INSTRUMENTATION] In-flight request failed:', error);
        // Continue with new request
      }
    }
    
    console.log('🔍 [INSTRUMENTATION] fetchUserRole called for userId:', userId, 'reqId:', reqId);
    
    // ✅ Create new request with timeout
    const rolePromise = (async (): Promise<'admin' | 'viewer'> => {
      try {
        // ✅ 10 second timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Role fetch timeout after 10s')), 10000)
        );
        
        const rpcPromise = supabase.rpc('get_user_role');
        
        const { data: rpcData, error: rpcError } = await Promise.race([rpcPromise, timeoutPromise]);
        
        // Check if this response is still relevant
        if (reqId !== roleReqIdRef.current) {
          console.log('🚫 [INSTRUMENTATION] Ignoring stale response, reqId:', reqId, 'current:', roleReqIdRef.current);
          return lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
        }
        
        console.log('🔧 [INSTRUMENTATION] RPC result:', { rpcData, rpcError, reqId });
        
        if (!rpcError && rpcData === 'admin') {
          console.log('✅ [INSTRUMENTATION] Role from RPC: admin');
          return 'admin';
        }
        
        // Fallback: check table directly
        const { data: tableData, error: tableError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        
        // Check again if response is still relevant
        if (reqId !== roleReqIdRef.current) {
          console.log('🚫 [INSTRUMENTATION] Ignoring stale fallback response, reqId:', reqId);
          return lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
        }
        
        console.log('📊 [INSTRUMENTATION] Table query result:', { tableData, tableError, reqId });
        
        if (!tableError && tableData?.role === 'admin') {
          console.log('✅ [INSTRUMENTATION] Role from table: admin');
          return 'admin';
        }
        
        console.log('ℹ️ [INSTRUMENTATION] No admin role found, defaulting to viewer');
        return 'viewer';
        
      } catch (error) {
        console.error('❌ [INSTRUMENTATION] Error in fetchUserRole:', error, 'reqId:', reqId);
        // Preserve admin role on error if it was previously admin
        return lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
      }
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
        console.log('🚀 [INSTRUMENTATION] Initializing Auth...');
        
        // Check for existing session first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [INSTRUMENTATION] Session check error:', error);
          if (!mounted) return;
          setAuthStatus('unauthenticated');
          setRole('none');
          setRoleStatus('ready');
          return;
        }
        
        console.log('📋 [AUTH-CTX] Session check result:', { hasSession: !!session, user: session?.user?.email });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        // ✅ ROLLBACK: No cambiar a 'authenticated' automáticamente en sesión existente
        setAuthStatus(session ? 'idle' : 'unauthenticated');
        setHasJustLoggedIn(false); // Sesión existente no es login reciente
        
        // ✅ ROLLBACK: No resolver rol automáticamente en sesión existente
        if (session?.user?.id) {
          console.log('👤 [AUTH-CTX] Existing user found, but not resolving role automatically');
          setRole('none'); // Mantener role como 'none' hasta login explícito
          setRoleStatus('idle');
        } else {
          console.log('❌ [AUTH-CTX] No existing user');
          setRole('none');
          setRoleStatus('idle');
        }
        
      } catch (error) {
        console.error('❌ [INSTRUMENTATION] Auth initialization error:', error);
        if (mounted) {
          setAuthStatus('unauthenticated');
          setRole('none');
          setRoleStatus('ready');
        }
      } finally {
        if (mounted) {
          setInitialized(true);
          console.log('✅ [INSTRUMENTATION] Auth initialization completed');
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [INSTRUMENTATION] Auth state change:', { event, user: session?.user?.email, path: window.location.pathname });
        console.log('📊 [INSTRUMENTATION] AUTH STATE BEFORE:', { authStatus, role, roleStatus, initialized });
        
        if (!mounted) return;
        
        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          console.log('🚪 [INSTRUMENTATION] SIGNED_OUT event');
          setSession(null);
          setUser(null);
          setAuthStatus('unauthenticated');
          setRole('none');
          setRoleStatus('ready');
          lastKnownRoleRef.current = 'none';
          setInitialized(true);
          return;
        }
        
        // ✅ ROLLBACK: Solo resolver rol en SIGNED_IN (login explícito)
        if (event === 'SIGNED_IN') {
          console.log(`🔐 [AUTH-CTX] ${event} event - explicit login`);
          
          setSession(session);
          setUser(session?.user ?? null);
          setAuthStatus(session ? 'authenticated' : 'unauthenticated');
          setHasJustLoggedIn(true); // Marcar que acaba de loguearse
          
          if (session?.user?.id) {
            const reqId = ++roleReqIdRef.current;
            setRoleStatus('resolving');
            
            try {
              const userRole = await fetchUserRole(session.user.id, reqId);
              if (mounted && reqId === roleReqIdRef.current) {
                console.log(`✅ [AUTH-CTX] Role fetched after ${event}:`, userRole, 'reqId:', reqId);
                setRole(userRole);
                lastKnownRoleRef.current = userRole;
                setRoleStatus('ready');
              }
            } catch (error) {
              console.error(`❌ [AUTH-CTX] Error fetching role during ${event}:`, error, 'reqId:', reqId);
              if (mounted && reqId === roleReqIdRef.current) {
                const fallbackRole = lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
                console.log(`🛡️ [AUTH-CTX] Using fallback role:`, fallbackRole);
                setRole(fallbackRole);
                setRoleStatus('error');
              }
            }
          } else {
            console.log('❌ [AUTH-CTX] No user in session');
            setRole('none');
            setRoleStatus('ready');
            lastKnownRoleRef.current = 'none';
          }
        } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          console.log(`🔄 [AUTH-CTX] ${event} event - updating session but not resolving role`);
          setSession(session);
          setUser(session?.user ?? null);
          // No cambiar authStatus ni resolver rol en estos eventos
        }
          
        setInitialized(true);
        console.log('📊 [AUTH-CTX] AUTH STATE AFTER:', { authStatus, role, roleStatus, initialized, hasJustLoggedIn });
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
    setAuthStatus('authenticating');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setAuthStatus('unauthenticated');
    }
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
    console.log('🚪 Signing out...');
    await supabase.auth.signOut();
    setRole('none');
    setAuthStatus('unauthenticated');
    setInitialized(true);
    
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
      console.log('❌ refreshRole: No user to refresh role for');
      return;
    }

    console.log('🔄 [INSTRUMENTATION] Manual role refresh triggered');
    setRoleStatus('resolving');
    const reqId = ++roleReqIdRef.current;
    
    try {
      const userRole = await fetchUserRole(user.id, reqId);
      if (reqId === roleReqIdRef.current) {
        setRole(userRole);
        lastKnownRoleRef.current = userRole;
        setRoleStatus('ready');
        console.log('✅ [INSTRUMENTATION] Role refreshed successfully:', userRole);
      }
    } catch (error) {
      console.error('❌ [INSTRUMENTATION] Error during manual role refresh:', error);
      if (reqId === roleReqIdRef.current) {
        setRoleStatus('error');
      }
    }
  }, [user?.id, fetchUserRole]);

  const value: AuthContextType = {
    user,
    session,
    authStatus,
    role,
    roleStatus,
    initialized,
    signIn,
    signUp,
    signOut,
    updatePassword,
    refreshRole,
    hasJustLoggedIn
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};