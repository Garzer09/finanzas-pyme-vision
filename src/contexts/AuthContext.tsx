import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authStatus: 'unknown' | 'authenticated' | 'unauthenticated';
  role: 'admin' | 'viewer' | 'none';
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
  const [initialized, setInitialized] = useState(false);

  const fetchUserRole = useCallback(async (userId: string): Promise<'admin' | 'viewer'> => {
    if (!userId) {
      console.log('❌ fetchUserRole: No userId provided');
      return 'viewer';
    }
    
    console.log('🔍 fetchUserRole called for userId:', userId);
    
    try {
      // Fase 3: Añadir timeout más corto para evitar cuelgues
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('fetchUserRole timeout')), 5000)
      );
      
      // Try RPC function first with timeout
      const rpcPromise = supabase
        .rpc('get_user_role', { user_uuid: userId });
      
      const { data: rpcData, error: rpcError } = await Promise.race([rpcPromise, timeoutPromise]);
      
      console.log('🔧 RPC result:', { rpcData, rpcError });
      
      if (!rpcError && rpcData === 'admin') {
        console.log('✅ Role from RPC: admin');
        return 'admin';
      }
      
      // Fallback to direct table query with timeout
      console.log('⚠️ RPC failed, trying direct table query...');
      const tablePromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      const { data: tableData, error: tableError } = await Promise.race([tablePromise, timeoutPromise]);
      
      console.log('📊 Table query result:', { tableData, tableError });
      
      if (!tableError && tableData?.role === 'admin') {
        console.log('✅ Role from table: admin');
        return 'admin';
      }
      
      // Default to viewer
      console.log('ℹ️ No admin role found, defaulting to viewer');
      return 'viewer';
      
    } catch (error) {
      console.error('❌ Error in fetchUserRole (with timeout):', error);
      return 'viewer';
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initAuth = async () => {
      try {
        console.log('🚀 Initializing Auth...');
        
        // Check for existing session first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session check error:', error);
          if (!mounted) return;
          setAuthStatus('unauthenticated');
          setRole('none');
          return;
        }
        
        console.log('📋 Session check result:', { hasSession: !!session, user: session?.user?.email });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setAuthStatus(session ? 'authenticated' : 'unauthenticated');
        
        if (session?.user?.id) {
          console.log('👤 Existing user found, fetching role...');
          const userRole = await fetchUserRole(session.user.id);
          if (mounted) {
            setRole(userRole);
          }
        } else {
          console.log('❌ No existing user');
          setRole('none');
        }
        
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setAuthStatus('unauthenticated');
          setRole('none');
        }
      } finally {
        if (mounted) {
          setInitialized(true);
          console.log('✅ Auth initialization completed');
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', { event, user: session?.user?.email });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setAuthStatus(session ? 'authenticated' : 'unauthenticated');
        
        try {
          if (session?.user?.id) {
            console.log('👤 User found, fetching role...');
            const userRole = await fetchUserRole(session.user.id);
            if (mounted) {
              setRole(userRole);
            }
          } else {
            console.log('❌ No user, clearing role');
            if (mounted) {
              setRole('none');
            }
          }
        } catch (error) {
          console.error('❌ Error in auth state change:', error);
          if (mounted) {
            setRole(session ? 'viewer' : 'none');
          }
        } finally {
          // Fase 3: Asegurar que initialized=true incluso si fetchUserRole falla
          if (mounted) {
            setInitialized(true);
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
    initialized,
    signIn,
    signUp,
    signOut,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};