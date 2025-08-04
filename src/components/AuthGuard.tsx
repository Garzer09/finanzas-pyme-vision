import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types/auth';
import { checkRoutePermissions, safeNavigate } from '@/utils/authHelpers';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthLoadingScreen, AuthUnauthorizedScreen } from '@/components/LoadingStates';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: Role;
  requireAdmin?: boolean;
  fallbackPath?: string;
  allowedPaths?: string[];
  blockedPaths?: string[];
}

/**
 * Enhanced AuthGuard component providing additional security layer
 * 
 * Features:
 * - Role-based access control
 * - Path-specific permissions
 * - Graceful error handling
 * - Loading states
 * - Security logging
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRole,
  requireAdmin = false,
  fallbackPath = '/',
  allowedPaths = [],
  blockedPaths = []
}) => {
  const { authState, initialized } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Wait for auth initialization
  if (!initialized) {
    return (
      <AuthLoadingScreen 
        message="Verificando permisos..." 
      />
    );
  }

  // Check if user is authenticated
  if (authState.status !== 'authenticated') {
    return (
      <AuthUnauthorizedScreen
        message="Debes iniciar sesión para acceder a esta página"
        onNavigateHome={() => safeNavigate('/login', navigate, { 
          state: { from: location.pathname }
        })}
      />
    );
  }

  const currentPath = location.pathname;
  
  // Check blocked paths
  if (blockedPaths.length > 0) {
    const isBlocked = blockedPaths.some(path => 
      currentPath.startsWith(path) || currentPath === path
    );
    
    if (isBlocked) {
      return (
        <AuthUnauthorizedScreen
          message="No tienes acceso a esta sección"
          onNavigateHome={() => safeNavigate(fallbackPath, navigate, { replace: true })}
        />
      );
    }
  }

  // Check allowed paths (if specified, user must be on one of these paths)
  if (allowedPaths.length > 0) {
    const isAllowed = allowedPaths.some(path => 
      currentPath.startsWith(path) || currentPath === path
    );
    
    if (!isAllowed) {
      return (
        <AuthUnauthorizedScreen
          message="Acceso restringido a esta área"
          onNavigateHome={() => safeNavigate(fallbackPath, navigate, { replace: true })}
        />
      );
    }
  }

  // Determine effective required role
  const effectiveRequiredRole = requireAdmin ? 'admin' : requiredRole;

  // Check permissions
  const permissionCheck = checkRoutePermissions(
    authState, 
    currentPath, 
    effectiveRequiredRole
  );

  if (!permissionCheck.canAccess) {
    // Log security event (in production, this could be sent to a monitoring service)
    console.warn('AuthGuard: Access denied', {
      userId: authState.user.id,
      userRole: authState.role,
      requiredRole: effectiveRequiredRole,
      path: currentPath,
      reason: permissionCheck.reason,
      timestamp: new Date().toISOString()
    });

    const handleNavigation = () => {
      switch (permissionCheck.suggestedAction) {
        case 'login':
          safeNavigate('/login', navigate, { 
            state: { from: currentPath }
          });
          break;
        case 'home':
          safeNavigate(fallbackPath, navigate, { replace: true });
          break;
        default:
          safeNavigate(fallbackPath, navigate, { replace: true });
      }
    };

    return (
      <AuthUnauthorizedScreen
        message={getPermissionMessage(permissionCheck.reason, effectiveRequiredRole)}
        onNavigateHome={handleNavigation}
        onSignOut={() => {
          // Optional: sign out user if they shouldn't have access
          // This could be configurable based on security requirements
        }}
      />
    );
  }

  // Log successful access (optional, for audit trail)
  if (process.env.NODE_ENV === 'development') {
    console.debug('AuthGuard: Access granted', {
      userId: authState.user.id,
      userRole: authState.role,
      path: currentPath,
      timestamp: new Date().toISOString()
    });
  }

  // All checks passed, render children
  return <>{children}</>;
};

/**
 * Helper function to get user-friendly permission messages
 */
function getPermissionMessage(reason: string, requiredRole?: Role): string {
  if (reason.includes('Admin role required')) {
    return 'Esta página está reservada para administradores';
  }
  
  if (reason.includes('Role') && requiredRole) {
    return `Se requiere el rol '${requiredRole}' para acceder a esta página`;
  }
  
  if (reason.includes('not authenticated')) {
    return 'Debes iniciar sesión para continuar';
  }
  
  return 'No tienes los permisos necesarios para acceder a esta página';
}

/**
 * Higher-order component version of AuthGuard
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardOptions: Omit<AuthGuardProps, 'children'> = {}
) {
  return function GuardedComponent(props: P) {
    return (
      <AuthGuard {...guardOptions}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Hook for checking permissions without rendering guard UI
 */
export function useAuthGuard(options: Omit<AuthGuardProps, 'children'> = {}) {
  const { authState, initialized } = useAuth();
  const location = useLocation();
  
  const {
    requiredRole,
    requireAdmin = false,
    allowedPaths = [],
    blockedPaths = []
  } = options;

  if (!initialized || authState.status !== 'authenticated') {
    return {
      canAccess: false,
      reason: 'Not authenticated or not initialized',
      loading: !initialized
    };
  }

  const currentPath = location.pathname;
  
  // Check blocked paths
  if (blockedPaths.length > 0) {
    const isBlocked = blockedPaths.some(path => 
      currentPath.startsWith(path) || currentPath === path
    );
    
    if (isBlocked) {
      return {
        canAccess: false,
        reason: 'Path is blocked',
        loading: false
      };
    }
  }

  // Check allowed paths
  if (allowedPaths.length > 0) {
    const isAllowed = allowedPaths.some(path => 
      currentPath.startsWith(path) || currentPath === path
    );
    
    if (!isAllowed) {
      return {
        canAccess: false,
        reason: 'Path not in allowed list',
        loading: false
      };
    }
  }

  // Check role permissions
  const effectiveRequiredRole = requireAdmin ? 'admin' : requiredRole;
  const permissionCheck = checkRoutePermissions(
    authState, 
    currentPath, 
    effectiveRequiredRole
  );

  return {
    canAccess: permissionCheck.canAccess,
    reason: permissionCheck.reason,
    loading: false
  };
}