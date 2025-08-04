
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Si el usuario está autenticado, redirigir a /redirect para manejo de roles
        navigate('/redirect');
      }
      // Si no está autenticado, permanecer en la landing page
    }
  }, [user, loading, navigate]);

  // Mientras está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si no está autenticado, mostrar la landing page
  return null; // Esto se manejará en App.tsx con LandingPage
};

export default Index;
