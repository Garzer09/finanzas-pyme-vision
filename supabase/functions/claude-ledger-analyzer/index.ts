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

    // Get OpenAI API key (using the secret name from Supabase)
    log('info', 'Checking for OpenAI API key in environment variables')
    
    const possibleKeys = ['OpenAI - ChatGPT', 'OPENAI_API_KEY', 'openai_api_key', 'OpenAI', 'ChatGPT']
    let openaiApiKey = null
    
    for (const keyName of possibleKeys) {
      const key = Deno.env.get(keyName)
      if (key) {
        openaiApiKey = key
        log('info', `Found OpenAI API key with name: ${keyName}`)
        break
      }
    }
    
    if (!openaiApiKey) {
      const availableEnvVars = Object.keys(Deno.env.toObject()).filter(key => 
        key.toLowerCase().includes('openai') || key.toLowerCase().includes('chatgpt')
      )
      log('error', 'OpenAI API key not found. Available env vars containing openai/chatgpt:', availableEnvVars)
      throw new Error(`OpenAI API key not found. Checked: ${possibleKeys.join(', ')}`)
    }

    log('info', 'Starting real data processing with GPT-4o-mini')

    // Detailed financial analysis prompt
    const analysisPrompt = `
Analyze this general ledger (libro diario) Excel file and perform a complete financial analysis.

CRITICAL: You must complete ALL these tasks in a SINGLE response.

1. STRUCTURE DETECTION:
- Identify the columns: Date (Fecha), Account Code (Código cuenta), Account Name (Cuenta), Debit (Debe), Credit (Haber)
- Detect the accounting standard:
  * PGC Spain: 9-digit account codes (e.g., 100000001)
  * GAAP/IFRS: Different coding structure
- Extract company information from headers (name, tax ID, year)

2. DATA PROCESSING:
Process all journal entries and calculate balances for each account:
- For Assets (groups 2,3) and Expenses (group 6): Balance = Debit - Credit
- For Liabilities (groups 1,4,5) and Income (group 7): Balance = Credit - Debit
- Special cases:
  * Accounts 40x, 41x (suppliers/creditors) are liabilities
  * Accounts 50x, 51x, 52x (short-term debt) are liabilities

3. GENERATE FINANCIAL STATEMENTS:

Balance Sheet Structure:
ASSETS:
- Non-current Assets:
  * Intangible (20x): Software, patents, goodwill
  * Tangible (21x-23x): Buildings, machinery, equipment
  * Investments (24x-26x): Long-term investments
  * Accumulated Depreciation (28x): NEGATIVE value
- Current Assets:
  * Inventory (3xx): All group 3 accounts
  * Receivables (43x,44x,47x): Customers, debtors
  * Cash (57x): Cash and bank accounts

LIABILITIES & EQUITY:
- Equity:
  * Share Capital (100)
  * Reserves (11x)
  * Retained Earnings (12x)
  * Current Year Profit/Loss
- Non-current Liabilities:
  * Long-term Debt (17x)
  * Other long-term (16x,18x,19x)
- Current Liabilities:
  * Suppliers (400)
  * Short-term Debt (52x)
  * Other Payables (41x,46x,47x)

Income Statement Structure:
- Revenue (70x-75x): Sales and other income
- Operating Expenses:
  * COGS (60x): Cost of goods sold
  * Personnel (64x): Salaries and social security
  * Other Operating (62x,63x,65x)
  * Depreciation (68x)
- Financial Result:
  * Financial Income (76x)
  * Financial Expenses (66x)
- Profit Before Tax
- Taxes (630)
- Net Profit

4. CALCULATE ALL RATIOS:
Liquidity:
- Current Ratio = Current Assets / Current Liabilities
- Quick Ratio = (Current Assets - Inventory) / Current Liabilities
- Cash Ratio = Cash / Current Liabilities

Leverage:
- Debt to Equity = Total Debt / Total Equity
- Debt Ratio = Total Debt / Total Assets
- Equity Ratio = Total Equity / Total Assets

Profitability:
- ROE = Net Profit / Equity × 100
- ROA = Net Profit / Total Assets × 100
- Net Margin = Net Profit / Revenue × 100
- EBITDA Margin = EBITDA / Revenue × 100

Activity:
- Asset Turnover = Revenue / Total Assets
- Inventory Days = (Inventory / COGS) × 365
- Receivable Days = (Receivables / Revenue) × 365
- Payable Days = (Payables / Purchases) × 365

5. VALIDATION CHECKS:
CRITICAL (must pass):
- Total Debits MUST equal Total Credits (difference < 0.01)
- Assets MUST equal Liabilities + Equity (difference < 0.01)
- Cash balance MUST be positive
- All accounts must balance correctly

WARNINGS (note but don't block):
- Current ratio < 1
- Debt to equity > 3
- Negative equity
- Unusual changes in accounts

6. RETURN THIS EXACT JSON STRUCTURE:
{
  "metadata": {
    "companyName": "string",
    "taxId": "string",
    "fiscalYear": 2024,
    "fiscalMonth": null,
    "currency": "EUR",
    "accountingStandard": "PGC",
    "totalEntries": number,
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    }
  },
  "validation": {
    "isBalanced": true/false,
    "totalDebits": number,
    "totalCredits": number,
    "balanceDifference": number,
    "criticalErrors": [
      {
        "code": "NEGATIVE_CASH",
        "message": "Cash balance is negative: -85,254.46",
        "account": "570000001",
        "amount": -85254.46,
        "autoFixAvailable": true,
        "autoFixDescription": "Reverse debit/credit in opening entry"
      }
    ],
    "warnings": [
      {
        "code": "LOW_LIQUIDITY",
        "message": "Current ratio is below 1",
        "value": 0.85,
        "recommendation": "Monitor cash flow closely"
      }
    ],
    "dataQuality": 0-100,
    "completeness": {
      "hasAllRequiredAccounts": true/false,
      "missingAccounts": []
    }
  },
  "financials": {
    "balanceSheet": {
      "assets": {
        "nonCurrent": {
          "intangible": number,
          "tangible": number,
          "investments": number,
          "depreciation": negative_number,
          "total": number,
          "breakdown": {
            "account_code": { "name": "string", "balance": number }
          }
        },
        "current": {
          "inventory": number,
          "receivables": number,
          "cash": number,
          "other": number,
          "total": number,
          "breakdown": {}
        },
        "totalAssets": number
      },
      "liabilitiesAndEquity": {
        "equity": {
          "shareCapital": number,
          "reserves": number,
          "retainedEarnings": number,
          "currentYearProfit": number,
          "total": number,
          "breakdown": {}
        },
        "nonCurrentLiabilities": {
          "longTermDebt": number,
          "other": number,
          "total": number,
          "breakdown": {}
        },
        "currentLiabilities": {
          "suppliers": number,
          "shortTermDebt": number,
          "other": number,
          "total": number,
          "breakdown": {}
        },
        "totalLiabilities": number,
        "totalLiabilitiesAndEquity": number
      }
    },
    "incomeStatement": {
      "revenue": {
        "sales": number,
        "otherIncome": number,
        "total": number,
        "breakdown": {}
      },
      "expenses": {
        "cogs": number,
        "personnel": number,
        "otherOperating": number,
        "depreciation": number,
        "total": number,
        "breakdown": {}
      },
      "ebitda": number,
      "ebit": number,
      "financialResult": {
        "income": number,
        "expenses": number,
        "net": number
      },
      "ebt": number,
      "taxes": number,
      "netProfit": number
    },
    "cashFlow": {
      "operating": {
        "netProfit": number,
        "depreciation": number,
        "workingCapitalChanges": number,
        "total": number
      },
      "investing": {
        "capex": number,
        "acquisitions": number,
        "total": number
      },
      "financing": {
        "debtChanges": number,
        "dividends": number,
        "total": number
      },
      "netCashFlow": number,
      "beginningCash": number,
      "endingCash": number
    },
    "ratios": {
      "liquidity": {
        "currentRatio": number,
        "quickRatio": number,
        "cashRatio": number,
        "workingCapital": number
      },
      "leverage": {
        "debtToEquity": number,
        "debtRatio": number,
        "equityRatio": number,
        "interestCoverage": number
      },
      "profitability": {
        "roe": number,
        "roa": number,
        "netMargin": number,
        "ebitdaMargin": number,
        "grossMargin": number
      },
      "activity": {
        "assetTurnover": number,
        "inventoryDays": number,
        "receivableDays": number,
        "payableDays": number,
        "cashConversionCycle": number
      }
    }
  },
  "accountDetails": [
    {
      "code": "string",
      "name": "string", 
      "group": "string",
      "totalDebit": number,
      "totalCredit": number,
      "balance": number,
      "entryCount": number
    }
  ]
}

ARCHIVO: ${fileName}
CONTENIDO (BASE64): ${fileContent}

IMPORTANTE: Analiza el archivo Excel completo y responde SOLO con JSON válido, sin texto adicional.`

    // Call OpenAI API with GPT-4o-mini
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial analyst specialized in Spanish accounting standards (PGC). Analyze Excel files and extract comprehensive financial information.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 16000,
        temperature: 0.1
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      log('error', 'OpenAI API error:', { status: openaiResponse.status, error: errorText })
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiResult = await openaiResponse.json()
    log('info', 'GPT-4o-mini response received')

    // Extract and parse the JSON response
    let analysisResult
    try {
      const content = openaiResult.choices[0].message.content
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        analysisResult = JSON.parse(content)
      }
      log('info', 'Financial analysis completed successfully')
    } catch (parseError) {
      log('error', 'Error parsing GPT-4o-mini response:', { error: parseError.message })
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
      message: 'Libro diario procesado exitosamente con GPT-4o-mini',
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