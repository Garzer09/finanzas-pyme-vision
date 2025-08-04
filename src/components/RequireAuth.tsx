import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessProtectedRoute, isAuthLoading } from '@/types/auth';

export const RequireAuth = () => {
  const { authState } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log('🔐 [REQUIRE-AUTH]:', { 
    authState: authState.status, 
    path: location.pathname 
  });

  // Show loading spinner while authentication is being processed
  if (isAuthLoading(authState)) {
    console.log('🔐 [REQUIRE-AUTH]: Waiting for authentication...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!canAccessProtectedRoute(authState)) {
    console.log('🔐 [REQUIRE-AUTH]: Redirecting unauthenticated user to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('🔐 [REQUIRE-AUTH]: Allowing access');
  // Render protected content
  return <Outlet />;
};