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
  RefreshCw,
  AlertCircle,
  ExternalLink
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
  stats_json: {
    stage?: string;
    progress_pct?: number;
    eta_seconds?: number;
    message?: string;
    total_rows?: number;
    rows_valid?: number;
    rows_reject?: number;
    rows_loaded?: number;
    batches_total?: number;
    batches_done?: number;
    headers_map?: Record<string, string>;
    headers_raw?: string[];
    headers_norm?: string[];
    missing_fields?: string[];
    valid_ratio?: number;
    reason?: string;
    artifacts?: {
      rejects_sample?: string;
      normalized_csv?: string;
      rejects?: string;
      meta?: string;
    };
    rejects_csv_path?: string;
    error_log_path?: string;
    completed_at?: string;
    failed_at?: string;
    error?: string;
    gpt_processed?: boolean;
  };
}

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
    case 'NEEDS_MAPPING':
      return 'Requiere mapeo manual o normalización GPT';
    case 'GPT_NORMALIZE':
      return 'Normalizando con GPT...';
    case 'GPT_PROCESSING':
      return 'Procesando con inteligencia artificial...';
    default:
      return 'Procesando...';
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
  const [needsMapping, setNeedsMapping] = useState(false);
  const [manualMapping, setManualMapping] = useState<Record<string, string>>({});
  const [companyId, setCompanyId] = useState<string>('');
  
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

          // Check if processing is complete or needs mapping
          if (updatedJob.status === 'NEEDS_MAPPING') {
            setNeedsMapping(true);
            setProcessing(false);
          } else if (['DONE', 'PARTIAL_OK', 'FAILED'].includes(updatedJob.status)) {
            setProcessing(false);
            setNeedsMapping(false);
            
            if (updatedJob.status === 'DONE' || updatedJob.status === 'PARTIAL_OK') {
              const stats = updatedJob.stats_json;
              const totalInserted = stats?.rows_loaded || 0;
              toast({
                title: "¡Procesamiento completado!",
                description: `${totalInserted} asientos procesados correctamente`,
              });

              // Navegar automáticamente al dashboard de la empresa tras finalizar
              setTimeout(() => {
                if (companyId) {
                  navigate(`/app/${companyId}`);
                }
              }, 750);
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
  }, [jobId, processing, toast]);

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
    setNeedsMapping(false);

    try {
      // Create FormData for admin-upload function
      const newCompanyId = crypto.randomUUID();
      setCompanyId(newCompanyId);
      const period = `${fiscalYear}-01-01`;

      // Ensure company exists and assign memberships before upload
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          throw new Error('No hay sesión activa');
        }

        // Create or upsert company
        const { error: upsertCompanyError } = await supabase
          .from('companies')
          .upsert({
            id: newCompanyId,
            name: companyName,
            currency_code: 'EUR',
            accounting_standard: 'PGC',
            sector: null,
            created_by: currentUser.id
          }, { onConflict: 'id' });

        if (upsertCompanyError) {
          throw upsertCompanyError;
        }

        // Assign membership to current admin
        const membershipsToUpsert = [
          { company_id: newCompanyId, user_id: currentUser.id, role: 'admin' }
        ];

        const { error: membershipError } = await supabase
          .from('memberships')
          .upsert(membershipsToUpsert, { onConflict: 'company_id,user_id' });

        if (membershipError) {
          // No bloquear la subida por fallo de membresía, pero informar en consola
          console.warn('Fallo asignando membresías:', membershipError);
        }
      } catch (prepError) {
        console.error('Preparación de empresa/membresías falló:', prepError);
        // Continuar de todos modos para no bloquear la carga si la empresa ya existía
      }

      const formData = new FormData();
      formData.append('companyId', newCompanyId);
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

  const handleManualMappingSubmit = async () => {
    if (!job) return;
    
    try {
      setProcessing(true);
      setNeedsMapping(false);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch('https://hlwchpmogvwmpuvwmvwv.supabase.co/functions/v1/admin-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reprocess: true,
          jobId: job.id,
          companyId,
          period: `${fiscalYear}-01-01`,
          headerMapOverride: manualMapping
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      toast({
        title: "Reprocesando con mapeo manual",
        description: "Los datos se están procesando con tu mapeo personalizado.",
      });
    } catch (error) {
      console.error('Manual mapping submission failed:', error);
      setProcessing(false);
      setNeedsMapping(true);
      toast({
        title: "Error en mapeo manual",
        description: error instanceof Error ? error.message : 'Failed to reprocess with manual mapping',
        variant: "destructive"
      });
    }
  };

  const handleGPTNormalize = async () => {
    if (!job) return;
    
    try {
      setProcessing(true);
      setNeedsMapping(false);
      
      const response = await supabase.functions.invoke('gpt-normalize', {
        body: {
          jobId: job.id,
          companyId,
          period: `${fiscalYear}-01-01`
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      toast({
        title: "Normalizando con GPT",
        description: "La inteligencia artificial está procesando y normalizando tus datos contables.",
      });
    } catch (error) {
      console.error('GPT normalization failed:', error);
      setProcessing(false);
      setNeedsMapping(true);
      toast({
        title: "Error en normalización GPT",
        description: error instanceof Error ? error.message : 'Failed to start GPT normalization',
        variant: "destructive"
      });
    }
  };

  const handleGoToDashboard = () => {
    if (companyId) {
      navigate(`/app/${companyId}`);
    } else {
      navigate('/home');
    }
    handleClose();
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
    setNeedsMapping(false);
    setManualMapping({});
    setCompanyId('');
    onClose();
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
      case 'NEEDS_MAPPING': return 40;
      case 'LOADING': return 60;
      case 'AGGREGATING': return 95;
      case 'DONE': return 100;
      case 'FAILED': return 0;
      default: return 15;
    }
  };

  const currentProgress = getCurrentProgress();
  const isCompleted = job && job.status === 'DONE';
  const isFailed = job && job.status === 'FAILED';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Subir Libro Diario - Sistema Robusto con GPT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File upload area */}
          {!file && !processing && !needsMapping && (
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
                      <strong>Nuevo:</strong> Sistema robusto con mapeo automático inteligente y fallback GPT para normalización
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File preview and company info */}
          {file && !processing && !converting && !needsMapping && (
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
                  <Label htmlFor="fiscal-year">Año fiscal</Label>
                  <Input
                    id="fiscal-year"
                    type="number"
                    min={2000}
                    max={2050}
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div className="mt-6 flex gap-2">
                  <Button onClick={processFile} className="flex-1">
                    <Database className="h-4 w-4 mr-2" />
                    Procesar Archivo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversion loading */}
          {converting && (
            <Card>
              <CardContent className="p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Convirtiendo Excel a CSV</h3>
                <p className="text-muted-foreground">
                  Procesando archivo Excel en tu navegador...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Manual mapping interface */}
          {needsMapping && job && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-lg mb-6">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Mapeo Automático Falló</div>
                    <div className="text-sm">
                      {job.stats_json?.reason === 'poor_mapping' 
                        ? 'No se pudieron detectar las columnas requeridas automáticamente'
                        : `Solo ${Math.round((job.stats_json?.valid_ratio || 0) * 100)}% de filas válidas detectadas`
                      }
                    </div>
                  </div>
                </div>

                {job.stats_json?.headers_raw && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Mapeo Manual de Columnas</h4>
                    <div className="text-sm text-muted-foreground">
                      Selecciona qué columna de tu CSV corresponde a cada campo requerido:
                    </div>
                    
                    <div className="grid gap-3">
                      {['entry_no', 'tx_date', 'account', 'description', 'debit', 'credit', 'doc_ref'].map(field => (
                        <div key={field} className="flex items-center gap-3">
                          <div className="w-28 text-sm font-medium">
                            {field === 'entry_no' ? 'N° Asiento' :
                             field === 'tx_date' ? 'Fecha' :
                             field === 'account' ? 'Cuenta' :
                             field === 'description' ? 'Descripción' :
                             field === 'debit' ? 'Debe' :
                             field === 'credit' ? 'Haber' :
                             'Documento'}
                            {['entry_no', 'tx_date', 'account', 'debit', 'credit'].includes(field) && (
                              <span className="text-red-500">*</span>
                            )}
                          </div>
                          <select
                            value={manualMapping[field] || ''}
                            onChange={(e) => setManualMapping(prev => ({
                              ...prev,
                              [field]: e.target.value
                            }))}
                            className="flex-1 px-3 py-2 border rounded-md text-sm"
                          >
                            <option value="">Seleccionar columna...</option>
                            {job.stats_json.headers_raw.map(header => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-6">
                      <Button 
                        onClick={handleManualMappingSubmit}
                        disabled={Object.keys(manualMapping).length < 3}
                        className="flex-1"
                      >
                        Procesar con Mapeo Manual
                      </Button>
                      <Button 
                        onClick={handleGPTNormalize}
                        variant="outline"
                        className="flex-1"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Normalizar con GPT
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Processing progress */}
          {(uploading || processing) && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {uploading ? 'Subiendo archivo' : 'Procesando datos'}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      {currentProgress}%
                    </div>
                  </div>
                  
                  <Progress value={currentProgress} className="w-full" />
                  
                  <p className="text-sm text-muted-foreground">
                    {getProgressLabel(job, uploadProgress)}
                  </p>

                  {job?.stats_json && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {job.stats_json.total_rows && (
                        <div>
                          <span className="font-medium">Filas totales:</span> {job.stats_json.total_rows}
                        </div>
                      )}
                      {job.stats_json.rows_valid !== undefined && (
                        <div>
                          <span className="font-medium">Filas válidas:</span> {job.stats_json.rows_valid}
                        </div>
                      )}
                      {job.stats_json.rows_loaded !== undefined && (
                        <div>
                          <span className="font-medium">Filas insertadas:</span> {job.stats_json.rows_loaded}
                        </div>
                      )}
                      {job.stats_json.eta_seconds && job.stats_json.eta_seconds > 0 && (
                        <div>
                          <span className="font-medium">ETA:</span> {job.stats_json.eta_seconds}s
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success state */}
          {isCompleted && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 text-green-800 rounded-lg mb-4">
                  <CheckCircle className="h-5 w-5" />
                  <span>Procesamiento completado exitosamente</span>
                  {job?.stats_json?.gpt_processed && (
                    <Badge variant="secondary">Normalizado con GPT</Badge>
                  )}
                </div>
                
                {job?.stats_json && (
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div>Filas procesadas: {job.stats_json.total_rows || 0}</div>
                    <div>Filas válidas: {job.stats_json.rows_valid || 0}</div>
                    <div>Filas insertadas: {job.stats_json.rows_loaded || 0}</div>
                    {job.stats_json.completed_at && (
                      <div>Completado: {new Date(job.stats_json.completed_at).toLocaleString()}</div>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={handleClose} variant="outline">
                    Cerrar
                  </Button>
                  <Button onClick={handleGoToDashboard}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ir al Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error state */}
          {isFailed && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 rounded-lg mb-4">
                  <XCircle className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Error en el procesamiento</div>
                    <div className="text-sm">
                      {job?.stats_json?.message || 'Error desconocido'}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleClose} variant="outline">
                    Cerrar
                  </Button>
                  <Button onClick={() => setFile(null)} variant="outline">
                    Intentar de nuevo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};