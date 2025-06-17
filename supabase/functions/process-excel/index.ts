
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

    // Llamar a Claude para procesar el archivo financiero
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
          content: `Analiza este archivo Excel financiero y extrae los datos estructurados. 
          
          Busca específicamente:
          1. **Estados Financieros**:
             - Cuenta de Pérdidas y Ganancias (P&G)
             - Balance de Situación
             - Estado de Flujos de Efectivo
             - Estado de Cambios en el Patrimonio Neto
          
          2. **Datos de Auditoría y Modelos**:
             - Información de auditoría
             - Modelos 200 IS, 303, 347
             - CIRBE (Central de Información de Riesgos del Banco de España)
             - AET+SS (Agencia Estatal de Administración Tributaria + Seguridad Social)
          
          3. **Pool Financiero**:
             - Estructura de endeudamiento
             - Amortización de deudas
             - Tipo de interés por líneas de crédito
             - Vencimientos y garantías
          
          4. **Ratios Financieros**:
             - Ratios de liquidez
             - Ratios de solvencia
             - Ratios de rentabilidad
             - Ratios de endeudamiento
          
          5. **Proyecciones y Análisis**:
             - Proyecciones de flujo de caja
             - Análisis de sensibilidad
             - Escenarios optimista/pesimista/realista
          
          Devuelve los datos en formato JSON estructurado con estas categorías principales:
          {
            "estados_financieros": {
              "pyg": {...},
              "balance": {...},
              "flujos_efectivo": {...},
              "patrimonio_neto": {...}
            },
            "auditoria_modelos": {
              "auditoria": {...},
              "modelo_200": {...},
              "modelo_303": {...},
              "modelo_347": {...},
              "cirbe": {...},
              "aet_ss": {...}
            },
            "pool_financiero": {
              "estructura_deuda": {...},
              "amortizacion": {...},
              "tipos_interes": {...},
              "vencimientos": {...}
            },
            "ratios_financieros": {
              "liquidez": {...},
              "solvencia": {...},
              "rentabilidad": {...},
              "endeudamiento": {...}
            },
            "proyecciones": {
              "flujos_futuros": {...},
              "escenarios": {...},
              "sensibilidad": {...}
            }
          }
          
          Archivo en base64: ${base64Content.substring(0, 2000)}...`
        }]
      })
    })

    const anthropicResult = await anthropicResponse.json()
    let processedData = {}
    
    try {
      // Intentar extraer JSON de la respuesta de Claude
      const content = anthropicResult.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        processedData = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Error parsing Claude response:', e)
      processedData = { 
        error: 'No se pudo procesar el archivo automáticamente',
        raw_response: anthropicResult.content[0]?.text?.substring(0, 500) 
      }
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

    // Guardar los datos financieros procesados de forma estructurada
    if (processedData && !processedData.error) {
      const financialDataInserts = []
      
      // Estados financieros
      if (processedData.estados_financieros) {
        Object.entries(processedData.estados_financieros).forEach(([type, data]) => {
          financialDataInserts.push({
            user_id: user.id,
            excel_file_id: fileRecord.id,
            data_type: `estado_${type}`,
            period_type: 'annual',
            period_date: new Date().getFullYear() + '-12-31',
            data_content: data
          })
        })
      }
      
      // Pool financiero
      if (processedData.pool_financiero) {
        financialDataInserts.push({
          user_id: user.id,
          excel_file_id: fileRecord.id,
          data_type: 'pool_financiero',
          period_type: 'annual',
          period_date: new Date().getFullYear() + '-12-31',
          data_content: processedData.pool_financiero
        })
      }
      
      // Ratios financieros
      if (processedData.ratios_financieros) {
        financialDataInserts.push({
          user_id: user.id,
          excel_file_id: fileRecord.id,
          data_type: 'ratios_financieros',
          period_type: 'annual',
          period_date: new Date().getFullYear() + '-12-31',
          data_content: processedData.ratios_financieros
        })
      }
      
      // Proyecciones
      if (processedData.proyecciones) {
        financialDataInserts.push({
          user_id: user.id,
          excel_file_id: fileRecord.id,
          data_type: 'proyecciones',
          period_type: 'projection',
          period_date: (new Date().getFullYear() + 3) + '-12-31',
          data_content: processedData.proyecciones
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
        processed_data: processedData,
        message: 'Archivo procesado exitosamente con análisis financiero completo'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in process-excel function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Error procesando archivo Excel con Claude'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
