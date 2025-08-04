import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const RequireAuth = () => {
  const { authStatus, roleStatus, initialized } = useAuth();
  const location = useLocation();

  // Instrumentación - logs de guards
  console.log('🔐 [INSTRUMENTATION] RequireAuth:', { 
    authStatus, 
    roleStatus, 
    initialized, 
    path: location.pathname 
  });

  // Show loading spinner while authentication is being initialized
  if (!initialized) {
    console.log('🔐 [INSTRUMENTATION] RequireAuth: Waiting for initialization');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (authStatus !== 'authenticated') {
    console.log('🔐 [INSTRUMENTATION] RequireAuth: Redirecting unauthenticated user to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('🔐 [INSTRUMENTATION] RequireAuth: Allowing access');
  // Render protected content
  return <Outlet />;
};