import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import * as XLSX from "https://esm.sh/xlsx@0.18.5"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXTRACTION_TIMEOUT = 30000 // 30 segundos
const MAX_ROWS_TO_EXTRACT = 10000
const MAX_SHEETS_TO_EXTRACT = 20

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Extraction timeout exceeded')), EXTRACTION_TIMEOUT)
  })

  try {
    return await Promise.race([timeoutPromise, extractData(req)])
  } catch (error) {
    console.error('Error in data-extractor:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stage: 'extraction'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function extractData(req: Request) {
  console.log('Starting data extraction...')
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { fileData, documentType, sessionId } = await req.json()

  if (!fileData || !documentType || !sessionId) {
    throw new Error('Missing required parameters')
  }

  // Autenticación
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    throw new Error('Missing authorization header')
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Extraer datos según el tipo de documento
  let extractedData: any = {}
  
  if (documentType.includes('excel') || documentType.includes('balance') || documentType.includes('income')) {
    extractedData = await extractExcelData(fileData, documentType)
  } else {
    throw new Error(`Extraction not implemented for document type: ${documentType}`)
  }

  // Validación de estructura
  const validationResults = await validateExtractedData(extractedData, documentType)

  // Actualizar sesión con datos extraídos
  const { error: updateError } = await supabase
    .from('test_sessions')
    .update({
      processing_status: 'completed',
      detected_sheets: extractedData.sheets || [],
      detected_fields: extractedData.fields || {},
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Failed to update session:', updateError)
    throw new Error('Failed to update session with extracted data')
  }

  console.log('Data extraction completed successfully')

  return new Response(
    JSON.stringify({
      success: true,
      extracted_data: extractedData,
      validation_results: validationResults,
      nextStage: 'normalization'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function extractExcelData(fileData: ArrayBuffer, documentType: string) {
  console.log('Extracting Excel data...')
  
  const data = new Uint8Array(fileData)
  const workbook = XLSX.read(data, { 
    type: 'array',
    dense: true,
    cellDates: false,
    cellNF: false,
    cellStyles: false,
    sheetStubs: false,
    bookDeps: false,
    bookFiles: false,
    bookProps: false,
    bookSheets: false,
    bookVBA: false
  })

  const sheets = workbook.SheetNames.slice(0, MAX_SHEETS_TO_EXTRACT)
  const extractedFields: Record<string, string[]> = {}
  const extractedData: Record<string, any[]> = {}

  for (const sheetName of sheets) {
    console.log(`Extracting sheet: ${sheetName}`)
    const worksheet = workbook.Sheets[sheetName]
    
    if (worksheet) {
      try {
        // Obtener rango optimizado
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
        const maxRow = Math.min(range.e.r, MAX_ROWS_TO_EXTRACT - 1)
        
        // Extraer headers
        const headerRange = `${XLSX.utils.encode_cell({r: 0, c: range.s.c})}:${XLSX.utils.encode_cell({r: 2, c: range.e.c})}`
        const headerData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          range: headerRange,
          raw: true,
          defval: null
        }) as any[][]
        
        // Detectar fila de headers
        let headerRow = 0
        for (let i = 0; i < Math.min(headerData.length, 3); i++) {
          const row = headerData[i]
          const nonEmptyCells = row.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '').length
          if (nonEmptyCells > 0) {
            headerRow = i
            break
          }
        }
        
        const headers = headerData[headerRow] || []
        const cleanHeaders = headers
          .filter(h => h !== null && h !== undefined && String(h).trim() !== '')
          .map(h => String(h).trim())
          .slice(0, 100) // Limitar columnas
        
        extractedFields[sheetName] = cleanHeaders
        
        // Extraer datos principales si es necesario
        if (documentType.includes('balance') || documentType.includes('income')) {
          const dataRange = `${XLSX.utils.encode_cell({r: headerRow + 1, c: range.s.c})}:${XLSX.utils.encode_cell({r: maxRow, c: range.e.c})}`
          const sheetData = XLSX.utils.sheet_to_json(worksheet, { 
            header: cleanHeaders,
            range: dataRange,
            raw: true,
            defval: null
          })
          
          extractedData[sheetName] = sheetData.slice(0, 1000) // Limitar filas extraídas
        }
        
        console.log(`Sheet ${sheetName} - Headers: ${cleanHeaders.length}, Data rows: ${extractedData[sheetName]?.length || 0}`)
        
      } catch (sheetError) {
        console.error(`Error extracting sheet ${sheetName}:`, sheetError)
        extractedFields[sheetName] = []
      }
    }
  }

  return {
    sheets,
    fields: extractedFields,
    data: extractedData,
    extraction_stats: {
      sheets_processed: sheets.length,
      total_fields: Object.values(extractedFields).reduce((acc, fields) => acc + fields.length, 0),
      extraction_timestamp: new Date().toISOString()
    }
  }
}

async function validateExtractedData(extractedData: any, documentType: string) {
  console.log('Validating extracted data...')
  
  const validationResults = {
    is_valid: true,
    warnings: [] as string[],
    errors: [] as string[],
    confidence_score: 1.0
  }
  
  // Validaciones básicas
  if (!extractedData.sheets || extractedData.sheets.length === 0) {
    validationResults.errors.push('No sheets found in the document')
    validationResults.is_valid = false
  }
  
  if (!extractedData.fields || Object.keys(extractedData.fields).length === 0) {
    validationResults.errors.push('No fields detected in any sheet')
    validationResults.is_valid = false
  }
  
  // Validaciones específicas por tipo de documento
  if (documentType.includes('balance')) {
    const balanceSheet = extractedData.fields['Balance'] || extractedData.fields['balance'] || null
    if (!balanceSheet) {
      validationResults.warnings.push('Balance sheet not clearly identified')
      validationResults.confidence_score -= 0.2
    }
  }
  
  if (documentType.includes('income')) {
    const incomeSheet = extractedData.fields['P&G'] || extractedData.fields['PyG'] || null
    if (!incomeSheet) {
      validationResults.warnings.push('Income statement not clearly identified')
      validationResults.confidence_score -= 0.2
    }
  }
  
  // Calcular score de confianza final
  validationResults.confidence_score = Math.max(0, Math.min(1, validationResults.confidence_score))
  
  return validationResults
}