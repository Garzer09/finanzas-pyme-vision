import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Beautiful loading states for authentication flows
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-2 border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
};

interface AuthLoadingScreenProps {
  message?: string;
  showSpinner?: boolean;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({ 
  message = 'Cargando...', 
  showSpinner = true 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="flex flex-col items-center space-y-6 p-8">
        {showSpinner && (
          <div className="relative">
            <LoadingSpinner size="lg" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-pulse" />
          </div>
        )}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">{message}</p>
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

interface AuthErrorScreenProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  retryLabel?: string;
  backLabel?: string;
}

export const AuthErrorScreen: React.FC<AuthErrorScreenProps> = ({
  title = 'Error de Autenticación',
  message,
  onRetry,
  onBack,
  retryLabel = 'Reintentar',
  backLabel = 'Volver'
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-md w-full bg-card border rounded-lg shadow-lg p-8">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Error Content */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md transition-colors duration-200 font-medium"
              >
                {retryLabel}
              </button>
            )}
            {onBack && (
              <button
                onClick={onBack}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2 px-4 rounded-md transition-colors duration-200 font-medium"
              >
                {backLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface AuthUnauthorizedScreenProps {
  message?: string;
  onNavigateHome?: () => void;
  onSignOut?: () => void;
}

export const AuthUnauthorizedScreen: React.FC<AuthUnauthorizedScreenProps> = ({
  message = 'No tienes permiso para acceder a esta página',
  onNavigateHome,
  onSignOut
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-md w-full bg-card border rounded-lg shadow-lg p-8">
        <div className="text-center space-y-6">
          {/* Warning Icon */}
          <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-warning"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 15v2m0-6V7m0 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Acceso Denegado</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md transition-colors duration-200 font-medium"
              >
                Ir al Inicio
              </button>
            )}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2 px-4 rounded-md transition-colors duration-200 font-medium"
              >
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  animate = true 
}) => {
  return (
    <div
      className={cn(
        'bg-muted rounded-md',
        animate && 'animate-pulse',
        className
      )}
    />
  );
};

export const AuthSkeletonLoader: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="flex space-x-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  );
};

interface ProgressiveLoadingProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  steps,
  currentStep,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <p className="text-sm font-medium">
          {steps[currentStep] || 'Procesando...'}
        </p>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep + 1) / steps.length) * 100}%`
          }}
        />
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        {currentStep + 1} de {steps.length}
      </div>
    </div>
  );
};