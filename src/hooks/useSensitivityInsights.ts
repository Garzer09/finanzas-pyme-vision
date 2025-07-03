import { useState, useEffect } from 'react';
import { SensitivityData } from './useSensitivity';

export interface SensitivityInsight {
  id: string;
  type: 'risk' | 'opportunity' | 'growth' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export const useSensitivityInsights = (sensitivityData: SensitivityData): {
  insights: SensitivityInsight[];
  isLoading: boolean;
} => {
  const [insights, setInsights] = useState<SensitivityInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    
    // Simulate AI insights generation with debounce
    const generateInsights = () => {
      const newInsights: SensitivityInsight[] = [];
      const { salesDelta, costsDelta, deltaPercentage, ebitdaSimulated, ebitdaBase } = sensitivityData;

      // Risk insights
      if (deltaPercentage < -15) {
        newInsights.push({
          id: 'risk-high-impact',
          type: 'risk',
          title: 'Alto Impacto Negativo Detectado',
          description: `La combinación actual reduce el EBITDA en ${Math.abs(deltaPercentage).toFixed(1)}%. Considere revisar las variables más sensibles.`,
          impact: 'high'
        });
      }

      // Opportunity insights
      if (deltaPercentage > 10) {
        newInsights.push({
          id: 'opportunity-growth',
          type: 'opportunity',
          title: 'Oportunidad de Crecimiento',
          description: `Las variables actuales muestran un potencial de mejora del ${deltaPercentage.toFixed(1)}% en EBITDA. Evalúe la viabilidad de estos escenarios.`,
          impact: 'high'
        });
      }

      // Sales sensitivity insights
      if (Math.abs(salesDelta) > 15) {
        newInsights.push({
          id: 'sales-sensitivity',
          type: Math.abs(salesDelta) > 20 ? 'risk' : 'trend',
          title: 'Alta Sensibilidad a Ventas',
          description: `Variación de ventas del ${salesDelta > 0 ? '+' : ''}${salesDelta}% genera impacto significativo. Las ventas son una palanca crítica.`,
          impact: Math.abs(salesDelta) > 20 ? 'high' : 'medium'
        });
      }

      // Costs sensitivity insights
      if (Math.abs(costsDelta) > 10) {
        newInsights.push({
          id: 'costs-sensitivity',
          type: 'trend',
          title: 'Impacto en Control de Costes',
          description: `Variación de costes del ${costsDelta > 0 ? '+' : ''}${costsDelta}% afecta considerablemente el resultado. Revisar estrategias de optimización.`,
          impact: 'medium'
        });
      }

      // Balanced scenario insight
      if (Math.abs(deltaPercentage) < 5 && (Math.abs(salesDelta) > 5 || Math.abs(costsDelta) > 5)) {
        newInsights.push({
          id: 'balanced-scenario',
          type: 'opportunity',
          title: 'Escenario Equilibrado',
          description: 'Las variables se compensan mutuamente. Este escenario muestra estabilidad en los resultados.',
          impact: 'low'
        });
      }

      // Default insight if no specific conditions
      if (newInsights.length === 0) {
        newInsights.push({
          id: 'base-scenario',
          type: 'trend',
          title: 'Escenario Base Estable',
          description: 'Las variables actuales mantienen el EBITDA en niveles cercanos al escenario base. Considere probar variaciones más amplias.',
          impact: 'low'
        });
      }

      setInsights(newInsights);
      setIsLoading(false);
    };

    const timeoutId = setTimeout(generateInsights, 500);
    
    return () => clearTimeout(timeoutId);
  }, [sensitivityData]);

  return { insights, isLoading };
};