import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QualitativeTemplateUploadProps {
  targetUserId: string;
  onUploadComplete?: (companyData: any, shareholderData: any) => void;
  showContinueButton?: boolean;
  onContinue?: () => void;
}

export const QualitativeTemplateUpload: React.FC<QualitativeTemplateUploadProps> = ({
  targetUserId,
  onUploadComplete,
  showContinueButton = false,
  onContinue
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    companyData?: any;
    shareholderData?: any;
    message?: string;
  } | null>(null);

  const { toast } = useToast();

  const processCSVFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('Por favor, sube un archivo CSV válido');
    }

    setIsProcessing(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetUserId', targetUserId);

      const { data, error } = await supabase.functions.invoke('empresa-cualitativa-processor', {
        body: formData
      });

      if (error) throw error;

      if (data.success) {
        setUploadResult({
          success: true,
          companyData: data.companyData,
          shareholderData: data.shareholderData,
          message: data.message
        });

        toast({
          title: "Plantilla procesada exitosamente",
          description: data.message || "La información cualitativa ha sido cargada correctamente",
        });

        onUploadComplete?.(data.companyData, data.shareholderData);
      } else {
        throw new Error(data.error || 'Error procesando la plantilla');
      }
    } catch (error: any) {
      console.error('Error processing template:', error);
      setUploadResult({
        success: false,
        message: error.message || 'Error desconocido procesando la plantilla'
      });

      toast({
        title: "Error procesando plantilla",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    processCSVFile(file);
  }, [targetUserId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/empresa_cualitativa.csv';
    link.download = 'empresa_cualitativa.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Download Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Descargar Plantilla
          </CardTitle>
          <CardDescription>
            Descarga la plantilla CSV para completar la información cualitativa de la empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Descargar empresa_cualitativa.csv
          </Button>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Plantilla Completada
          </CardTitle>
          <CardDescription>
            Sube el archivo CSV completado con la información de la empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isProcessing ? (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-primary animate-pulse" />
                <div>
                  <p className="text-lg font-medium">Procesando plantilla...</p>
                  <p className="text-sm text-muted-foreground">
                    Analizando estructura y guardando datos
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    Arrastra tu archivo CSV aquí o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Solo archivos CSV con la estructura de la plantilla
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv';
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      handleFileSelect(target.files);
                    };
                    input.click();
                  }}
                >
                  Seleccionar archivo CSV
                </Button>
              </div>
            )}
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className="mt-6">
              {uploadResult.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">✅ Plantilla procesada correctamente</p>
                      <p className="text-sm">{uploadResult.message}</p>
                      {uploadResult.companyData && (
                        <div className="mt-3">
                          <p className="text-sm font-medium">Empresa cargada:</p>
                          <Badge variant="secondary" className="mr-1">
                            {uploadResult.companyData.company_name}
                          </Badge>
                          {uploadResult.companyData.sector && (
                            <Badge variant="outline">
                              {uploadResult.companyData.sector}
                            </Badge>
                          )}
                        </div>
                      )}
                      {uploadResult.shareholderData && uploadResult.shareholderData.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">
                            Estructura accionarial: {uploadResult.shareholderData.length} accionista(s)
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium">❌ Error procesando plantilla</p>
                    <p className="text-sm mt-1">{uploadResult.message}</p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Continue Button */}
          {showContinueButton && uploadResult?.success && (
            <div className="mt-6 text-center">
              <Button onClick={onContinue} className="w-full">
                Continuar al siguiente paso
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};