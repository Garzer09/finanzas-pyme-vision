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

interface TestSession {
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
      alert('Por favor selecciona archivos Excel (.xlsx o .xls)');
      return;
    }

    if (selectedDocumentTypes.length === 0) {
      alert('Por favor selecciona al menos un tipo de documento');
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
      files: validFiles
    };

    setTestSession(newSession);
    setUploadProgress(0);

    try {
      setUploadProgress(25);
      
      // Procesar todos los archivos
      const allData = { detectedSheets: [], detectedFields: {} };
      
      for (const file of validFiles) {
        const { data, error } = await supabase.functions.invoke('simple-excel-parser', {
          body: { 
            file: await fileToBase64(file),
            fileName: file.name
          }
        });

        if (error) throw error;
        
        // Combinar datos de todos los archivos
        allData.detectedSheets = [...(allData.detectedSheets || []), ...(data.detectedSheets || [])];
        Object.assign(allData.detectedFields, data.detectedFields || {});
      }

      setUploadProgress(75);

      const updatedSession: TestSession = {
        ...newSession,
        uploadStatus: 'completed',
        processingStatus: 'completed',
        detectedSheets: allData.detectedSheets,
        detectedFields: allData.detectedFields
      };

      setTestSession(updatedSession);
      setUploadProgress(100);

      // Iniciar EDA primero
      await runEdaAnalysis(updatedSession);

    } catch (error) {
      console.error('Error processing file:', error);
      setTestSession({
        ...newSession,
        uploadStatus: 'error',
        processingStatus: 'error'
      });
    }
  };

  const runEdaAnalysis = async (session: TestSession) => {
    try {
      setEdaProgress(0);
      
      const updatedSession = {
        ...session,
        edaStatus: 'processing' as const
      };
      setTestSession(updatedSession);

      setEdaProgress(25);

      const { data, error } = await supabase.functions.invoke('claude-eda-analyzer', {
        body: {
          sessionId: 'temp-session-id',
          fileData: {
            fileName: session.fileName,
            detectedSheets: session.detectedSheets,
            detectedFields: session.detectedFields
          },
          documentTypes: session.documentTypes
        }
      });

      if (error) throw error;

      setEdaProgress(75);

      const sessionWithEda = {
        ...updatedSession,
        edaStatus: 'completed' as const,
        edaResults: data
      };
      
      setTestSession(sessionWithEda);
      setEdaProgress(100);

      // Ahora ejecutar análisis principal
      await analyzeWithClaude(sessionWithEda);

    } catch (error) {
      console.error('Error in EDA analysis:', error);
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

      const { data, error } = await supabase.functions.invoke('claude-testing-analyzer', {
        body: {
          sessionId: 'temp-session-id',
          fileData: {
            fileName: session.fileName,
            detectedSheets: session.detectedSheets,
            detectedFields: session.detectedFields,
            edaResults: session.edaResults
          },
          documentTypes: session.documentTypes
        }
      });

      if (error) throw error;

      setAnalysisProgress(75);

      const finalSession = {
        ...updatedSession,
        analysisStatus: 'completed' as const,
        analysisResults: data
      };

      setTestSession(finalSession);
      setAnalysisProgress(100);
      
      // Notificar al componente padre
      onSessionChange?.(finalSession);

    } catch (error) {
      console.error('Error analyzing with Claude:', error);
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
      reader.onload = () => resolve(reader.result as string);
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

              {currentSessionStatus !== 'idle' && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Subida y procesamiento</span>
                      <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Análisis Exploratorio (EDA)</span>
                      <span className="text-sm text-muted-foreground">{edaProgress}%</span>
                    </div>
                    <Progress value={edaProgress} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Análisis Financiero</span>
                      <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} />
                  </div>
                </div>
              )}

              {currentSessionStatus === 'completed' && testSession.detectedSheets && (
                <Tabs defaultValue="sheets" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="sheets">Hojas Detectadas</TabsTrigger>
                    <TabsTrigger value="fields">Campos Identificados</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sheets">
                    <div className="grid grid-cols-2 gap-2">
                      {testSession.detectedSheets.map((sheet) => (
                        <Badge key={sheet} variant="outline" className="justify-center p-2">
                          {sheet}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="fields">
                    {Object.entries(testSession.detectedFields || {}).map(([sheet, fields]) => (
                      <div key={sheet} className="space-y-2">
                        <h5 className="font-medium text-sm">{sheet}</h5>
                        <div className="flex flex-wrap gap-1">
                          {fields.map((field) => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              )}

              {currentSessionStatus === 'completed' && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    ¡Análisis EDA y financiero completados! Los datos están listos para validación.
                  </AlertDescription>
                </Alert>
              )}

              {currentSessionStatus === 'eda' && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Realizando análisis exploratorio de datos (EDA)...
                  </AlertDescription>
                </Alert>
              )}

              {currentSessionStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Error durante el procesamiento. Por favor, intenta nuevamente.
                  </AlertDescription>
                </Alert>
              )}

              {currentSessionStatus === 'completed' && onContinue && (
                <div className="flex justify-center pt-4">
                  <Button onClick={onContinue} size="lg" className="flex items-center gap-2">
                    Continuar al EDA
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};