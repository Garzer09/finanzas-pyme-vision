import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const DashboardSessionBanner: React.FC = () => {
  const { session, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Alert className="mb-6">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>
          Verificando sesión de usuario...
        </AlertDescription>
      </Alert>
    );
  }

  if (!session || !user) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Sin sesión activa:</strong> Los datos no se pueden cargar sin autenticación. 
          Por favor, inicia sesión nuevamente.
        </AlertDescription>
      </Alert>
    );
  }

  // Session is ready - don't show banner
  return null;
};