import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { TestDataUploader } from '@/components/testing/TestDataUploader';
import { DocumentProcessingPipeline } from '@/components/testing/DocumentProcessingPipeline';
import { CalculationValidator } from '@/components/testing/CalculationValidator';
import { InsightEvaluator } from '@/components/testing/InsightEvaluator';
import { CompletenessMatrix } from '@/components/testing/CompletenessMatrix';
import { TestingResults } from '@/components/testing/TestingResults';
import { Brain, FileSpreadsheet, Calculator, Lightbulb, CheckCircle2, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

// Interfaz estándar para la sesión de testing
interface StandardTestSession {
  id: string;
  sessionName: string;
  fileName: string;
  fileSize?: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  analysisStatus: 'pending' | 'analyzing' | 'completed' | 'error';
  detectedSheets?: string[];
  detectedFields?: Record<string, string[]>;
  // Estructura estandarizada de datos analizados
  analysisResult?: {
    calculations?: {
      key_metrics?: Record<string, number>;
      financial_ratios?: Record<string, number>;
      balance_sheet?: Record<string, number>;
      income_statement?: Record<string, number>;
    };
    insights?: Array<{
      interpretation?: string;
      summary?: string;
      category?: string;
      confidence?: number;
    }>;
    data_quality?: {
      completeness?: number;
      accuracy?: number;
      consistency?: number;
    };
  };
  createdAt?: string;
}

// Estados del proceso de testing
type TestingStep = 'upload' | 'pipeline' | 'calculations' | 'insights' | 'completeness' | 'results';

interface StepStatus {
  completed: boolean;
  inProgress: boolean;
  canAccess: boolean;
}

export default function ClaudeTestingPage() {
  const [currentTestSession, setCurrentTestSession] = useState<StandardTestSession | null>(null);
  const [currentStep, setCurrentStep] = useState<TestingStep>('upload');

  const resetSession = () => {
    setCurrentTestSession(null);
    setCurrentStep('upload');
  };
  const [testingResults, setTestingResults] = useState({
    calculationAccuracy: 0,
    insightQuality: 0,
    dataCompleteness: 0,
    dashboardAvailability: 0
  });

  // Gestión del estado de los pasos
  const getStepStatus = (step: TestingStep): StepStatus => {
    const session = currentTestSession;
    
    switch (step) {
      case 'upload':
      case 'pipeline':
        return {
          completed: session?.analysisStatus === 'completed',
          inProgress: session?.analysisStatus === 'analyzing' || session?.processingStatus === 'processing',
          canAccess: true
        };
      case 'calculations':
        return {
          completed: testingResults.calculationAccuracy > 0,
          inProgress: false,
          canAccess: session?.analysisStatus === 'completed'
        };
      case 'insights':
        return {
          completed: testingResults.insightQuality > 0,
          inProgress: false,
          canAccess: session?.analysisStatus === 'completed'
        };
      case 'completeness':
        return {
          completed: testingResults.dataCompleteness > 0,
          inProgress: false,
          canAccess: session?.analysisStatus === 'completed'
        };
      case 'results':
        return {
          completed: false,
          inProgress: false,
          canAccess: testingResults.calculationAccuracy > 0 || testingResults.insightQuality > 0
        };
      default:
        return { completed: false, inProgress: false, canAccess: false };
    }
  };

  // Navegación programática
  const navigateToStep = (step: TestingStep) => {
    const status = getStepStatus(step);
    if (status.canAccess) {
      setCurrentStep(step);
    }
  };

  // Auto-navegación cuando se completa un paso
  useEffect(() => {
    if (currentTestSession?.analysisStatus === 'completed' && 
        (currentStep === 'upload' || currentStep === 'pipeline')) {
      // Auto-navegar a validación de cálculos después de completar el análisis
      setTimeout(() => {
        setCurrentStep('calculations');
      }, 2000);
    }
  }, [currentTestSession?.analysisStatus, currentStep]);

  // Gestionar sesión estándar para el pipeline robusto
  const handlePipelineSessionComplete = (session: any) => {
    const standardSession: StandardTestSession = {
      id: session.id,
      sessionName: session.sessionName,
      fileName: session.fileName,
      fileSize: session.fileSize,
      uploadStatus: 'completed',
      processingStatus: 'completed',
      analysisStatus: 'completed',
      detectedSheets: session.results?.extraction?.extracted_data?.sheets || [],
      detectedFields: session.results?.extraction?.extracted_data?.fields || {},
      analysisResult: {
        calculations: session.results?.validation?.calculations || {},
        insights: session.results?.validation?.insights || [],
        data_quality: session.results?.validation?.confidence_scores || {}
      },
      createdAt: session.startTime
    };
    
    setCurrentTestSession(standardSession);
    setTestingResults({
      calculationAccuracy: session.results?.validation?.confidence_scores?.overall_confidence || 0,
      insightQuality: session.results?.validation?.validation_results?.overall_score || 0,
      dataCompleteness: session.results?.validation?.confidence_scores?.completeness || 0,
      dashboardAvailability: session.results?.validation?.confidence_scores?.structure_quality || 0
    });
  };

  // Gestionar sesión estándar para la carga simple
  const handleSimpleUploadSessionChange = (session: any) => {
    if (session) {
      const standardSession: StandardTestSession = {
        id: session.id || '',
        sessionName: session.sessionName,
        fileName: session.fileName,
        fileSize: session.fileSize,
        uploadStatus: session.uploadStatus,
        processingStatus: session.processingStatus,
        analysisStatus: session.analysisStatus,
        detectedSheets: session.detectedSheets || [],
        detectedFields: session.detectedFields || {},
        analysisResult: session.analysisResults ? {
          calculations: session.analysisResults.calculations || {},
          insights: session.analysisResults.insights || [],
          data_quality: session.analysisResults.data_quality || {}
        } : undefined,
        createdAt: session.createdAt
      };
      setCurrentTestSession(standardSession);
    } else {
      setCurrentTestSession(null);
    }
  };

  // Calcular progreso general
  const calculateOverallProgress = () => {
    const steps: TestingStep[] = ['upload', 'calculations', 'insights', 'completeness'];
    const completedSteps = steps.filter(step => getStepStatus(step).completed).length;
    return (completedSteps / steps.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Brain className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Claude Testing Lab
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Entorno de pruebas aislado para validar las capacidades de Claude en análisis financiero
          </p>
          <div className="flex justify-center gap-4">
            <Badge variant="outline" className="text-green-600 border-green-200">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Entorno Aislado
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Solo Administradores
            </Badge>
          </div>
        </div>

        {/* Barra de progreso general */}
        {currentTestSession && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Progreso del Testing</h3>
                  <span className="text-sm text-muted-foreground">{calculateOverallProgress().toFixed(0)}% completo</span>
                </div>
                <Progress value={calculateOverallProgress()} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Sesión: {currentTestSession.sessionName}</span>
                  <span>Archivo: {currentTestSession.fileName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Testing Interface */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Laboratorio de Validación Claude
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={currentStep} onValueChange={(value) => navigateToStep(value as TestingStep)} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger 
                  value="pipeline" 
                  className="flex items-center gap-2"
                  disabled={!getStepStatus('pipeline').canAccess}
                >
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">Pipeline Robusto</span>
                  {getStepStatus('pipeline').completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                  {getStepStatus('pipeline').inProgress && <Clock className="h-3 w-3 text-blue-600 animate-pulse" />}
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center gap-2"
                  disabled={!getStepStatus('upload').canAccess}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Carga Simple</span>
                  {getStepStatus('upload').completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                  {getStepStatus('upload').inProgress && <Clock className="h-3 w-3 text-blue-600 animate-pulse" />}
                </TabsTrigger>
                <TabsTrigger 
                  value="calculations" 
                  className="flex items-center gap-2"
                  disabled={!getStepStatus('calculations').canAccess}
                >
                  <Calculator className="h-4 w-4" />
                  <span className="hidden sm:inline">Cálculos</span>
                  {getStepStatus('calculations').completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                  {!getStepStatus('calculations').canAccess && <AlertTriangle className="h-3 w-3 text-muted-foreground" />}
                </TabsTrigger>
                <TabsTrigger 
                  value="insights" 
                  className="flex items-center gap-2"
                  disabled={!getStepStatus('insights').canAccess}
                >
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Insights</span>
                  {getStepStatus('insights').completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                  {!getStepStatus('insights').canAccess && <AlertTriangle className="h-3 w-3 text-muted-foreground" />}
                </TabsTrigger>
                <TabsTrigger 
                  value="completeness" 
                  className="flex items-center gap-2"
                  disabled={!getStepStatus('completeness').canAccess}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Completitud</span>
                  {getStepStatus('completeness').completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                  {!getStepStatus('completeness').canAccess && <AlertTriangle className="h-3 w-3 text-muted-foreground" />}
                </TabsTrigger>
                <TabsTrigger 
                  value="results" 
                  className="flex items-center gap-2"
                  disabled={!getStepStatus('results').canAccess}
                >
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">Resultados</span>
                  {!getStepStatus('results').canAccess && <AlertTriangle className="h-3 w-3 text-muted-foreground" />}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pipeline" className="space-y-4">
                <DocumentProcessingPipeline 
                  onSessionComplete={handlePipelineSessionComplete}
                />
                {currentTestSession?.analysisStatus === 'completed' && (
                  <div className="flex justify-center">
                    <Button onClick={() => navigateToStep('calculations')} size="lg" className="w-full max-w-md">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Continuar a Validación de Cálculos
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <TestDataUploader 
                  onTestSessionChange={handleSimpleUploadSessionChange}
                  currentSession={currentTestSession}
                  onContinue={() => navigateToStep('calculations')}
                />
              </TabsContent>

              <TabsContent value="calculations" className="space-y-4">
                <CalculationValidator 
                  testSession={currentTestSession}
                  onResultsUpdate={(results) => 
                    setTestingResults(prev => ({ ...prev, calculationAccuracy: results }))
                  }
                  onContinue={() => navigateToStep('insights')}
                />
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <InsightEvaluator 
                  testSession={currentTestSession}
                  onResultsUpdate={(results) => 
                    setTestingResults(prev => ({ ...prev, insightQuality: results }))
                  }
                  onContinue={() => navigateToStep('completeness')}
                />
              </TabsContent>

              <TabsContent value="completeness" className="space-y-4">
                <CompletenessMatrix 
                  testSession={currentTestSession}
                  onResultsUpdate={(results) => 
                    setTestingResults(prev => ({ 
                      ...prev, 
                      dataCompleteness: results.dataCompleteness,
                      dashboardAvailability: results.dashboardAvailability 
                    }))
                  }
                  onContinue={() => navigateToStep('results')}
                />
              </TabsContent>

              <TabsContent value="results" className="space-y-4">
                <TestingResults 
                  results={testingResults}
                  testSession={currentTestSession}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}