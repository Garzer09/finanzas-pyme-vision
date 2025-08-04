import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: 'admin' | 'user' | null;
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
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);

  const fetchUserRole = useCallback(async (userId: string) => {
    if (!userId) {
      console.log('❌ fetchUserRole: No userId provided');
      return;
    }
    
    console.log('🔍 fetchUserRole called for userId:', userId);
    
    try {
      // Try RPC function first
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_role', { user_uuid: userId });
      
      console.log('🔧 RPC result:', { rpcData, rpcError });
      
      if (!rpcError && rpcData) {
        console.log('✅ Role from RPC:', rpcData);
        setUserRole(rpcData);
        return;
      }
      
      // Fallback to direct table query
      console.log('⚠️ RPC failed, trying direct table query...');
      const { data: tableData, error: tableError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('📊 Table query result:', { tableData, tableError });
      
      if (!tableError && tableData?.role) {
        console.log('✅ Role from table:', tableData.role);
        setUserRole(tableData.role);
        return;
      }
      
      // If no role found, set as null
      console.log('❌ No role found, setting to null');
      setUserRole(null);
      
    } catch (error) {
      console.error('❌ Error in fetchUserRole:', error);
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    let authSubscription: any = null;

    const initAuth = async () => {
      try {
        console.log('🚀 Initializing Auth...');
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 Auth state change:', { event, user: session?.user?.email });
            
            setSession(session);
            setUser(session?.user ?? null);
            
            // Fetch user role when session is established
            if (session?.user?.id) {
              console.log('👤 User found, fetching role...');
              await fetchUserRole(session.user.id);
            } else {
              console.log('❌ No user, clearing role');
              setUserRole(null);
            }
            
            setLoading(false);
          }
        );
        
        authSubscription = subscription;

        // Check for existing session
        console.log('🔍 Checking existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session check error:', error);
          setLoading(false);
          return;
        }
        
        console.log('📋 Session check result:', { hasSession: !!session, user: session?.user?.email });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          console.log('👤 Existing user found, fetching role...');
          await fetchUserRole(session.user.id);
        } else {
          console.log('❌ No existing user');
          setUserRole(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
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
    setUserRole(null);
    
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
    loading,
    userRole,
    signIn,
    signUp,
    signOut,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};