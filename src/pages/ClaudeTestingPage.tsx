import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Lock, ArrowRight, RefreshCw } from 'lucide-react';
import { TestingResults } from '@/components/testing/TestingResults';
import { DocumentProcessingPipeline } from '@/components/testing/DocumentProcessingPipeline';
import { TestDataUploader } from '@/components/testing/TestDataUploader';
import { CalculationValidator } from '@/components/testing/CalculationValidator';
import { InsightEvaluator } from '@/components/testing/InsightEvaluator';
import { CompletenessMatrix } from '@/components/testing/CompletenessMatrix';
import { EdaResults } from '@/components/testing/EdaResults';

// Interfaz estándar para transferencia de datos entre componentes
interface StandardTestSession {
  id?: string;
  sessionName?: string;
  fileName: string;
  fileSize?: number;
  uploadStatus: 'idle' | 'uploading' | 'completed' | 'error';
  processingStatus: 'idle' | 'processing' | 'completed' | 'error';
  analysisStatus: 'idle' | 'processing' | 'completed' | 'error';
  detectedSheets?: string[];
  detectedFields?: Record<string, string[]>;
  uploadedAt?: string;
  analysisResults?: any;
  edaResults?: any;
  edaStatus?: 'idle' | 'processing' | 'completed' | 'error';
  financial_analysis_status?: 'idle' | 'processing' | 'completed' | 'error';
  financial_analysis_results?: any;
  documentTypes?: string[];
  calculationResults?: any;
  insightResults?: any;
  completenessResults?: any;
}

type TestingStep = 'upload' | 'eda' | 'calculations' | 'insights' | 'completeness' | 'results';

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

  // Gestión del estado de los pasos
  const getStepStatus = (step: TestingStep): StepStatus => {
    if (!currentTestSession) return { completed: false, inProgress: false, canAccess: step === 'upload' };
    
    switch (step) {
      case 'upload':
        return { 
          completed: currentTestSession.uploadStatus === 'completed',
          inProgress: currentTestSession.uploadStatus === 'uploading' || 
                     currentTestSession.processingStatus === 'processing' ||
                     currentTestSession.edaStatus === 'processing' ||
                     currentTestSession.analysisStatus === 'processing',
          canAccess: true 
        };
      
      case 'eda':
        return { 
          completed: currentTestSession.edaStatus === 'completed',
          inProgress: currentTestSession.edaStatus === 'processing',
          canAccess: currentTestSession.uploadStatus === 'completed' && 
                     currentTestSession.processingStatus === 'completed' &&
                     currentTestSession.edaStatus !== 'idle'
        };
      
      case 'calculations':
        return { 
          completed: currentTestSession.financial_analysis_status === 'completed',
          inProgress: currentTestSession.financial_analysis_status === 'processing',
          canAccess: currentTestSession.edaStatus === 'completed'
        };
      
      case 'insights':
        return { 
          completed: currentTestSession.financial_analysis_status === 'completed',
          inProgress: currentTestSession.financial_analysis_status === 'processing',
          canAccess: currentTestSession.financial_analysis_status === 'completed'
        };
      
      case 'completeness':
        return { 
          completed: currentTestSession.financial_analysis_status === 'completed',
          inProgress: false,
          canAccess: currentTestSession.financial_analysis_status === 'completed'
        };
      
      case 'results':
        return { 
          completed: currentTestSession.financial_analysis_status === 'completed',
          inProgress: false,
          canAccess: currentTestSession.financial_analysis_status === 'completed'
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
    if (currentTestSession?.edaStatus === 'completed' && currentStep === 'upload') {
      setCurrentStep('eda');
    }
  }, [currentTestSession?.edaStatus, currentStep]);


  // Gestionar sesión estándar para la carga simple
  const handleSimpleUploadSessionChange = (session: any) => {
    if (session) {
      const standardSession: StandardTestSession = {
      id: session.id || '',
      sessionName: session.sessionName,
      fileName: session.fileName,
      fileSize: session.fileSize,
      uploadStatus: session.uploadStatus || 'idle',
      processingStatus: session.processingStatus || 'idle',
      analysisStatus: session.analysisStatus || 'idle',
      detectedSheets: session.detectedSheets || [],
      detectedFields: session.detectedFields || {},
      analysisResults: session.analysisResults || session.analysis_results,
      edaResults: session.edaResults || session.eda_results,
      edaStatus: (session.edaStatus || session.eda_status || 'idle') as 'idle' | 'processing' | 'completed' | 'error',
        documentTypes: session.documentTypes || [],
        calculationResults: undefined,
        insightResults: undefined,
        completenessResults: undefined
      };
      
      setCurrentTestSession(standardSession);
    } else {
      setCurrentTestSession(null);
    }
  };

  // Calcular progreso general
  const calculateOverallProgress = () => {
    if (!currentTestSession) return 0;
    
    const steps: TestingStep[] = ['upload', 'eda', 'calculations', 'insights', 'completeness', 'results'];
    const completedSteps = steps.filter(step => getStepStatus(step).completed).length;
    
    return (completedSteps / steps.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Claude Testing Lab</h1>
            <p className="text-muted-foreground mt-2">
              Evalúa y valida el rendimiento de Claude en análisis financiero
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={resetSession}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reiniciar
            </Button>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Progreso General</div>
              <div className="font-bold text-lg">{calculateOverallProgress().toFixed(1)}%</div>
            </div>
            <Progress value={calculateOverallProgress()} className="w-32" />
          </div>
        </div>

        {/* Main Testing Interface */}
        <Tabs value={currentStep} onValueChange={(value) => navigateToStep(value as TestingStep)} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger 
              value="upload" 
              disabled={!getStepStatus('upload').canAccess}
              className="flex items-center gap-2"
            >
              {getStepStatus('upload').completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {getStepStatus('upload').inProgress && <Clock className="h-4 w-4 text-blue-600" />}
              {!getStepStatus('upload').canAccess && <Lock className="h-4 w-4 text-gray-400" />}
              Carga
            </TabsTrigger>
            
            <TabsTrigger 
              value="eda" 
              disabled={!getStepStatus('eda').canAccess}
              className="flex items-center gap-2"
            >
              {getStepStatus('eda').completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {getStepStatus('eda').inProgress && <Clock className="h-4 w-4 text-blue-600" />}
              {!getStepStatus('eda').canAccess && <Lock className="h-4 w-4 text-gray-400" />}
              EDA
            </TabsTrigger>
            
            <TabsTrigger 
              value="calculations" 
              disabled={!getStepStatus('calculations').canAccess}
              className="flex items-center gap-2"
            >
              {getStepStatus('calculations').completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {getStepStatus('calculations').inProgress && <Clock className="h-4 w-4 text-blue-600" />}
              {!getStepStatus('calculations').canAccess && <Lock className="h-4 w-4 text-gray-400" />}
              Cálculos
            </TabsTrigger>
            
            <TabsTrigger 
              value="insights" 
              disabled={!getStepStatus('insights').canAccess}
              className="flex items-center gap-2"
            >
              {getStepStatus('insights').completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {getStepStatus('insights').inProgress && <Clock className="h-4 w-4 text-blue-600" />}
              {!getStepStatus('insights').canAccess && <Lock className="h-4 w-4 text-gray-400" />}
              Insights
            </TabsTrigger>
            
            <TabsTrigger 
              value="completeness" 
              disabled={!getStepStatus('completeness').canAccess}
              className="flex items-center gap-2"
            >
              {getStepStatus('completeness').completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {getStepStatus('completeness').inProgress && <Clock className="h-4 w-4 text-blue-600" />}
              {!getStepStatus('completeness').canAccess && <Lock className="h-4 w-4 text-gray-400" />}
              Completitud
            </TabsTrigger>
            
            <TabsTrigger 
              value="results" 
              disabled={!getStepStatus('results').canAccess}
              className="flex items-center gap-2"
            >
              {getStepStatus('results').completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {getStepStatus('results').inProgress && <Clock className="h-4 w-4 text-blue-600" />}
              {!getStepStatus('results').canAccess && <Lock className="h-4 w-4 text-gray-400" />}
              Resultados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <TestDataUploader
              onSessionChange={handleSimpleUploadSessionChange}
              currentSession={currentTestSession}
              onContinue={() => setCurrentStep('eda')}
            />
          </TabsContent>

          <TabsContent value="eda">
            <EdaResults
              edaResults={currentTestSession?.edaResults}
              onContinue={() => setCurrentStep('calculations')}
              onEdaUpdate={(updatedEda) => {
                if (currentTestSession) {
                  setCurrentTestSession({
                    ...currentTestSession,
                    edaResults: updatedEda
                  });
                }
              }}
            />
          </TabsContent>

          <TabsContent value="calculations">
            <CalculationValidator
              testSession={currentTestSession}
              onResultsUpdate={(results) => {
                if (currentTestSession) {
                  setCurrentTestSession({
                    ...currentTestSession,
                    calculationResults: results
                  });
                }
              }}
              onContinue={() => setCurrentStep('insights')}
            />
          </TabsContent>

          <TabsContent value="insights">
            <InsightEvaluator
              testSession={currentTestSession}
              onComplete={(results) => {
                if (currentTestSession) {
                  setCurrentTestSession({
                    ...currentTestSession,
                    insightResults: results
                  });
                }
              }}
              onContinue={() => setCurrentStep('completeness')}
            />
          </TabsContent>

          <TabsContent value="completeness">
            <CompletenessMatrix
              testSession={currentTestSession}
              onResultsUpdate={(results) => {
                if (currentTestSession) {
                  setCurrentTestSession({
                    ...currentTestSession,
                    completenessResults: results
                  });
                }
              }}
              onContinue={() => setCurrentStep('results')}
            />
          </TabsContent>

          <TabsContent value="results">
            <TestingResults
              results={{
                calculationAccuracy: currentTestSession?.calculationResults?.overallScore || 0,
                insightQuality: currentTestSession?.insightResults?.overallScore || 0,
                dataCompleteness: currentTestSession?.completenessResults?.dataCompleteness || 0,
                dashboardAvailability: currentTestSession?.completenessResults?.dashboardAvailability || 0
              }}
              testSession={currentTestSession}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}