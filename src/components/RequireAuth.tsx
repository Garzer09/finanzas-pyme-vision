import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { canAccessProtectedRoute, isAuthLoading } from '@/types/auth';

interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { authState, initialized, retry } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  // 2️⃣ Error de autenticación: mostramos opción de reintentar
  if (authState.status === 'error') {
    console.error('🔐 [REQUIRE-AUTH] Auth error:', authState.error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="mb-4 text-center text-red-600">
          Ha ocurrido un error al verificar la autenticación.
        </p>
        <Button onClick={() => retry?.() ?? window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  // 3️⃣ No autenticado: redirigimos a login preservando la ubicación
  if (authState.status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4️⃣ Autenticado pero sin permisos: mensaje de "no autorizado"
  if (authState.status === 'authenticated' && !canAccessProtectedRoute(authState)) {
    console.warn(
      '🔐 [REQUIRE-AUTH] Usuario sin permisos intentando acceder a:',
      location.pathname
    );
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="mb-4 text-center text-yellow-600">
          No tienes permiso para ver esta página.
        </p>
        <Button onClick={() => navigate('/', { replace: true })}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  // 5️⃣ Todo OK: renderizamos rutas hijas
  return <>{children}</>;
};
