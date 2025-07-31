import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle, Info, ArrowRight, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileValidation {
  isValid: boolean;
  fileName: string;
  canonicalName: string;
  error?: string;
}

interface ProcessingStatus {
  job_id: string;
  status: 'PARSING' | 'VALIDATING' | 'LOADING' | 'AGGREGATING' | 'DONE' | 'FAILED';
  progress_pct: number;
  message: string;
  eta_seconds?: number;
}

interface Company {
  id: string;
  name: string;
  currency_code: string;
  accounting_standard: string;
}

const CANONICAL_FILES = {
  // Obligatorios
  obligatorios: {
    'cuenta-pyg.csv': 'Cuenta de Pérdidas y Ganancias',
    'balance-situacion.csv': 'Balance de Situación'
  },
  // Opcionales
  opcionales: {
    'pool-deuda.csv': 'Pool de Deuda',
    'pool-deuda-vencimientos.csv': 'Vencimientos de Deuda',
    'estado-flujos.csv': 'Estado de Flujos de Efectivo',
    'datos-operativos.csv': 'Datos Operativos',
    'supuestos-financieros.csv': 'Supuestos Financieros',
    'info-empresa.csv': 'Información de Empresa'
  }
};

export const AdminCargaPlantillasPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId');

  // Form state
  const [metadata, setMetadata] = useState({
    company_id: companyId || '',
    period_type: 'annual' as 'annual' | 'quarterly' | 'monthly',
    period_year: new Date().getFullYear(),
    period_quarter: null as number | null,
    period_month: null as number | null,
    currency_code: 'EUR',
    accounting_standard: 'PGC',
    import_mode: 'REPLACE' as 'REPLACE' | 'MERGE',
    dry_run: false
  });

  // Company data
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  // File state
  const [obligatoriosFiles, setObligatoriosFiles] = useState<{ [key: string]: File }>({});
  const [opcionalesFiles, setOpcionalesFiles] = useState<{ [key: string]: File }>({});
  const [fileValidations, setFileValidations] = useState<{ [key: string]: FileValidation }>({});

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
    if (companyId) {
      loadCompanyData(companyId);
    }
  }, [companyId]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, currency_code, accounting_standard')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadCompanyData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, currency_code, accounting_standard')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setCompany(data);
      setMetadata(prev => ({
        ...prev,
        company_id: id,
        currency_code: data.currency_code,
        accounting_standard: data.accounting_standard
      }));
    } catch (error) {
      console.error('Error loading company:', error);
    }
  };

  // Validate file name and content
  const validateFile = useCallback((file: File): FileValidation => {
    const fileName = file.name.toLowerCase();
    const allCanonicalNames = { ...CANONICAL_FILES.obligatorios, ...CANONICAL_FILES.opcionales };
    
    if (!allCanonicalNames[fileName]) {
      return {
        isValid: false,
        fileName: file.name,
        canonicalName: fileName,
        error: `Nombre de archivo no reconocido. Renómbralo a uno de los nombres esperados.`
      };
    }

    // Basic file validation
    if (file.size === 0) {
      return {
        isValid: false,
        fileName: file.name,
        canonicalName: fileName,
        error: 'El archivo está vacío'
      };
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB
      return {
        isValid: false,
        fileName: file.name,
        canonicalName: fileName,
        error: 'El archivo es demasiado grande (máximo 20MB)'
      };
    }

    return {
      isValid: true,
      fileName: file.name,
      canonicalName: fileName
    };
  }, []);

  // Handle file drops for obligatorios
  const handleObligatoriosDrop = useCallback((e: React.DragEvent, expectedFileName: string) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (!file) return;

    const validation = validateFile(file);
    
    if (validation.isValid && validation.canonicalName === expectedFileName) {
      setObligatoriosFiles(prev => ({ ...prev, [expectedFileName]: file }));
      setFileValidations(prev => ({ ...prev, [expectedFileName]: validation }));
    } else {
      setFileValidations(prev => ({ 
        ...prev, 
        [expectedFileName]: {
          ...validation,
          error: validation.error || `Se esperaba el archivo ${expectedFileName}`
        }
      }));
      toast({
        title: "Archivo incorrecto",
        description: `Se esperaba ${expectedFileName}`,
        variant: "destructive"
      });
    }
  }, [validateFile, toast]);

  // Handle file selection for opcionales
  const handleOpcionalesFiles = useCallback((files: FileList) => {
    const newFiles = { ...opcionalesFiles };
    const newValidations = { ...fileValidations };

    Array.from(files).forEach(file => {
      const validation = validateFile(file);
      
      if (validation.isValid) {
        newFiles[validation.canonicalName] = file;
        newValidations[validation.canonicalName] = validation;
      } else {
        newValidations[file.name] = validation;
        toast({
          title: "Archivo no válido",
          description: validation.error,
          variant: "destructive"
        });
      }
    });

    setOpcionalesFiles(newFiles);
    setFileValidations(newValidations);
  }, [opcionalesFiles, fileValidations, validateFile, toast]);

  // Check if form is ready to submit
  const isFormReady = metadata.company_id && 
                     metadata.period_year && 
                     Object.keys(CANONICAL_FILES.obligatorios).every(fileName => 
                       obligatoriosFiles[fileName] && fileValidations[fileName]?.isValid
                     );

  // Process files
  const handleProcessFiles = async () => {
    if (!isFormReady || !user) return;

    setIsProcessing(true);
    setProcessingError(null);

    try {
      const formData = new FormData();
      
      // Add metadata
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Add files
      Object.entries(obligatoriosFiles).forEach(([fileName, file]) => {
        formData.append(fileName, file);
      });
      
      Object.entries(opcionalesFiles).forEach(([fileName, file]) => {
        formData.append(fileName, file);
      });

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      // Submit to edge function
      const response = await fetch(`https://hlwchpmogvwmpuvwmvwv.supabase.co/functions/v1/admin-pack-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en el procesamiento');
      }

      const result = await response.json();
      console.log('Upload iniciado:', result);

      // Start polling for status
      startStatusPolling(result.job_id);

    } catch (error) {
      console.error('Error uploading files:', error);
      setProcessingError(error instanceof Error ? error.message : 'Error desconocido');
      setIsProcessing(false);
    }
  };

  // Poll processing status
  const startStatusPolling = (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('processing_jobs')
          .select('status, stats_json')
          .eq('id', jobId)
          .single();

        if (error) throw error;

        const statsJson = data.stats_json as any;
        const status: ProcessingStatus = {
          job_id: jobId,
          status: data.status as ProcessingStatus['status'],
          progress_pct: statsJson?.progress_pct || 0,
          message: statsJson?.message || '',
          eta_seconds: statsJson?.eta_seconds
        };

        setProcessingStatus(status);

        if (status.status === 'DONE') {
          clearInterval(pollInterval);
          setIsProcessing(false);
          toast({
            title: "Carga completada",
            description: metadata.dry_run ? "Validación completada exitosamente" : "Los datos se han cargado exitosamente"
          });
        } else if (status.status === 'FAILED') {
          clearInterval(pollInterval);
          setIsProcessing(false);
          setProcessingError(status.message);
        }
      } catch (error) {
        console.error('Error polling status:', error);
        clearInterval(pollInterval);
        setIsProcessing(false);
        setProcessingError('Error obteniendo estado del procesamiento');
      }
    }, 2000);

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
  };

  // Navigate to dashboard
  const handleGoToDashboard = () => {
    if (metadata.company_id) {
      navigate(`/admin/dashboard?companyId=${metadata.company_id}&period=${metadata.period_year}`);
    }
  };

  return (
    <RoleBasedAccess allowedRoles={['admin']}>
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/admin/empresas')}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Empresas
                  </Button>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">Carga de Plantillas CSV</h1>
                    <p className="text-muted-foreground">
                      {company ? `${company.name} - Sistema robusto para cargar datos financieros` : 'Sistema robusto para cargar datos financieros desde archivos CSV normalizados'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Descargar Plantillas
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Asistente GPT
                  </Button>
                </div>
              </div>

              {/* Important notice */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Los ratios se calculan automáticamente</strong> desde los datos de P&L, Balance y Deuda. 
                  No necesitas subir un archivo de ratios financieros.
                </AlertDescription>
              </Alert>

              {/* Metadata Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Metadatos del Período</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_id">Empresa *</Label>
                      <Select 
                        value={metadata.company_id}
                        onValueChange={(value) => {
                          setMetadata(prev => ({ ...prev, company_id: value }));
                          loadCompanyData(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map(comp => (
                            <SelectItem key={comp.id} value={comp.id}>
                              {comp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="period_type">Tipo de Período *</Label>
                      <Select 
                        value={metadata.period_type}
                        onValueChange={(value: 'annual' | 'quarterly' | 'monthly') => 
                          setMetadata(prev => ({ 
                            ...prev, 
                            period_type: value,
                            period_quarter: value === 'quarterly' ? 1 : null,
                            period_month: value === 'monthly' ? 1 : null
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="annual">Anual</SelectItem>
                          <SelectItem value="quarterly">Trimestral</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="period_year">Año *</Label>
                      <Input
                        id="period_year"
                        type="number"
                        min="2000"
                        max="2030"
                        value={metadata.period_year}
                        onChange={(e) => setMetadata(prev => ({ ...prev, period_year: parseInt(e.target.value) || new Date().getFullYear() }))}
                      />
                    </div>

                    {metadata.period_type === 'quarterly' && (
                      <div className="space-y-2">
                        <Label htmlFor="period_quarter">Trimestre *</Label>
                        <Select 
                          value={metadata.period_quarter?.toString() || ''}
                          onValueChange={(value) => setMetadata(prev => ({ ...prev, period_quarter: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar trimestre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">T1 (Ene-Mar)</SelectItem>
                            <SelectItem value="2">T2 (Abr-Jun)</SelectItem>
                            <SelectItem value="3">T3 (Jul-Sep)</SelectItem>
                            <SelectItem value="4">T4 (Oct-Dic)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {metadata.period_type === 'monthly' && (
                      <div className="space-y-2">
                        <Label htmlFor="period_month">Mes *</Label>
                        <Select 
                          value={metadata.period_month?.toString() || ''}
                          onValueChange={(value) => setMetadata(prev => ({ ...prev, period_month: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar mes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Enero</SelectItem>
                            <SelectItem value="2">Febrero</SelectItem>
                            <SelectItem value="3">Marzo</SelectItem>
                            <SelectItem value="4">Abril</SelectItem>
                            <SelectItem value="5">Mayo</SelectItem>
                            <SelectItem value="6">Junio</SelectItem>
                            <SelectItem value="7">Julio</SelectItem>
                            <SelectItem value="8">Agosto</SelectItem>
                            <SelectItem value="9">Septiembre</SelectItem>
                            <SelectItem value="10">Octubre</SelectItem>
                            <SelectItem value="11">Noviembre</SelectItem>
                            <SelectItem value="12">Diciembre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="currency_code">Moneda</Label>
                      <Select 
                        value={metadata.currency_code}
                        onValueChange={(value) => setMetadata(prev => ({ ...prev, currency_code: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="USD">USD - Dólar</SelectItem>
                          <SelectItem value="GBP">GBP - Libra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accounting_standard">Estándar Contable</Label>
                      <Select 
                        value={metadata.accounting_standard}
                        onValueChange={(value) => setMetadata(prev => ({ ...prev, accounting_standard: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PGC">PGC - Plan General Contable</SelectItem>
                          <SelectItem value="IFRS">IFRS - Normas Internacionales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="import_mode">Modo de Importación</Label>
                      <Select 
                        value={metadata.import_mode}
                        onValueChange={(value: 'REPLACE' | 'MERGE') => setMetadata(prev => ({ ...prev, import_mode: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REPLACE">REPLACE - Sustituir datos existentes</SelectItem>
                          <SelectItem value="MERGE">MERGE - Combinar con datos existentes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="dry_run"
                        checked={metadata.dry_run}
                        onCheckedChange={(checked) => setMetadata(prev => ({ ...prev, dry_run: checked }))}
                      />
                      <Label htmlFor="dry_run">Validar sin cargar (dry-run)</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Obligatorios */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Archivos Obligatorios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(CANONICAL_FILES.obligatorios).map(([fileName, description]) => (
                      <div key={fileName} className="space-y-2">
                        <Label className="text-sm font-medium">{description}</Label>
                        <div
                          className={cn(
                            "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
                            fileValidations[fileName]?.isValid
                              ? "border-green-300 bg-green-50"
                              : "border-border hover:border-border/80"
                          )}
                          onDrop={(e) => handleObligatoriosDrop(e, fileName)}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.csv';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                handleObligatoriosDrop({
                                  preventDefault: () => {},
                                  dataTransfer: { files: [file] }
                                } as any, fileName);
                              }
                            };
                            input.click();
                          }}
                        >
                          <div className="flex items-center justify-center gap-2 text-sm">
                            {fileValidations[fileName]?.isValid ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-700 font-medium">{fileName}</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Arrastra o haz clic para subir <strong>{fileName}</strong>
                                </span>
                              </>
                            )}
                          </div>
                          {fileValidations[fileName]?.error && (
                            <div className="mt-2 text-xs text-red-600">
                              {fileValidations[fileName].error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Opcionales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Archivos Opcionales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-6 transition-colors cursor-pointer hover:border-border/80"
                        onDrop={(e) => {
                          e.preventDefault();
                          handleOpcionalesFiles(e.dataTransfer.files);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.csv';
                          input.multiple = true;
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) handleOpcionalesFiles(files);
                          };
                          input.click();
                        }}
                      >
                        <div className="text-center space-y-2">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                          <div>
                            <p className="text-sm font-medium">Arrastra archivos opcionales aquí</p>
                            <p className="text-xs text-muted-foreground">o haz clic para seleccionar</p>
                          </div>
                        </div>
                      </div>

                      {/* Show uploaded optional files */}
                      {Object.keys(opcionalesFiles).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Archivos opcionales cargados:</h4>
                          {Object.entries(opcionalesFiles).map(([fileName, file]) => (
                            <div key={fileName} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{fileName}</span>
                              <span className="text-muted-foreground">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Processing Status */}
              {(isProcessing || processingStatus) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Estado del Procesamiento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {processingStatus && (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progreso:</span>
                            <span>{processingStatus.progress_pct}%</span>
                          </div>
                          <Progress value={processingStatus.progress_pct} />
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              processingStatus.status === 'DONE' ? "bg-green-500" :
                              processingStatus.status === 'FAILED' ? "bg-red-500" : "bg-blue-500 animate-pulse"
                            )} />
                            <span className="text-sm font-medium">Estado: {processingStatus.status}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{processingStatus.message}</p>
                          
                          {processingStatus.eta_seconds && processingStatus.status !== 'DONE' && (
                            <p className="text-xs text-muted-foreground">
                              ETA: {Math.round(processingStatus.eta_seconds / 60)} min
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Error Display */}
              {processingError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error en el procesamiento:</strong> {processingError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={handleProcessFiles}
                  disabled={!isFormReady || isProcessing}
                  className="flex-1 gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {metadata.dry_run ? 'Validar Archivos' : 'Procesar y Cargar'}
                </Button>

                {processingStatus?.status === 'DONE' && !metadata.dry_run && (
                  <Button 
                    onClick={handleGoToDashboard}
                    variant="outline"
                    className="gap-2"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Ir al Dashboard
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleBasedAccess>
  );
};

export default AdminCargaPlantillasPage;