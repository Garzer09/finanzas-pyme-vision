import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestSession {
  id?: string;
  fileName: string;
  uploadStatus: 'idle' | 'uploading' | 'completed' | 'error';
  processingStatus: 'idle' | 'processing' | 'completed' | 'error';
  analysisStatus: 'idle' | 'processing' | 'completed' | 'error';
  edaStatus?: 'idle' | 'processing' | 'completed' | 'error';
  detectedSheets?: string[];
  detectedFields?: Record<string, string[]>;
  analysisResults?: any;
  edaResults?: any;
  uploadedAt?: string;
  documentTypes?: string[];
  files?: File[];
  fileSize?: number;
}

interface TestDataUploaderProps {
  onSessionChange?: (session: TestSession | null) => void;
  currentSession?: TestSession | null;
  onContinue?: () => void;
}

export const TestDataUploader = ({ onSessionChange, currentSession, onContinue }: TestDataUploaderProps) => {
  const [testSession, setTestSession] = useState<TestSession | null>(currentSession || null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [edaProgress, setEdaProgress] = useState(0);
  const [sessionName, setSessionName] = useState('');
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const documentTypes = [
    { id: 'balance', label: 'Balance de Situación' },
    { id: 'pyg', label: 'Estado de Pérdidas y Ganancias' },
    { id: 'cash_flow', label: 'Estado de Flujo de Caja' },
    { id: 'libro_diario', label: 'Libro Diario' },
    { id: 'libro_mayor', label: 'Libro Mayor' },
    { id: 'ratios', label: 'Ratios Financieros' },
    { id: 'notas', label: 'Notas a los Estados Financieros' }
  ];

  const getOverallStatus = (session: TestSession) => {
    if (session.analysisStatus === 'error' || session.edaStatus === 'error') return 'error';
    if (session.analysisStatus === 'completed' && session.edaStatus === 'completed') return 'completed';
    if (session.edaStatus === 'processing') return 'eda';
    if (session.analysisStatus === 'processing') return 'analyzing';
    if (session.processingStatus === 'processing') return 'processing';
    if (session.uploadStatus === 'uploading') return 'uploading';
    return 'idle';
  };

  const handleFileUpload = async (files: File[]) => {
    const validFiles = files.filter(file => file.name.match(/\.(xlsx|xls)$/i));
    
    if (validFiles.length === 0) {
      toast.error('Por favor selecciona archivos Excel (.xlsx o .xls)');
      return;
    }

    if (selectedDocumentTypes.length === 0) {
      toast.error('Por favor selecciona al menos un tipo de documento');
      return;
    }

    const fileName = validFiles.length === 1 
      ? validFiles[0].name 
      : `${validFiles.length} archivos: ${validFiles.map(f => f.name).join(', ')}`;

    const newSession: TestSession = {
      fileName,
      uploadStatus: 'uploading',
      processingStatus: 'idle',
      analysisStatus: 'idle',
      edaStatus: 'idle',
      uploadedAt: new Date().toISOString(),
      documentTypes: selectedDocumentTypes,
      files: validFiles,
      fileSize: validFiles.reduce((total, file) => total + file.size, 0)
    };

    setTestSession(newSession);
    setUploadProgress(0);

    try {
      setUploadProgress(25);
      
      // Procesar archivo con process-excel edge function
      const file = validFiles[0]; // Por ahora procesamos el primer archivo
      const base64Content = await fileToBase64(file);
      
      setUploadProgress(50);
      
      console.log('Calling process-excel function...');
      const { data: processedData, error: processError } = await supabase.functions.invoke('process-excel', {
        body: { 
          fileName: file.name,
          fileContent: base64Content,
          documentTypes: selectedDocumentTypes
        }
      });

      if (processError) {
        console.error('Process Excel error:', processError);
        throw processError;
      }

      console.log('Process Excel response:', processedData);
      setUploadProgress(75);

      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Crear sesión en test_sessions table
      const { data: dbSession, error: dbError } = await supabase
        .from('test_sessions')
        .insert({
          user_id: user.id,
          session_name: sessionName || `Sesión ${new Date().toLocaleDateString()}`,
          file_name: file.name,
          file_size: file.size,
          upload_status: 'completed',
          processing_status: 'completed',
          analysis_status: 'pending',
          eda_status: 'pending',
          detected_sheets: processedData?.detectedSheets || [],
          detected_fields: processedData?.detectedFields || {}
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      const updatedSession: TestSession = {
        ...newSession,
        id: dbSession.id,
        uploadStatus: 'completed',
        processingStatus: 'completed',
        detectedSheets: processedData?.detectedSheets || [],
        detectedFields: processedData?.detectedFields || {}
      };

      setTestSession(updatedSession);
      setUploadProgress(100);

      // Iniciar EDA real
      await runEdaAnalysis(updatedSession, processedData);

    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error procesando el archivo: ' + (error as Error).message);
      setTestSession({
        ...newSession,
        uploadStatus: 'error',
        processingStatus: 'error'
      });
    }
  };

  const runEdaAnalysis = async (session: TestSession, fileData: any) => {
    try {
      setEdaProgress(0);
      
      const updatedSession = {
        ...session,
        edaStatus: 'processing' as const
      };
      setTestSession(updatedSession);

      setEdaProgress(25);

      console.log('Calling claude-eda-analyzer function...');
      const { data: edaResults, error: edaError } = await supabase.functions.invoke('claude-eda-analyzer', {
        body: { 
          sessionId: session.id,
          fileData: fileData,
          documentTypes: session.documentTypes
        }
      });

      if (edaError) {
        console.error('EDA Analysis error:', edaError);
        throw edaError;
      }

      console.log('EDA Analysis response:', edaResults);
      setEdaProgress(75);

      // Actualizar sesión en DB con resultados EDA
      if (session.id) {
        const { error: updateError } = await supabase
          .from('test_sessions')
          .update({
            eda_status: 'completed',
            eda_results: edaResults
          })
          .eq('id', session.id);

        if (updateError) {
          console.error('Error updating EDA results:', updateError);
        }
      }

      const sessionWithEda = {
        ...updatedSession,
        edaStatus: 'completed' as const,
        edaResults: edaResults
      };
      
      setTestSession(sessionWithEda);
      setEdaProgress(100);

      // Iniciar análisis financiero principal
      await analyzeWithClaude(sessionWithEda);

    } catch (error) {
      console.error('Error in EDA analysis:', error);
      toast.error('Error en análisis EDA: ' + (error as Error).message);
      
      // Actualizar estado en DB
      if (session.id) {
        await supabase
          .from('test_sessions')
          .update({ eda_status: 'error' })
          .eq('id', session.id);
      }

      setTestSession({
        ...session,
        edaStatus: 'error'
      });
    }
  };

  const analyzeWithClaude = async (session: TestSession) => {
    try {
      setAnalysisProgress(0);
      
      const updatedSession = {
        ...session,
        analysisStatus: 'processing' as const
      };
      setTestSession(updatedSession);

      setAnalysisProgress(25);

      console.log('Calling claude-testing-analyzer function...');
      const { data: analysisResults, error: analysisError } = await supabase.functions.invoke('claude-testing-analyzer', {
        body: { 
          sessionId: session.id,
          analysisType: 'financial_analysis'
        }
      });

      if (analysisError) {
        console.error('Financial Analysis error:', analysisError);
        throw analysisError;
      }

      console.log('Financial Analysis response:', analysisResults);
      setAnalysisProgress(75);

      // Actualizar sesión en DB con resultados del análisis
      if (session.id) {
        const { error: updateError } = await supabase
          .from('test_sessions')
          .update({
            analysis_status: 'completed',
            financial_analysis_results: analysisResults,
            completed_at: new Date().toISOString()
          })
          .eq('id', session.id);

        if (updateError) {
          console.error('Error updating analysis results:', updateError);
        }
      }

      const finalSession = {
        ...updatedSession,
        analysisStatus: 'completed' as const,
        analysisResults: analysisResults
      };

      setTestSession(finalSession);
      setAnalysisProgress(100);
      
      // Notificar al componente padre
      onSessionChange?.(finalSession);
      toast.success('Análisis completado exitosamente');

    } catch (error) {
      console.error('Error analyzing with Claude:', error);
      toast.error('Error en análisis financiero: ' + (error as Error).message);
      
      // Actualizar estado en DB
      if (session.id) {
        await supabase
          .from('test_sessions')
          .update({ analysis_status: 'error' })
          .eq('id', session.id);
      }

      setTestSession({
        ...session,
        analysisStatus: 'error'
      });
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Extraer solo la parte base64 sin el prefijo data:...
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      handleFileUpload(files);
    }
  }, [selectedDocumentTypes]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const clearSession = () => {
    setTestSession(null);
    setUploadProgress(0);
    setAnalysisProgress(0);
    setEdaProgress(0);
    setSessionName('');
    setSelectedDocumentTypes([]);
    setSelectedFiles([]);
  };

  const currentSessionStatus = testSession ? getOverallStatus(testSession) : 'idle';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carga de Archivos con EDA Automático
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!testSession ? (
            <div className="space-y-6">
              <div>
                <label htmlFor="session-name" className="block text-sm font-medium mb-2">
                  Nombre de la sesión (opcional)
                </label>
                <Input
                  id="session-name"
                  placeholder="ej. Análisis Q3 2024"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  Tipo(s) de documento que vas a cargar
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {documentTypes.map((docType) => (
                    <div key={docType.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={docType.id}
                        checked={selectedDocumentTypes.includes(docType.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDocumentTypes([...selectedDocumentTypes, docType.id]);
                          } else {
                            setSelectedDocumentTypes(selectedDocumentTypes.filter(id => id !== docType.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={docType.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {docType.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Arrastra aquí tus archivos Excel</h3>
                <p className="text-muted-foreground mb-4">
                  Puedes cargar varios archivos a la vez (Balance, P&G, etc.)
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setSelectedFiles(files);
                      handleFileUpload(files);
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={selectedDocumentTypes.length === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Seleccionar Archivo(s)
                </Button>
                {selectedDocumentTypes.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Primero selecciona el tipo de documento
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{testSession.fileName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {testSession.uploadedAt && new Date(testSession.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <Button variant="outline" onClick={clearSession}>
                  Limpiar
                </Button>
              </div>

              {/* Progress indicators */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {testSession.uploadStatus === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : testSession.uploadStatus === 'error' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <span className="text-sm font-medium">Carga</span>
                  </div>
                  <Progress value={uploadProgress} className="flex-1" />
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>

                {(testSession.edaStatus && testSession.edaStatus !== 'idle') && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {testSession.edaStatus === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : testSession.edaStatus === 'error' ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <span className="text-sm font-medium">EDA</span>
                    </div>
                    <Progress value={edaProgress} className="flex-1" />
                    <span className="text-sm text-muted-foreground">{edaProgress}%</span>
                  </div>
                )}

                {(testSession.analysisStatus && testSession.analysisStatus !== 'idle') && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {testSession.analysisStatus === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : testSession.analysisStatus === 'error' ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <span className="text-sm font-medium">Análisis</span>
                    </div>
                    <Progress value={analysisProgress} className="flex-1" />
                    <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
                  </div>
                )}
              </div>

              {/* Detected data preview */}
              {testSession.detectedSheets && testSession.detectedSheets.length > 0 && (
                <Tabs defaultValue="sheets" className="w-full">
                  <TabsList>
                    <TabsTrigger value="sheets">Hojas Detectadas</TabsTrigger>
                    <TabsTrigger value="fields">Campos Detectados</TabsTrigger>
                  </TabsList>
                  <TabsContent value="sheets" className="space-y-2">
                    {testSession.detectedSheets.map((sheet, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{sheet}</span>
                        <Badge variant="secondary">
                          {testSession.detectedFields?.[sheet]?.length || 0} campos
                        </Badge>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="fields" className="space-y-2">
                    {Object.entries(testSession.detectedFields || {}).map(([sheet, fields]) => (
                      <div key={sheet} className="space-y-2">
                        <h5 className="font-medium">{sheet}</h5>
                        <div className="grid grid-cols-2 gap-2 pl-4">
                          {fields.map((field, index) => (
                            <span key={index} className="text-sm text-muted-foreground">
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              )}

              {/* Status alerts */}
              {currentSessionStatus === 'completed' && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    ¡Análisis completado! Los datos han sido procesados y están listos para el dashboard.
                    {onContinue && (
                      <Button 
                        onClick={onContinue} 
                        variant="outline" 
                        size="sm" 
                        className="ml-2"
                      >
                        Continuar al EDA
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {currentSessionStatus === 'eda' && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Realizando análisis exploratorio de datos (EDA) con Claude...
                  </AlertDescription>
                </Alert>
              )}

              {currentSessionStatus === 'analyzing' && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Claude está analizando los datos financieros...
                  </AlertDescription>
                </Alert>
              )}

              {currentSessionStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Error durante el procesamiento. Revisa los logs y vuelve a intentar.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};