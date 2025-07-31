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
  Loader2
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
  stats_json?: any;
  error_log_path?: string | null;
}

const STATUS_MESSAGES = {
  PENDING: 'Preparando procesamiento...',
  PARSING: 'Parseando archivo Excel con SheetJS...',
  VALIDATING: 'Validando asientos contables...',
  LOADING: 'Insertando datos en base de datos...',
  AGGREGATING: 'Generando estados financieros...',
  DONE: 'Procesamiento completado exitosamente',
  PARTIAL_OK: 'Procesamiento completado con algunas advertencias',
  FAILED: 'Error en el procesamiento'
};

const STATUS_PROGRESS = {
  PENDING: 10,
  PARSING: 25,
  VALIDATING: 50,
  LOADING: 75,
  AGGREGATING: 90,
  DONE: 100,
  PARTIAL_OK: 100,
  FAILED: 0
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
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [dragOver, setDragOver] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Poll job status when processing
  useEffect(() => {
    if (!jobId || !processing) return;

    const pollJob = async () => {
      try {
        const { data, error } = await supabase
          .from('processing_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) {
          console.error('Error polling job:', error);
          return;
        }

        setJob(data);

        // Check if processing is complete
        if (['DONE', 'PARTIAL_OK', 'FAILED'].includes(data.status)) {
          setProcessing(false);
          
          if (data.status === 'DONE' || data.status === 'PARTIAL_OK') {
            const statsJson = data.stats_json as any;
            const totalInserted = statsJson?.metrics?.totalInserted || 0;
            toast({
              title: "¡Procesamiento completado!",
              description: `${totalInserted} asientos procesados correctamente`,
            });
            onSuccess();
          } else if (data.status === 'FAILED') {
            const statsJson = data.stats_json as any;
            toast({
              title: "Error en el procesamiento",
              description: statsJson?.error_message || 'Error desconocido',
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Error polling job:', error);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollJob, 2000);
    
    // Poll immediately
    pollJob();

    return () => clearInterval(interval);
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

    // Validate file size (40MB limit for new architecture)
    const maxSize = 40 * 1024 * 1024; // 40MB
    if (selectedFile.size > maxSize) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo no puede superar los 40MB. Para archivos más grandes, use formato CSV.",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);

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
    setJob(null);

    try {
      // Generate unique job ID
      const newJobId = crypto.randomUUID();
      setJobId(newJobId);

      // Create file path for Storage
      const companyId = crypto.randomUUID(); // In production, this would come from user's company
      const yearMonth = `${fiscalYear}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const fileName = `${newJobId}.xlsx`;
      const filePath = `company/${companyId}/${yearMonth}/${fileName}`;

      // Upload file to Storage
      const { error: uploadError } = await supabase.storage
        .from('gl-uploads')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }

      // Create processing job record
      const { error: jobError } = await supabase
        .from('processing_jobs')
        .insert({
          id: newJobId,
          company_id: companyId,
          user_id: userId,
          file_path: filePath,
          period: `[${fiscalYear}-01-01,${fiscalYear}-12-31]`,
          status: 'PENDING'
        });

      if (jobError) {
        throw new Error(`Error creating job: ${jobError.message}`);
      }

      setUploading(false);
      setProcessing(true);

      // Call Edge Function with file path (no base64!)
      const { data, error } = await supabase.functions.invoke('intelligent-ledger-processor', {
        body: {
          jobId: newJobId,
          filePath,
          companyId,
          userId,
          period: `${fiscalYear}-12-31`,
          fiscalYear,
          companyName,
          taxId
        }
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (data.status !== 'accepted') {
        throw new Error('Processing not accepted by server');
      }

      toast({
        title: "Archivo subido correctamente",
        description: "El procesamiento ha comenzado. Podrás ver el progreso en tiempo real.",
      });

    } catch (error: any) {
      console.error('Error processing file:', error);
      setUploading(false);
      setProcessing(false);
      
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
    setJob(null);
    setJobId(null);
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

  const currentProgress = job ? STATUS_PROGRESS[job.status] : 0;
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
                    Máximo 40MB • Formatos: Excel (.xlsx, .xls) o CSV
                  </p>
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Para archivos mayores a 40MB, por favor usa formato CSV
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File preview and company info */}
          {file && !processing && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-semibold">{file.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
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

          {/* Processing status */}
          {(uploading || processing) && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {uploading && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Subiendo archivo a Storage...</span>
                    </div>
                  )}
                  
                  {processing && job && (
                    <>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {STATUS_MESSAGES[job.status]}
                        </span>
                        {!['DONE', 'PARTIAL_OK', 'FAILED'].includes(job.status) && (
                          <Clock className="h-4 w-4 animate-pulse text-muted-foreground" />
                        )}
                      </div>
                      
                      <Progress value={currentProgress} className="w-full" />
                      
                      {job.stats_json && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          {(() => {
                            const stats = job.stats_json as any;
                            const metrics = stats?.metrics;
                            if (!metrics) return null;
                            
                            return (
                              <>
                                <div>Filas procesadas: {metrics.validRows} / {metrics.totalRows}</div>
                                {metrics.rejectedRows > 0 && (
                                  <div className="text-amber-600">
                                    Filas rechazadas: {metrics.rejectedRows}
                                  </div>
                                )}
                                {metrics.totalInserted !== undefined && (
                                  <div className="text-green-600">
                                    Asientos insertados: {metrics.totalInserted}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </>
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
                      Libro diario procesado con la nueva arquitectura robusta
                    </p>
                    
                    {(() => {
                      const stats = job.stats_json as any;
                      const metrics = stats?.metrics;
                      if (!metrics) return null;
                      
                      return (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Total asientos:</span> {metrics.totalInserted || 0}
                            </div>
                            <div>
                              <span className="font-medium">Balance cuadra:</span> {metrics.entriesBalance ? '✅ Sí' : '❌ No'}
                            </div>
                          </div>
                          
                          {metrics.rejectedRows > 0 && (
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                {metrics.rejectedRows} filas fueron rechazadas por errores de validación
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      );
                    })()}
                    
                    <div className="pt-3">
                      <Button 
                        onClick={handleGoToDashboard}
                        className="w-full"
                        size="sm"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Ver Estados Financieros
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span className="font-semibold">Error de procesamiento</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(() => {
                        const stats = job.stats_json as any;
                        return stats?.error_message || 'Error desconocido';
                      })()}
                    </p>
                    {job.error_log_path && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          Log de errores disponible en: {job.error_log_path}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {isCompleted ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!processing && !isCompleted && !isFailed && (
            <Button 
              onClick={processFile} 
              disabled={!file || uploading || !companyName}
            >
              {uploading ? 'Subiendo...' : 'Procesar con Nueva Arquitectura'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};