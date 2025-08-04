import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Brain, X, Play } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { ProgressTracker } from './ProgressTracker';
import { FileValidator } from './FileValidator';
import { cn } from '@/lib/utils';

interface UploadInterfaceProps {
  onUploadComplete?: (fileId: string, processedData: any) => void;
  targetUserId?: string;
  className?: string;
}

export const UploadInterface: React.FC<UploadInterfaceProps> = ({
  onUploadComplete,
  targetUserId,
  className
}) => {
  const [showValidator, setShowValidator] = useState(false);
  
  const {
    file,
    isUploading,
    isDragOver,
    progress,
    steps,
    validationResult,
    error,
    estimatedTimeRemaining,
    handleFileSelection,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    cancelUpload,
    resetState
  } = useFileUpload({
    onUploadComplete,
    targetUserId
  });

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setShowValidator(true);
      handleFileSelection(files[0]);
    }
    // Reset input to allow same file selection
    e.target.value = '';
  };

  const handleStartProcessing = () => {
    if (file && validationResult?.isValid) {
      setShowValidator(false);
      handleFileSelection(file);
    }
  };

  const handleCancel = () => {
    setShowValidator(false);
    resetState();
  };

  // Show progress tracker when uploading
  if (isUploading) {
    return (
      <div className={cn("space-y-4", className)}>
        <ProgressTracker
          fileName={file?.name || ''}
          fileSize={file?.size || 0}
          steps={steps}
          progress={progress}
          estimatedTimeRemaining={estimatedTimeRemaining}
        />
        
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={cancelUpload}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // Show validator when file is selected but not yet processing
  if (showValidator && file) {
    return (
      <div className={cn("space-y-4", className)}>
        <FileValidator
          file={file}
          onValidationComplete={(result) => {
            // Validation is automatically handled by the validator
          }}
        />
        
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleStartProcessing}
            disabled={!validationResult?.isValid}
            className="btn-steel-primary"
          >
            <Play className="h-4 w-4 mr-2" />
            Procesar archivo
          </Button>
          
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // Main upload interface
  return (
    <Card className={cn("dashboard-card bg-white", className)}>
      <CardContent className="p-8">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer",
            isDragOver
              ? "border-steel-blue bg-steel-blue-light scale-105"
              : "border-light-gray-300 hover:border-steel-blue hover:bg-steel-blue-light",
            "min-h-[300px] flex flex-col justify-center"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="flex flex-col items-center gap-6">
            {/* Icon Section */}
            <div className="flex items-center gap-4 mb-2">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                isDragOver 
                  ? "bg-steel-200 scale-110" 
                  : "bg-steel-100"
              )}>
                <FileSpreadsheet className="h-8 w-8 text-steel-blue" />
              </div>
              
              <div className="text-2xl text-steel-blue-light">→</div>
              
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                isDragOver 
                  ? "bg-steel-200 scale-110" 
                  : "bg-steel-100"
              )}>
                <Brain className="h-8 w-8 text-steel-blue" />
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-steel-blue-dark">
                {isDragOver ? '¡Suelta tu archivo aquí!' : 'Sube tu archivo financiero'}
              </h3>
              
              <p className="text-professional max-w-md mx-auto">
                {isDragOver 
                  ? 'Procesa archivos hasta 50MB con análisis IA avanzado'
                  : 'Arrastra y suelta tu archivo Excel o CSV, o haz clic para seleccionar. Claude AI analizará automáticamente P&G, Balance, Flujos y Ratios.'
                }
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Button
                className="btn-steel-primary relative"
                size="lg"
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="h-5 w-5 mr-2" />
                Seleccionar archivo
              </Button>
              
              <span className="text-sm text-steel-600">
                o arrastra tu archivo aquí
              </span>
            </div>

            {/* Format Info */}
            <div className="text-xs text-slate-500 space-y-1">
              <div>Formatos: .xlsx, .xls, .csv</div>
              <div>Tamaño máximo: 50MB | Filas: hasta 50,000</div>
            </div>
          </div>
        </div>

        {/* Enhanced Features Info */}
        <div className="mt-6 p-4 alert-info rounded-lg">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-steel-blue mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-steel-blue-dark font-medium mb-2">
                🚀 Sistema Optimizado para Máximo Rendimiento
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-steel-blue text-sm">
                <div className="space-y-1">
                  <div className="font-medium">Capacidades mejoradas:</div>
                  <ul className="space-y-0.5">
                    <li>• Archivos hasta 50MB (rendimiento óptimo)</li>
                    <li>• Procesamiento hasta 50,000 filas</li>
                    <li>• Validación en tiempo real</li>
                    <li>• Progress tracking avanzado</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <div className="font-medium">Análisis IA con Claude:</div>
                  <ul className="space-y-0.5">
                    <li>• Estados Financieros completos</li>
                    <li>• Ratios y métricas automáticas</li>
                    <li>• Validación de consistencia</li>
                    <li>• Pool financiero y proyecciones</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};