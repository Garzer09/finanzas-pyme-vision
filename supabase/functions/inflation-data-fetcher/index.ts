import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { region = 'EU', source = 'ECB' } = await req.json()

    // Fetch current inflation data from ECB (European Central Bank)
    // In a real implementation, you would call the actual ECB API
    // For now, we'll update our stored data with projected rates
    
    const currentYear = new Date().getFullYear()
    const projectedRates = [
      { period: `${currentYear + 1}-01-01`, rate: 2.8 },
      { period: `${currentYear + 1}-07-01`, rate: 2.5 },
      { period: `${currentYear + 2}-01-01`, rate: 2.3 },
      { period: `${currentYear + 2}-07-01`, rate: 2.1 },
      { period: `${currentYear + 3}-01-01`, rate: 2.0 },
    ]

    // Insert projected inflation rates
    for (const rate of projectedRates) {
      await supabaseClient
        .from('inflation_rates')
        .upsert({
          period_date: rate.period,
          region,
          inflation_rate: rate.rate,
          source,
          data_type: 'projected'
        }, {
          onConflict: 'period_date,region,source'
        })
    }

    // Fetch the latest inflation data
    const { data: inflationData, error } = await supabaseClient
      .from('inflation_rates')
      .select('*')
      .eq('region', region)
      .order('period_date', { ascending: false })
      .limit(12)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: inflationData,
        message: `Fetched ${inflationData?.length || 0} inflation records for ${region}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in inflation-data-fetcher:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch inflation data' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})