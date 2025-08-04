import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { canAccessProtectedRoute, isAuthLoading } from '@/types/auth';
import { createSecureRetry, checkRoutePermissions, safeNavigate, formatAuthError } from '@/utils/authHelpers';
import { AuthLoadingScreen, AuthErrorScreen, AuthUnauthorizedScreen } from '@/components/LoadingStates';

interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { authState, initialized, retry } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1️⃣ Wait for authentication initialization
  if (!initialized || isAuthLoading(authState)) {
    return (
      <AuthLoadingScreen 
        message="Verificando autenticación..." 
      />
    );
  }

  // 2️⃣ Authentication error: show enhanced retry option
  if (authState.status === 'error') {
    const secureRetry = createSecureRetry(
      retry,
      () => safeNavigate('/login', navigate, { state: { from: location } })
    );

    return (
      <AuthErrorScreen
        message={formatAuthError(authState.error)}
        onRetry={secureRetry}
        onBack={() => safeNavigate('/login', navigate)}
        retryLabel="Reintentar"
        backLabel="Ir a Login"
      />
    );
  }

  // 3️⃣ Not authenticated: redirect to login preserving location
  if (authState.status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4️⃣ Enhanced permission check for authenticated users
  if (authState.status === 'authenticated') {
    const permissionCheck = checkRoutePermissions(authState, location.pathname);
    
    if (!permissionCheck.canAccess) {
      return (
        <AuthUnauthorizedScreen
          message={
            permissionCheck.reason === 'Admin role required for admin routes'
              ? 'Esta página está reservada para administradores'
              : 'No tienes permiso para ver esta página'
          }
          onNavigateHome={() => safeNavigate('/', navigate, { replace: true })}
          onSignOut={() => {
            // Optional: could sign out if access is severely restricted
            // For now, just navigate home
            safeNavigate('/', navigate, { replace: true });
          }}
        />
      );
    }
  }

  // 5️⃣ All checks passed: render children
  return <>{children}</>;
};
