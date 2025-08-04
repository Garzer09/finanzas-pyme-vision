import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, FileText, HardDrive, Clock } from 'lucide-react';
import { validateFile, createFilePreview, estimateProcessingTime, FileValidationResult } from '@/utils/fileProcessing';

interface FileValidatorProps {
  file: File | null;
  onValidationComplete?: (result: FileValidationResult) => void;
}

export const FileValidator: React.FC<FileValidatorProps> = ({ 
  file, 
  onValidationComplete 
}) => {
  if (!file) return null;

  const preview = createFilePreview(file);
  const { validation } = preview;

  // Notify parent of validation result
  React.useEffect(() => {
    if (onValidationComplete) {
      onValidationComplete(validation);
    }
  }, [validation, onValidationComplete]);

  const getValidationIcon = () => {
    if (validation.isValid) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  const getValidationColor = () => {
    return validation.isValid 
      ? 'border-green-200 bg-green-50' 
      : 'border-red-200 bg-red-50';
  };

  return (
    <Card className={`w-full transition-all duration-200 ${getValidationColor()}`}>
      <CardContent className="p-4">
        {/* Validation Header */}
        <div className="flex items-center gap-2 mb-3">
          {getValidationIcon()}
          <h3 className={`font-medium ${
            validation.isValid ? 'text-green-700' : 'text-red-700'
          }`}>
            {validation.isValid ? 'Archivo válido' : 'Error de validación'}
          </h3>
        </div>

        {/* File Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="font-medium text-slate-700">Archivo:</span>
            <span className="text-slate-600 truncate max-w-xs" title={preview.name}>
              {preview.name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <HardDrive className="h-4 w-4 text-slate-500" />
            <span className="font-medium text-slate-700">Tamaño:</span>
            <span className="text-slate-600">{preview.size}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="font-medium text-slate-700">Modificado:</span>
            <span className="text-slate-600">
              {preview.lastModified.toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Validation Result */}
        {validation.error ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {validation.error}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              El archivo cumple con todos los requisitos y está listo para procesarse.
            </AlertDescription>
          </Alert>
        )}

        {/* File Type Information */}
        <div className="mt-3 p-3 bg-white/50 rounded border">
          <div className="text-xs text-slate-600">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">Tipo detectado:</span>
              <span className="capitalize">{preview.type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Tiempo estimado:</span>
              <span>{estimateProcessingTime(preview.sizeBytes)}</span>
            </div>
          </div>
        </div>

        {/* Processing Capabilities */}
        {validation.isValid && (
          <div className="mt-3 text-xs text-slate-600">
            <div className="font-medium mb-1">Capacidades de procesamiento:</div>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Archivos hasta 50MB (óptimo rendimiento)</li>
              <li>Hasta 50,000 filas de datos</li>
              <li>Análisis automático con IA Claude</li>
              <li>Extracción de P&G, Balance, Flujos y Ratios</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};