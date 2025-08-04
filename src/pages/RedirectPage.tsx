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
        // Detectar rol y redirigir apropiadamente
        if (userRole === 'admin') {
          navigate('/admin/empresas');
        } else {
          navigate('/app/mis-empresas');
        }
      } else {
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