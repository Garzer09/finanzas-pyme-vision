
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

const Index = () => {
  const { user, loading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (user) {
        // Detectar rol y redirigir apropiadamente
        if (userRole === 'admin') {
          navigate('/admin/users');
        } else {
          navigate('/home');
        }
      } else {
        navigate('/auth');
      }
    }
  }, [user, userRole, loading, roleLoading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
};

export default Index;
