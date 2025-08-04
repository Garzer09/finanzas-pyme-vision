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
  const mounted = useRef(true);
  const roleCache = useRef<Record<string, 'admin' | 'user'>>({});

  const fetchUserRole = useCallback(async (userId: string) => {
    if (!mounted.current || !userId) return;
    
    console.log('fetchUserRole called for userId:', userId);
    
    // Check cache first
    if (roleCache.current[userId]) {
      console.log('Role found in cache:', roleCache.current[userId]);
      setUserRole(roleCache.current[userId]);
      return;
    }

    try {
      console.log('Fetching role from database for user:', userId);
      
      // Try the database function first
      const { data: functionData, error: functionError } = await supabase
        .rpc('get_user_role', { user_uuid: userId });
      
      console.log('Function call result:', { functionData, functionError });
      
      if (!functionError && functionData) {
        const role = functionData as 'admin' | 'user';
        console.log('Role from function:', role);
        roleCache.current[userId] = role;
        setUserRole(role);
        return;
      }
      
      // Fallback to direct table query
      console.log('Trying direct table query...');
      const { data: tableData, error: tableError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      console.log('Table query result:', { tableData, tableError });
      
      if (!mounted.current) return;
      
      if (tableError) {
        console.error('Error fetching user role from table:', tableError);
        console.error('Error details:', JSON.stringify(tableError, null, 2));
        setUserRole(null);
        return;
      }
      
      const role = tableData?.role || null;
      console.log('Extracted role from table:', role);
      
      if (role) {
        roleCache.current[userId] = role;
        console.log('Role cached:', role);
      }
      setUserRole(role);
      console.log('User role set to:', role);
    } catch (error) {
      if (!mounted.current) return;
      console.error('Catch block - Error fetching user role:', error);
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let authSubscription: any = null;

    const initAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted.current) return;
            
            setSession(session);
            setUser(session?.user ?? null);
            
            // Fetch user role when session is established
            if (session?.user?.id) {
              await fetchUserRole(session.user.id);
            } else {
              setUserRole(null);
            }
            
            setLoading(false);
          }
        );
        
        authSubscription = subscription;

        // Check for existing session with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 10000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (!mounted.current) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          await fetchUserRole(session.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        if (!mounted.current) return;
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted.current = false;
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
    await supabase.auth.signOut();
    // Clear any cached data
    roleCache.current = {};
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