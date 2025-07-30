import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, Star, ThumbsUp, ThumbsDown, AlertTriangle, Brain } from 'lucide-react';

interface InsightEvaluatorProps {
  testSession: any;
  onResultsUpdate: (quality: number) => void;
}

interface InsightEvaluation {
  id: string;
  text: string;
  category: 'financial' | 'operational' | 'strategic' | 'risk';
  relevance: number; // 1-5
  accuracy: number; // 1-5
  actionability: number; // 1-5
  clarity: number; // 1-5
  feedback: string;
  overallRating: number;
}

export const InsightEvaluator = ({ testSession, onResultsUpdate }: InsightEvaluatorProps) => {
  const [insights, setInsights] = useState<InsightEvaluation[]>([]);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [overallQuality, setOverallQuality] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    if (testSession?.analysisResult?.insights) {
      initializeInsights();
    }
  }, [testSession]);

  const initializeInsights = () => {
    const claudeInsights = testSession.analysisResult.insights || [];
    
    const evaluations: InsightEvaluation[] = claudeInsights.map((insight: any, index: number) => ({
      id: `insight_${index}`,
      text: insight.interpretation || insight.summary || 'Sin descripción',
      category: categorizeInsight(insight),
      relevance: 0,
      accuracy: 0,
      actionability: 0,
      clarity: 0,
      feedback: '',
      overallRating: 0
    }));

    setInsights(evaluations);
  };

  const categorizeInsight = (insight: any): InsightEvaluation['category'] => {
    const text = (insight.interpretation || insight.summary || '').toLowerCase();
    
    if (text.includes('ratio') || text.includes('financiero') || text.includes('liquidez')) {
      return 'financial';
    }
    if (text.includes('operativ') || text.includes('eficiencia') || text.includes('productividad')) {
      return 'operational';
    }
    if (text.includes('estrategia') || text.includes('mercado') || text.includes('competitiv')) {
      return 'strategic';
    }
    if (text.includes('riesgo') || text.includes('volatilidad') || text.includes('deuda')) {
      return 'risk';
    }
    
    return 'financial';
  };

  const updateInsightEvaluation = (field: keyof InsightEvaluation, value: any) => {
    setInsights(prev => {
      const updated = [...prev];
      updated[currentInsightIndex] = {
        ...updated[currentInsightIndex],
        [field]: value
      };
      
      // Calcular rating general si se actualizaron las métricas
      if (['relevance', 'accuracy', 'actionability', 'clarity'].includes(field)) {
        const insight = updated[currentInsightIndex];
        const overallRating = (insight.relevance + insight.accuracy + insight.actionability + insight.clarity) / 4;
        updated[currentInsightIndex].overallRating = overallRating;
      }
      
      return updated;
    });
  };

  const calculateOverallQuality = () => {
    const evaluatedInsights = insights.filter(i => i.overallRating > 0);
    if (evaluatedInsights.length === 0) return 0;
    
    const totalRating = evaluatedInsights.reduce((sum, insight) => sum + insight.overallRating, 0);
    return (totalRating / evaluatedInsights.length / 5) * 100; // Convertir a porcentaje
  };

  const completeEvaluation = async () => {
    setIsEvaluating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular procesamiento
      
      const quality = calculateOverallQuality();
      setOverallQuality(quality);
      onResultsUpdate(quality);
      
    } finally {
      setIsEvaluating(false);
    }
  };

  const getCategoryIcon = (category: InsightEvaluation['category']) => {
    switch (category) {
      case 'financial': return '💰';
      case 'operational': return '⚙️';
      case 'strategic': return '🎯';
      case 'risk': return '⚠️';
      default: return '💡';
    }
  };

  const getCategoryColor = (category: InsightEvaluation['category']) => {
    switch (category) {
      case 'financial': return 'bg-blue-100 text-blue-800';
      case 'operational': return 'bg-green-100 text-green-800';
      case 'strategic': return 'bg-purple-100 text-purple-800';
      case 'risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (!testSession?.analysisResult?.insights?.length) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No se encontraron insights para evaluar. Asegúrate de que Claude haya completado el análisis del archivo.
        </AlertDescription>
      </Alert>
    );
  }

  const currentInsight = insights[currentInsightIndex];

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Evaluador de Insights de Claude
            </CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {currentInsightIndex + 1} de {insights.length}
              </span>
              {overallQuality > 0 && (
                <Badge className="bg-primary/10 text-primary">
                  Calidad: {overallQuality.toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentInsightIndex(prev => Math.max(0, prev - 1))}
              disabled={currentInsightIndex === 0}
            >
              Anterior
            </Button>
            
            <div className="flex gap-2">
              {insights.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentInsightIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentInsightIndex 
                      ? 'bg-primary' 
                      : insights[index].overallRating > 0 
                        ? 'bg-green-400' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentInsightIndex(prev => Math.min(insights.length - 1, prev + 1))}
              disabled={currentInsightIndex === insights.length - 1}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evaluación del insight actual */}
      {currentInsight && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(currentInsight.category)}</span>
                <div>
                  <h3 className="font-semibold">Insight #{currentInsightIndex + 1}</h3>
                  <Badge className={getCategoryColor(currentInsight.category)}>
                    {currentInsight.category}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getRatingStars(currentInsight.overallRating)}
                {currentInsight.overallRating > 0 && (
                  <span className="ml-2 text-sm font-medium">
                    {currentInsight.overallRating.toFixed(1)}/5
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Texto del insight */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium">Insight de Claude:</Label>
                <p className="mt-2 text-sm leading-relaxed">{currentInsight.text}</p>
              </div>

              {/* Criterios de evaluación */}
              <div className="grid grid-cols-2 gap-6">
                {/* Relevancia */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Relevancia</Label>
                  <RadioGroup
                    value={currentInsight.relevance.toString()}
                    onValueChange={(value) => updateInsightEvaluation('relevance', parseInt(value))}
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating.toString()} id={`relevance-${rating}`} />
                        <Label htmlFor={`relevance-${rating}`} className="text-sm">
                          {rating} - {['Irrelevante', 'Poco relevante', 'Moderado', 'Relevante', 'Muy relevante'][rating - 1]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Precisión */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Precisión</Label>
                  <RadioGroup
                    value={currentInsight.accuracy.toString()}
                    onValueChange={(value) => updateInsightEvaluation('accuracy', parseInt(value))}
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating.toString()} id={`accuracy-${rating}`} />
                        <Label htmlFor={`accuracy-${rating}`} className="text-sm">
                          {rating} - {['Incorrecto', 'Parcialmente correcto', 'Aceptable', 'Preciso', 'Muy preciso'][rating - 1]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Accionabilidad */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Accionabilidad</Label>
                  <RadioGroup
                    value={currentInsight.actionability.toString()}
                    onValueChange={(value) => updateInsightEvaluation('actionability', parseInt(value))}
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating.toString()} id={`actionability-${rating}`} />
                        <Label htmlFor={`actionability-${rating}`} className="text-sm">
                          {rating} - {['No accionable', 'Poco accionable', 'Moderado', 'Accionable', 'Muy accionable'][rating - 1]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Claridad */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Claridad</Label>
                  <RadioGroup
                    value={currentInsight.clarity.toString()}
                    onValueChange={(value) => updateInsightEvaluation('clarity', parseInt(value))}
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating.toString()} id={`clarity-${rating}`} />
                        <Label htmlFor={`clarity-${rating}`} className="text-sm">
                          {rating} - {['Confuso', 'Poco claro', 'Aceptable', 'Claro', 'Muy claro'][rating - 1]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {/* Feedback adicional */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Comentarios adicionales (opcional)</Label>
                <Textarea
                  value={currentInsight.feedback}
                  onChange={(e) => updateInsightEvaluation('feedback', e.target.value)}
                  placeholder="Proporciona feedback específico sobre este insight..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón de finalización */}
      <div className="flex justify-center">
        <Button
          onClick={completeEvaluation}
          disabled={isEvaluating || insights.filter(i => i.overallRating > 0).length === 0}
          size="lg"
          className="w-full max-w-md"
        >
          {isEvaluating ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-pulse" />
              Procesando evaluación...
            </>
          ) : (
            <>
              <ThumbsUp className="h-4 w-4 mr-2" />
              Completar Evaluación
            </>
          )}
        </Button>
      </div>

      {/* Resumen de resultados */}
      {overallQuality > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Evaluación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Insights Evaluados</h4>
                <p className="text-2xl font-bold">{insights.filter(i => i.overallRating > 0).length}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Calidad Promedio</h4>
                <p className="text-2xl font-bold text-primary">{overallQuality.toFixed(1)}%</p>
              </div>
            </div>
            
            <Alert className="mt-4">
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                {overallQuality >= 80 && "Excelente calidad de insights. Claude está proporcionando análisis muy valiosos."}
                {overallQuality >= 60 && overallQuality < 80 && "Buena calidad con margen de mejora. Algunos insights necesitan más precisión."}
                {overallQuality < 60 && "Los insights necesitan mejora significativa. Considera ajustar los prompts o datos de entrada."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};