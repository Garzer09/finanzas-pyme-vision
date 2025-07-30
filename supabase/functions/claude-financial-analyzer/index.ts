import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinancialAnalysisRequest {
  data: any;
  analysisType: 'balance' | 'pyg' | 'ratios' | 'comprehensive';
  periods?: string[];
  context?: string;
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
    const { data, analysisType, periods, context }: FinancialAnalysisRequest = await req.json();

    const systemPrompt = `Eres un analista financiero experto. Tu tarea es analizar datos financieros y generar insights automáticos.

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido sin explicaciones adicionales.

Estructura de respuesta requerida:
{
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
}

Tipos de análisis:
- balance: Analiza liquidez, solvencia, estructura patrimonial
- pyg: Analiza rentabilidad, márgenes, eficiencia operativa  
- ratios: Calcula ratios financieros clave
- comprehensive: Análisis completo con todos los aspectos

Para cada KPI, calcula el valor exacto basándote en los datos proporcionados.`;

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
        model: 'claude-3-5-sonnet-20241022',
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