
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { file_id, analysis_type = 'complete' } = await req.json()

    // Obtener los datos financieros del archivo
    const { data: financialData, error: dataError } = await supabaseClient
      .from('financial_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('excel_file_id', file_id)

    if (dataError || !financialData) {
      return new Response('No financial data found', { status: 404, headers: corsHeaders })
    }

    // Preparar los datos para Claude
    const dataForAnalysis = financialData.reduce((acc, item) => {
      acc[item.data_type] = item.data_content
      return acc
    }, {})

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response('Anthropic API key not configured', { status: 500, headers: corsHeaders })
    }

    const analysisPrompt = `Como experto en análisis financiero, analiza los siguientes datos y proporciona:

1. **DIAGNÓSTICO FINANCIERO COMPLETO**:
   - Situación de liquidez actual
   - Análisis de solvencia y endeudamiento
   - Evaluación de rentabilidad
   - Eficiencia operativa

2. **CÁLCULOS AUTOMÁTICOS**:
   - Ratios financieros clave
   - Indicadores de performance
   - Métricas de riesgo
   - EVA (Economic Value Added)

3. **RECOMENDACIONES ESTRATÉGICAS**:
   - Áreas de mejora identificadas
   - Acciones correctivas sugeridas
   - Oportunidades de optimización
   - Alertas de riesgo

4. **PROYECCIONES Y ESCENARIOS**:
   - Tendencias identificadas
   - Proyecciones a 3 años
   - Análisis de sensibilidad
   - Escenarios optimista/realista/pesimista

Datos financieros a analizar:
${JSON.stringify(dataForAnalysis, null, 2)}

Devuelve el análisis en formato JSON estructurado:
{
  "diagnostico": {
    "resumen_ejecutivo": "...",
    "fortalezas": [...],
    "debilidades": [...],
    "puntuacion_general": 0-100
  },
  "ratios_calculados": {
    "liquidez": {...},
    "solvencia": {...},
    "rentabilidad": {...},
    "endeudamiento": {...}
  },
  "recomendaciones": [
    {
      "categoria": "...",
      "prioridad": "alta|media|baja",
      "descripcion": "...",
      "impacto_esperado": "..."
    }
  ],
  "alertas": [
    {
      "tipo": "riesgo|oportunidad",
      "severidad": "critica|alta|media|baja",
      "mensaje": "...",
      "accion_recomendada": "..."
    }
  ],
  "proyecciones": {
    "tendencias": {...},
    "escenarios": {...},
    "recomendaciones_inversion": "..."
  }
}`

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: analysisPrompt
        }]
      })
    })

    const anthropicResult = await anthropicResponse.json()
    let analysisData = {}
    
    try {
      const content = anthropicResult.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Error parsing Claude analysis:', e)
      analysisData = { 
        error: 'No se pudo generar el análisis',
        raw_response: anthropicResult.content[0]?.text?.substring(0, 1000) 
      }
    }

    // Guardar el análisis en la base de datos
    const { data: analysisRecord, error: analysisError } = await supabaseClient
      .from('financial_data')
      .insert({
        user_id: user.id,
        excel_file_id: file_id,
        data_type: 'claude_analysis',
        period_type: 'analysis',
        period_date: new Date().toISOString().split('T')[0],
        data_content: analysisData
      })
      .select()
      .single()

    if (analysisError) {
      console.error('Error saving analysis:', analysisError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: analysisData,
        message: 'Análisis financiero completado con Claude'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in financial-analysis function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Error en análisis financiero con Claude'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
