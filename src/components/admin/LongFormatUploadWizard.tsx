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
      
      for (const result of uploadResults) {
        if (result.result.success) {
          await processFile({
            file: result.file || new File([], result.fileName),
            company_id: companyId || undefined,
            template_type: result.templateType,
            dry_run: false // Guardado real
          });
        }
      }
      
      toast.success('Todos los datos han sido guardados exitosamente');
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Error al guardar los datos');
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
                onClick={() => onComplete(companyId || '')} 
                className="bg-green-600 hover:bg-green-700"
              >
                Ver Dashboard de la Empresa
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
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Previsualización de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadResults.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{result.fileName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Tipo: {result.templateType} • Estado: {result.result.success ? 'Validado' : 'Error'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {result.result.success && result.result.preview_data && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditData(result)}
                        >
                          Editar Datos
                        </Button>
                      )}
                      <Button 
                        variant={result.result.success ? "default" : "destructive"}
                        size="sm"
                        disabled
                      >
                        {result.result.success ? 'Validado' : 'Con Errores'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBackToUpload}>
                Volver a Carga
              </Button>
              <Button 
                onClick={handleConfirmAndSave}
                disabled={uploadResults.filter(r => r.result.success).length === 0 || isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? 'Guardando...' : 'Confirmar y Guardar Datos'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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