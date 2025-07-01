
import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  title: string;
  description: string;
  acceptedFormats?: string[];
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
  error?: string;
  success?: string;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  title,
  description,
  acceptedFormats = ['.xlsx', '.csv'],
  onFileUpload,
  isLoading = false,
  error,
  success,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

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
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [onFileUpload]);

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="border-2 border-dashed transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-8">
          <div
            className={cn(
              "flex flex-col items-center justify-center text-center space-y-6 transition-all duration-300",
              isDragOver && "scale-105 bg-steel-50/30 rounded-lg p-4",
              isLoading && "opacity-50 pointer-events-none"
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
              {isLoading ? (
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
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <FileText className="h-4 w-4" />
                <span>Formatos soportados: {acceptedFormats.join(', ')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Button
                variant="outline"
                className="relative hover:bg-steel-50 border-steel-200 text-steel-700"
                disabled={isLoading}
              >
                <input
                  type="file"
                  accept={acceptedFormats.join(',')}
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isLoading}
                />
                <Upload className="h-4 w-4 mr-2" />
                {isLoading ? 'Procesando...' : 'Seleccionar Archivo'}
              </Button>
              
              <span className="text-slate-400 text-sm">o</span>
              
              <span className="text-sm text-slate-600 font-medium">
                Arrastra tu archivo aquí
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

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
