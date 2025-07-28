import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';

interface RoleBasedAccessProps {
  allowedRoles: ('admin' | 'user')[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback
}) => {
  const { userRole, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return fallback || (
      <div className="bg-muted border border-border rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Acceso Restringido</h3>
        <p className="text-muted-foreground">
          No tienes permisos para acceder a esta funcionalidad.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};