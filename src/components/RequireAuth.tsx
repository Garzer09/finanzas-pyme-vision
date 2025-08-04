import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const RequireAuth = () => {
  const { authState, initialized } = useAuth();
  const location = useLocation();

  // Show loading spinner while authentication is being initialized
  if (!initialized) {
    console.log('🔐 [REQUIRE-AUTH] Waiting for initialization');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Inicializando...</p>
        </div>
      </div>
    );
  }

  // Handle error states with retry option
  if (authState.status === 'error') {
    console.log('🔐 [REQUIRE-AUTH] Auth error state:', authState.error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="text-destructive text-lg">⚠️</div>
          <h2 className="text-lg font-semibold">Error de autenticación</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {authState.error || 'Ha ocurrido un error con tu sesión.'}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Reintentar
          </Button>
          <Button 
            onClick={() => window.location.href = '/auth'}
            size="sm"
            variant="ghost"
          >
            Ir al login
          </Button>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (authState.status === 'unauthenticated') {
    console.log('🔐 [REQUIRE-AUTH] Redirecting unauthenticated user to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Show loading for role resolution
  if (authState.status === 'resolving-role') {
    console.log('🔐 [REQUIRE-AUTH] Resolving user role...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  console.log('🔐 [REQUIRE-AUTH] Allowing access');
  // Render protected content
  return <Outlet />;
};