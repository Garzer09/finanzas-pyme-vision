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
    
    // Check cache first
    if (roleCache.current[userId]) {
      setUserRole(roleCache.current[userId]);
      return;
    }

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      const queryPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (!mounted.current) return;
      
      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        return;
      }
      
      const role = data?.role || null;
      if (role) {
        roleCache.current[userId] = role;
      }
      setUserRole(role);
    } catch (error) {
      if (!mounted.current) return;
      console.error('Error fetching user role:', error);
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