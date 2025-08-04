import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';
import { Button } from '@/components/ui/button';
import { canAccessProtectedRoute, isAuthLoading } from '@/types/auth';

interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { authState, initialized, retry } = useAuth();
  const location = useLocation();

  // Debug logging
  console.debug('🔐 [REQUIRE-AUTH]:', {
    status: authState.status,
    path: location.pathname,
  });

  // 1️⃣ Esperamos a que se inicialice la autenticación
  if (!initialized || isAuthLoading(authState)) {
    console.debug('🔐 [REQUIRE-AUTH]: Waiting for initialization or loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // 2️⃣ Error de autenticación: mostrar opción de reintentar
  if (authState.status === 'error') {
    console.debug('🔐 [REQUIRE-AUTH]: Authentication error');
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

  // 3️⃣ No autenticado: redirigimos a login preservando la ubicación
  if (authState.status === 'unauthenticated') {
    console.log('🔐 [REQUIRE-AUTH] Redirecting unauthenticated user to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 4️⃣ Muestra loader mientras se resuelve el rol
  if (authState.status === 'resolving-role') {
    console.log('🔐 [REQUIRE-AUTH] Resolving user role...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // 5️⃣ Redirige usuarios sin permiso
  if (!canAccessProtectedRoute(authState)) {
    console.log('🔐 [REQUIRE-AUTH] Redirecting unauthorized user to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('🔐 [REQUIRE-AUTH] Allowing access');

  // 6️⃣ Todo OK: renderizamos rutas hijas
  return <Outlet />;
};