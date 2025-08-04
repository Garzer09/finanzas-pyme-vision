import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const RequireAdmin = () => {
  const { authStatus, role, initialized } = useAuth();
  const location = useLocation();

  // Fase 1: Instrumentación - logs de guards
  console.log('👑 RequireAdmin:', { authStatus, role, initialized, path: location.pathname });

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
    console.log('👑 RequireAdmin: Redirecting unauthenticated user to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect non-admin users to their dashboard
  if (role !== 'admin') {
    console.log('👑 RequireAdmin: Redirecting non-admin user to /app/mis-empresas');
    return <Navigate to="/app/mis-empresas" replace />;
  }

  // Render admin content
  return <Outlet />;
};