import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authStatus: 'unknown' | 'authenticated' | 'unauthenticated';
  role: 'admin' | 'viewer' | 'none';
  roleStatus: 'idle' | 'resolving' | 'ready' | 'error';
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, data?: any) => Promise<{ error: any }>;
  signOut: (redirectTo?: string) => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  refreshRole: () => Promise<void>;
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
  const [authStatus, setAuthStatus] = useState<'unknown' | 'authenticated' | 'unauthenticated'>('unknown');
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
        
        console.log('📋 [INSTRUMENTATION] Session check result:', { hasSession: !!session, user: session?.user?.email });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setAuthStatus(session ? 'authenticated' : 'unauthenticated');
        
        if (session?.user?.id) {
          console.log('👤 [INSTRUMENTATION] Existing user found, fetching role...');
          setRoleStatus('resolving');
          const reqId = ++roleReqIdRef.current;
          try {
            const userRole = await fetchUserRole(session.user.id, reqId);
            if (mounted && reqId === roleReqIdRef.current) {
              setRole(userRole);
              lastKnownRoleRef.current = userRole;
              setRoleStatus('ready');
            }
          } catch (error) {
            console.error('❌ [INSTRUMENTATION] Error fetching role during init:', error);
            if (mounted && reqId === roleReqIdRef.current) {
              setRole(lastKnownRoleRef.current || 'viewer');
              setRoleStatus('error');
            }
          }
        } else {
          console.log('❌ [INSTRUMENTATION] No existing user');
          setRole('none');
          setRoleStatus('ready');
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
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          console.log(`🔐 [INSTRUMENTATION] ${event} event`);
          
          setSession(session);
          setUser(session?.user ?? null);
          setAuthStatus(session ? 'authenticated' : 'unauthenticated');
          
          if (session?.user?.id) {
            // Increment request ID for race condition protection
            const reqId = ++roleReqIdRef.current;
            
            // For TOKEN_REFRESHED, keep admin role sticky during revalidation
            if (event === 'TOKEN_REFRESHED' && lastKnownRoleRef.current === 'admin') {
              console.log('🔄 [INSTRUMENTATION] TOKEN_REFRESHED: keeping admin role sticky during revalidation');
              setRoleStatus('resolving'); // Show we're revalidating but don't change role yet
            } else {
              setRoleStatus('resolving');
            }
            
            try {
              const userRole = await fetchUserRole(session.user.id, reqId);
              // Only update if this is the most recent request
              if (mounted && reqId === roleReqIdRef.current) {
                console.log(`✅ [INSTRUMENTATION] Role fetched after ${event}:`, userRole, 'reqId:', reqId);
                setRole(userRole);
                lastKnownRoleRef.current = userRole;
                setRoleStatus('ready');
              } else {
                console.log(`🚫 [INSTRUMENTATION] Ignoring stale role response:`, userRole, 'reqId:', reqId, 'current:', roleReqIdRef.current);
              }
            } catch (error) {
              console.error(`❌ [INSTRUMENTATION] Error fetching role during ${event}:`, error, 'reqId:', reqId);
              if (mounted && reqId === roleReqIdRef.current) {
                // Preserve admin role on error if it was previously admin
                const fallbackRole = lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
                console.log(`🛡️ [INSTRUMENTATION] Using fallback role:`, fallbackRole);
                setRole(fallbackRole);
                setRoleStatus('error');
              }
            }
          } else {
            console.log('❌ [INSTRUMENTATION] No user in session');
            setRole('none');
            setRoleStatus('ready');
            lastKnownRoleRef.current = 'none';
          }
          
          setInitialized(true);
        }
        
        console.log('📊 [INSTRUMENTATION] AUTH STATE AFTER:', { authStatus, role, roleStatus, initialized });
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};