import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuración optimizada para Claude 4 Sonnet con máximos tokens
const CLAUDE_CONFIG = {
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 16000, // Máximo disponible para archivos grandes
  temperature: 0.1
}

function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

const COMPREHENSIVE_LEDGER_PROMPT = `Eres un experto analista financiero especializado en contabilidad española. Tu misión es analizar un libro diario (journal entries) y generar automáticamente TODOS los estados financieros, ratios y análisis completo.

🚨 VALIDACIONES CRÍTICAS OBLIGATORIAS:
1. BALANCE CONTABLE: Suma total de Debe = Suma total de Haber (diferencia máxima: 0€)
2. TESORERÍA POSITIVA: Las cuentas de caja/bancos (57x) no pueden ser negativas
3. EQUILIBRIO PATRIMONIAL: Activo = Pasivo + Patrimonio Neto
4. COHERENCIA TEMPORAL: Todas las fechas deben estar en el mismo ejercicio fiscal

📋 PROCESO DE ANÁLISIS:
1. DETECCIÓN DE ESTRUCTURA:
   - Identificar columnas: Fecha, Código Cuenta, Nombre Cuenta, Debe, Haber
   - Detectar Plan General Contable español (códigos 9 dígitos)
   - Extraer información de empresa desde encabezados

2. PROCESAMIENTO DE ASIENTOS:
   - Agrupar todos los movimientos por cuenta contable
   - Calcular saldo final de cada cuenta:
     * Cuentas de Activo (2,3) y Gastos (6): Saldo = Debe - Haber  
     * Cuentas de Pasivo (1,4,5) e Ingresos (7): Saldo = Haber - Debe
   - Casos especiales:
     * Cuentas 40,41,50,51,52 = Pasivos (Haber - Debe)
     * Amortización acumulada (28x) = Negativo en Activo

3. GENERACIÓN DE ESTADOS FINANCIEROS:
   
   BALANCE DE SITUACIÓN:
   ACTIVO:
   - No Corriente: Grupos 20-29 (con amortización 28x como negativo)
   - Corriente: 30-39 (existencias), 43,44,47 (deudores), 57 (tesorería)
   
   PASIVO Y PATRIMONIO:
   - Patrimonio Neto: Grupos 10-15
   - Pasivo No Corriente: Grupos 16-19  
   - Pasivo Corriente: 40,41,50-52, otros pasivos
   
   CUENTA DE RESULTADOS:
   - Ingresos: Grupos 70-75
   - Gastos: Grupos 60-68
   - Resultado Financiero: 76,77 (ingresos) - 66,67 (gastos)

4. CÁLCULO DE RATIOS:
   - Liquidez: Ratio Corriente, Ratio Ácido, Ratio Tesorería
   - Solvencia: Ratio Endeudamiento, Deuda/Patrimonio
   - Rentabilidad: ROE, ROA, Margen Neto, Margen EBITDA
   - Actividad: Rotación Activos, Días Inventario

5. VALIDACIONES Y ALERTAS:
   - Verificar todas las validaciones críticas
   - Detectar ratios fuera de rangos normales
   - Identificar inconsistencias contables

ESTRUCTURA JSON DE RESPUESTA OBLIGATORIA:
{
  "metadata": {
    "companyName": "string",
    "taxId": "string", 
    "fiscalYear": 2024,
    "totalEntries": number,
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    },
    "processingTime": "segundos"
  },
  "validation": {
    "isBalanced": boolean,
    "balanceDifference": 0,
    "criticalErrors": [
      {
        "code": "NEGATIVE_CASH | UNBALANCED_JOURNAL | EQUITY_MISMATCH",
        "message": "Descripción del error",
        "amount": number,
        "suggestion": "Recomendación específica"
      }
    ],
    "warnings": [
      {
        "code": "UNUSUAL_RATIO",
        "message": "Ratio fuera de rango normal",
        "value": number,
        "normalRange": "x - y"
      }
    ],
    "dataQuality": 85 // 0-100 score
  },
  "financials": {
    "balanceSheet": {
      "assets": {
        "nonCurrent": {
          "intangible": number,
          "tangible": number,
          "investments": number,
          "depreciation": number, // negativo
          "total": number
        },
        "current": {
          "inventory": number,
          "receivables": number,
          "cash": number,
          "total": number
        },
        "totalAssets": number
      },
      "liabilities": {
        "equity": {
          "capital": number,
          "reserves": number,
          "retainedEarnings": number,
          "currentYearProfit": number,
          "total": number
        },
        "nonCurrent": {
          "longTermDebt": number,
          "total": number
        },
        "current": {
          "suppliers": number,
          "otherPayables": number,
          "shortTermDebt": number,
          "total": number
        },
        "totalLiabilities": number,
        "totalLiabilitiesAndEquity": number
      }
    },
    "incomeStatement": {
      "revenue": {
        "sales": number,
        "otherIncome": number,
        "total": number
      },
      "expenses": {
        "costOfGoodsSold": number,
        "personnel": number,
        "otherOperating": number,
        "depreciation": number,
        "financial": number,
        "total": number
      },
      "ebit": number,
      "ebt": number,
      "taxes": number,
      "netProfit": number
    },
    "ratios": {
      "liquidity": {
        "currentRatio": number,
        "quickRatio": number,
        "cashRatio": number
      },
      "leverage": {
        "debtToEquity": number,
        "debtRatio": number,
        "equityRatio": number
      },
      "profitability": {
        "roe": number,
        "roa": number,
        "netMargin": number,
        "ebitdaMargin": number
      },
      "activity": {
        "assetTurnover": number,
        "inventoryDays": number,
        "receivableDays": number
      }
    }
  },
  "insights": {
    "financialHealth": "EXCELLENT | GOOD | AVERAGE | POOR | CRITICAL",
    "keyStrengths": ["string array"],
    "keyWeaknesses": ["string array"],
    "recommendations": ["string array"],
    "riskAlerts": ["string array"]
  }
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON válido, sin explicaciones adicionales.`

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('info', '🚀 Iniciando análisis completo de libro diario')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY no configurada')
    }

    const requestBody = await req.json()
    const { userId, fileName, fileContent } = requestBody
    log('info', 'Archivo recibido', { fileName, userId, contentLength: fileContent?.length })

    if (!userId || !fileName || !fileContent) {
      throw new Error('Faltan parámetros requeridos: userId, fileName, fileContent')
    }

    // Verificar que el contenido no esté vacío
    if (fileContent.length < 100) {
      throw new Error('El archivo parece estar vacío o corrupto')
    }

    // Llamar a Claude con el prompt especializado
    log('info', 'Iniciando análisis con Claude 4 Sonnet', { 
      model: CLAUDE_CONFIG.model, 
      maxTokens: CLAUDE_CONFIG.max_tokens 
    })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_CONFIG.model,
        max_tokens: CLAUDE_CONFIG.max_tokens,
        temperature: CLAUDE_CONFIG.temperature,
        messages: [{
          role: 'user',
          content: `${COMPREHENSIVE_LEDGER_PROMPT}\n\nArchivo a analizar (nombre: ${fileName}):\n${fileContent.substring(0, 50000)}`
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      log('error', 'Error de Claude API', { status: response.status, error: errorText })
      throw new Error(`Error de Claude API: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    log('info', 'Respuesta de Claude recibida', { contentLength: result.content[0]?.text?.length })

    // Parsear respuesta JSON de Claude
    let analysisResult
    try {
      const content = result.content[0]?.text || ''
      // Extraer JSON del contenido si viene con texto adicional
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonContent = jsonMatch ? jsonMatch[0] : content
      analysisResult = JSON.parse(jsonContent)
      log('info', 'Análisis parseado correctamente')
    } catch (parseError) {
      log('error', 'Error parseando respuesta de Claude', { error: parseError.message })
      
      // Si no se puede parsear el JSON, devolver un resultado básico
      analysisResult = {
        success: false,
        error: 'PARSE_ERROR',
        message: 'Error procesando la respuesta del análisis',
        validation: {
          dataQuality: 30,
          criticalErrors: [
            {
              code: 'PARSE_ERROR',
              message: 'No se pudo interpretar la respuesta del análisis'
            }
          ]
        }
      }
    }

    // Validar si hay errores críticos
    if (analysisResult.validation?.criticalErrors?.length > 0) {
      log('error', 'Errores críticos detectados', { errors: analysisResult.validation.criticalErrors })
      return new Response(JSON.stringify({
        success: false,
        error: 'CRITICAL_ERRORS',
        message: 'Se detectaron errores críticos que deben corregirse',
        errors: analysisResult.validation.criticalErrors,
        suggestions: analysisResult.validation.criticalErrors.map(e => e.suggestion).filter(Boolean)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Si el análisis fue exitoso, intentar guardar en la base de datos
    if (analysisResult.financials) {
      try {
        const period_date = `${analysisResult.metadata?.fiscalYear || 2024}-12-31`
        
        // Guardar balance
        if (analysisResult.financials.balanceSheet) {
          await supabaseClient.from('financial_data').insert({
            user_id: userId,
            data_type: 'balance_situacion',
            period_date,
            period_year: analysisResult.metadata?.fiscalYear || 2024,
            period_type: 'annual',
            data_content: analysisResult.financials.balanceSheet
          })
        }

        // Guardar P&G
        if (analysisResult.financials.incomeStatement) {
          await supabaseClient.from('financial_data').insert({
            user_id: userId,
            data_type: 'cuenta_pyg',
            period_date,
            period_year: analysisResult.metadata?.fiscalYear || 2024,
            period_type: 'annual',
            data_content: analysisResult.financials.incomeStatement
          })
        }

        // Guardar ratios
        if (analysisResult.financials.ratios) {
          await supabaseClient.from('financial_data').insert({
            user_id: userId,
            data_type: 'ratios_financieros',
            period_date,
            period_year: analysisResult.metadata?.fiscalYear || 2024,
            period_type: 'annual',
            data_content: analysisResult.financials.ratios
          })
        }

        log('info', 'Análisis guardado en base de datos')
      } catch (dbError) {
        log('warn', 'Error guardando en base de datos', { error: dbError.message })
        // No falla el proceso completo si hay error en BD, solo se registra
      }
    }

    log('info', 'Análisis completo finalizado exitosamente')

    return new Response(JSON.stringify({
      success: true,
      message: 'Libro diario procesado exitosamente',
      data: analysisResult,
      dataQuality: analysisResult.validation?.dataQuality || 75,
      warnings: analysisResult.validation?.warnings || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    log('error', 'Error en análisis de libro diario', { error: error.message, stack: error.stack })
    return new Response(JSON.stringify({
      success: false,
      error: 'PROCESSING_ERROR',
      message: error.message || 'Error procesando el libro diario'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})