import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { authStatus, initialized } = useAuth();
  const location = useLocation();

  // Mostrar loading solo mientras no esté inicializado
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirigir solo después de la inicialización
  if (authStatus === 'unauthenticated') {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};