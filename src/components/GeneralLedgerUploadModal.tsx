import React, { useState, useCallback, useEffect } from 'react';
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
  FileText,
  BarChart3,
  Clock,
  Database,
  Loader2,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface GeneralLedgerUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
  isAdminImpersonating?: boolean;
}

interface ProcessingJob {
  id: string;
  status: string;
  stats_json?: {
    stage?: string;
    progress_pct?: number;
    eta_seconds?: number;
    total_rows?: number;
    rows_valid?: number;
    rows_reject?: number;
    rows_loaded?: number;
    batches_total?: number;
    batches_done?: number;
    avg_batch_ms?: number;
    message?: string;
    error_log_path?: string;
    rejects_csv_path?: string;
  };
  error_log_path?: string | null;
}

const STATUS_MESSAGES = {
  UPLOADING: 'Subiendo archivo...',
  PARSING: 'Parseando datos CSV...',
  VALIDATING: 'Validando asientos contables...',
  LOADING: 'Insertando datos en base de datos...',
  AGGREGATING: 'Generando estados financieros...',
  DONE: 'Procesamiento completado exitosamente',
  PARTIAL_OK: 'Procesamiento completado con algunas advertencias',
  FAILED: 'Error en el procesamiento'
};

const getProgressLabel = (job: ProcessingJob | null, uploadProgress: number): string => {
  if (!job) {
    return uploadProgress > 0 ? `Subiendo archivo... ${uploadProgress}%` : 'Preparando...';
  }

  const stats = job.stats_json;
  const stage = stats?.stage || job.status;

  switch (stage) {
    case 'PARSING':
      return 'Parseando datos CSV...';
    case 'VALIDATING':
      return `Validando ${stats?.total_rows || 0} asientos contables...`;
    case 'LOADING':
      if (stats?.batches_total && stats?.batches_done !== undefined) {
        const eta = stats.eta_seconds ? ` (ETA: ${stats.eta_seconds}s)` : '';
        return `Insertando lote ${stats.batches_done + 1}/${stats.batches_total}...${eta}`;
      }
      return 'Insertando datos en base de datos...';
    case 'AGGREGATING':
      return 'Generando estados financieros...';
    case 'DONE':
      return 'Procesamiento completado exitosamente';
    case 'FAILED':
      return 'Error en el procesamiento';
    default:
      return STATUS_MESSAGES[stage] || 'Procesando...';
  }
};

export const GeneralLedgerUploadModal: React.FC<GeneralLedgerUploadModalProps> = ({
  isOpen,
  onClose,
  userId,
  onSuccess,
  isAdminImpersonating = false
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [converting, setConverting] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Realtime subscription for job progress
  useEffect(() => {
    if (!jobId || !processing) return;

    const channel = supabase
      .channel('job-progress')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'processing_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          const updatedJob = payload.new as ProcessingJob;
          setJob(updatedJob);

          // Check if processing is complete
          if (['DONE', 'PARTIAL_OK', 'FAILED'].includes(updatedJob.status)) {
            setProcessing(false);
            
            if (updatedJob.status === 'DONE' || updatedJob.status === 'PARTIAL_OK') {
              const stats = updatedJob.stats_json;
              const totalInserted = stats?.rows_loaded || 0;
              toast({
                title: "¡Procesamiento completado!",
                description: `${totalInserted} asientos procesados correctamente`,
              });
              onSuccess();
            } else if (updatedJob.status === 'FAILED') {
              const stats = updatedJob.stats_json;
              toast({
                title: "Error en el procesamiento",
                description: stats?.message || 'Error desconocido',
                variant: "destructive"
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, processing, toast, onSuccess]);

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
    // Validate file type
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || 
                   selectedFile.type.includes('spreadsheet');
    const isCsv = selectedFile.name.endsWith('.csv') || selectedFile.type.includes('csv');
    
    if (!isExcel && !isCsv) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Por favor, sube un archivo Excel (.xlsx, .xls) o CSV",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (40MB limit)
    const maxSize = 40 * 1024 * 1024; // 40MB
    if (selectedFile.size > maxSize) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo no puede superar los 40MB. Para archivos más grandes, use formato CSV.",
        variant: "destructive"
      });
      return;
    }

    // Convert Excel to CSV if needed
    let finalFile = selectedFile;
    if (isExcel) {
      try {
        setConverting(true);
        toast({
          title: "Convirtiendo Excel a CSV",
          description: "Procesando archivo Excel en el navegador...",
        });

        // Dynamic import to avoid loading SheetJS always
        const XLSX = await import("xlsx");
        
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ",", RS: "\n" });
        
        const csvBlob = new Blob([csv], { type: "text/csv" });
        finalFile = new File([csvBlob], selectedFile.name.replace(/\.xlsx?$/i, ".csv"), { type: "text/csv" });
        
        toast({
          title: "Conversión completada",
          description: "Archivo Excel convertido a CSV exitosamente",
        });
      } catch (error) {
        console.error('Error converting Excel to CSV:', error);
        toast({
          title: "Error de conversión",
          description: "No se pudo convertir el archivo Excel. Intenta con un archivo CSV.",
          variant: "destructive"
        });
        return;
      } finally {
        setConverting(false);
      }
    }

    setFile(finalFile);

    // Auto-extract information from filename
    const fileName = selectedFile.name.toLowerCase();
    const yearMatch = fileName.match(/20\d{2}/);
    if (yearMatch) {
      setFiscalYear(parseInt(yearMatch[0]));
    }
  };

  const processFile = async () => {
    if (!file || !companyName) {
      toast({
        title: "Datos incompletos",
        description: "Por favor, completa el nombre de la empresa antes de continuar",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setJob(null);

    try {
      // Create FormData for admin-upload function
      const companyId = crypto.randomUUID();
      const period = `${fiscalYear}-01-01`;

      const formData = new FormData();
      formData.append('companyId', companyId);
      formData.append('period', period);
      formData.append('file', file);

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      // Use XMLHttpRequest for upload progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 15); // 0-15%
          setUploadProgress(progress);
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 202) {
            const response = JSON.parse(xhr.responseText);
            setJobId(response.jobId);
            setUploading(false);
            setProcessing(true);
            setUploadProgress(15); // Start processing phase

            toast({
              title: "Archivo subido correctamente",
              description: "El procesamiento ha comenzado. Podrás ver el progreso en tiempo real.",
            });
          } else {
            const errorText = xhr.responseText;
            throw new Error(`Error ${xhr.status}: ${errorText}`);
          }
        }
      };

      xhr.open('POST', 'https://hlwchpmogvwmpuvwmvwv.supabase.co/functions/v1/admin-upload');
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.send(formData);

    } catch (error: any) {
      console.error('Error processing file:', error);
      setUploading(false);
      setProcessing(false);
      setUploadProgress(0);
      
      toast({
        title: "Error de procesamiento",
        description: error.message || 'Error procesando el archivo',
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setCompanyName('');
    setTaxId('');
    setFiscalYear(new Date().getFullYear());
    setUploading(false);
    setProcessing(false);
    setUploadProgress(0);
    setJob(null);
    setJobId(null);
    setConverting(false);
    onClose();
  };

  const handleGoToDashboard = () => {
    handleClose();
    navigate('/home');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCurrentProgress = (): number => {
    if (uploading) return uploadProgress;
    if (!job) return 0;
    
    const stats = job.stats_json;
    if (stats?.progress_pct !== undefined) {
      return Math.max(15, stats.progress_pct); // Ensure minimum 15% after upload
    }
    
    // Fallback based on stage
    switch (job.status) {
      case 'PARSING': return 20;
      case 'VALIDATING': return 35;
      case 'LOADING': return 60;
      case 'AGGREGATING': return 95;
      case 'DONE': return 100;
      case 'FAILED': return 0;
      default: return 15;
    }
  };

  const currentProgress = getCurrentProgress();
  const isCompleted = job && ['DONE', 'PARTIAL_OK'].includes(job.status);
  const isFailed = job && job.status === 'FAILED';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Subir Libro Diario - Nueva Arquitectura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File upload area */}
          {!file && !processing && (
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
                    O haz click para seleccionar el archivo Excel o CSV
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
                    Máximo 40MB • Excel se convierte automáticamente a CSV
                  </p>
                  <Alert className="mt-4">
                    <RefreshCw className="h-4 w-4" />
                    <AlertDescription>
                      Los archivos Excel se procesan en tu navegador y se convierten a CSV automáticamente para mayor velocidad
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File preview and company info */}
          {file && !processing && !converting && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-semibold">{file.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {file.type.includes('csv') ? 'CSV' : 'Excel convertido a CSV'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setFile(null)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nombre de la empresa *</Label>
                    <Input
                      id="company-name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ej: Mi Empresa S.L."
                      required
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
              </CardContent>
            </Card>
          )}

          {/* Converting status */}
          {converting && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Convirtiendo Excel a CSV en el navegador...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing status */}
          {(uploading || processing) && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Database className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-sm font-medium">
                        {getProgressLabel(job, uploadProgress)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {currentProgress}%
                    </Badge>
                  </div>
                  
                  <Progress value={currentProgress} className="w-full" />
                  
                  {job?.stats_json && (
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      {job.stats_json.total_rows && (
                        <div>
                          <span className="font-medium">Total filas:</span> {job.stats_json.total_rows}
                        </div>
                      )}
                      {job.stats_json.rows_valid && (
                        <div>
                          <span className="font-medium">Válidas:</span> {job.stats_json.rows_valid}
                        </div>
                      )}
                      {job.stats_json.rows_reject && job.stats_json.rows_reject > 0 && (
                        <div className="text-amber-600">
                          <span className="font-medium">Rechazadas:</span> {job.stats_json.rows_reject}
                        </div>
                      )}
                      {job.stats_json.rows_loaded && (
                        <div className="text-green-600">
                          <span className="font-medium">Insertadas:</span> {job.stats_json.rows_loaded}
                        </div>
                      )}
                      {job.stats_json.eta_seconds && job.stats_json.eta_seconds > 0 && (
                        <div className="col-span-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>ETA: {job.stats_json.eta_seconds}s</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {job && ['DONE', 'PARTIAL_OK', 'FAILED'].includes(job.status) && (
            <Card>
              <CardContent className="p-4">
                {isCompleted ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">¡Procesamiento exitoso!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Libro diario procesado con el sistema optimizado
                    </p>
                    
                    {job.stats_json && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Total asientos:</span> {job.stats_json.rows_loaded || 0}
                          </div>
                          <div>
                            <span className="font-medium">Filas procesadas:</span> {job.stats_json.total_rows || 0}
                          </div>
                          {job.stats_json.rows_reject && job.stats_json.rows_reject > 0 && (
                            <div className="col-span-2 text-amber-600">
                              <span className="font-medium">Advertencia:</span> {job.stats_json.rows_reject} filas rechazadas
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span className="font-semibold">Error en el procesamiento</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {job.stats_json?.message || 'Error desconocido durante el procesamiento'}
                    </p>
                    
                    {/* Error actions */}
                    {(job.stats_json?.error_log_path || job.stats_json?.rejects_csv_path) && (
                      <div className="flex gap-2 mt-2">
                        {job.stats_json.error_log_path && (
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Ver logs de error
                          </Button>
                        )}
                        {job.stats_json.rejects_csv_path && (
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Descargar rechazados
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {processing && !['DONE', 'PARTIAL_OK', 'FAILED'].includes(job?.status || '') && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>No cierres esta ventana durante el procesamiento</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={uploading || (processing && !['DONE', 'PARTIAL_OK', 'FAILED'].includes(job?.status || ''))}
            >
              {processing && !['DONE', 'PARTIAL_OK', 'FAILED'].includes(job?.status || '') ? 'Procesando...' : 'Cancelar'}
            </Button>
            
            {isCompleted && (
              <Button onClick={handleGoToDashboard} className="ml-2">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Estados Financieros
              </Button>
            )}
            
            {!file && !processing && !converting && (
              <Button disabled>
                Selecciona un archivo
              </Button>
            )}
            
            {file && !processing && !uploading && !converting && (
              <Button onClick={processFile}>
                <Upload className="h-4 w-4 mr-2" />
                Procesar archivo
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};