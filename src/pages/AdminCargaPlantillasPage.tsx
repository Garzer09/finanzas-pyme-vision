import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle, Info, ArrowRight, ArrowLeft, ExternalLink, Download, Eye, Building2, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { AdminTopNavigation } from '@/components/AdminTopNavigation';
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
  detected_years?: number[];
  selected_years?: number[];
  per_year?: { [year: string]: { status: string; rows_valid: number; rows_reject: number } };
}

interface Company {
  id: string;
  name: string;
  currency_code: string;
  accounting_standard: string;
}

interface CompanyInfo {
  companyId: string;
  company_name: string;
  currency_code: string;
  accounting_standard: string;
  meta: {
    sector?: string;
    industry?: string;
    employees?: string;
    founded_year?: string;
    headquarters?: string;
    website?: string;
    description?: string;
    from_template?: boolean;
  };
}

const CANONICAL_FILES = {
  obligatorios: {
    'cuenta-pyg.csv': 'Cuenta de Pérdidas y Ganancias',
    'balance-situacion.csv': 'Balance de Situación'
  },
  opcionales: {
    'pool-deuda.csv': 'Pool de Deuda',
    'pool-deuda-vencimientos.csv': 'Vencimientos de Deuda', 
    'estado-flujos.csv': 'Estado de Flujos de Efectivo',
    'datos-operativos.csv': 'Datos Operativos',
    'supuestos-financieros.csv': 'Supuestos Financieros'
  }
};

const CSV_SCHEMAS = {
  'cuenta-pyg.csv': ['Concepto', '2022', '2023', '2024', 'Notas'],
  'balance-situacion.csv': ['Concepto', '2022', '2023', '2024', 'Notas'],
  'pool-deuda.csv': ['Entidad', 'Tipo_Financiacion', 'Importe_Inicial', 'Tipo_Interes', 'Vencimiento', 'Moneda', 'Garantias'],
  'pool-deuda-vencimientos.csv': ['Entidad', 'Tipo_Financiacion', 'Año', 'Principal', 'Intereses', 'Total'],
  'estado-flujos.csv': ['Concepto', 'Categoria', '2022', '2023', '2024'],
  'datos-operativos.csv': ['Concepto', 'Unidad', '2022', '2023', '2024'],
  'supuestos-financieros.csv': ['Categoria', 'Concepto', 'Valor', 'Unidad', 'Notas'],
  'info-empresa.csv': ['Campo', 'Valor', 'Descripción']
};

export const AdminCargaPlantillasPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<'qualitative' | 'financial'>('qualitative');
  
  // Step 1 - Qualitative data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [infoEmpresaFile, setInfoEmpresaFile] = useState<File | null>(null);
  const [isUploadingInfo, setIsUploadingInfo] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [useTemplateData, setUseTemplateData] = useState(true);

  // Step 2 - Financial data
  const [obligatoriosFiles, setObligatoriosFiles] = useState<{ [key: string]: File }>({});
  const [opcionalesFiles, setOpcionalesFiles] = useState<{ [key: string]: File }>({});
  const [fileValidations, setFileValidations] = useState<{ [key: string]: FileValidation }>({});
  const [detectedYears, setDetectedYears] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dryRun, setDryRun] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

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

    if (file.size === 0) {
      return {
        isValid: false,
        fileName: file.name,
        canonicalName: fileName,
        error: 'El archivo está vacío'
      };
    }

    if (file.size > 40 * 1024 * 1024) { // 40MB limit
      return {
        isValid: false,
        fileName: file.name,
        canonicalName: fileName,
        error: 'El archivo es demasiado grande (máximo 40MB)'
      };
    }

    return {
      isValid: true,
      fileName: file.name,
      canonicalName: fileName
    };
  }, []);

  // Step 1 handlers
  const handleInfoEmpresaUpload = async () => {
    if (!infoEmpresaFile || !user) return;

    setIsUploadingInfo(true);
    try {
      const formData = new FormData();
      formData.append('info-empresa.csv', infoEmpresaFile);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      const response = await fetch(`https://hlwchpmogvwmpuvwmvwv.supabase.co/functions/v1/admin-company-info-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error procesando archivo');
      }

      const result = await response.json();
      setCompanyInfo(result);
      
      toast({
        title: "Empresa detectada",
        description: `${result.company_name} configurada correctamente`
      });

    } catch (error) {
      console.error('Error uploading info empresa:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      });
    } finally {
      setIsUploadingInfo(false);
    }
  };

  const handleSkipToStep2 = () => {
    if (!selectedCompanyId) {
      toast({
        title: "Error",
        description: "Selecciona una empresa para continuar",
        variant: "destructive"
      });
      return;
    }

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    if (selectedCompany) {
      setCompanyInfo({
        companyId: selectedCompany.id,
        company_name: selectedCompany.name,
        currency_code: selectedCompany.currency_code,
        accounting_standard: selectedCompany.accounting_standard,
        meta: { from_template: false }
      });
      setCurrentStep('financial');
    }
  };

  // Step 2 handlers
  const handleObligatoriosDrop = useCallback((e: React.DragEvent, expectedFileName: string) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (!file) return;

    const validation = validateFile(file);
    
    if (validation.isValid && validation.canonicalName === expectedFileName) {
      setObligatoriosFiles(prev => ({ ...prev, [expectedFileName]: file }));
      setFileValidations(prev => ({ ...prev, [expectedFileName]: validation }));
      detectYearsFromFiles({ ...obligatoriosFiles, [expectedFileName]: file }, opcionalesFiles);
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
  }, [validateFile, toast, obligatoriosFiles, opcionalesFiles]);

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
    detectYearsFromFiles(obligatoriosFiles, newFiles);
  }, [opcionalesFiles, fileValidations, validateFile, toast, obligatoriosFiles]);

  const detectYearsFromFiles = async (obligFiles: { [key: string]: File }, opcFiles: { [key: string]: File }) => {
    const pygFile = obligFiles['cuenta-pyg.csv'];
    const balanceFile = obligFiles['balance-situacion.csv'];
    
    if (!pygFile || !balanceFile) return;

    try {
      const pygText = await pygFile.text();
      const balanceText = await balanceFile.text();
      
      const pygYears = extractYearsFromCsv(pygText);
      const balanceYears = extractYearsFromCsv(balanceText);
      
      // Intersection of years
      const commonYears = pygYears.filter(year => balanceYears.includes(year));
      
      setDetectedYears(commonYears);
      setSelectedYears(commonYears);
    } catch (error) {
      console.error('Error detecting years:', error);
    }
  };

  const extractYearsFromCsv = (csvText: string): number[] => {
    const lines = csvText.split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const years: number[] = [];
    
    headers.forEach(header => {
      const year = parseInt(header);
      if (!isNaN(year) && year >= 2000 && year <= 2030) {
        years.push(year);
      }
    });
    
    return years.sort();
  };

  const isStep2Ready = companyInfo && 
                      Object.keys(CANONICAL_FILES.obligatorios).every(fileName => 
                        obligatoriosFiles[fileName] && fileValidations[fileName]?.isValid
                      ) && 
                      selectedYears.length > 0;

  const handleProcessFinancialFiles = async () => {
    if (!isStep2Ready || !user || !companyInfo) return;

    setIsProcessing(true);
    setProcessingError(null);

    try {
      const formData = new FormData();
      
      // Add metadata
      formData.append('companyId', companyInfo.companyId);
      formData.append('currency_code', useTemplateData ? companyInfo.currency_code : companyInfo.currency_code);
      formData.append('accounting_standard', useTemplateData ? companyInfo.accounting_standard : companyInfo.accounting_standard);
      selectedYears.forEach(year => formData.append('selected_years[]', year.toString()));
      formData.append('dry_run', dryRun.toString());

      // Add files
      Object.entries(obligatoriosFiles).forEach(([fileName, file]) => {
        formData.append(fileName, file);
      });
      
      Object.entries(opcionalesFiles).forEach(([fileName, file]) => {
        formData.append(fileName, file);
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

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

      startStatusPolling(result.job_id);

    } catch (error) {
      console.error('Error uploading files:', error);
      setProcessingError(error instanceof Error ? error.message : 'Error desconocido');
      setIsProcessing(false);
    }
  };

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
          eta_seconds: statsJson?.eta_seconds,
          detected_years: statsJson?.detected_years,
          selected_years: statsJson?.selected_years,
          per_year: statsJson?.per_year
        };

        setProcessingStatus(status);

        if (status.status === 'DONE') {
          clearInterval(pollInterval);
          setIsProcessing(false);
          toast({
            title: "Carga completada",
            description: dryRun ? "Validación completada exitosamente" : "Los datos se han cargado exitosamente"
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

    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
  };

  const handleGoToDashboard = () => {
    if (companyInfo && selectedYears.length > 0) {
      const lastYear = Math.max(...selectedYears);
      navigate(`/admin/dashboard?companyId=${companyInfo.companyId}&period=${lastYear}`);
    }
  };

  const downloadTemplates = () => {
    // Create a simple CSV download for info-empresa.csv
    const csvContent = [
      'Campo,Valor,Descripción',
      'Nombre,,Razón social completa',
      'CIF,,Identificación fiscal',
      'Sector,,Sector principal',
      'Industria,,Industria específica',
      'Año fundación,,YYYY',
      'Empleados,,Número total',
      'Sede,,Ciudad/País',
      'Web,,URL',
      'Descripción,,Actividad de la empresa',
      'currency_code,EUR,"Código ISO de moneda (p.ej., EUR)"',
      'accounting_standard,PGC,PGC/IFRS/OTHER'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'info-empresa.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <RoleBasedAccess allowedRoles={['admin']}>
      <div className="min-h-screen bg-background">
        <AdminTopNavigation />
        <main className="p-6">
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
                  <h1 className="text-3xl font-bold text-foreground">Wizard de Carga Simplificado</h1>
                  <p className="text-muted-foreground">
                    Proceso en 2 pasos: datos cualitativos y carga financiera
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={downloadTemplates}>
                  <Download className="h-4 w-4" />
                  Descargar Plantillas
                </Button>
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Ver columnas esperadas
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Esquemas de CSV</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 max-h-96 overflow-y-auto">
                      {Object.entries(CSV_SCHEMAS).map(([fileName, columns]) => (
                        <div key={fileName} className="mb-4">
                          <h4 className="font-medium text-sm">{fileName}</h4>
                          <p className="text-xs text-muted-foreground">{columns.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="flex items-center gap-4 mb-6">
              <div className={cn("flex items-center gap-2", currentStep === 'qualitative' ? "text-primary" : "text-muted-foreground")}>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", 
                  currentStep === 'qualitative' ? "bg-primary text-primary-foreground" : 
                  companyInfo ? "bg-green-500 text-white" : "bg-muted"
                )}>
                  {companyInfo ? <CheckCircle className="h-4 w-4" /> : "1"}
                </div>
                <span className="font-medium">Datos Cualitativos</span>
              </div>
              
              <div className="flex-1 h-0.5 bg-border" />
              
              <div className={cn("flex items-center gap-2", currentStep === 'financial' ? "text-primary" : "text-muted-foreground")}>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", 
                  currentStep === 'financial' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  2
                </div>
                <span className="font-medium">Carga Financiera</span>
              </div>
            </div>

            {currentStep === 'qualitative' && (
              <div className="space-y-6">
                {/* Step 1: Qualitative Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Paso 1: Datos Cualitativos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Sube el archivo <strong>info-empresa.csv</strong>. Detectaremos la empresa y fijaremos moneda y estándar automáticamente.
                      </AlertDescription>
                    </Alert>

                    {/* Option 1: Upload info-empresa.csv */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Opción 1: Subir archivo info-empresa.csv</h3>
                      <div
                        className={cn(
                          "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
                          infoEmpresaFile ? "border-green-300 bg-green-50" : "border-border hover:border-border/80"
                        )}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = Array.from(e.dataTransfer.files);
                          const file = files.find(f => f.name.toLowerCase() === 'info-empresa.csv');
                          if (file) setInfoEmpresaFile(file);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.csv';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file && file.name.toLowerCase() === 'info-empresa.csv') {
                              setInfoEmpresaFile(file);
                            } else {
                              toast({
                                title: "Archivo incorrecto",
                                description: "Se esperaba el archivo info-empresa.csv",
                                variant: "destructive"
                              });
                            }
                          };
                          input.click();
                        }}
                      >
                        <div className="text-center space-y-2">
                          {infoEmpresaFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                              <span className="font-medium text-green-700">{infoEmpresaFile.name}</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                              <div>
                                <p className="text-sm font-medium">Arrastra info-empresa.csv aquí</p>
                                <p className="text-xs text-muted-foreground">o haz clic para seleccionar</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {infoEmpresaFile && (
                        <Button 
                          onClick={handleInfoEmpresaUpload}
                          disabled={isUploadingInfo}
                          className="w-full"
                        >
                          {isUploadingInfo ? 'Procesando...' : 'Procesar y Continuar'}
                        </Button>
                      )}
                    </div>

                    <div className="text-center text-muted-foreground">— o —</div>

                    {/* Option 2: Select existing company */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Opción 2: Seleccionar empresa existente</h3>
                      <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar empresa existente" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map(company => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedCompanyId && (
                        <Button 
                          onClick={handleSkipToStep2}
                          variant="outline"
                          className="w-full"
                        >
                          Continuar con empresa seleccionada
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Company Summary */}
                {companyInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Empresa Detectada</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Nombre</Label>
                          <p className="text-sm text-muted-foreground">{companyInfo.company_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Moneda</Label>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">{companyInfo.currency_code}</p>
                            {companyInfo.meta.from_template && (
                              <Badge variant="secondary" className="text-xs">desde plantilla</Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Estándar Contable</Label>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">{companyInfo.accounting_standard}</p>
                            {companyInfo.meta.from_template && (
                              <Badge variant="secondary" className="text-xs">desde plantilla</Badge>
                            )}
                          </div>
                        </div>
                        {companyInfo.meta.sector && (
                          <div>
                            <Label className="text-sm font-medium">Sector</Label>
                            <p className="text-sm text-muted-foreground">{companyInfo.meta.sector}</p>
                          </div>
                        )}
                      </div>

                      {companyInfo.meta.from_template && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="use_template_data"
                            checked={useTemplateData}
                            onCheckedChange={setUseTemplateData}
                          />
                          <Label htmlFor="use_template_data">Usar datos de la plantilla</Label>
                        </div>
                      )}

                      <Button 
                        onClick={() => setCurrentStep('financial')}
                        className="w-full gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Continuar con carga financiera
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 'financial' && companyInfo && (
              <div className="space-y-6">
                {/* Step 2: Financial Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Folder className="h-5 w-5" />
                      Paso 2: Carga Financiera
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Empresa: {companyInfo.company_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {companyInfo.currency_code} • {companyInfo.accounting_standard}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentStep('qualitative')}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                      </Button>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Sube <strong>P&L y Balance</strong> (obligatorios). Selecciona los años que quieres cargar. 
                        <strong> Los ratios se calculan automáticamente.</strong>
                      </AlertDescription>
                    </Alert>
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

                {/* Year Selection */}
                {detectedYears.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Años Detectados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Selecciona los años que quieres cargar (intersección de P&L y Balance):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {detectedYears.map(year => (
                            <button
                              key={year}
                              onClick={() => {
                                if (selectedYears.includes(year)) {
                                  setSelectedYears(selectedYears.filter(y => y !== year));
                                } else {
                                  setSelectedYears([...selectedYears, year]);
                                }
                              }}
                              className={cn(
                                "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                                selectedYears.includes(year)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Advanced Options */}
                <Card>
                  <CardHeader>
                    <CardTitle 
                      className="cursor-pointer flex items-center justify-between"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      Opciones Avanzadas
                      <ArrowRight className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-90")} />
                    </CardTitle>
                  </CardHeader>
                  {showAdvanced && (
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="dry_run"
                          checked={dryRun}
                          onCheckedChange={setDryRun}
                        />
                        <Label htmlFor="dry_run">Validar sin cargar (dry-run)</Label>
                      </div>
                    </CardContent>
                  )}
                </Card>

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

                          {/* Per-year progress */}
                          {processingStatus.per_year && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Progreso por año:</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(processingStatus.per_year).map(([year, info]) => (
                                  <div key={year} className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">{year}:</span>
                                    <Badge variant={info.status === 'DONE' ? 'default' : 'secondary'}>
                                      {info.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
                    onClick={handleProcessFinancialFiles}
                    disabled={!isStep2Ready || isProcessing}
                    className="flex-1 gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {dryRun ? 'Validar Archivos' : 'Procesar y Cargar'}
                  </Button>

                  {processingStatus?.status === 'DONE' && !dryRun && (
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
            )}
          </div>
        </main>
      </div>
    </RoleBasedAccess>
  );
};

export default AdminCargaPlantillasPage;