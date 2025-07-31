import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey || !anthropicApiKey) {
      throw new Error('Missing required configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { sessionId, analysisType = 'comprehensive' } = await req.json()

    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    console.log(`Analyzing session: ${sessionId} with type: ${analysisType}`)

    // Get user from authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get test session data
    const { data: session, error: sessionError } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      throw new Error('Test session not found')
    }

    // Prepare analysis prompt
    const systemPrompt = `Eres un analista financiero experto especializado en análisis cuantitativo de estados financieros. Tu tarea es analizar datos financieros y generar insights precisos y cálculos exactos.

IMPORTANTE: 
- Calcula métricas financieras con precisión matemática
- Proporciona fórmulas exactas y justificaciones
- Identifica patrones, tendencias y alertas críticas
- Usa valores numéricos realistas y consistentes
- Genera recomendaciones específicas y accionables`

    const userPrompt = `Analiza los siguientes datos financieros detectados:

ARCHIVO: ${session.file_name}
HOJAS DETECTADAS: ${JSON.stringify(session.detected_sheets)}
CAMPOS DETECTADOS: ${JSON.stringify(session.detected_fields)}

TIPO DE ANÁLISIS: ${analysisType}

Genera un análisis financiero completo que incluya:
1. Cálculos de KPIs financieros principales
2. Interpretación de cada métrica
3. Tendencias identificadas
4. Alertas críticas (si las hay)
5. Recomendaciones específicas

Responde ÚNICAMENTE en formato JSON con esta estructura exacta:
{
  "insights": [
    {
      "kpi": "nombre_del_kpi",
      "value": numero,
      "formula": "fórmula matemática",
      "interpretation": "interpretación detallada",
      "trend": "positive|negative|stable",
      "benchmark": "valor de referencia del sector (opcional)",
      "recommendations": ["recomendación 1", "recomendación 2"]
    }
  ],
  "summary": "resumen ejecutivo del análisis",
  "alerts": [
    {
      "type": "warning|critical|info",
      "title": "título de la alerta",
      "description": "descripción detallada",
      "impact": "impacto potencial",
      "action": "acción recomendada"
    }
  ],
  "calculations": {
    "key_metrics": {
      "roe": numero,
      "roa": numero,
      "ratio_corriente": numero,
      "ratio_deuda": numero,
      "margen_bruto": numero,
      "margen_operativo": numero
    }
  },
  "metadata": {
    "analysisType": "${analysisType}",
    "timestamp": "${new Date().toISOString()}",
    "model": "claude-opus-4-20250514",
    "confidence": numero_entre_0_y_1
  }
}`

    console.log('Calling Anthropic API...')

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.1,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Anthropic API error:', error)
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('Anthropic API response received')

    // Parse Claude's response
    let analysisResult
    try {
      const content = result.content[0].text
      analysisResult = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError)
      throw new Error('Invalid response format from Claude')
    }

    // Update test session with analysis results
    const { error: updateError } = await supabase
      .from('test_sessions')
      .update({
        analysis_status: 'completed',
        analysis_results: analysisResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Failed to update session:', updateError)
    }

    console.log(`Analysis completed for session: ${sessionId}`)

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in claude-testing-analyzer:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})