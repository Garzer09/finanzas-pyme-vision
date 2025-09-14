import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const RequireAdmin = () => {
  const { authStatus, role, roleStatus, initialized, user } = useAuth();
  const location = useLocation();

  // Instrumentación - logs de guards
  console.log('👑 [INSTRUMENTATION] RequireAdmin:', { 
    authStatus, 
    role, 
    roleStatus, 
    initialized, 
    user: user?.id || 'no-user',
    path: location.pathname 
  });

  // Show loading spinner while authentication is being initialized
  if (!initialized) {
    console.log('👑 [INSTRUMENTATION] RequireAdmin: Auth not initialized');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (authStatus !== 'authenticated') {
    console.log('👑 [INSTRUMENTATION] RequireAdmin: Redirecting unauthenticated user to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Show loading while role is resolving, but with timeout fallback
  if (roleStatus === 'resolving') {
    console.log('👑 [INSTRUMENTATION] RequireAdmin: Role resolving, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Verificando permisos...</p>
      </div>
    );
  }

  // If role query failed or returned non-admin, redirect to user area
  if (role !== 'admin') {
    console.log('👑 [INSTRUMENTATION] RequireAdmin: Redirecting non-admin user to /app/mis-empresas');
    return <Navigate to="/app/mis-empresas" replace />;
  }

  console.log('👑 [INSTRUMENTATION] RequireAdmin: Allowing access to admin area');
  // Render admin content
  return <Outlet />;
};