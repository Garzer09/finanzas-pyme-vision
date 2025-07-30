import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinancialAnalysisRequest {
  data: any;
  analysisType: 'balance' | 'pyg' | 'ratios' | 'debt-structure' | 'conclusions' | 'comprehensive';
  periods?: string[];
  context?: string;
  companyInfo?: {
    name?: string;
    sector?: string;
    size?: string;
  };
}

interface FinancialInsight {
  kpi: string;
  value: number;
  formula: string;
  interpretation: string;
  trend?: 'positive' | 'negative' | 'neutral';
  benchmark?: number;
  recommendations?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { data, analysisType, periods, context, companyInfo }: FinancialAnalysisRequest = await req.json();

    const getAnalysisPrompt = (type: string) => {
      const baseStructure = `{
  "insights": [
    {
      "kpi": "Nombre del KPI",
      "value": número_calculado,
      "formula": "fórmula_utilizada", 
      "interpretation": "interpretación_clara",
      "trend": "positive|negative|neutral",
      "benchmark": número_benchmark_opcional,
      "recommendations": ["recomendación1", "recomendación2"]
    }
  ],
  "summary": "Resumen ejecutivo de máximo 200 caracteres",
  "alerts": ["alerta1", "alerta2"],
  "calculations": {
    "key_metrics": {
      "metric_name": calculated_value
    }
  }
}`;

      const specificPrompts = {
        'ratios': `Como experto analista financiero, analiza los ratios financieros calculando métricas precisas y proporcionando interpretaciones profesionales.

ESTRUCTURA DE RESPUESTA: ${baseStructure}

RATIOS A ANALIZAR:
- Liquidez: Ratio corriente, prueba ácida, liquidez inmediata
- Endeudamiento: Deuda/Patrimonio, Deuda/Activos, cobertura de intereses
- Rentabilidad: ROE, ROA, margen neto, margen bruto
- Actividad: Rotación de activos, rotación de inventarios, días de cobro
- Crecimiento: Variación de ventas, activos, patrimonio

Para cada ratio:
1. Calcula el valor exacto con los datos disponibles
2. Interpreta el resultado (excelente, bueno, regular, deficiente)
3. Compara con benchmarks del sector si es posible
4. Identifica tendencias y patrones
5. Proporciona recomendaciones específicas y accionables`,

        'debt-structure': `Como experto en análisis de deuda, evalúa la estructura de endeudamiento y riesgo financiero.

ESTRUCTURA DE RESPUESTA: ${baseStructure}

ANÁLISIS REQUERIDO:
- Estructura de deuda: Corto vs largo plazo, concentración por vencimientos
- Capacidad de pago: DSCR, cobertura de intereses, flujo libre
- Riesgo financiero: Nivel de endeudamiento, volatilidad, garantías
- Sostenibilidad: Proyección de vencimientos, refinanciamiento

Evalúa:
1. Distribución temporal de vencimientos
2. Costo promedio de la deuda
3. Riesgo de liquidez y solvencia
4. Recomendaciones para optimización de estructura`,

        'conclusions': `Como director financiero experimentado, genera conclusiones ejecutivas y recomendaciones estratégicas.

ESTRUCTURA DE RESPUESTA: ${baseStructure}

ANÁLISIS EJECUTIVO:
- Diagnóstico integral de la situación financiera
- Fortalezas principales identificadas
- Debilidades críticas a atender
- Oportunidades de mejora priorizadas
- Riesgos principales y mitigación
- Plan de acción con timeline

Enfócate en:
1. Síntesis de hallazgos más relevantes
2. Impacto en la sostenibilidad del negocio
3. Recomendaciones priorizadas por impacto/esfuerzo
4. Alertas tempranas de riesgos emergentes`,

        'comprehensive': `Como consultor senior en finanzas corporativas, realiza un análisis integral completo.

ESTRUCTURA DE RESPUESTA: ${baseStructure}

ANÁLISIS 360°:
- Diagnóstico completo de liquidez, solvencia, rentabilidad y eficiencia
- Análisis de tendencias y proyecciones
- Benchmarking sectorial
- Identificación de value drivers clave
- Matriz de riesgos y oportunidades
- Roadmap estratégico financiero

Integra todos los aspectos financieros en una visión holística del negocio.`
      };

      return specificPrompts[type] || specificPrompts['comprehensive'];
    };

    const systemPrompt = `Eres un analista financiero experto. Tu tarea es analizar datos financieros y generar insights automáticos.

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido sin explicaciones adicionales.

${getAnalysisPrompt(analysisType)}

Para cada KPI, calcula el valor exacto basándote en los datos proporcionados. Sé específico, preciso y accionable en tus recomendaciones.`;

    const userPrompt = `Analiza estos datos financieros:

Tipo de análisis: ${analysisType}
${context ? `Contexto adicional: ${context}` : ''}
${periods ? `Períodos a analizar: ${periods.join(', ')}` : ''}

Datos:
${JSON.stringify(data, null, 2)}

Proporciona insights automáticos, cálculos precisos y recomendaciones.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n${userPrompt}`
          }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.content[0].text;
    
    // Parsear la respuesta JSON de Claude
    let analysisResult;
    try {
      // Limpiar posibles marcadores de código
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      // Si falla el parsing, crear estructura básica
      analysisResult = {
        insights: [],
        summary: "Error al procesar análisis automático",
        alerts: ["Error en el formato de respuesta"],
        calculations: {}
      };
    }

    // Validar estructura de respuesta
    const validatedResult = {
      insights: Array.isArray(analysisResult.insights) ? analysisResult.insights : [],
      summary: analysisResult.summary || "Análisis completado",
      alerts: Array.isArray(analysisResult.alerts) ? analysisResult.alerts : [],
      calculations: analysisResult.calculations || {},
      metadata: {
        analysisType,
        timestamp: new Date().toISOString(),
        dataSize: JSON.stringify(data).length
      }
    };

    return new Response(
      JSON.stringify(validatedResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in claude-financial-analyzer:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        insights: [],
        summary: "Error en análisis automático",
        alerts: ["Error del sistema de análisis"],
        calculations: {}
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});