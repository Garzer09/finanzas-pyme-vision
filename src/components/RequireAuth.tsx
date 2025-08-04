import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const RequireAuth = () => {
  const { authStatus, initialized } = useAuth();
  const location = useLocation();

  // Fase 1: Instrumentación - logs de guards
  console.log('🔐 RequireAuth:', { authStatus, initialized, path: location.pathname });

  // Show loading spinner while authentication is being initialized
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (authStatus !== 'authenticated') {
    console.log('🔐 RequireAuth: Redirecting unauthenticated user to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Render protected content
  return <Outlet />;
};