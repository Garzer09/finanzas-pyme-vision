import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const RootRedirect = () => {
  const { authStatus, role, roleStatus, initialized } = useAuth();

  console.debug('[ROOT-REDIRECT] State:', { authStatus, role, roleStatus, initialized });

  // Show loading while authentication is being initialized
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, go to auth page
  if (authStatus !== 'authenticated') {
    console.debug('[ROOT-REDIRECT] Not authenticated, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // If authenticated but role not ready yet, show loading
  if (roleStatus !== 'ready') {
    console.debug('[ROOT-REDIRECT] Authenticated but role not ready, showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect based on role
  if (role === 'admin') {
    console.debug('[ROOT-REDIRECT] Admin user, redirecting to /admin/empresas');
    return <Navigate to="/admin/empresas" replace />;
  } else {
    console.debug('[ROOT-REDIRECT] Regular user, redirecting to /app/mis-empresas');
    return <Navigate to="/app/mis-empresas" replace />;
  }
};