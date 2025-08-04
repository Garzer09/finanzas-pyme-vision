
import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Eye, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  validateFile, 
  formatFileSize, 
  getFileTypeDescription, 
  detectFinancialDocumentType,
  estimateProcessingTime,
  type FileValidationOptions 
} from '@/utils/fileValidation';
import { UploadProgress, useUploadProgress } from '@/components/UploadProgress';

interface FileUploaderProps {
  title: string;
  description: string;
  acceptedFormats?: string[];
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
  error?: string;
  success?: string;
  className?: string;
  validationOptions?: FileValidationOptions;
  showFilePreview?: boolean;
  enableProgressTracking?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  title,
  description,
  acceptedFormats = ['.xlsx', '.csv'],
  onFileUpload,
  isLoading = false,
  error,
  success,
  className,
  validationOptions,
  showFilePreview = true,
  enableProgressTracking = true
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string>();
  const [validationSuggestion, setValidationSuggestion] = useState<string>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    progress,
    status,
    error: uploadError,
    updateStatus,
    setErrorState,
    reset: resetProgress,
    simulateProgress
  } = useUploadProgress({
    onSuccess: () => {
      setIsUploading(false);
      setSelectedFile(null);
    },
    onError: (err) => {
      setIsUploading(false);
      console.error('Upload error:', err);
    }
  });

  const clearValidationErrors = useCallback(() => {
    setValidationError(undefined);
    setValidationSuggestion(undefined);
  }, []);

  const handleFileValidation = useCallback((file: File) => {
    clearValidationErrors();
    
    const validation = validateFile(file, {
      allowedExtensions: acceptedFormats,
      ...validationOptions
    });

    if (!validation.isValid) {
      setValidationError(validation.error);
      setValidationSuggestion(validation.suggestion);
      return false;
    }

    return true;
  }, [acceptedFormats, validationOptions, clearValidationErrors]);

  const processFileUpload = useCallback(async (file: File) => {
    if (!handleFileValidation(file)) {
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    resetProgress();
    clearValidationErrors();

    if (enableProgressTracking) {
      // Start progress simulation
      const cancelProgress = simulateProgress();
      
      try {
        // Call the actual upload function
        await onFileUpload(file);
      } catch (err) {
        cancelProgress();
        const errorMessage = err instanceof Error ? err.message : 'Error procesando el archivo';
        setErrorState(errorMessage);
      }
    } else {
      try {
        await onFileUpload(file);
        setIsUploading(false);
        setSelectedFile(null);
      } catch (err) {
        setIsUploading(false);
        const errorMessage = err instanceof Error ? err.message : 'Error procesando el archivo';
        setValidationError(errorMessage);
      }
    }
  }, [handleFileValidation, onFileUpload, enableProgressTracking, resetProgress, clearValidationErrors, simulateProgress, setErrorState]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFileUpload(files[0]);
    }
  }, [processFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFileUpload(files[0]);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [processFileUpload]);

  const handleCancel = useCallback(() => {
    setIsUploading(false);
    setSelectedFile(null);
    resetProgress();
    updateStatus('uploading');
  }, [resetProgress, updateStatus]);

  const handleRetry = useCallback(() => {
    if (selectedFile) {
      processFileUpload(selectedFile);
    }
  }, [selectedFile, processFileUpload]);

  // Show progress component when uploading
  if (isUploading && selectedFile && enableProgressTracking) {
    return (
      <div className={cn("space-y-4", className)}>
        <UploadProgress
          file={selectedFile}
          progress={progress}
          status={status}
          error={uploadError}
          onCancel={handleCancel}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="border-2 border-dashed transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-8">
          <div
            className={cn(
              "flex flex-col items-center justify-center text-center space-y-6 transition-all duration-300",
              isDragOver && "scale-105 bg-steel-50/30 rounded-lg p-4",
              (isLoading || isUploading) && "opacity-50 pointer-events-none"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
              isDragOver 
                ? "bg-steel-100 border-2 border-steel-300" 
                : "bg-slate-100 border-2 border-slate-200"
            )}>
              {isLoading || isUploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-steel-500 border-t-transparent"></div>
              ) : (
                <Upload className={cn(
                  "h-8 w-8 transition-colors duration-300",
                  isDragOver ? "text-steel-600" : "text-slate-500"
                )} />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
              <p className="text-slate-600 max-w-md">{description}</p>
              
              {/* File format info */}
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <FileText className="h-4 w-4" />
                <span>Formatos soportados: {acceptedFormats.join(', ')}</span>
              </div>
              
              {/* File size limit info */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Info className="h-3 w-3" />
                <span>Tamaño máximo: 50MB</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Button
                variant="outline"
                className="relative hover:bg-steel-50 border-steel-200 text-steel-700"
                disabled={isLoading || isUploading}
              >
                <input
                  type="file"
                  accept={acceptedFormats.join(',')}
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isLoading || isUploading}
                />
                <Upload className="h-4 w-4 mr-2" />
                {isLoading || isUploading ? 'Procesando...' : 'Seleccionar Archivo'}
              </Button>
              
              <span className="text-slate-400 text-sm">o</span>
              
              <span className="text-sm text-slate-600 font-medium">
                Arrastra tu archivo aquí
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Preview */}
      {showFilePreview && selectedFile && !isUploading && (
        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                  <div className="flex items-center space-x-4 text-xs text-blue-700">
                    <span>{formatFileSize(selectedFile.size)}</span>
                    <span>{getFileTypeDescription(selectedFile)}</span>
                    {detectFinancialDocumentType(selectedFile.name) && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {detectFinancialDocumentType(selectedFile.name)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-blue-600">
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>Tiempo estimado: {estimateProcessingTime(selectedFile.size)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {validationError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <div className="space-y-1">
              <p className="font-medium">{validationError}</p>
              {validationSuggestion && (
                <p className="text-sm opacity-90">{validationSuggestion}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* External Errors */}
      {error && !validationError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {success}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
