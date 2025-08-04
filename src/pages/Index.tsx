
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized) {
      if (user) {
        // Si el usuario está autenticado, la LandingPage se encargará de la redirección
        navigate('/');
      }
      // Si no está autenticado, permanecer en la landing page
    }
  }, [user, initialized, navigate]);

  // Mientras está cargando, mostrar spinner
  if (!initialized) {
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
