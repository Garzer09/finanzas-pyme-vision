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
    
    // Get Claude API key
    const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!claudeApiKey) {
      throw new Error('ANTHROPIC_API_KEY not found')
    }
    
    log('info', 'Starting real analysis with Claude 4 Opus')

    // Detailed financial analysis prompt
    const analysisPrompt = `
Analyze this general ledger (libro diario) Excel file and perform a complete financial analysis.

CRITICAL: You must complete ALL these tasks in a SINGLE response and return ONLY valid JSON.

1. STRUCTURE DETECTION:
- Identify columns: Date (Fecha), Account Code (Código cuenta), Account Name (Cuenta), Debit (Debe), Credit (Haber)
- Detect accounting standard (PGC Spain: 9-digit codes)
- Extract company information from headers

2. DATA PROCESSING:
Process all journal entries and calculate balances:
- Assets (groups 2,3) and Expenses (group 6): Balance = Debit - Credit
- Liabilities (groups 1,4,5) and Income (group 7): Balance = Credit - Debit

3. GENERATE FINANCIAL STATEMENTS following Spanish PGC structure

4. CALCULATE ALL RATIOS:
- Liquidity: Current, Quick, Cash ratios
- Leverage: Debt to Equity, Debt Ratio
- Profitability: ROE, ROA, Net Margin, EBITDA Margin
- Activity: Asset Turnover, Days ratios

5. VALIDATION CHECKS:
- Total Debits = Total Credits
- Assets = Liabilities + Equity

6. RETURN THIS EXACT JSON STRUCTURE:
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

ARCHIVO: ${fileName}
CONTENIDO (BASE64): ${fileContent}

IMPORTANTE: Analiza el archivo Excel completo y responde SOLO con JSON válido.`

    // Call Claude 4 Opus API
    log('info', 'Calling Claude 4 Opus API...')
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-20250514',
        max_tokens: 8000,
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
    log('info', 'Claude 4 Opus response received')

    // Parse JSON response
    let analysisResult
    try {
      const content = claudeResult.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        analysisResult = JSON.parse(content)
      }
      log('info', 'Financial analysis completed successfully with Claude 4 Opus')
    } catch (parseError) {
      log('error', 'Error parsing Claude response:', parseError.message)
      throw new Error('Error parsing financial analysis results')
    }

    // Save real data to database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    try {
      const period_date = `${analysisResult.metadata.fiscalYear}-12-31`
      
      // Delete existing data for this user and year to avoid duplicates
      await supabaseClient
        .from('financial_data')
        .delete()
        .eq('user_id', userId)
        .eq('period_year', analysisResult.metadata.fiscalYear)

      // Save balance sheet
      const { error: balanceError } = await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'balance_situacion',
        period_date,
        period_year: analysisResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: analysisResult.financials.balanceSheet
      })

      if (balanceError) throw balanceError

      // Save income statement  
      const { error: incomeError } = await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'cuenta_pyg',
        period_date,
        period_year: analysisResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: analysisResult.financials.incomeStatement
      })

      if (incomeError) throw incomeError

      // Save ratios
      const { error: ratiosError } = await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'ratios_financieros',
        period_date,
        period_year: analysisResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: analysisResult.financials.ratios
      })

      if (ratiosError) throw ratiosError

      // Save metadata
      const { error: metadataError } = await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'metadata',
        period_date,
        period_year: analysisResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: analysisResult.metadata
      })

      if (metadataError) throw metadataError

      // Save file record
      const { error: fileError } = await supabaseClient.from('excel_files').insert({
        user_id: userId,
        file_name: fileName,
        file_path: `uploads/${userId}/${fileName}`,
        upload_date: new Date().toISOString(),
        file_size: fileContent.length,
        processing_status: 'completed',
        processing_result: analysisResult
      })

      if (fileError) log('warn', 'Error saving file record:', fileError)

      log('info', 'Real financial data saved to database successfully')
    } catch (dbError) {
      log('error', 'Database error:', dbError)
      throw new Error(`Error saving to database: ${dbError.message}`)
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Libro diario procesado exitosamente con Claude 4 Opus',
      data: analysisResult,
      dataQuality: analysisResult.validation.dataQuality,
      warnings: analysisResult.validation.warnings
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    log('error', 'Error processing file:', { 
      error: error.message, 
      stack: error.stack
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