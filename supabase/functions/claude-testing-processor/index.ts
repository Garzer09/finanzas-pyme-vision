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
    const formData = await req.formData()
    const file = formData.get('file') as File
    const sessionId = formData.get('sessionId') as string

    if (!file || !sessionId) {
      throw new Error('File and sessionId are required')
    }

    // Simular procesamiento del archivo
    const mockSheets = ['Balance', 'PyG', 'Flujo de Efectivo']
    const mockDetectedFields = {
      'Balance': ['activo_corriente', 'pasivo_corriente', 'patrimonio_neto'],
      'PyG': ['ingresos', 'costos_ventas', 'resultado_neto'],
      'Flujo de Efectivo': ['flujo_operativo', 'flujo_inversion']
    }

    return new Response(
      JSON.stringify({
        sessionId,
        sheets: mockSheets,
        detectedFields: mockDetectedFields,
        success: true
      }),
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