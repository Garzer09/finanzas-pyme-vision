import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authStatus: 'unknown' | 'authenticated' | 'unauthenticated';
  role: 'admin' | 'viewer' | 'none';
  roleStatus: 'idle' | 'loading' | 'ready';
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, data?: any) => Promise<{ error: any }>;
  signOut: (redirectTo?: string) => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: any }>;
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
  const [roleStatus, setRoleStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [initialized, setInitialized] = useState(false);
  
  // Sticky role ref to prevent admin downgrade during refresh
  const lastKnownRoleRef = useRef<'admin' | 'viewer' | 'none'>('none');
  const fetchControllerRef = useRef<AbortController | null>(null);

  const fetchUserRole = useCallback(async (userId: string): Promise<'admin' | 'viewer'> => {
    if (!userId) {
      console.log('❌ fetchUserRole: No userId provided');
      return 'viewer';
    }
    
    // Cancel previous request if exists
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    fetchControllerRef.current = new AbortController();
    const { signal } = fetchControllerRef.current;
    
    console.log('🔍 [INSTRUMENTATION] fetchUserRole called for userId:', userId);
    
    try {
      // Reduced timeout to 5s for faster recovery
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('fetchUserRole timeout')), 5000)
      );
      
      // Try RPC function first with timeout
      const rpcPromise = supabase
        .rpc('get_user_role', { user_uuid: userId });
      
      const { data: rpcData, error: rpcError } = await Promise.race([rpcPromise, timeoutPromise]);
      
      console.log('🔧 [INSTRUMENTATION] RPC result:', { rpcData, rpcError });
      
      if (!rpcError && rpcData === 'admin') {
        console.log('✅ [INSTRUMENTATION] Role from RPC: admin');
        return 'admin';
      }
      
      // Fallback to direct table query with timeout
      console.log('⚠️ [INSTRUMENTATION] RPC failed, trying direct table query...');
      const tablePromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      const { data: tableData, error: tableError } = await Promise.race([tablePromise, timeoutPromise]);
      
      console.log('📊 [INSTRUMENTATION] Table query result:', { tableData, tableError });
      
      if (!tableError && tableData?.role === 'admin') {
        console.log('✅ [INSTRUMENTATION] Role from table: admin');
        return 'admin';
      }
      
      // Default to viewer
      console.log('ℹ️ [INSTRUMENTATION] No admin role found, defaulting to viewer');
      return 'viewer';
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🚫 [INSTRUMENTATION] fetchUserRole aborted');
        return lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
      }
      console.error('❌ [INSTRUMENTATION] Error in fetchUserRole (with timeout):', error);
      // Preserve admin role on error if it was previously admin
      return lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
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
          setRoleStatus('loading');
          try {
            const userRole = await fetchUserRole(session.user.id);
            if (mounted) {
              setRole(userRole);
              lastKnownRoleRef.current = userRole;
              setRoleStatus('ready');
            }
          } catch (error) {
            console.error('❌ [INSTRUMENTATION] Error fetching role during init:', error);
            if (mounted) {
              setRole('viewer');
              setRoleStatus('ready');
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
            // For TOKEN_REFRESHED, keep admin role sticky during revalidation
            if (event === 'TOKEN_REFRESHED' && lastKnownRoleRef.current === 'admin') {
              console.log('🔄 [INSTRUMENTATION] TOKEN_REFRESHED: keeping admin role sticky during revalidation');
              setRoleStatus('loading'); // Show we're revalidating but don't change role yet
            } else {
              setRoleStatus('loading');
            }
            
            try {
              const userRole = await fetchUserRole(session.user.id);
              if (mounted) {
                console.log(`✅ [INSTRUMENTATION] Role fetched after ${event}:`, userRole);
                setRole(userRole);
                lastKnownRoleRef.current = userRole;
                setRoleStatus('ready');
              }
            } catch (error) {
              console.error(`❌ [INSTRUMENTATION] Error fetching role during ${event}:`, error);
              if (mounted) {
                // Preserve admin role on error if it was previously admin
                const fallbackRole = lastKnownRoleRef.current === 'admin' ? 'admin' : 'viewer';
                console.log(`🛡️ [INSTRUMENTATION] Using fallback role:`, fallbackRole);
                setRole(fallbackRole);
                setRoleStatus('ready');
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};