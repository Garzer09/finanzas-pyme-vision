import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Edit3,
  Save,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CSVFileUploader } from './CSVFileUploader';
import { DataPreviewTable } from './DataPreviewTable';
import { ProcessingConfirmation } from './ProcessingConfirmation';

interface ParsedFileData {
  fileName: string;
  canonicalName: string;
  data: Array<{ [key: string]: string | number }>;
  originalData: Array<{ [key: string]: string | number }>;
  headers: string[];
  detectedYears: number[];
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface DataPreviewWizardProps {
  companyInfo: {
    companyId: string;
    company_name: string;
    currency_code: string;
    accounting_standard: string;
  };
  onComplete: (processedData: any) => void;
  onCancel: () => void;
}

export const DataPreviewWizard: React.FC<DataPreviewWizardProps> = ({
  companyInfo,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<ParsedFileData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const steps: WizardStep[] = [
    {
      id: 'upload',
      title: 'Subir Archivos',
      description: 'Selecciona y sube los archivos CSV requeridos',
      completed: uploadedFiles.length >= 2 && uploadedFiles.every(f => f.isValid)
    },
    {
      id: 'preview',
      title: 'Revisar y Editar',
      description: 'Valida y corrige los datos antes de procesar',
      completed: uploadedFiles.length > 0 && validationErrors.length === 0
    },
    {
      id: 'confirm',
      title: 'Confirmar',
      description: 'Procesar y guardar en la base de datos',
      completed: false
    }
  ];

  const handleFilesUploaded = useCallback((files: ParsedFileData[]) => {
    setUploadedFiles(files);
    
    const totalErrors = files.reduce((acc, file) => acc + file.errors.length, 0);
    const totalWarnings = files.reduce((acc, file) => acc + file.warnings.length, 0);
    
    if (totalErrors === 0 && files.every(f => f.isValid)) {
      toast({
        title: "Archivos cargados correctamente",
        description: `${files.length} archivos listos para revisión${totalWarnings > 0 ? ` (${totalWarnings} advertencias)` : ''}`,
      });
      
      // Auto-advance to preview if all files are valid
      if (files.length >= 2) {
        setCurrentStep(1);
      }
    } else {
      toast({
        title: "Archivos cargados con errores",
        description: `${totalErrors} errores encontrados. Revisa los datos antes de continuar.`,
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDataEdited = useCallback((fileName: string, updatedData: Array<{ [key: string]: string | number }>) => {
    setUploadedFiles(prev => prev.map(file => 
      file.fileName === fileName 
        ? { ...file, data: updatedData }
        : file
    ));
  }, []);

  const handleValidationChange = useCallback((errors: string[]) => {
    setValidationErrors(errors);
  }, []);

  const handleResetFile = useCallback((fileName: string) => {
    setUploadedFiles(prev => prev.map(file => 
      file.fileName === fileName 
        ? { ...file, data: [...file.originalData] }
        : file
    ));
    
    toast({
      title: "Datos restaurados",
      description: `${fileName} ha sido restaurado a su estado original`,
    });
  }, [toast]);

  const handleProcessData = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Errores de validación",
        description: "Corrige todos los errores antes de procesar",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Process each file through the enhanced template processor
      const processedFiles = [];
      let totalRecordsProcessed = 0;
      
      for (const file of uploadedFiles) {
        // Convert data back to CSV format for processing
        const csvContent = [
          file.headers.join(','),
          ...file.data.map(row => 
            file.headers.map(header => {
              const value = row[header];
              return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : String(value || '');
            }).join(',')
          )
        ].join('\n');
        
        // Create a file blob from the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const processFile = new File([blob], file.fileName, { type: 'text/csv' });
        
        // Create FormData for the edge function
        const formData = new FormData();
        formData.append('file', processFile);
        formData.append('company_id', companyInfo.companyId);
        formData.append('template_name', file.canonicalName);
        file.detectedYears.forEach(year => 
          formData.append('selected_years[]', year.toString())
        );
        
        // Call enhanced template processor
        const { data: processingResult, error: processingError } = await supabase.functions.invoke(
          'enhanced-template-processor', 
          { 
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        if (processingError) {
          throw new Error(`Error procesando ${file.fileName}: ${processingError.message}`);
        }
        
        if (!processingResult?.success) {
          throw new Error(`Error en ${file.fileName}: ${processingResult?.error || 'Error desconocido'}`);
        }
        
        processedFiles.push({
          fileName: file.fileName,
          canonicalName: file.canonicalName,
          uploadId: processingResult.upload_id,
          recordsProcessed: file.data.length
        });
        
        totalRecordsProcessed += file.data.length;
      }
      
      // Now process the staged data to final tables using database function
      const { data: normalizationResult, error: normalizationError } = await supabase
        .rpc('normalize_financial_lines', {
          _import_id: processedFiles[0]?.uploadId, // Use first upload ID as import session
          _company_id: companyInfo.companyId
        });
      
      if (normalizationError) {
        console.warn('Normalization warning:', normalizationError);
        // Continue even with normalization warnings
      }
      
      const processedData = {
        companyInfo,
        files: processedFiles,
        totalRecords: totalRecordsProcessed,
        detectedYears: [...new Set(uploadedFiles.flatMap(f => f.detectedYears))].sort(),
        normalizationResult
      };
      
      onComplete(processedData);
      
      toast({
        title: "Datos procesados exitosamente",
        description: `${totalRecordsProcessed} registros guardados en la base de datos`,
      });
    } catch (error) {
      console.error('Error processing data:', error);
      toast({
        title: "Error al procesar",
        description: error instanceof Error ? error.message : "Hubo un problema procesando los datos",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return uploadedFiles.length >= 2 && uploadedFiles.every(f => f.isValid);
      case 1:
        return validationErrors.length === 0;
      default:
        return false;
    }
  };

  const getStepProgress = () => {
    return ((currentStep + 1) / steps.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <div>
                <CardTitle>Wizard de Carga de Datos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {companyInfo.company_name} • {companyInfo.currency_code}
                </p>
              </div>
            </div>
            <Badge variant="outline">
              Paso {currentStep + 1} de {steps.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={getStepProgress()} className="w-full" />
            <div className="flex justify-between text-sm">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`flex items-center gap-2 ${
                    index === currentStep ? 'text-primary font-medium' : 
                    index < currentStep ? 'text-muted-foreground' : 'text-muted-foreground/50'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : index === currentStep ? (
                    <div className="h-4 w-4 rounded-full border-2 border-primary" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  {step.title}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[500px]">
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {steps[0].title}
              </CardTitle>
              <p className="text-muted-foreground">{steps[0].description}</p>
            </CardHeader>
            <CardContent>
              <CSVFileUploader 
                companyInfo={companyInfo}
                onFilesUploaded={handleFilesUploaded}
                uploadedFiles={uploadedFiles}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {steps[1].title}
              </CardTitle>
              <p className="text-muted-foreground">{steps[1].description}</p>
              
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {validationErrors.length} error{validationErrors.length !== 1 ? 'es' : ''} encontrado{validationErrors.length !== 1 ? 's' : ''}. 
                    Revisa y corrige los datos resaltados.
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              <DataPreviewTable
                files={uploadedFiles}
                onDataEdited={handleDataEdited}
                onValidationChange={handleValidationChange}
                onResetFile={handleResetFile}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {steps[2].title}
              </CardTitle>
              <p className="text-muted-foreground">{steps[2].description}</p>
            </CardHeader>
            <CardContent>
              <ProcessingConfirmation
                files={uploadedFiles}
                companyInfo={companyInfo}
                onConfirm={handleProcessData}
                isProcessing={isProcessing}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            <div className="flex gap-2">
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToNext()}
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleProcessData}
                  disabled={!canProceedToNext() || isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Procesar Datos
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};