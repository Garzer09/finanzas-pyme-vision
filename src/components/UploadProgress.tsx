import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Clock, FileText, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize, estimateProcessingTime } from '@/utils/fileValidation';

export interface UploadProgressProps {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
  showEstimate?: boolean;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  file,
  progress,
  status,
  error,
  onCancel,
  onRetry,
  className,
  showEstimate = true
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'uploading' || status === 'processing') {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  useEffect(() => {
    if (status === 'uploading' && progress > 0 && elapsed > 0) {
      // Calculate upload speed (bytes per second)
      const bytesUploaded = (progress / 100) * file.size;
      const speed = bytesUploaded / elapsed;
      setUploadSpeed(speed);
    }
  }, [progress, elapsed, file.size, status]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const estimatedTimeRemaining = (): string => {
    if (status !== 'uploading' || progress === 0 || uploadSpeed === 0) {
      return estimateProcessingTime(file.size);
    }
    
    const remainingBytes = file.size - (progress / 100) * file.size;
    const remainingSeconds = Math.ceil(remainingBytes / uploadSpeed);
    return formatTime(remainingSeconds);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <FileText className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'processing':
        return <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Subiendo archivo...';
      case 'processing':
        return 'Procesando archivo...';
      case 'completed':
        return 'Procesado exitosamente';
      case 'error':
        return 'Error en el procesamiento';
      default:
        return 'Preparando...';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'processing':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Card className={cn("border-2 transition-all duration-300", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with file info and cancel button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            
            {onCancel && (status === 'uploading' || status === 'processing') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{getStatusText()}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 ease-out rounded-full",
                  getProgressColor()
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Status details */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              {status === 'uploading' && uploadSpeed > 0 && (
                <div className="flex items-center space-x-1">
                  <span>Velocidad:</span>
                  <span className="font-medium">
                    {formatFileSize(uploadSpeed)}/s
                  </span>
                </div>
              )}
              
              {elapsed > 0 && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Transcurrido: {formatTime(elapsed)}</span>
                </div>
              )}
            </div>
            
            {showEstimate && (status === 'uploading' || status === 'processing') && (
              <div className="flex items-center space-x-1">
                <span>Tiempo estimado:</span>
                <span className="font-medium">{estimatedTimeRemaining()}</span>
              </div>
            )}
          </div>

          {/* Error state */}
          {status === 'error' && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 mb-2">{error}</p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  Reintentar
                </Button>
              )}
            </div>
          )}

          {/* Success state */}
          {status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                ✅ Archivo procesado correctamente en {formatTime(elapsed)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for managing upload progress state
export interface UseUploadProgressProps {
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: UploadProgressProps['status']) => void;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

export const useUploadProgress = ({
  onProgress,
  onStatusChange,
  onError,
  onSuccess
}: UseUploadProgressProps = {}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadProgressProps['status']>('uploading');
  const [error, setError] = useState<string>();

  const updateProgress = (newProgress: number) => {
    setProgress(newProgress);
    onProgress?.(newProgress);
  };

  const updateStatus = (newStatus: UploadProgressProps['status']) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
    
    if (newStatus === 'completed') {
      setProgress(100);
      onSuccess?.();
    }
  };

  const setErrorState = (errorMessage: string) => {
    setError(errorMessage);
    setStatus('error');
    onError?.(errorMessage);
  };

  const reset = () => {
    setProgress(0);
    setStatus('uploading');
    setError(undefined);
  };

  const simulateProgress = (duration: number = 3000) => {
    // Simulate realistic upload progress for demo purposes
    let currentProgress = 0;
    const increment = 100 / (duration / 100);
    
    const interval = setInterval(() => {
      currentProgress += increment * (0.5 + Math.random() * 0.5); // Variable speed
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        updateProgress(currentProgress);
        clearInterval(interval);
        updateStatus('processing');
        
        // Simulate processing time
        setTimeout(() => {
          updateStatus('completed');
        }, 1000 + Math.random() * 2000);
      } else {
        updateProgress(currentProgress);
      }
    }, 100);

    return () => clearInterval(interval);
  };

  return {
    progress,
    status,
    error,
    updateProgress,
    updateStatus,
    setErrorState,
    reset,
    simulateProgress
  };
};