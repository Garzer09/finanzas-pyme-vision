
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Detectar tipo de documento financiero por nombre de archivo
function detectDocumentType(fileName: string): string {
  const name = fileName.toLowerCase()
  
  if (name.includes('balance') || name.includes('situacion')) return 'balance'
  if (name.includes('pyg') || name.includes('perdidas') || name.includes('ganancias')) return 'pyg'
  if (name.includes('flujo') || name.includes('cash') || name.includes('tesoreria')) return 'flujos'
  if (name.includes('ratio') || name.includes('indicador')) return 'ratios'
  if (name.includes('pool') || name.includes('deuda') || name.includes('financiacion')) return 'pool_financiero'
  if (name.includes('auditoria') || name.includes('revision')) return 'auditoria'
  if (name.includes('proyeccion') || name.includes('forecast') || name.includes('prevision')) return 'proyecciones'
  if (name.includes('200') || name.includes('303') || name.includes('347')) return 'modelos_fiscales'
  
  return 'general'
}

// Detectar períodos automáticamente del contenido
function detectPeriods(content: string): string[] {
  const yearRegex = /20\d{2}/g
  const dateRegex = /\d{1,2}\/\d{1,2}\/20\d{2}/g
  const monthYearRegex = /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+20\d{2}/gi
  
  const years = content.match(yearRegex) || []
  const dates = content.match(dateRegex) || []
  const monthYears = content.match(monthYearRegex) || []
  
  const allPeriods = [...years, ...dates, ...monthYears]
  return [...new Set(allPeriods)].sort()
}

// Validar datos financieros extraídos
function validateFinancialData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validar estructura básica
  if (!data || typeof data !== 'object') {
    errors.push('Datos no válidos o estructura incorrecta')
    return { isValid: false, errors }
  }
  
  // Validar datos numéricos en P&G
  if (data.estados_financieros?.pyg) {
    const pyg = data.estados_financieros.pyg
    if (pyg.ingresos && isNaN(Number(pyg.ingresos))) {
      errors.push('Ingresos no es un número válido')
    }
    if (pyg.gastos && isNaN(Number(pyg.gastos))) {
      errors.push('Gastos no es un número válido')
    }
  }
  
  // Validar coherencia en Balance
  if (data.estados_financieros?.balance) {
    const balance = data.estados_financieros.balance
    const activo = Number(balance.activo_total) || 0
    const pasivo = Number(balance.pasivo_total) || 0
    const patrimonio = Number(balance.patrimonio_neto) || 0
    
    if (Math.abs(activo - (pasivo + patrimonio)) > 1000) {
      errors.push('El balance no cuadra: Activo ≠ Pasivo + Patrimonio')
    }
  }
  
  // Validar ratios están en rangos lógicos
  if (data.ratios_financieros) {
    const ratios = data.ratios_financieros
    if (ratios.liquidez?.ratio_corriente && ratios.liquidez.ratio_corriente < 0) {
      errors.push('Ratio de liquidez corriente no puede ser negativo')
    }
    if (ratios.endeudamiento?.ratio_endeudamiento && ratios.endeudamiento.ratio_endeudamiento > 10) {
      errors.push('Ratio de endeudamiento parece excesivamente alto (>1000%)')
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

// Crear prompt específico por tipo de documento
function createSpecificPrompt(documentType: string, isPDF: boolean, base64Content: string): string {
  const basePrompt = isPDF ? 
    'Analiza este archivo PDF financiero y extrae los datos estructurados.' :
    'Analiza este archivo Excel financiero y extrae los datos estructurados.'
    
  const templatePrompts = {
    'balance': `${basePrompt}
    
    DOCUMENTO IDENTIFICADO: Balance de Situación
    
    Extrae específicamente:
    1. **ACTIVO**:
       - Activo No Corriente (Inmovilizado material, intangible, inversiones)
       - Activo Corriente (Existencias, deudores, tesorería)
    
    2. **PASIVO**:
       - Patrimonio Neto (Capital, reservas, resultados)
       - Pasivo No Corriente (Deudas a largo plazo)
       - Pasivo Corriente (Deudas a corto plazo, acreedores)
    
    3. **PERÍODOS**: Identifica los años/fechas de las columnas
    
    Devuelve en formato JSON:
    {
      "tipo_documento": "balance",
      "periodos_detectados": ["2023", "2022", "2021"],
      "estados_financieros": {
        "balance": {
          "activo_no_corriente": {...},
          "activo_corriente": {...},
          "patrimonio_neto": {...},
          "pasivo_no_corriente": {...},
          "pasivo_corriente": {...}
        }
      }
    }`,
    
    'pyg': `${basePrompt}
    
    DOCUMENTO IDENTIFICADO: Cuenta de Pérdidas y Ganancias
    
    Extrae específicamente:
    1. **INGRESOS**: Cifra de negocios, otros ingresos
    2. **GASTOS**: Consumos, gastos de personal, amortizaciones, otros gastos
    3. **RESULTADOS**: EBITDA, EBIT, Resultado antes impuestos, Resultado neto
    
    Devuelve en formato JSON:
    {
      "tipo_documento": "pyg",
      "periodos_detectados": [...],
      "estados_financieros": {
        "pyg": {
          "ingresos_explotacion": {...},
          "gastos_explotacion": {...},
          "resultado_explotacion": {...},
          "resultado_financiero": {...},
          "resultado_antes_impuestos": {...},
          "resultado_neto": {...}
        }
      }
    }`,
    
    'ratios': `${basePrompt}
    
    DOCUMENTO IDENTIFICADO: Ratios Financieros
    
    Extrae específicamente:
    1. **LIQUIDEZ**: Ratio corriente, acid test, tesorería
    2. **SOLVENCIA**: Endeudamiento, autonomía financiera
    3. **RENTABILIDAD**: ROE, ROA, margen neto
    4. **EFICIENCIA**: Rotación activos, período medio cobro/pago
    
    Devuelve en formato JSON con validación numérica:
    {
      "tipo_documento": "ratios",
      "ratios_financieros": {
        "liquidez": {...},
        "solvencia": {...},
        "rentabilidad": {...},
        "eficiencia": {...}
      }
    }`,
    
    'general': `${basePrompt}
    
    ANÁLISIS COMPLETO: Detecta automáticamente el tipo de documento financiero
    
    Busca todos los elementos financieros posibles:
    1. Estados Financieros (P&G, Balance, Flujos)
    2. Ratios y KPIs
    3. Pool de financiación
    4. Datos de auditoría
    5. Proyecciones
    
    IMPORTANTE: 
    - Detecta automáticamente períodos/fechas
    - Valida coherencia de datos numéricos
    - Identifica monedas y unidades
    
    Devuelve en formato JSON estructurado con validación.`
  }
  
  return templatePrompts[documentType] || templatePrompts['general'] + `\n\nArchivo: ${base64Content.substring(0, 1500)}...`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Use temporary user ID for anonymous uploads
    const tempUserId = 'temp-user-' + crypto.randomUUID()

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response('No file provided', { status: 400, headers: corsHeaders })
    }

    // Leer el contenido del archivo
    const fileBuffer = await file.arrayBuffer()
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)))
    
    // Detectar tipo de archivo y configurar procesamiento
    const isPDF = file.name.toLowerCase().endsWith('.pdf')
    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
    
    // Detectar tipo de documento financiero por nombre
    const documentType = detectDocumentType(file.name)
    
    // Llamar a Claude para procesar el archivo financiero con prompts específicos
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
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: createSpecificPrompt(documentType, isPDF, base64Content)
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
        
        // Detectar períodos automáticamente si no están en los datos
        if (!processedData.periodos_detectados) {
          processedData.periodos_detectados = detectPeriods(content)
        }
        
        // Validar datos financieros
        const validation = validateFinancialData(processedData)
        processedData.validation = validation
        
        // Agregar metadatos del procesamiento
        processedData.document_type_detected = documentType
        processedData.file_type = isPDF ? 'PDF' : 'Excel'
        processedData.processing_timestamp = new Date().toISOString()
        
        if (!validation.isValid) {
          console.warn('Validation errors found:', validation.errors)
          processedData.processing_warnings = validation.errors
        }
      }
    } catch (e) {
      console.error('Error parsing Claude response:', e)
      processedData = { 
        error: 'No se pudo procesar el archivo automáticamente',
        raw_response: anthropicResult.content[0]?.text?.substring(0, 500),
        document_type_detected: documentType,
        file_type: isPDF ? 'PDF' : 'Excel'
      }
    }

    // Guardar el archivo en la base de datos
    const { data: fileRecord, error: fileError } = await supabaseClient
      .from('excel_files')
      .insert({
        user_id: tempUserId,
        file_name: file.name,
        file_path: `uploads/${tempUserId}/${Date.now()}_${file.name}`,
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
            user_id: tempUserId,
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
          user_id: tempUserId,
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
          user_id: tempUserId,
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
          user_id: tempUserId,
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
