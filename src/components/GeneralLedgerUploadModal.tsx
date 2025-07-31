import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Calendar,
  Building2,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeneralLedgerUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

interface FilePreview {
  name: string;
  size: number;
  type: string;
  rows: number;
  columns: string[];
}

interface AnalysisResult {
  success: boolean;
  error?: string;
  message: string;
  data?: any;
  dataQuality?: number;
  warnings?: any[];
  errors?: any[];
  suggestions?: string[];
}

export const GeneralLedgerUploadModal: React.FC<GeneralLedgerUploadModalProps> = ({
  isOpen,
  onClose,
  userId,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelection(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = async (selectedFile: File) => {
    // Validar tipo de archivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Por favor, sube un archivo Excel (.xlsx, .xls) o CSV",
        variant: "destructive"
      });
      return;
    }

    // Validar tamaño (máximo 100MB)
    if (selectedFile.size > 100 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo no puede superar los 100MB",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    
    // Generar vista previa simple
    setPreview({
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      rows: 0, // Se calculará después
      columns: ['Fecha', 'Cuenta', 'Debe', 'Haber'] // Columnas esperadas
    });

    // Auto-extraer información del nombre del archivo
    const fileName = selectedFile.name.toLowerCase();
    const yearMatch = fileName.match(/20\d{2}/);
    if (yearMatch) {
      setFiscalYear(parseInt(yearMatch[0]));
    }
  };

  const processFile = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Convertir archivo a base64
      const fileContent = await fileToBase64(file);

      // Llamar a la nueva edge function
      const { data, error } = await supabase.functions.invoke('claude-ledger-analyzer', {
        body: {
          userId,
          fileName: file.name,
          fileContent
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setResult(data);

      if (data.success) {
        toast({
          title: "¡Éxito!",
          description: `Libro diario procesado correctamente. Calidad: ${data.dataQuality}%`,
        });
        
        // Esperar un momento para mostrar el resultado y luego cerrar
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }

    } catch (error: any) {
      console.error('Error processing file:', error);
      setResult({
        success: false,
        error: 'PROCESSING_ERROR',
        message: error.message || 'Error procesando el archivo'
      });
      
      toast({
        title: "Error de procesamiento",
        description: error.message || 'Error procesando el archivo',
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remover el prefijo data:...;base64,
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setCompanyName('');
    setTaxId('');
    setFiscalYear(new Date().getFullYear());
    setProcessing(false);
    setProgress(0);
    setResult(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Subir Libro Diario
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Zona de carga de archivos */}
          {!file && (
            <Card 
              className={`border-2 border-dashed transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <CardContent className="p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Arrastra tu libro diario aquí</h3>
                  <p className="text-muted-foreground">
                    O haz click para seleccionar el archivo Excel
                  </p>
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => document.getElementById('file-input')?.click()}>
                      Seleccionar archivo
                    </Button>
                    <input
                      id="file-input"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Máximo 100MB • Formatos: Excel (.xlsx, .xls) o CSV
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vista previa del archivo */}
          {file && preview && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-semibold">{preview.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(preview.size)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nombre de la empresa</Label>
                    <Input
                      id="company-name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ej: Mi Empresa S.L."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-id">NIF/CIF</Label>
                    <Input
                      id="tax-id"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="Ej: B12345678"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="fiscal-year">Ejercicio fiscal</Label>
                  <Input
                    id="fiscal-year"
                    type="number"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                    min="2000"
                    max="2030"
                  />
                </div>

                <div className="mt-4">
                  <h5 className="text-sm font-medium mb-2">Columnas esperadas:</h5>
                  <div className="flex gap-2 flex-wrap">
                    {preview.columns.map((col, idx) => (
                      <Badge key={idx} variant="outline">{col}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Barra de progreso */}
          {processing && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm font-medium">Analizando libro diario...</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    Claude está procesando y validando los datos contables
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultados */}
          {result && (
            <Card>
              <CardContent className="p-4">
                {result.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">¡Procesamiento exitoso!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.dataQuality && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Calidad de datos:</span>
                        <Badge variant={result.dataQuality >= 80 ? "default" : "secondary"}>
                          {result.dataQuality}%
                        </Badge>
                      </div>
                    )}
                    {result.warnings && result.warnings.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {result.warnings.length} advertencias detectadas
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span className="font-semibold">Error de procesamiento</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.errors && result.errors.length > 0 && (
                      <div className="space-y-2">
                        <h6 className="text-sm font-semibold">Errores detectados:</h6>
                        {result.errors.map((error, idx) => (
                          <Alert key={idx} variant="destructive">
                            <AlertDescription>{error.message}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
        <Button 
          onClick={processFile} 
          disabled={!file || processing || (result?.success === true)}
        >
          {processing ? 'Procesando...' : 'Analizar Libro Diario'}
        </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};