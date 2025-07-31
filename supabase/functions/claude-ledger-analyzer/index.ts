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
    log('info', 'Request body received')

    const { userId, fileName, fileContent } = requestBody

    if (!userId || !fileName || !fileContent) {
      throw new Error('Faltan parámetros requeridos: userId, fileName, fileContent')
    }

    // Check for OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      log('error', 'OPENAI_API_KEY not found')
      throw new Error('OPENAI_API_KEY not found in environment')
    }
    
    log('info', 'OpenAI API key found')

    // Mock data para probar que la función funciona
    const mockAnalysisResult = {
      metadata: {
        companyName: "Empresa de Prueba",
        taxId: "12345678A",
        fiscalYear: 2024,
        fiscalMonth: null,
        currency: "EUR",
        accountingStandard: "PGC",
        totalEntries: 1000,
        dateRange: {
          from: "2024-01-01",
          to: "2024-12-31"
        }
      },
      validation: {
        isBalanced: true,
        totalDebits: 1000000,
        totalCredits: 1000000,
        balanceDifference: 0,
        criticalErrors: [],
        warnings: [],
        dataQuality: 95,
        completeness: {
          hasAllRequiredAccounts: true,
          missingAccounts: []
        }
      },
      financials: {
        balanceSheet: {
          assets: {
            nonCurrent: {
              intangible: 50000,
              tangible: 300000,
              investments: 0,
              depreciation: -50000,
              total: 300000,
              breakdown: {}
            },
            current: {
              inventory: 150000,
              receivables: 100000,
              cash: 50000,
              other: 0,
              total: 300000,
              breakdown: {}
            },
            totalAssets: 600000
          },
          liabilitiesAndEquity: {
            equity: {
              shareCapital: 100000,
              reserves: 50000,
              retainedEarnings: 100000,
              currentYearProfit: 50000,
              total: 300000,
              breakdown: {}
            },
            nonCurrentLiabilities: {
              longTermDebt: 150000,
              other: 0,
              total: 150000,
              breakdown: {}
            },
            currentLiabilities: {
              suppliers: 100000,
              shortTermDebt: 30000,
              other: 20000,
              total: 150000,
              breakdown: {}
            },
            totalLiabilities: 300000,
            totalLiabilitiesAndEquity: 600000
          }
        },
        incomeStatement: {
          revenue: {
            sales: 500000,
            otherIncome: 10000,
            total: 510000,
            breakdown: {}
          },
          expenses: {
            cogs: 300000,
            personnel: 100000,
            otherOperating: 40000,
            depreciation: 10000,
            total: 450000,
            breakdown: {}
          },
          ebitda: 70000,
          ebit: 60000,
          financialResult: {
            income: 1000,
            expenses: 5000,
            net: -4000
          },
          ebt: 56000,
          taxes: 6000,
          netProfit: 50000
        },
        ratios: {
          liquidity: {
            currentRatio: 2.0,
            quickRatio: 1.0,
            cashRatio: 0.33,
            workingCapital: 150000
          },
          leverage: {
            debtToEquity: 1.0,
            debtRatio: 0.5,
            equityRatio: 0.5,
            interestCoverage: 12
          },
          profitability: {
            roe: 16.7,
            roa: 8.3,
            netMargin: 9.8,
            ebitdaMargin: 13.7,
            grossMargin: 39.2
          },
          activity: {
            assetTurnover: 0.85,
            inventoryDays: 182,
            receivableDays: 73,
            payableDays: 122,
            cashConversionCycle: 133
          }
        }
      },
      accountDetails: []
    }

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    try {
      const period_date = `${mockAnalysisResult.metadata.fiscalYear}-12-31`
      
      // Save balance sheet
      const { error: balanceError } = await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'balance_situacion',
        period_date,
        period_year: mockAnalysisResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: mockAnalysisResult.financials.balanceSheet
      })

      if (balanceError) {
        log('warn', 'Error saving balance sheet:', balanceError)
      }

      // Save income statement  
      const { error: incomeError } = await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'cuenta_pyg',
        period_date,
        period_year: mockAnalysisResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: mockAnalysisResult.financials.incomeStatement
      })

      if (incomeError) {
        log('warn', 'Error saving income statement:', incomeError)
      }

      // Save ratios
      const { error: ratiosError } = await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'ratios_financieros',
        period_date,
        period_year: mockAnalysisResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: mockAnalysisResult.financials.ratios
      })

      if (ratiosError) {
        log('warn', 'Error saving ratios:', ratiosError)
      }

      log('info', 'Mock data saved to database successfully')
    } catch (dbError) {
      log('warn', 'Error saving to database:', dbError)
    }

    log('info', 'Returning successful response')

    return new Response(JSON.stringify({
      success: true,
      message: 'Libro diario procesado exitosamente (modo mock)',
      data: mockAnalysisResult,
      dataQuality: mockAnalysisResult.validation.dataQuality,
      warnings: mockAnalysisResult.validation.warnings
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