import React from 'react';
import { AlertCircle, FileText, Upload, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Fallback component for when the main dashboard fails to load
 */
export const DashboardFallback = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleBasicUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('File selected for basic upload:', file.name);
        // Basic file handling would go here
        alert(`Archivo seleccionado: ${file.name}. La funcionalidad completa no está disponible temporalmente.`);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dashboard No Disponible</AlertTitle>
          <AlertDescription>
            El dashboard principal no está disponible temporalmente. Funcionalidades básicas disponibles a continuación.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Subir Archivos
              </CardTitle>
              <CardDescription>
                Funcionalidad básica de carga de archivos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleBasicUpload} className="w-full">
                Seleccionar Archivo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentación
              </CardTitle>
              <CardDescription>
                Acceso a la documentación del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('/docs', '_blank')}
              >
                Ver Documentación
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estado del Sistema
              </CardTitle>
              <CardDescription>
                Información básica del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <span className="text-yellow-600">Modo Seguro</span>
                </div>
                <div className="flex justify-between">
                  <span>Funcionalidad:</span>
                  <span className="text-yellow-600">Limitada</span>
                </div>
                <div className="flex justify-between">
                  <span>Última actualización:</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center space-x-4">
          <Button onClick={handleRefresh} variant="default">
            Intentar Recargar Dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/support'}
          >
            Contactar Soporte
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Si el problema persiste, por favor contacte al administrador del sistema.</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Fallback component for file upload functionality
 */
export const FileUploadFallback = () => {
  return (
    <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium mb-2">Función de Carga No Disponible</h3>
      <p className="text-gray-600 mb-4">
        La funcionalidad de carga de archivos no está disponible temporalmente.
      </p>
      <div className="space-y-2">
        <p className="text-sm text-gray-500">Opciones alternativas:</p>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Fallback component for authentication failures
 */
export const AuthFallback = () => {
  const handleRetry = () => {
    // Clear any cached auth state
    localStorage.removeItem('auth-token');
    sessionStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Problema de Autenticación
          </CardTitle>
          <CardDescription>
            Hubo un problema con el sistema de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Por favor, inicie sesión nuevamente para continuar.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full">
              Ir a Inicio de Sesión
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Recargar Página
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Generic fallback component for any component failure
 */
export const GenericFallback: React.FC<{ 
  title?: string; 
  description?: string; 
  onRetry?: () => void;
}> = ({ 
  title = "Componente No Disponible", 
  description = "Este componente no está disponible temporalmente.",
  onRetry 
}) => {
  return (
    <div className="p-6 border rounded-lg bg-gray-50">
      <div className="text-center">
        <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <h3 className="text-lg font-medium mb-1">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Reintentar
          </Button>
        )}
      </div>
    </div>
  );
};