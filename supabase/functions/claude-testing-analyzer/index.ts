import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { sessionId, fileData, analysisType } = await req.json()

    // Simular análisis con Claude
    const mockAnalysis = {
      insights: [
        {
          kpi: 'ROE',
          value: 15.2,
          formula: 'Beneficio Neto / Patrimonio Neto',
          interpretation: 'La rentabilidad sobre el patrimonio es buena, indicando eficiencia en el uso del capital',
          trend: 'positive'
        },
        {
          kpi: 'Ratio Corriente',
          value: 2.1,
          formula: 'Activo Corriente / Pasivo Corriente',
          interpretation: 'La liquidez es adecuada para cumplir obligaciones a corto plazo',
          trend: 'positive'
        }
      ],
      summary: 'La empresa muestra indicadores financieros saludables con buena rentabilidad y liquidez',
      alerts: [],
      calculations: {
        key_metrics: {
          roe: 15.2,
          roa: 8.5,
          ratio_corriente: 2.1,
          ratio_deuda: 0.45
        }
      },
      metadata: {
        analysisType,
        timestamp: new Date().toISOString(),
        dataSize: Object.keys(fileData).length
      }
    }

    return new Response(
      JSON.stringify(mockAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})