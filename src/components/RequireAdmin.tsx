import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const RequireAdmin = () => {
  const { authStatus, role, roleStatus, initialized } = useAuth();
  const location = useLocation();

  // Instrumentación - logs de guards
  console.log('👑 [INSTRUMENTATION] RequireAdmin:', { 
    authStatus, 
    role, 
    roleStatus, 
    initialized, 
    path: location.pathname 
  });

  // Show loading spinner while authentication is being initialized OR role is loading
  if (!initialized || roleStatus !== 'ready') {
    console.log('👑 [INSTRUMENTATION] RequireAdmin: Waiting for auth/role to be ready');
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

  // Redirect non-admin users to their dashboard
  if (role !== 'admin') {
    console.log('👑 [INSTRUMENTATION] RequireAdmin: Redirecting non-admin user to /app/mis-empresas');
    return <Navigate to="/app/mis-empresas" replace />;
  }

  console.log('👑 [INSTRUMENTATION] RequireAdmin: Allowing access to admin area');
  // Render admin content
  return <Outlet />;
};