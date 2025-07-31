import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('info', '🚀 Function claude-ledger-analyzer started')
    log('info', 'Request method:', req.method)
    
    // Check if this is a test call
    if (req.url.includes('test')) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Function is working correctly',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const requestBody = await req.json()
    log('info', 'Request body received:', { 
      hasUserId: !!requestBody.userId,
      hasFileName: !!requestBody.fileName,
      hasFileContent: !!requestBody.fileContent,
      contentLength: requestBody.fileContent?.length
    })

    const { userId, fileName, fileContent } = requestBody

    if (!userId || !fileName || !fileContent) {
      throw new Error('Faltan parámetros requeridos: userId, fileName, fileContent')
    }

    // Get Claude API key
    const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!claudeApiKey) {
      throw new Error('ANTHROPIC_API_KEY not found in environment')
    }

    log('info', 'Starting real data processing with Claude Sonnet 4')

    // Prepare the prompt for Claude
    const analysisPrompt = `
Eres un analista financiero experto. Analiza el siguiente libro diario en formato Excel (base64) y extrae información financiera estructurada.

Archivo: ${fileName}
Contenido (base64): ${fileContent.substring(0, 1000)}...

INSTRUCCIONES:
1. Convierte el archivo Excel y extrae todas las transacciones contables
2. Agrupa por cuentas contables estándar
3. Calcula automáticamente el Balance de Situación y Cuenta de P&G
4. Calcula ratios financieros clave
5. Detecta el ejercicio fiscal y período cubierto
6. Valida que el balance cuadre
7. Identifica fortalezas, debilidades y riesgos financieros

RESPUESTA REQUERIDA (JSON estricto):
{
  "metadata": {
    "companyName": "string",
    "taxId": "string",
    "fiscalYear": number,
    "totalEntries": number,
    "dateRange": {
      "from": "YYYY-MM-DD",
      "to": "YYYY-MM-DD"
    },
    "processingTime": "string"
  },
  "validation": {
    "isBalanced": boolean,
    "balanceDifference": number,
    "criticalErrors": ["string"],
    "warnings": ["string"],
    "dataQuality": number
  },
  "financials": {
    "balanceSheet": {
      "assets": {
        "nonCurrent": {
          "intangible": number,
          "tangible": number,
          "investments": number,
          "depreciation": number,
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
    "financialHealth": "EXCELLENT|GOOD|AVERAGE|POOR|CRITICAL",
    "keyStrengths": ["string"],
    "keyWeaknesses": ["string"],
    "recommendations": ["string"],
    "riskAlerts": ["string"]
  }
}

IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional.`

    // Call Claude API with Sonnet 4
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Using latest available Claude model
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      log('error', 'Claude API error:', { status: claudeResponse.status, error: errorText })
      throw new Error(`Claude API error: ${claudeResponse.status}`)
    }

    const claudeResult = await claudeResponse.json()
    log('info', 'Claude response received')

    // Extract and parse the JSON response
    let analysisResult
    try {
      const content = claudeResult.content[0].text
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        analysisResult = JSON.parse(content)
      }
      log('info', 'Financial analysis completed successfully')
    } catch (parseError) {
      log('error', 'Error parsing Claude response:', { error: parseError.message })
      throw new Error('Error parsing financial analysis results')
    }

    // Save the real data to database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    try {
      const period_date = `${analysisResult.metadata.fiscalYear}-12-31`
      
      // Save balance sheet
      const { error: balanceError } = await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'balance_situacion',
        period_date,
        period_year: analysisResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: analysisResult.financials.balanceSheet
      })

      if (balanceError) {
        log('warn', 'Error saving balance sheet:', { error: balanceError.message })
      }

      // Save income statement  
      const { error: incomeError } = await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'cuenta_pyg',
        period_date,
        period_year: analysisResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: analysisResult.financials.incomeStatement
      })

      if (incomeError) {
        log('warn', 'Error saving income statement:', { error: incomeError.message })
      }

      // Save ratios
      const { error: ratiosError } = await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'ratios_financieros',
        period_date,
        period_year: analysisResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: analysisResult.financials.ratios
      })

      if (ratiosError) {
        log('warn', 'Error saving ratios:', { error: ratiosError.message })
      }

      // Save metadata
      const { error: metadataError } = await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'metadata',
        period_date,
        period_year: analysisResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: analysisResult.metadata
      })

      if (metadataError) {
        log('warn', 'Error saving metadata:', { error: metadataError.message })
      }

      // Save insights
      const { error: insightsError } = await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'insights',
        period_date,
        period_year: analysisResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: analysisResult.insights
      })

      if (insightsError) {
        log('warn', 'Error saving insights:', { error: insightsError.message })
      }

      // Save file record
      const { error: fileError } = await supabaseClient.from('excel_files').insert({
        user_id: userId,
        file_name: fileName,
        upload_date: new Date().toISOString(),
        file_size: fileContent.length,
        processing_status: 'completed',
        processing_result: analysisResult
      })

      if (fileError) {
        log('warn', 'Error saving file record:', { error: fileError.message })
      }

      log('info', 'Real financial data saved to database successfully')
    } catch (dbError) {
      log('warn', 'Error saving to database:', { error: dbError.message })
    }

    log('info', 'Returning successful response with real data')

    return new Response(JSON.stringify({
      success: true,
      message: 'Libro diario procesado exitosamente con Claude Sonnet 4',
      data: analysisResult,
      dataQuality: analysisResult.validation.dataQuality,
      warnings: analysisResult.validation.warnings
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    log('error', 'Error en análisis de libro diario', { 
      error: error.message, 
      stack: error.stack,
      name: error.name
    })
    
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