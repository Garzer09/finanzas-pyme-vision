import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Shield } from 'lucide-react';

interface AuthLoadingScreenProps {
  message?: string;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({ 
  message = "Verificando autenticación..." 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
    <Card className="w-96">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground text-center">{message}</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

interface AuthErrorScreenProps {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  retryLabel?: string;
  backLabel?: string;
}

export const AuthErrorScreen: React.FC<AuthErrorScreenProps> = ({
  message,
  onRetry,
  onBack,
  retryLabel = "Reintentar",
  backLabel = "Volver"
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
    <Card className="w-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Error de Autenticación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              {retryLabel}
            </Button>
          )}
          {onBack && (
            <Button variant="outline" onClick={onBack} className="flex-1">
              {backLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

interface AuthUnauthorizedScreenProps {
  message?: string;
  onNavigateHome?: () => void;
  onSignOut?: () => void;
}

export const AuthUnauthorizedScreen: React.FC<AuthUnauthorizedScreenProps> = ({
  message = "No tienes permisos para acceder a esta página",
  onNavigateHome,
  onSignOut
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
    <Card className="w-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <Shield className="h-5 w-5" />
          Acceso No Autorizado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-2">
          {onNavigateHome && (
            <Button onClick={onNavigateHome} className="flex-1">
              Ir al Inicio
            </Button>
          )}
          {onSignOut && (
            <Button variant="outline" onClick={onSignOut} className="flex-1">
              Cerrar Sesión
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);