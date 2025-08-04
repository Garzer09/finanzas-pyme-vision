import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

const RedirectPage = () => {
  const { user, loading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const [directRole, setDirectRole] = useState<string | null>(null);
  const navigate = useNavigate();

  // Direct role check for debugging
  useEffect(() => {
    const checkRoleDirectly = async () => {
      if (user?.id) {
        console.log('🔍 Direct role check for user:', user.id);
        
        try {
          // Method 1: Use RPC function
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_user_role', { user_uuid: user.id });
          
          console.log('🔧 RPC get_user_role result:', { rpcData, rpcError });
          
          // Method 2: Direct table query
          const { data: tableData, error: tableError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();
          
          console.log('📊 Direct table query result:', { tableData, tableError });
          
          setDirectRole(rpcData || tableData?.role || null);
        } catch (error) {
          console.error('❌ Direct role check failed:', error);
        }
      }
    };
    
    checkRoleDirectly();
  }, [user?.id]);

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (user) {
        console.log('🚀 RedirectPage Final Routing:', { 
          userId: user.id, 
          userRole,
          directRole,
          email: user.email,
          timestamp: new Date().toISOString()
        });
        
        // Use directRole as fallback if userRole is null
        const effectiveRole = userRole || directRole;
        console.log('🎯 Effective role:', effectiveRole);
        
        // Detectar rol y redirigir apropiadamente
        if (effectiveRole === 'admin') {
          console.log('👑 Redirecting admin to /admin/empresas');
          navigate('/admin/empresas');
        } else {
          console.log('👤 Redirecting user to /app/mis-empresas');
          navigate('/app/mis-empresas');
        }
      } else {
        console.log('❌ No user found, redirecting to /auth');
        navigate('/auth');
      }
    }
  }, [user, userRole, directRole, loading, roleLoading, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
};

export default RedirectPage;