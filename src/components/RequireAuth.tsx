import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLoadingScreen, AuthErrorScreen, AuthUnauthorizedScreen } from '@/components/auth/AuthScreens';

interface RequireAuthProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isLoading, error, retry, role, user } = useAuth();
  const location = useLocation();

  console.debug('[REQUIRE-AUTH] Component render:', {
    isAuthenticated,
    isLoading,
    error,
    role,
    adminOnly,
    pathname: location.pathname
  });

  // Loading state
  if (isLoading) {
    return <AuthLoadingScreen message="Verificando acceso..." />;
  }

  // Error state
  if (error) {
    return (
      <AuthErrorScreen
        message={error}
        onRetry={retry}
        onBack={() => window.location.href = '/auth'}
        retryLabel="Reintentar"
        backLabel="Ir a Login"
      />
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin-only route check
  if (adminOnly && role !== 'admin') {
    return (
      <AuthUnauthorizedScreen
        message="Esta página está reservada para administradores"
        onNavigateHome={() => window.location.href = role === 'viewer' ? '/app/mis-empresas' : '/'}
        onSignOut={() => window.location.href = '/auth'}
      />
    );
  }

  // All checks passed
  return <>{children}</>;
};