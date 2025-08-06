import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MultiFileUploadInterface } from './MultiFileUploadInterface';
import { EditableDataPreview } from './EditableDataPreview';
import { PreProcessingPreview } from './PreProcessingPreview';
import { AlertTriangle, Upload, Settings, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LongFormatUploadWizardProps {
  companyId?: string | null;
  onComplete: (processedCompanyId: string) => void;
  onCancel: () => void;
}

export const LongFormatUploadWizard: React.FC<LongFormatUploadWizardProps> = ({
  companyId,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'preprocessing' | 'confirmation' | 'edit'>('upload');
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [selectedResultForEdit, setSelectedResultForEdit] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleMultiFileComplete = (results: any[]) => {
    console.log('Multi-file upload completed (dry run):', results);
    setUploadResults(results);
    setPreviewData(results);
    setCurrentStep('preprocessing');
    
    const successfulUploads = results.filter(r => r.result.success);
    if (successfulUploads.length > 0) {
      toast.success(`${successfulUploads.length} archivos prevalidados exitosamente`);
    }
  };

  const handleEditData = (result: any) => {
    setSelectedResultForEdit(result);
    setCurrentStep('edit');
  };

  const handleConfirmAndSave = async () => {
    setIsProcessing(true);
    
    try {
      const { useUnifiedTemplates } = await import('@/hooks/useUnifiedTemplates');
      const { processFile } = useUnifiedTemplates();
      
      let processedCount = 0;
      
      for (const result of uploadResults) {
        if (result.result.success) {
          console.log(`Processing file for real save: ${result.fileName}`);
          const processResult = await processFile({
            file: result.file || new File([], result.fileName),
            company_id: companyId || undefined,
            template_type: result.templateType,
            dry_run: false // Guardado real
          });
          
          if (processResult.success) {
            processedCount++;
          }
        }
      }
      
      if (processedCount > 0) {
        toast.success(`${processedCount} archivos guardados exitosamente en la base de datos`);
        // Navigate to company-specific dashboard
        onComplete(companyId || '');
      } else {
        toast.error('No se pudo guardar ningún archivo');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Error al guardar los datos: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEditedData = async (modifiedData: any[]) => {
    setIsProcessing(true);
    
    try {
      // Guardar datos editados
      await handleConfirmAndSave();
    } catch (error) {
      console.error('Error saving edited data:', error);
      toast.error('Error al guardar los datos editados');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
    setUploadResults([]);
    setSelectedResultForEdit(null);
  };

  const handleBackToPreview = () => {
    setCurrentStep('preprocessing');
    setSelectedResultForEdit(null);
  };

  // Render different steps
  if (currentStep === 'edit' && selectedResultForEdit) {
    return (
      <EditableDataPreview
        originalData={selectedResultForEdit.result.preview_data || []}
        templateType={selectedResultForEdit.templateType}
        onSave={handleSaveEditedData}
        onCancel={handleBackToPreview}
        isProcessing={isProcessing}
      />
    );
  }

  if (currentStep === 'confirmation') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              ¡Datos Guardados Exitosamente!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Los datos han sido procesados y guardados correctamente en la base de datos para la empresa.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Archivos Procesados</h4>
                <p className="text-2xl font-bold text-green-600">{uploadResults.filter(r => r.result.success).length}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Estado</h4>
                <p className="text-sm text-green-600 font-medium">Completado</p>
              </div>
            </div>

            <div className="flex justify-center space-x-4 pt-4">
              <Button 
                onClick={handleConfirmAndSave}
                disabled={uploadResults.filter(r => r.result.success).length === 0 || isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? 'Guardando Datos...' : 'Guardar en Base de Datos'}
              </Button>
              <Button variant="outline" onClick={handleBackToUpload}>
                Procesar Más Archivos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'preprocessing') {
    // Convert uploadResults to files for PreProcessingPreview
    const files = uploadResults.map(result => result.file).filter(Boolean);
    
    return (
      <PreProcessingPreview
        files={files}
        onValidationComplete={(validatedData) => {
          console.log('Validation completed:', validatedData);
          // Move to confirmation step after validation
          setCurrentStep('confirmation');
        }}
        onCancel={handleBackToUpload}
      />
    );
  }

  // Default: Upload step
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Sistema Dinámico de Carga Múltiple
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Sistema avanzado con carga múltiple, validación dinámica, previsualización editable y generación automática de plantillas desde el catálogo de métricas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
      <MultiFileUploadInterface
        companyId={companyId}
        onComplete={handleMultiFileComplete}
        onCancel={onCancel}
      />
    </div>
  );
};