import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TestDataUploader } from '@/components/testing/TestDataUploader';
import { CalculationValidator } from '@/components/testing/CalculationValidator';
import { InsightEvaluator } from '@/components/testing/InsightEvaluator';
import { CompletenessMatrix } from '@/components/testing/CompletenessMatrix';
import { TestingResults } from '@/components/testing/TestingResults';
import { Brain, FileSpreadsheet, Calculator, Lightbulb, CheckCircle2 } from 'lucide-react';

export default function ClaudeTestingPage() {
  const [currentTestSession, setCurrentTestSession] = useState(null);
  const [testingResults, setTestingResults] = useState({
    calculationAccuracy: 0,
    insightQuality: 0,
    dataCompleteness: 0,
    dashboardAvailability: 0
  });

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

        {/* Main Testing Interface */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Laboratorio de Validación Claude
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Carga de Datos
                </TabsTrigger>
                <TabsTrigger value="calculations" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Validación de Cálculos
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Evaluación de Insights
                </TabsTrigger>
                <TabsTrigger value="completeness" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Matriz de Completitud
                </TabsTrigger>
                <TabsTrigger value="results" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Resultados
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <TestDataUploader 
                  onTestSessionChange={setCurrentTestSession}
                  currentSession={currentTestSession}
                />
              </TabsContent>

              <TabsContent value="calculations" className="space-y-4">
                <CalculationValidator 
                  testSession={currentTestSession}
                  onResultsUpdate={(results) => 
                    setTestingResults(prev => ({ ...prev, calculationAccuracy: results }))
                  }
                />
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <InsightEvaluator 
                  testSession={currentTestSession}
                  onResultsUpdate={(results) => 
                    setTestingResults(prev => ({ ...prev, insightQuality: results }))
                  }
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