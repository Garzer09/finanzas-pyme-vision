import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component that displays inactivity warning dialog
 * Shows countdown and allows user to extend session
 */
export function InactivityWarning() {
  const { inactivityWarning, timeUntilLogout, resetInactivityTimer, signOut } = useAuth();

  if (!inactivityWarning) {
    return null;
  }

  const handleStaySignedIn = () => {
    resetInactivityTimer();
  };

  const handleSignOut = () => {
    signOut();
  };

  const minutes = Math.floor((timeUntilLogout || 0) / 60);
  const seconds = (timeUntilLogout || 0) % 60;

  return (
    <AlertDialog open={inactivityWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sesión por Expirar</AlertDialogTitle>
          <AlertDialogDescription>
            Tu sesión expirará por inactividad en {minutes}:{seconds.toString().padStart(2, '0')} minutos.
            <br />
            ¿Deseas mantener tu sesión activa?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleSignOut}>
            Cerrar Sesión
          </Button>
          <AlertDialogAction onClick={handleStaySignedIn}>
            Mantener Sesión
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}