import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'feature';
  context?: Record<string, any>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Send error to Sentry with context
    const errorId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        errorBoundary: {
          level: this.props.level || 'component',
          context: this.props.context || {},
        },
      },
      tags: {
        errorBoundary: true,
        level: this.props.level || 'component',
      },
    });

    this.setState({
      error,
      errorInfo,
      errorId,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  private handleReportFeedback = () => {
    if (this.state.errorId) {
      Sentry.showReportDialog({ eventId: this.state.errorId });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error de Aplicación</AlertTitle>
              <AlertDescription>
                Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={this.handleRetry} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
              <Button onClick={this.handleReload} className="flex-1">
                Recargar Página
              </Button>
            </div>

            {this.state.errorId && (
              <div className="text-center">
                <Button 
                  onClick={this.handleReportFeedback} 
                  variant="link" 
                  size="sm"
                  className="text-muted-foreground"
                >
                  Reportar este error
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  ID del error: {this.state.errorId}
                </p>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-muted rounded border text-sm">
                <summary className="cursor-pointer font-medium mb-2">
                  Detalles del Error (Desarrollo)
                </summary>
                <pre className="whitespace-pre-wrap text-xs">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}