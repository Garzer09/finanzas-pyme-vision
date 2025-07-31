import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import * as XLSX from "https://esm.sh/xlsx@0.18.5"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuración para archivos grandes
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const PROCESSING_TIMEOUT = 25000 // 25 segundos
const MAX_ROWS_TO_PROCESS = 10000 // Procesar máximo 10k filas
const MAX_SHEETS_TO_PROCESS = 20 // Procesar máximo 20 hojas

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Configurar timeout para la función
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Processing timeout exceeded')), PROCESSING_TIMEOUT)
  })

  try {
    return await Promise.race([timeoutPromise, processFile(req)])
  } catch (error) {
    console.error('Error in claude-testing-processor:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.name === 'TimeoutError' ? 'File too large or processing took too long' : 'Processing failed'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function processFile(req: Request) {
  console.log('Starting claude-testing-processor...')
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  console.log('Environment check:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey
  })
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration')
    throw new Error('Missing Supabase configuration')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const formData = await req.formData()
  const file = formData.get('file') as File
  const sessionName = formData.get('sessionName') as string

  if (!file || !sessionName) {
    throw new Error('File and sessionName are required')
  }

  // Validar tamaño de archivo
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }

  // Validar formato de archivo
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    throw new Error('Invalid file format. Only Excel files (.xlsx, .xls) are supported')
  }

  console.log(`Processing file: ${file.name}, size: ${file.size} bytes`)

  // Get user from authorization header
  const authHeader = req.headers.get('authorization')
  console.log('Auth header present:', !!authHeader)
  
  if (!authHeader) {
    console.error('Missing authorization header')
    throw new Error('Missing authorization header')
  }

  console.log('Attempting to get user from token...')
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )

  console.log('Auth result:', { 
    hasUser: !!user, 
    userId: user?.id,
    authError: authError?.message 
  })

  if (authError || !user) {
    console.error('Authentication failed:', authError)
    throw new Error(`Unauthorized: ${authError?.message || 'No user found'}`)
  }

  // Read file as ArrayBuffer
  console.log('Reading file as ArrayBuffer...')
  const arrayBuffer = await file.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)
  
  console.log(`File data length: ${data.length} bytes`)
  
  // Parse Excel file using SheetJS con opciones optimizadas
  console.log('Parsing Excel file with SheetJS...')
  
  let workbook: any
  try {
    console.log('Using static XLSX import with optimized options')
    // Opciones optimizadas para archivos grandes
    workbook = XLSX.read(data, { 
      type: 'array',
      dense: true, // Usar arrays densos para mejor rendimiento
      cellDates: false, // No parsear fechas para ser más rápido
      cellNF: false, // No formatear números
      cellStyles: false, // No cargar estilos
      sheetStubs: false, // No crear stubs para celdas vacías
      bookDeps: false, // No cargar dependencias
      bookFiles: false, // No cargar archivos
      bookProps: false, // No cargar propiedades
      bookSheets: false, // No cargar metadata de hojas
      bookVBA: false // No cargar VBA
    })
    console.log('Excel file parsed successfully with optimizations')
  } catch (xlsxError) {
    console.error('Error importing or using XLSX:', xlsxError)
    throw new Error(`Failed to parse Excel file: ${xlsxError.message}`)
  }
  
  console.log(`Workbook sheets: ${workbook.SheetNames.join(', ')}`)

  // Limitar número de hojas a procesar
  const sheetsToProcess = workbook.SheetNames.slice(0, MAX_SHEETS_TO_PROCESS)
  if (workbook.SheetNames.length > MAX_SHEETS_TO_PROCESS) {
    console.log(`Limiting processing to first ${MAX_SHEETS_TO_PROCESS} sheets out of ${workbook.SheetNames.length}`)
  }

  // Extract sheets and their data de forma optimizada
  const sheets = sheetsToProcess
  const detectedFields: Record<string, string[]> = {}
  
  console.log('Processing sheets with optimizations...')
  for (const sheetName of sheetsToProcess) {
    console.log(`Processing sheet: ${sheetName}`)
    const worksheet = workbook.Sheets[sheetName]
    if (worksheet) {
      try {
        // Optimización: Solo leer las primeras filas para obtener headers
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
        const maxRow = Math.min(range.e.r, MAX_ROWS_TO_PROCESS - 1)
        const limitedRange = `${XLSX.utils.encode_cell({r: 0, c: range.s.c})}:${XLSX.utils.encode_cell({r: Math.min(2, maxRow), c: range.e.c})}`
        
        // Solo convertir las primeras filas para detectar headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          range: limitedRange,
          raw: true, // Sin formatear para ser más rápido
          defval: null // Usar null para celdas vacías
        }) as any[][]
        
        if (jsonData.length > 0 && jsonData[0]) {
          // Get headers from first row
          const headers = (jsonData[0] as any[]).filter(h => h !== null && h !== undefined && String(h).trim() !== '')
          detectedFields[sheetName] = headers.map(h => String(h)).slice(0, 100) // Limitar a 100 columnas
          console.log(`Sheet ${sheetName} headers (${detectedFields[sheetName].length}):`, detectedFields[sheetName].slice(0, 10))
        } else {
          console.log(`Sheet ${sheetName} is empty or has no headers`)
          detectedFields[sheetName] = []
        }
      } catch (sheetError) {
        console.error(`Error processing sheet ${sheetName}:`, sheetError)
        detectedFields[sheetName] = []
      }
    }
  }

  console.log(`Final detected fields for ${sheets.length} sheets:`, Object.keys(detectedFields))

  // Create test session in database
  console.log('Creating test session in database...')
  console.log('Session data:', {
    user_id: user.id,
    session_name: sessionName,
    file_name: file.name,
    file_size: file.size,
    sheetsCount: sheets.length,
    fieldsCount: Object.keys(detectedFields).length
  })
  
  // Validar que tenemos datos válidos antes de insertar
  if (!sessionName || sessionName.trim().length === 0) {
    throw new Error('Session name is required and cannot be empty')
  }
  
  if (!file.name || file.name.trim().length === 0) {
    throw new Error('File name is required and cannot be empty')
  }

  // Preparar datos para inserción con validación
  const sessionData = {
    user_id: user.id,
    session_name: sessionName.trim(),
    file_name: file.name,
    file_size: file.size || 0,
    upload_status: 'completed' as const,
    processing_status: 'completed' as const,
    detected_sheets: JSON.parse(JSON.stringify(sheets)), // Asegurar JSON válido
    detected_fields: JSON.parse(JSON.stringify(detectedFields)) // Asegurar JSON válido
  }
  
  console.log('Inserting session data:', JSON.stringify(sessionData, null, 2))
  
  const { data: session, error: sessionError } = await supabase
    .from('test_sessions')
    .insert(sessionData)
    .select()
    .single()

  if (sessionError) {
    console.error('Database error:', sessionError)
    console.error('Full session error details:', JSON.stringify(sessionError, null, 2))
    console.error('Session data that failed:', JSON.stringify(sessionData, null, 2))
    throw new Error(`Failed to create test session: ${sessionError.message}`)
  }

  console.log(`Test session created with ID: ${session.id}`)

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      sheets,
      detectedFields,
      success: true,
      message: 'File processed successfully',
      processingStats: {
        sheetsProcessed: sheets.length,
        totalSheets: workbook.SheetNames.length,
        fieldsDetected: Object.values(detectedFields).reduce((acc, fields) => acc + fields.length, 0)
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}