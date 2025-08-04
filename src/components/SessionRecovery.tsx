import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/**
 * SessionRecovery component handles graceful recovery from session issues
 * Prevents blank screens and provides user-friendly recovery options
 */
export const SessionRecovery: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState, initialized, refreshRole } = useAuth();
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);

  // Monitor for session issues and attempt recovery
  useEffect(() => {
    if (!initialized) return;

    // If we're in an error state and haven't exceeded retry attempts
    if (authState.status === 'error' && recoveryAttempts < 3) {
      const attemptRecovery = async () => {
        console.log('🔧 [SESSION-RECOVERY] Attempting automatic recovery, attempt:', recoveryAttempts + 1);
        setIsRecovering(true);
        
        try {
          // Wait a bit before attempting recovery
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try to refresh the role
          await refreshRole();
          
          setRecoveryAttempts(prev => prev + 1);
        } catch (error) {
          console.error('❌ [SESSION-RECOVERY] Recovery attempt failed:', error);
          setRecoveryAttempts(prev => prev + 1);
        } finally {
          setIsRecovering(false);
        }
      };

      // Don't attempt recovery immediately, wait a bit
      const timer = setTimeout(attemptRecovery, 1000);
      return () => clearTimeout(timer);
    }
  }, [authState.status, initialized, recoveryAttempts, refreshRole]);

  // If we're still initializing, show loading
  if (!initialized) {
    return (
      <div className="min-h-screen bg-steel flex items-center justify-center" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">Iniciando aplicación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we're in an error state and have exceeded retry attempts, show recovery UI
  if (authState.status === 'error' && recoveryAttempts >= 3) {
    return (
      <div className="min-h-screen bg-steel flex items-center justify-center" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-white" />
              <span className="text-4xl font-bold text-white">FinSight</span>
            </div>
          </div>

          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-destructive">Problema de conexión</CardTitle>
              <CardDescription>
                No se pudo establecer una conexión estable. Esto puede deberse a problemas de red temporales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Error: {authState.error}</p>
                <p className="mt-2">Intentos de recuperación: {recoveryAttempts}</p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                  disabled={isRecovering}
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Intentando...
                    </>
                  ) : (
                    'Recargar página'
                  )}
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/auth'} 
                  variant="outline" 
                  className="w-full"
                >
                  Volver al login
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground text-center mt-4">
                Si el problema persiste, verifica tu conexión a internet o contacta soporte.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show recovery indicator if we're attempting recovery
  if (isRecovering && authState.status === 'error') {
    toast({
      title: "Recuperando sesión",
      description: "Intentando restablecer la conexión...",
      duration: 2000,
    });
  }

  // Normal operation - render children
  return <>{children}</>;
};