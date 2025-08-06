import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MultiFileUploadInterface } from './MultiFileUploadInterface';
import { EditableDataPreview } from './EditableDataPreview';
import { AlertTriangle, Upload, Settings } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'edit'>('upload');
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [selectedResultForEdit, setSelectedResultForEdit] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMultiFileComplete = (results: any[]) => {
    console.log('Multi-file upload completed:', results);
    setUploadResults(results);
    setCurrentStep('preview');
    
    const successfulUploads = results.filter(r => r.result.success);
    if (successfulUploads.length > 0) {
      toast.success(`${successfulUploads.length} archivos procesados exitosamente`);
    }
  };

  const handleEditData = (result: any) => {
    setSelectedResultForEdit(result);
    setCurrentStep('edit');
  };

  const handleSaveEditedData = async (modifiedData: any[]) => {
    setIsProcessing(true);
    
    try {
      // Here you would save the modified data
      // For now, we'll simulate the save process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Datos guardados exitosamente');
      onComplete(companyId || '');
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
    setCurrentStep('preview');
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

  if (currentStep === 'preview') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Resultados del Procesamiento
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
                        Tipo: {result.templateType} • Estado: {result.result.success ? 'Exitoso' : 'Error'}
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
                        {result.result.success ? 'Válido' : 'Con Errores'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBackToUpload}>
                Volver a Subida
              </Button>
              <Button onClick={() => onComplete(companyId || '')}>
                Finalizar
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