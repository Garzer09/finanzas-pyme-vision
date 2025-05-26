
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response('No file provided', { status: 400, headers: corsHeaders })
    }

    // Leer el contenido del archivo Excel
    const fileBuffer = await file.arrayBuffer()
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)))

    // Llamar a Anthropic para procesar el archivo
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response('Anthropic API key not configured', { status: 500, headers: corsHeaders })
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Analiza este archivo Excel financiero y extrae los datos estructurados de P&G, Balance y Flujo de Caja. 
          Devuelve los datos en formato JSON con las siguientes estructuras:
          - pyg: {ingresos, costes, ebitda, beneficio_neto, etc.}
          - balance: {activo, pasivo, patrimonio_neto, etc.}
          - cash_flow: {operativo, inversion, financiacion, etc.}
          
          El archivo está en base64: ${base64Content.substring(0, 1000)}...`
        }]
      })
    })

    const anthropicResult = await anthropicResponse.json()
    let processedData = {}
    
    try {
      // Intentar extraer JSON de la respuesta de Anthropic
      const content = anthropicResult.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        processedData = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Error parsing Anthropic response:', e)
      processedData = { error: 'No se pudo procesar el archivo automáticamente' }
    }

    // Guardar el archivo en la base de datos
    const { data: fileRecord, error: fileError } = await supabaseClient
      .from('excel_files')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_path: `uploads/${user.id}/${Date.now()}_${file.name}`,
        file_size: file.size,
        processing_status: 'completed',
        processing_result: processedData
      })
      .select()
      .single()

    if (fileError) {
      throw fileError
    }

    // Guardar los datos financieros procesados
    if (processedData && !processedData.error) {
      const financialDataInserts = []
      
      if (processedData.pyg) {
        financialDataInserts.push({
          user_id: user.id,
          excel_file_id: fileRecord.id,
          data_type: 'pyg',
          period_type: 'annual',
          period_date: new Date().getFullYear() + '-12-31',
          data_content: processedData.pyg
        })
      }
      
      if (processedData.balance) {
        financialDataInserts.push({
          user_id: user.id,
          excel_file_id: fileRecord.id,
          data_type: 'balance',
          period_type: 'annual',
          period_date: new Date().getFullYear() + '-12-31',
          data_content: processedData.balance
        })
      }
      
      if (processedData.cash_flow) {
        financialDataInserts.push({
          user_id: user.id,
          excel_file_id: fileRecord.id,
          data_type: 'cash_flow',
          period_type: 'annual',
          period_date: new Date().getFullYear() + '-12-31',
          data_content: processedData.cash_flow
        })
      }
      
      if (financialDataInserts.length > 0) {
        await supabaseClient
          .from('financial_data')
          .insert(financialDataInserts)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        file_id: fileRecord.id,
        processed_data: processedData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
