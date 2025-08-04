import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

const RedirectPage = () => {
  const { user, loading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (user) {
        console.log('RedirectPage Debug:', { 
          userId: user.id, 
          userRole, 
          email: user.email,
          timestamp: new Date().toISOString()
        });
        
        // Detectar rol y redirigir apropiadamente
        if (userRole === 'admin') {
          console.log('Redirecting admin to /admin/empresas');
          navigate('/admin/empresas');
        } else {
          console.log('Redirecting user to /app/mis-empresas');
          navigate('/app/mis-empresas');
        }
      } else {
        console.log('No user found, redirecting to /auth');
        navigate('/auth');
      }
    }
  }, [user, userRole, loading, roleLoading, navigate]);

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