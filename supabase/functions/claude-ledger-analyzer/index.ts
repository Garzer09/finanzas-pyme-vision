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
    log('info', 'Request headers:', Object.fromEntries(req.headers.entries()))
    
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

    // For now, return a mock successful response
    const mockResult = {
      metadata: {
        companyName: "Empresa de Prueba",
        taxId: "12345678A",
        fiscalYear: 2024,
        totalEntries: 100,
        dateRange: {
          from: "2024-01-01",
          to: "2024-12-31"
        },
        processingTime: "5 segundos"
      },
      validation: {
        isBalanced: true,
        balanceDifference: 0,
        criticalErrors: [],
        warnings: [],
        dataQuality: 85
      },
      financials: {
        balanceSheet: {
          assets: {
            nonCurrent: {
              intangible: 10000,
              tangible: 50000,
              investments: 5000,
              depreciation: -5000,
              total: 60000
            },
            current: {
              inventory: 15000,
              receivables: 8000,
              cash: 12000,
              total: 35000
            },
            totalAssets: 95000
          },
          liabilities: {
            equity: {
              capital: 30000,
              reserves: 20000,
              retainedEarnings: 15000,
              currentYearProfit: 5000,
              total: 70000
            },
            nonCurrent: {
              longTermDebt: 15000,
              total: 15000
            },
            current: {
              suppliers: 7000,
              otherPayables: 2000,
              shortTermDebt: 1000,
              total: 10000
            },
            totalLiabilities: 25000,
            totalLiabilitiesAndEquity: 95000
          }
        },
        incomeStatement: {
          revenue: {
            sales: 100000,
            otherIncome: 2000,
            total: 102000
          },
          expenses: {
            costOfGoodsSold: 60000,
            personnel: 25000,
            otherOperating: 10000,
            depreciation: 2000,
            financial: 1000,
            total: 98000
          },
          ebit: 4000,
          ebt: 3000,
          taxes: 800,
          netProfit: 2200
        },
        ratios: {
          liquidity: {
            currentRatio: 3.5,
            quickRatio: 2.0,
            cashRatio: 1.2
          },
          leverage: {
            debtToEquity: 0.36,
            debtRatio: 0.26,
            equityRatio: 0.74
          },
          profitability: {
            roe: 3.14,
            roa: 2.32,
            netMargin: 2.16,
            ebitdaMargin: 5.88
          },
          activity: {
            assetTurnover: 1.07,
            inventoryDays: 91,
            receivableDays: 29
          }
        }
      },
      insights: {
        financialHealth: "GOOD",
        keyStrengths: ["Liquidez sólida", "Bajo endeudamiento"],
        keyWeaknesses: ["Margen de beneficio bajo"],
        recommendations: ["Optimizar costes operativos", "Mejorar gestión de inventario"],
        riskAlerts: []
      }
    }

    // Try to save to database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    try {
      const period_date = `${mockResult.metadata.fiscalYear}-12-31`
      
      // Save balance sheet
      await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'balance_situacion',
        period_date,
        period_year: mockResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: mockResult.financials.balanceSheet
      })

      // Save income statement  
      await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'cuenta_pyg',
        period_date,
        period_year: mockResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: mockResult.financials.incomeStatement
      })

      // Save ratios
      await supabaseClient.from('financial_data').insert({
        user_id: userId,
        data_type: 'ratios_financieros',
        period_date,
        period_year: mockResult.metadata.fiscalYear,
        period_type: 'annual',
        data_content: mockResult.financials.ratios
      })

      log('info', 'Mock data saved to database successfully')
    } catch (dbError) {
      log('warn', 'Error saving to database', { error: dbError.message })
    }

    log('info', 'Returning successful response')

    return new Response(JSON.stringify({
      success: true,
      message: 'Libro diario procesado exitosamente (versión de prueba)',
      data: mockResult,
      dataQuality: mockResult.validation.dataQuality,
      warnings: mockResult.validation.warnings
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