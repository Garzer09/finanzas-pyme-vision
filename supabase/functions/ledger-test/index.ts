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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('info', '🚀 Real Data Processing Function started')
    
    const body = await req.json()
    const { userId, fileName, fileContent } = body
    
    if (!userId || !fileName || !fileContent) {
      throw new Error('Faltan parámetros requeridos: userId, fileName, fileContent')
    }
    
    log('info', 'Processing real Excel file:', { fileName, userId, contentLength: fileContent.length })
    
    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not found')
    }
    
    log('info', 'Starting real analysis with GPT-4.1-2025-04-14')

    // Optimized financial analysis prompt for GPT-4.1
    const analysisPrompt = `
Eres un experto analista financiero especializado en el Plan General Contable español (PGC). 
Analiza este libro diario completo y genera estados financieros estructurados.

ARCHIVO EXCEL BASE64: ${fileContent}
NOMBRE: ${fileName}

INSTRUCCIONES CRÍTICAS:
1. Extrae TODAS las entradas del libro diario
2. Clasifica cuentas según el PGC español (códigos de 9 dígitos)
3. Calcula balances: 
   - Activos/Gastos (grupos 2,3,6): Debe - Haber
   - Pasivos/Ingresos (grupos 1,4,5,7): Haber - Debe
4. Genera estados financieros completos
5. Calcula ratios financieros estándar
6. Valida que el balance cuadre

RESPONDE ÚNICAMENTE CON ESTE JSON EXACTO:
{
  "metadata": {
    "companyName": "string",
    "taxId": "string", 
    "fiscalYear": 2024,
    "currency": "EUR",
    "accountingStandard": "PGC",
    "totalEntries": number,
    "dateRange": {"from": "2024-01-01", "to": "2024-12-31"}
  },
  "validation": {
    "isBalanced": true,
    "totalDebits": number,
    "totalCredits": number,
    "balanceDifference": number,
    "criticalErrors": [],
    "warnings": [],
    "dataQuality": 95
  },
  "financials": {
    "balanceSheet": {
      "assets": {
        "nonCurrent": {"intangible": 0, "tangible": 0, "investments": 0, "depreciation": 0, "total": 0},
        "current": {"inventory": 0, "receivables": 0, "cash": 0, "other": 0, "total": 0},
        "totalAssets": 0
      },
      "liabilitiesAndEquity": {
        "equity": {"shareCapital": 0, "reserves": 0, "retainedEarnings": 0, "currentYearProfit": 0, "total": 0},
        "nonCurrentLiabilities": {"longTermDebt": 0, "other": 0, "total": 0},
        "currentLiabilities": {"suppliers": 0, "shortTermDebt": 0, "other": 0, "total": 0},
        "totalLiabilities": 0,
        "totalLiabilitiesAndEquity": 0
      }
    },
    "incomeStatement": {
      "revenue": {"sales": 0, "otherIncome": 0, "total": 0},
      "expenses": {"cogs": 0, "personnel": 0, "otherOperating": 0, "depreciation": 0, "total": 0},
      "ebitda": 0, "ebit": 0,
      "financialResult": {"income": 0, "expenses": 0, "net": 0},
      "ebt": 0, "taxes": 0, "netProfit": 0
    },
    "ratios": {
      "liquidity": {"currentRatio": 0, "quickRatio": 0, "cashRatio": 0},
      "leverage": {"debtToEquity": 0, "debtRatio": 0, "equityRatio": 0},
      "profitability": {"roe": 0, "roa": 0, "netMargin": 0, "ebitdaMargin": 0},
      "activity": {"assetTurnover": 0, "inventoryDays": 0, "receivableDays": 0}
    }
  }
}

VALIDACIONES REQUERIDAS:
- Suma(Debe) = Suma(Haber) en el libro
- Activo Total = Pasivo Total + Patrimonio Neto
- Todos los importes deben ser números positivos
- El beneficio neto debe coincidir entre PyG y balance

RESPUESTA: SOLO JSON válido, sin texto adicional.`

    // Call OpenAI GPT-4.1-2025-04-14 API
    log('info', 'Calling OpenAI GPT-4.1 API...')
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        max_tokens: 65536,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'Eres un experto analista financiero del Plan General Contable español. Analiza libros diarios y genera estados financieros precisos. Responde ÚNICAMENTE con JSON válido.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ]
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      log('error', 'OpenAI API error:', { status: openaiResponse.status, error: errorText })
      
      // Enhanced error handling for token limits
      if (openaiResponse.status === 429) {
        const errorDetails = JSON.parse(errorText)
        if (errorDetails.error?.code === 'rate_limit_exceeded') {
          log('error', 'Token limit exceeded. File too large for processing.')
          throw new Error('El archivo es demasiado grande. Por favor, divídelo en partes más pequeñas.')
        }
      }
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiResult = await openaiResponse.json()
    log('info', 'GPT-4.1 response received successfully')

    // Parse JSON response with enhanced error handling
    let analysisResult
    try {
      const content = openaiResult.choices[0].message.content.trim()
      log('info', 'Raw response length:', content.length)
      
      // Multiple JSON extraction strategies
      let jsonContent = content
      
      // Strategy 1: Direct JSON parsing
      try {
        analysisResult = JSON.parse(jsonContent)
      } catch {
        // Strategy 2: Extract JSON between code blocks
        const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i)
        if (codeBlockMatch) {
          jsonContent = codeBlockMatch[1]
          analysisResult = JSON.parse(jsonContent)
        } else {
          // Strategy 3: Find JSON object in text
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonContent = jsonMatch[0]
            analysisResult = JSON.parse(jsonContent)
          } else {
            throw new Error('No valid JSON found in response')
          }
        }
      }
      
      // Validate essential structure
      if (!analysisResult.metadata || !analysisResult.financials || !analysisResult.validation) {
        throw new Error('Missing required JSON structure components')
      }
      
      log('info', 'Financial analysis completed successfully with GPT-4.1')
      log('info', 'Analysis summary:', {
        company: analysisResult.metadata?.companyName,
        year: analysisResult.metadata?.fiscalYear,
        totalAssets: analysisResult.financials?.balanceSheet?.assets?.totalAssets,
        netProfit: analysisResult.financials?.incomeStatement?.netProfit,
        balanced: analysisResult.validation?.isBalanced
      })
      
    } catch (parseError) {
      log('error', 'Error parsing GPT-4.1 response:', {
        error: parseError.message,
        rawResponse: openaiResult.choices[0].message.content.substring(0, 500)
      })
      throw new Error('Error parsing financial analysis results: ' + parseError.message)
    }

    // Initialize Supabase client with enhanced configuration
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    try {
      const fiscalYear = analysisResult.metadata.fiscalYear || new Date().getFullYear()
      const period_date = `${fiscalYear}-12-31`
      
      log('info', 'Starting database save operation', { userId, fiscalYear })
      
      // Delete existing data for this user and year to avoid duplicates
      const { error: deleteError } = await supabaseClient
        .from('financial_data')
        .delete()
        .eq('user_id', userId)
        .eq('period_year', fiscalYear)

      if (deleteError) log('warn', 'Error deleting existing data:', deleteError)

      // Prepare data records with validation
      const dataRecords = [
        {
          user_id: userId,
          data_type: 'balance_situacion',
          period_date,
          period_year: fiscalYear,
          period_type: 'annual',
          data_content: analysisResult.financials.balanceSheet || {}
        },
        {
          user_id: userId,
          data_type: 'cuenta_pyg',
          period_date,
          period_year: fiscalYear,
          period_type: 'annual',
          data_content: analysisResult.financials.incomeStatement || {}
        },
        {
          user_id: userId,
          data_type: 'ratios_financieros',
          period_date,
          period_year: fiscalYear,
          period_type: 'annual',
          data_content: analysisResult.financials.ratios || {}
        },
        {
          user_id: userId,
          data_type: 'metadata',
          period_date,
          period_year: fiscalYear,
          period_type: 'annual',
          data_content: analysisResult.metadata || {}
        }
      ]

      // Batch insert financial data
      const { error: insertError } = await supabaseClient
        .from('financial_data')
        .insert(dataRecords)

      if (insertError) {
        log('error', 'Error inserting financial data:', insertError)
        throw new Error(`Database insert error: ${insertError.message}`)
      }

      // Save file record with enhanced metadata
      const { error: fileError } = await supabaseClient.from('excel_files').insert({
        user_id: userId,
        file_name: fileName,
        file_path: `uploads/${userId}/${fileName}`,
        upload_date: new Date().toISOString(),
        file_size: fileContent.length,
        processing_status: 'completed',
        processing_result: {
          ...analysisResult,
          processedWith: 'GPT-4.1-2025-04-14',
          processedAt: new Date().toISOString()
        }
      })

      if (fileError) log('warn', 'Error saving file record:', fileError)

      // Verify data was saved correctly
      const { data: verifyData, error: verifyError } = await supabaseClient
        .from('financial_data')
        .select('data_type, period_year')
        .eq('user_id', userId)
        .eq('period_year', fiscalYear)

      if (verifyError) {
        log('warn', 'Error verifying saved data:', verifyError)
      } else {
        log('info', 'Data verification successful:', { 
          recordsInserted: verifyData?.length || 0,
          types: verifyData?.map(d => d.data_type) || []
        })
      }

      log('info', 'Financial data successfully saved to database')
      
    } catch (dbError) {
      log('error', 'Database operation failed:', {
        error: dbError.message,
        stack: dbError.stack,
        userId,
        fileName
      })
      throw new Error(`Error guardando datos en base de datos: ${dbError.message}`)
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Libro diario procesado exitosamente con GPT-4.1',
      data: analysisResult,
      dataQuality: analysisResult.validation?.dataQuality || 95,
      warnings: analysisResult.validation?.warnings || [],
      summary: {
        company: analysisResult.metadata?.companyName,
        fiscalYear: analysisResult.metadata?.fiscalYear,
        totalAssets: analysisResult.financials?.balanceSheet?.assets?.totalAssets,
        netProfit: analysisResult.financials?.incomeStatement?.netProfit,
        isBalanced: analysisResult.validation?.isBalanced
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    log('error', 'Critical error processing file:', { 
      error: error.message, 
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    // Enhanced error response with specific error types
    let errorType = 'PROCESSING_ERROR'
    let userMessage = 'Error procesando el libro diario'
    
    if (error.message.includes('Token limit') || error.message.includes('too large')) {
      errorType = 'FILE_TOO_LARGE'
      userMessage = 'El archivo es demasiado grande. Por favor, divídelo en partes más pequeñas o usa un archivo con menos transacciones.'
    } else if (error.message.includes('API error')) {
      errorType = 'API_ERROR'
      userMessage = 'Error de comunicación con el servicio de análisis. Inténtalo de nuevo en unos minutos.'
    } else if (error.message.includes('JSON') || error.message.includes('parsing')) {
      errorType = 'PARSING_ERROR'
      userMessage = 'Error procesando la respuesta del análisis. El archivo puede tener un formato incompatible.'
    } else if (error.message.includes('database') || error.message.includes('Database')) {
      errorType = 'DATABASE_ERROR'
      userMessage = 'Error guardando los datos procesados. Los datos se analizaron correctamente pero no se pudieron guardar.'
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorType,
      message: userMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})