import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Brain, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestSession {
  id: string;
  sessionName: string;
  fileName: string;
  fileSize?: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  analysisStatus: 'pending' | 'analyzing' | 'completed' | 'error';
  detectedSheets?: string[];
  detectedFields?: Record<string, string[]>;
  analysisResults?: any;
  createdAt?: string;
}

interface TestDataUploaderProps {
  onTestSessionChange: (session: TestSession | null) => void;
  currentSession: TestSession | null;
}

export const TestDataUploader = ({ onTestSessionChange, currentSession }: TestDataUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [sessionName, setSessionName] = useState('');
  const { toast } = useToast();

  const getOverallStatus = (session: TestSession) => {
    if (session.analysisStatus === 'completed') return 'completed';
    if (session.analysisStatus === 'analyzing') return 'analyzing';
    if (session.processingStatus === 'completed') return 'analyzing';
    if (session.processingStatus === 'processing') return 'processing';
    if (session.uploadStatus === 'uploading') return 'uploading';
    if (session.uploadStatus === 'error' || session.processingStatus === 'error' || session.analysisStatus === 'error') return 'error';
    return 'pending';
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos Excel (.xlsx, .xls)",
        variant: "destructive",
      });
      return;
    }

    if (!sessionName.trim()) {
      toast({
        title: "Nombre de sesión requerido",
        description: "Por favor ingresa un nombre para la sesión de prueba antes de subir el archivo",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    const newSession: TestSession = {
      id: '', // Se asignará por la base de datos
      sessionName: sessionName.trim(),
      fileName: file.name,
      fileSize: file.size,
      uploadStatus: 'uploading',
      processingStatus: 'pending',
      analysisStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    onTestSessionChange(newSession);

    try {
      // Progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Procesar archivo con función de testing
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionName', sessionName.trim());

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase.functions.invoke('claude-testing-processor', {
        body: formData,
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      // Actualizar sesión con datos procesados
      const updatedSession: TestSession = {
        ...newSession,
        id: data.sessionId,
        uploadStatus: 'completed',
        processingStatus: 'completed',
        analysisStatus: 'analyzing',
        detectedSheets: data.sheets,
        detectedFields: data.detectedFields
      };
      onTestSessionChange(updatedSession);

      // Iniciar análisis con Claude
      await analyzeWithClaude(updatedSession);

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error en la carga",
        description: "No se pudo procesar el archivo de prueba",
        variant: "destructive",
      });
      
      onTestSessionChange({
        ...newSession,
        uploadStatus: 'error',
        processingStatus: 'error',
        analysisStatus: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  }, [onTestSessionChange, toast, sessionName]);

  const analyzeWithClaude = async (session: TestSession) => {
    try {
      setAnalysisProgress(0);
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 1500);

      const { data: analysisResult, error } = await supabase.functions.invoke('claude-testing-analyzer', {
        body: {
          sessionId: session.id,
          analysisType: 'comprehensive'
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (error) throw error;

      const completedSession: TestSession = {
        ...session,
        analysisStatus: 'completed',
        analysisResults: analysisResult
      };
      
      onTestSessionChange(completedSession);

      toast({
        title: "Análisis completado",
        description: "Claude ha procesado exitosamente el archivo de prueba",
      });

    } catch (error) {
      console.error('Error analyzing with Claude:', error);
      toast({
        title: "Error en análisis",
        description: "Claude no pudo procesar el archivo correctamente",
        variant: "destructive",
      });
      
      onTestSessionChange({
        ...session,
        analysisStatus: 'error'
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const clearSession = () => {
    onTestSessionChange(null);
    setUploadProgress(0);
    setAnalysisProgress(0);
    setSessionName('');
  };

  const overallStatus = currentSession ? getOverallStatus(currentSession) : 'pending';

  return (
    <div className="space-y-6">
      {/* Área de Carga */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carga de Archivo de Prueba
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!currentSession ? (
            <div className="space-y-4">
              {/* Campo para nombre de sesión */}
              <div className="space-y-2">
                <Label htmlFor="session-name">
                  Nombre de la sesión de prueba 
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="session-name"
                  placeholder="Ej: Prueba análisis financiero Q4 2024"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className={!sessionName.trim() ? "border-muted-foreground/50" : ""}
                />
                {!sessionName.trim() && (
                  <p className="text-xs text-muted-foreground">
                    Ingresa un nombre antes de seleccionar el archivo
                  </p>
                )}
              </div>

              {/* Área de drag & drop */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  Arrastra tu archivo Excel aquí
                </h3>
                <p className="text-muted-foreground mb-4">
                  O haz clic para seleccionar un archivo de prueba
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild variant="outline" disabled={!sessionName.trim()}>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Seleccionar Archivo
                  </label>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info de sesión actual */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">{currentSession.sessionName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {currentSession.fileName} • {currentSession.fileSize ? `${Math.round(currentSession.fileSize / 1024)} KB` : ''}
                    </p>
                    {currentSession.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(currentSession.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    overallStatus === 'completed' ? 'default' :
                    overallStatus === 'error' ? 'destructive' : 'secondary'
                  }>
                    {overallStatus === 'uploading' && 'Cargando...'}
                    {overallStatus === 'processing' && 'Procesando...'}
                    {overallStatus === 'analyzing' && 'Analizando...'}
                    {overallStatus === 'completed' && 'Completado'}
                    {overallStatus === 'error' && 'Error'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={clearSession}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progreso de carga */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cargando y procesando archivo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Progreso de análisis */}
              {overallStatus === 'analyzing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Brain className="h-4 w-4 animate-pulse" />
                      Claude analizando datos financieros...
                    </span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} />
                </div>
              )}

              {/* Resultados de detección */}
              {overallStatus === 'completed' && currentSession.detectedFields && (
                <Tabs defaultValue="sheets" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="sheets">Hojas Detectadas</TabsTrigger>
                    <TabsTrigger value="fields">Campos Identificados</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sheets" className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {currentSession.detectedSheets?.map((sheet) => (
                        <Badge key={sheet} variant="outline" className="justify-center p-2">
                          {sheet}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="fields" className="space-y-3">
                    {Object.entries(currentSession.detectedFields).map(([sheet, fields]) => (
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas de estado */}
      {overallStatus === 'completed' && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Archivo procesado exitosamente con Claude. Puedes continuar con la validación de cálculos.
          </AlertDescription>
        </Alert>
      )}

      {overallStatus === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error al procesar el archivo. Verifica el formato y vuelve a intentar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};