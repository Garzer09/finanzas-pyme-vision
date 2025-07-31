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

    const { sessionId, fileData, documentTypes = [] } = await req.json()

    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    console.log(`Starting EDA for session: ${sessionId}`)

    // Function is configured with verify_jwt = false, so we don't need to check user auth

    // Prepare EDA prompt
    const systemPrompt = `Eres un experto en análisis exploratorio de datos (EDA) especializado en datos financieros. Tu tarea es analizar la estructura, calidad y contenido de datos financieros para mapear correctamente los campos disponibles.

OBJETIVO: Realizar un análisis exploratorio detallado para identificar:
1. Estructura de datos y formato
2. Campos financieros disponibles y su contenido
3. Calidad y completitud de los datos
4. Patrones, inconsistencias y valores atípicos
5. Mapeo de campos a conceptos financieros estándar

IMPORTANTE: 
- Identifica TODOS los campos disponibles, aunque tengan nombres no estándar
- Detecta variaciones en nomenclatura (ej: "Total Activo" vs "Activo Total")
- Evalúa la calidad de cada campo
- Sugiere mapeos a conceptos financieros estándar`

    const documentTypesText = documentTypes.length > 0 
      ? `TIPOS DE DOCUMENTO ESPERADOS: ${documentTypes.join(', ')}`
      : 'TIPOS DE DOCUMENTO: No especificados'

    const userPrompt = `Realiza un análisis exploratorio completo de los siguientes datos financieros:

${documentTypesText}

DATOS DETECTADOS:
${JSON.stringify(fileData, null, 2)}

Genera un análisis EDA completo que incluya:

1. ESTRUCTURA DE DATOS:
   - Hojas detectadas y su propósito probable
   - Campos disponibles por hoja
   - Tipos de datos identificados

2. MAPEO DE CAMPOS:
   - Mapeo de campos a conceptos financieros estándar
   - Campos con nomenclatura no estándar
   - Campos que podrían contener datos duplicados

3. CALIDAD DE DATOS:
   - Completitud por campo (% de valores no nulos)
   - Consistencia de formatos
   - Valores atípicos o sospechosos

4. IDENTIFICACIÓN DE CONTENIDO:
   - Qué tipo de información financiera está disponible
   - Períodos de tiempo cubiertos
   - Monedas y unidades utilizadas

5. RECOMENDACIONES:
   - Cómo proceder con el análisis
   - Campos prioritarios para el análisis
   - Limitaciones identificadas

CRÍTICO: Responde ÚNICAMENTE en formato JSON válido. NO agregues texto adicional.

Estructura JSON requerida:
{
  "eda_summary": {
    "total_sheets": numero,
    "total_fields": numero,
    "data_quality_score": numero_entre_0_y_100,
    "coverage_score": numero_entre_0_y_100
  },
  "sheets_analysis": [
    {
      "sheet_name": "nombre_hoja",
      "sheet_type": "balance|pyg|cash_flow|ratios|other",
      "confidence": numero_entre_0_y_1,
      "fields_count": numero,
      "data_quality": numero_entre_0_y_100,
      "coverage": ["concepto1", "concepto2"]
    }
  ],
  "field_mapping": {
    "identified_concepts": {
      "activos_corrientes": ["campo1", "campo2"],
      "activos_no_corrientes": ["campo3"],
      "pasivos_corrientes": ["campo4"],
      "pasivos_no_corrientes": ["campo5"],
      "patrimonio": ["campo6"],
      "ingresos": ["campo7"],
      "costos": ["campo8"],
      "gastos_operativos": ["campo9"],
      "gastos_financieros": ["campo10"],
      "utilidad_neta": ["campo11"]
    },
    "unmapped_fields": ["campo_sin_mapear1", "campo_sin_mapear2"],
    "potential_duplicates": [["campo1", "campo2"]]
  },
  "data_quality": {
    "completeness": {
      "overall": numero_entre_0_y_100,
      "by_concept": {
        "activos": numero_entre_0_y_100,
        "pasivos": numero_entre_0_y_100,
        "patrimonio": numero_entre_0_y_100,
        "ingresos": numero_entre_0_y_100,
        "gastos": numero_entre_0_y_100
      }
    },
    "consistency": numero_entre_0_y_100,
    "issues": [
      {
        "type": "missing_data|format_issue|inconsistency",
        "field": "nombre_campo",
        "description": "descripción del problema",
        "severity": "low|medium|high"
      }
    ]
  },
  "insights": [
    {
      "type": "coverage|quality|structure|recommendation",
      "title": "título del insight",
      "description": "descripción detallada",
      "impact": "impacto en el análisis",
      "priority": "low|medium|high"
    }
  ],
  "recommendations": {
    "analysis_feasibility": "excellent|good|limited|poor",
    "dashboard_modules": ["modulo1", "modulo2"],
    "missing_data": ["tipo_dato1", "tipo_dato2"],
    "next_steps": ["paso1", "paso2"]
  },
  "metadata": {
    "analysis_timestamp": "${new Date().toISOString()}",
    "model": "claude-3-5-sonnet-20241022",
    "confidence": numero_entre_0_y_1,
    "document_types": ${JSON.stringify(documentTypes)}
  }
}`

    console.log('Calling Anthropic API for EDA...')

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
    console.log('EDA analysis completed')

    // Parse Claude's response
    let edaResult
    try {
      const content = result.content[0].text
      edaResult = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse Claude EDA response:', parseError)
      throw new Error('Invalid EDA response format from Claude')
    }

    // Update test session with EDA results
    const { error: updateError } = await supabase
      .from('test_sessions')
      .update({
        eda_results: edaResult,
        eda_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Failed to update session with EDA:', updateError)
    }

    console.log(`EDA completed for session: ${sessionId}`)

    return new Response(
      JSON.stringify(edaResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in claude-eda-analyzer:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})