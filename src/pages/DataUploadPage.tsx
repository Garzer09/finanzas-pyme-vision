import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CompanyLayout } from '@/components/CompanyLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, Upload, FileText, AlertTriangle, Download } from 'lucide-react';
import { TemplateSelector } from '@/components/upload/TemplateSelector';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { ValidationPreview } from '@/components/upload/ValidationPreview';
import { UploadJobStatus } from '@/components/upload/UploadJobStatus';
import { useUploadJob } from '@/hooks/useUploadJob';
import { toast } from 'sonner';

type Step = 1 | 2 | 3;
type FileType = 'pyg' | 'balance' | 'cashflow';

export default function DataUploadPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedFileType, setSelectedFileType] = useState<FileType | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validateOnly, setValidateOnly] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const { createJob, isCreating } = useUploadJob();

  const handleTemplateSelect = (fileType: FileType) => {
    setSelectedFileType(fileType);
    setCurrentStep(2);
  };

  const handleFileUpload = (file: File, preview: any[]) => {
    setUploadedFile(file);
    setPreviewData(preview);
    setCurrentStep(3);
  };

  const handleStartProcessing = async () => {
    if (!companyId || !selectedFileType || !uploadedFile) {
      toast.error('Missing required information');
      return;
    }

    try {
      const newJobId = await createJob({
        companyId,
        fileType: selectedFileType,
        file: uploadedFile,
        validateOnly
      });
      
      setJobId(newJobId);
      toast.success(validateOnly ? 'Validation started' : 'Upload processing started');
    } catch (error) {
      toast.error('Failed to start processing: ' + String(error));
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedFileType(null);
    setUploadedFile(null);
    setPreviewData([]);
    setJobId(null);
    setValidateOnly(false);
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  const steps = [
    { number: 1, title: 'Seleccionar Tipo', description: 'Elige el tipo de datos financieros' },
    { number: 2, title: 'Subir Archivo', description: 'Carga tu archivo CSV o XLSX' },
    { number: 3, title: 'Procesar', description: 'Validar y cargar los datos' }
  ];

  return (
    <CompanyLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cargar Datos Financieros</h1>
            <p className="text-muted-foreground">
              Sube archivos CSV o XLSX con datos de P&G, Balance o Flujo de Efectivo
            </p>
          </div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleReset}>
              Reiniciar
            </Button>
          )}
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                      ${getStepStatus(step.number) === 'completed' 
                        ? 'bg-primary text-primary-foreground' 
                        : getStepStatus(step.number) === 'current'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {getStepStatus(step.number) === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      getStepStatus(step.number) === 'completed' || getStepStatus(step.number) === 'current'
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      flex-1 h-0.5 mx-4
                      ${getStepStatus(step.number) === 'completed' 
                        ? 'bg-primary' 
                        : 'bg-muted'
                      }
                    `} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === 1 && (
          <TemplateSelector onSelect={handleTemplateSelect} />
        )}

        {currentStep === 2 && selectedFileType && (
          <FileDropzone 
            fileType={selectedFileType}
            onFileUpload={handleFileUpload}
          />
        )}

        {currentStep === 3 && uploadedFile && previewData && !jobId && (
          <div className="space-y-6">
            {/* File Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Resumen del Archivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Tipo</div>
                    <Badge variant="secondary">
                      {selectedFileType === 'pyg' ? 'Pérdidas y Ganancias' :
                       selectedFileType === 'balance' ? 'Balance de Situación' :
                       'Flujo de Efectivo'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Archivo</div>
                    <div className="font-medium">{uploadedFile.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Filas</div>
                    <div className="font-medium">{previewData.length.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Preview */}
            <ValidationPreview 
              data={previewData} 
              fileType={selectedFileType}
            />

            {/* Processing Options */}
            <Card>
              <CardHeader>
                <CardTitle>Opciones de Procesamiento</CardTitle>
                <CardDescription>
                  Configura cómo procesar el archivo antes de continuar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="validate-only" 
                    checked={validateOnly}
                    onCheckedChange={setValidateOnly}
                  />
                  <Label htmlFor="validate-only">
                    Solo validar (no cargar datos)
                  </Label>
                </div>
                {validateOnly && (
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      En modo validación, se revisarán los datos pero no se cargarán en las tablas finales.
                      Útil para verificar la calidad antes de la carga definitiva.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Volver
              </Button>
              <Button 
                onClick={handleStartProcessing}
                disabled={isCreating}
                className="min-w-32"
              >
                {isCreating ? (
                  <>Iniciando...</>
                ) : validateOnly ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Validar
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Procesar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Job Status */}
        {jobId && (
          <UploadJobStatus 
            jobId={jobId} 
            onComplete={handleReset}
          />
        )}
      </div>
    </CompanyLayout>
  );
}