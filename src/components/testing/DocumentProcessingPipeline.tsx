import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Search, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Brain,
  ArrowRight,
  Clock,
  Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PipelineStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  icon: any;
  duration?: number;
}

interface ProcessingSession {
  id: string;
  sessionName: string;
  fileName: string;
  fileSize: number;
  stages: PipelineStage[];
  startTime: string;
  endTime?: string;
  overallStatus: 'idle' | 'processing' | 'completed' | 'error';
  results?: any;
}

interface DocumentProcessingPipelineProps {
  onSessionComplete: (session: ProcessingSession) => void;
}

export const DocumentProcessingPipeline = ({ onSessionComplete }: DocumentProcessingPipelineProps) => {
  const [currentSession, setCurrentSession] = useState<ProcessingSession | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const initialStages: PipelineStage[] = [
    {
      id: 'detection',
      name: 'Detección de Formato',
      description: 'Identificando tipo de documento y formato',
      status: 'pending',
      progress: 0,
      icon: Search
    },
    {
      id: 'extraction',
      name: 'Extracción de Datos',
      description: 'Extrayendo campos y estructura de datos',
      status: 'pending',
      progress: 0,
      icon: Database
    },
    {
      id: 'normalization',
      name: 'Normalización',
      description: 'Normalizando a esquema común',
      status: 'pending',
      progress: 0,
      icon: Zap
    },
    {
      id: 'validation',
      name: 'Validación con Claude',
      description: 'Validación financiera y análisis IA',
      status: 'pending',
      progress: 0,
      icon: Brain
    }
  ];

  const handleFileUpload = useCallback(async (file: File) => {
    // Validaciones
    if (!file.name.match(/\.(xlsx|xls|pdf|csv)$/i)) {
      toast({
        title: "Formato no válido",
        description: "Formatos soportados: Excel (.xlsx, .xls), PDF, CSV",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Archivo demasiado grande",
        description: `Tamaño máximo: 10MB. Actual: ${Math.round(file.size / (1024 * 1024))}MB`,
        variant: "destructive",
      });
      return;
    }

    if (!sessionName.trim()) {
      toast({
        title: "Nombre de sesión requerido",
        description: "Ingresa un nombre para la sesión antes de procesar",
        variant: "destructive",
      });
      return;
    }

    // Crear nueva sesión
    const newSession: ProcessingSession = {
      id: crypto.randomUUID(),
      sessionName: sessionName.trim(),
      fileName: file.name,
      fileSize: file.size,
      stages: [...initialStages],
      startTime: new Date().toISOString(),
      overallStatus: 'processing'
    };

    setCurrentSession(newSession);

    try {
      await processDocumentPipeline(file, newSession);
    } catch (error) {
      console.error('Pipeline error:', error);
      
      setCurrentSession(prev => prev ? {
        ...prev,
        overallStatus: 'error',
        stages: prev.stages.map(stage => 
          stage.status === 'processing' ? { ...stage, status: 'error' } : stage
        )
      } : null);
      
      toast({
        title: "Error en el procesamiento",
        description: "No se pudo completar el pipeline de procesamiento",
        variant: "destructive",
      });
    }
  }, [sessionName, toast]);

  const processDocumentPipeline = async (file: File, session: ProcessingSession) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const authHeaders = {
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    };

    // ETAPA 1: Detección de Formato
    await updateStageStatus(session.id, 'detection', 'processing');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const { data: detectionResult, error: detectionError } = await supabase.functions.invoke('document-detector', {
      body: formData,
      headers: authHeaders
    });

    if (detectionError) throw detectionError;
    
    await updateStageStatus(session.id, 'detection', 'completed', 100);
    
    // ETAPA 2: Extracción de Datos
    await updateStageStatus(session.id, 'extraction', 'processing');
    
    const { data: extractionResult, error: extractionError } = await supabase.functions.invoke('data-extractor', {
      body: {
        fileData: await file.arrayBuffer(),
        documentType: detectionResult.detection.document_type,
        sessionId: session.id
      },
      headers: authHeaders
    });

    if (extractionError) throw extractionError;
    
    await updateStageStatus(session.id, 'extraction', 'completed', 100);
    
    // ETAPA 3: Normalización
    await updateStageStatus(session.id, 'normalization', 'processing');
    
    const { data: normalizationResult, error: normalizationError } = await supabase.functions.invoke('data-normalizer', {
      body: {
        extractedData: extractionResult.extracted_data,
        documentType: detectionResult.detection.document_type,
        sessionId: session.id
      },
      headers: authHeaders
    });

    if (normalizationError) throw normalizationError;
    
    await updateStageStatus(session.id, 'normalization', 'completed', 100);
    
    // ETAPA 4: Validación con Claude
    await updateStageStatus(session.id, 'validation', 'processing');
    
    const { data: validationResult, error: validationError } = await supabase.functions.invoke('claude-financial-validator', {
      body: {
        normalizedData: normalizationResult.normalized_data,
        sessionId: session.id,
        validationType: 'comprehensive'
      },
      headers: authHeaders
    });

    if (validationError) throw validationError;
    
    await updateStageStatus(session.id, 'validation', 'completed', 100);
    
    // Completar sesión
    const completedSession: ProcessingSession = {
      ...session,
      overallStatus: 'completed',
      endTime: new Date().toISOString(),
      results: {
        detection: detectionResult,
        extraction: extractionResult,
        normalization: normalizationResult,
        validation: validationResult
      }
    };
    
    setCurrentSession(completedSession);
    onSessionComplete(completedSession);
    
    toast({
      title: "Pipeline completado",
      description: "Documento procesado exitosamente con todas las validaciones",
    });
  };

  const updateStageStatus = async (sessionId: string, stageId: string, status: 'processing' | 'completed' | 'error', progress?: number) => {
    setCurrentSession(prev => {
      if (!prev || prev.id !== sessionId) return prev;
      
      return {
        ...prev,
        stages: prev.stages.map(stage =>
          stage.id === stageId
            ? { 
                ...stage, 
                status, 
                progress: progress ?? stage.progress,
                duration: status === 'completed' ? Date.now() - new Date(prev.startTime).getTime() : undefined
              }
            : stage
        )
      };
    });

    // Simular progreso gradual para mejor UX
    if (status === 'processing' && progress === undefined) {
      for (let i = 10; i <= 90; i += 20) {
        setTimeout(() => {
          setCurrentSession(prev => {
            if (!prev || prev.id !== sessionId) return prev;
            return {
              ...prev,
              stages: prev.stages.map(stage =>
                stage.id === stageId && stage.status === 'processing'
                  ? { ...stage, progress: i }
                  : stage
              )
            };
          });
        }, (i / 10) * 1000);
      }
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

  const clearSession = () => {
    setCurrentSession(null);
    setSessionName('');
  };

  const getStageIcon = (stage: PipelineStage) => {
    const IconComponent = stage.icon;
    
    if (stage.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (stage.status === 'error') {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    } else if (stage.status === 'processing') {
      return <IconComponent className="h-5 w-5 text-blue-600 animate-pulse" />;
    } else {
      return <IconComponent className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuración de Sesión */}
      {!currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Pipeline de Procesamiento de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">
                Nombre de la sesión <span className="text-destructive">*</span>
              </Label>
              <Input
                id="session-name"
                placeholder="Ej: Análisis Estados Financieros Q4 2024"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Arrastra tu documento financiero aquí
              </h3>
              <p className="text-muted-foreground mb-4">
                O selecciona un archivo para procesar
                <br />
                <span className="text-xs">Formatos: Excel, PDF, CSV • Máximo: 10MB</span>
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.pdf,.csv"
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
          </CardContent>
        </Card>
      )}

      {/* Pipeline de Procesamiento */}
      {currentSession && (
        <div className="space-y-4">
          {/* Información de la Sesión */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{currentSession.sessionName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {currentSession.fileName} • {Math.round(currentSession.fileSize / 1024)} KB
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    currentSession.overallStatus === 'completed' ? 'default' :
                    currentSession.overallStatus === 'error' ? 'destructive' : 
                    'secondary'
                  }>
                    {currentSession.overallStatus === 'processing' && 'Procesando...'}
                    {currentSession.overallStatus === 'completed' && 'Completado'}
                    {currentSession.overallStatus === 'error' && 'Error'}
                    {currentSession.overallStatus === 'idle' && 'Pendiente'}
                  </Badge>
                  {currentSession.overallStatus !== 'processing' && (
                    <Button variant="ghost" size="sm" onClick={clearSession}>
                      Nueva Sesión
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Etapas del Pipeline */}
          <div className="grid gap-4">
            {currentSession.stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-4">
                {/* Conexión visual */}
                {index > 0 && (
                  <div className="flex flex-col items-center -mb-8 -mt-4">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                
                <Card className="flex-1">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {getStageIcon(stage)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{stage.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {stage.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{Math.round(stage.duration / 1000)}s</span>
                              </div>
                            )}
                            {stage.status === 'processing' && (
                              <span>{stage.progress}%</span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {stage.description}
                        </p>
                        
                        {stage.status === 'processing' && (
                          <Progress value={stage.progress} className="h-1" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Resultados */}
          {currentSession.overallStatus === 'completed' && currentSession.results && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Pipeline completado exitosamente</p>
                  <div className="text-sm space-y-1">
                    <p>• Formato detectado: {currentSession.results.detection?.detection?.document_type}</p>
                    <p>• Hojas procesadas: {currentSession.results.extraction?.extracted_data?.sheets?.length || 0}</p>
                    <p>• Campos normalizados: {Object.keys(currentSession.results.normalization?.normalized_data || {}).length}</p>
                    <p>• Score de validación: {Math.round((currentSession.results.validation?.validation_results?.overall_score || 0) * 100)}%</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {currentSession.overallStatus === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Error durante el procesamiento. Verifica el archivo y vuelve a intentarlo.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};