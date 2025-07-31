import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import * as XLSX from "https://esm.sh/xlsx@0.18.5"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuración para detección
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const DETECTION_TIMEOUT = 15000 // 15 segundos

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Detection timeout exceeded')), DETECTION_TIMEOUT)
  })

  try {
    return await Promise.race([timeoutPromise, detectDocument(req)])
  } catch (error) {
    console.error('Error in document-detector:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stage: 'detection'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function detectDocument(req: Request) {
  console.log('Starting document detection...')
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    throw new Error('File is required')
  }

  // Validaciones de formato y tamaño
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }

  // Detectar formato de archivo
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  let documentType = 'unknown'
  let format = 'unknown'

  if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    format = 'excel'
    documentType = await detectExcelDocumentType(file)
  } else if (fileExtension === 'pdf') {
    format = 'pdf'
    documentType = 'financial_statement' // Por ahora asumimos estados financieros
  } else if (fileExtension === 'csv') {
    format = 'csv'
    documentType = 'data_table'
  } else {
    throw new Error(`Unsupported file format: ${fileExtension}`)
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

  // Crear registro de detección
  const detectionResult = {
    user_id: user.id,
    file_name: file.name,
    file_size: file.size,
    format: format,
    document_type: documentType,
    detection_status: 'completed',
    detection_confidence: await calculateDetectionConfidence(file, documentType),
    created_at: new Date().toISOString()
  }

  console.log('Document detection completed:', detectionResult)

  return new Response(
    JSON.stringify({
      success: true,
      detection: detectionResult,
      nextStage: 'extraction'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function detectExcelDocumentType(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)
    
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

    const sheetNames = workbook.SheetNames.map(name => name.toLowerCase())
    
    // Detectar tipo basado en nombres de hojas
    if (sheetNames.some(name => name.includes('balance') || name.includes('situacion'))) {
      return 'balance_sheet'
    }
    if (sheetNames.some(name => name.includes('pyg') || name.includes('p&g') || name.includes('perdidas') || name.includes('ganancias'))) {
      return 'income_statement'
    }
    if (sheetNames.some(name => name.includes('cash') || name.includes('flujo') || name.includes('efectivo'))) {
      return 'cash_flow'
    }
    if (sheetNames.some(name => name.includes('diario') || name.includes('journal'))) {
      return 'journal_entries'
    }
    if (sheetNames.some(name => name.includes('ratio') || name.includes('kpi'))) {
      return 'financial_ratios'
    }

    return 'financial_data'
  } catch (error) {
    console.error('Error detecting Excel document type:', error)
    return 'financial_data'
  }
}

async function calculateDetectionConfidence(file: File, documentType: string): Promise<number> {
  // Algoritmo simple de confianza basado en nombre y tipo
  const fileName = file.name.toLowerCase()
  let confidence = 0.5 // Base
  
  if (documentType !== 'unknown') confidence += 0.3
  
  // Palabras clave en el nombre del archivo
  const keywords = ['balance', 'pyg', 'estados', 'financiero', 'cash', 'flujo', 'ratios']
  const foundKeywords = keywords.filter(keyword => fileName.includes(keyword)).length
  confidence += (foundKeywords / keywords.length) * 0.2
  
  return Math.min(confidence, 1.0)
}