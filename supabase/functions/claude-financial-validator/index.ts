import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALIDATION_TIMEOUT = 25000 // 25 segundos

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Validation timeout exceeded')), VALIDATION_TIMEOUT)
  })

  try {
    return await Promise.race([timeoutPromise, validateFinancialData(req)])
  } catch (error) {
    console.error('Error in claude-financial-validator:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stage: 'validation'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function validateFinancialData(req: Request) {
  console.log('Starting financial data validation...')
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
  
  if (!supabaseUrl || !supabaseServiceKey || !anthropicApiKey) {
    throw new Error('Missing required configuration')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { normalizedData, sessionId, validationType = 'comprehensive' } = await req.json()

  if (!normalizedData || !sessionId) {
    throw new Error('Missing required parameters')
  }

  // Autenticación
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

  console.log(`Validating session: ${sessionId} with type: ${validationType}`)

  // Preparar prompt especializado para validación financiera
  const systemPrompt = `Eres un auditor financiero experto especializado en validación de datos financieros. Tu tarea es analizar datos normalizados y detectar:

1. ERRORES CRÍTICOS: Inconsistencias matemáticas, balances que no cuadran, datos faltantes críticos
2. ADVERTENCIAS: Datos inusuales, ratios fuera de rango normal, posibles errores de tipeo
3. SCORES DE CONFIANZA: Califica la calidad y confiabilidad de los datos (0-1)
4. RECOMENDACIONES: Acciones específicas para mejorar la calidad de los datos

IMPORTANTE: 
- Verifica que el balance cuadre (Activos = Pasivos + Patrimonio)
- Calcula ratios financieros básicos y valida rangos razonables
- Identifica campos faltantes importantes para análisis financiero
- Proporciona scores de confianza precisos y justificados`

  const userPrompt = `Valida los siguientes datos financieros normalizados:

DATOS NORMALIZADOS: ${JSON.stringify(normalizedData, null, 2)}
TIPO DE VALIDACIÓN: ${validationType}

Realiza una validación exhaustiva y responde ÚNICAMENTE en formato JSON válido:

{
  "validation_results": {
    "overall_score": número_entre_0_y_1,
    "is_valid": boolean,
    "critical_errors": [
      {
        "type": "balance_mismatch|missing_data|calculation_error",
        "description": "descripción detallada del error",
        "location": "hoja.campo afectado",
        "severity": "critical|high|medium|low",
        "suggested_fix": "acción recomendada"
      }
    ],
    "warnings": [
      {
        "type": "unusual_value|missing_field|data_quality",
        "description": "descripción de la advertencia",
        "location": "ubicación específica",
        "impact": "impacto potencial",
        "recommendation": "recomendación"
      }
    ]
  },
  "financial_checks": {
    "balance_sheet_integrity": {
      "is_balanced": boolean,
      "difference_percentage": número,
      "confidence": número_entre_0_y_1
    },
    "data_completeness": {
      "missing_critical_fields": ["campo1", "campo2"],
      "completeness_score": número_entre_0_y_1,
      "required_for_analysis": ["campo_requerido1", "campo_requerido2"]
    },
    "ratio_validation": {
      "calculated_ratios": {
        "current_ratio": número_o_null,
        "debt_to_equity": número_o_null,
        "gross_margin": número_o_null
      },
      "ratio_warnings": ["descripción de ratios fuera de rango normal"]
    }
  },
  "confidence_scores": {
    "data_accuracy": número_entre_0_y_1,
    "structure_quality": número_entre_0_y_1,
    "completeness": número_entre_0_y_1,
    "overall_confidence": número_entre_0_y_1
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "data_quality|structure|completeness",
      "action": "acción específica recomendada",
      "expected_improvement": "mejora esperada"
    }
  ],
  "metadata": {
    "validation_type": "${validationType}",
    "timestamp": "${new Date().toISOString()}",
    "model": "claude-sonnet-4-20250514",
    "sheets_validated": número,
    "fields_validated": número
  }
}`

  console.log('Calling Claude for financial validation...')

  // Llamar a Claude API con reintentos
  let validationResult
  const maxRetries = 2
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 6000,
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
        console.error(`Claude API error (attempt ${attempt}):`, error)
        
        if (attempt === maxRetries) {
          throw new Error(`Claude API error: ${response.status}`)
        }
        continue
      }

      const result = await response.json()
      console.log('Claude validation response received')

      // Parsear respuesta de Claude con manejo robusto de errores
      try {
        const content = result.content[0].text.trim()
        
        // Extraer solo el JSON si hay texto adicional
        const jsonStart = content.indexOf('{')
        const jsonEnd = content.lastIndexOf('}') + 1
        
        if (jsonStart === -1 || jsonEnd === 0) {
          throw new Error('No JSON found in Claude response')
        }
        
        const jsonContent = content.substring(jsonStart, jsonEnd)
        validationResult = JSON.parse(jsonContent)
        break // Éxito, salir del loop de reintentos
        
      } catch (parseError) {
        console.error(`Failed to parse Claude response (attempt ${attempt}):`, parseError)
        console.error('Claude response content:', result.content[0].text.substring(0, 500))
        
        if (attempt === maxRetries) {
          // Crear resultado por defecto si Claude falla
          validationResult = createDefaultValidationResult(normalizedData)
          console.log('Using default validation result due to Claude parsing failure')
        }
      }
    } catch (fetchError) {
      console.error(`Claude API fetch error (attempt ${attempt}):`, fetchError)
      
      if (attempt === maxRetries) {
        validationResult = createDefaultValidationResult(normalizedData)
        console.log('Using default validation result due to Claude API failure')
      }
    }
  }

  // Actualizar sesión con resultados de validación
  const { error: updateError } = await supabase
    .from('test_sessions')
    .update({
      analysis_status: 'completed',
      analysis_results: validationResult,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Failed to update session with validation results:', updateError)
  }

  console.log(`Financial validation completed for session: ${sessionId}`)

  return new Response(
    JSON.stringify({
      success: true,
      validation_results: validationResult,
      nextStage: 'dashboard'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function createDefaultValidationResult(normalizedData: any) {
  const sheetsCount = Object.keys(normalizedData).length
  const fieldsCount = Object.values(normalizedData).reduce((acc: number, sheet: any) => 
    acc + Object.keys(sheet.fields || {}).length, 0)
  
  return {
    validation_results: {
      overall_score: 0.6,
      is_valid: true,
      critical_errors: [],
      warnings: [
        {
          type: "validation_incomplete",
          description: "Validación automática no completada - se requiere revisión manual",
          location: "system",
          impact: "medium",
          recommendation: "Revisar datos manualmente antes de continuar con el análisis"
        }
      ]
    },
    financial_checks: {
      balance_sheet_integrity: {
        is_balanced: null,
        difference_percentage: null,
        confidence: 0.5
      },
      data_completeness: {
        missing_critical_fields: [],
        completeness_score: 0.7,
        required_for_analysis: []
      },
      ratio_validation: {
        calculated_ratios: {
          current_ratio: null,
          debt_to_equity: null,
          gross_margin: null
        },
        ratio_warnings: []
      }
    },
    confidence_scores: {
      data_accuracy: 0.6,
      structure_quality: 0.7,
      completeness: 0.6,
      overall_confidence: 0.6
    },
    recommendations: [
      {
        priority: "medium",
        category: "data_quality",
        action: "Realizar validación manual de los datos extraídos",
        expected_improvement: "Mayor confianza en el análisis financiero"
      }
    ],
    metadata: {
      validation_type: "fallback",
      timestamp: new Date().toISOString(),
      model: "claude-sonnet-4-20250514",
      sheets_validated: sheetsCount,
      fields_validated: fieldsCount,
      fallback_reason: "Claude validation failed - using default result"
    }
  }
}