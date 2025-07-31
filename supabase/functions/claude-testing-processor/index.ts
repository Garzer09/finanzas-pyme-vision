import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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
    
    // Parse Excel file using SheetJS
    console.log('Parsing Excel file with SheetJS...')
    
    let workbook: any
    let XLSX: any
    
    try {
      // Import XLSX dynamically
      XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs')
      console.log('XLSX imported successfully')
      workbook = XLSX.read(data, { type: 'array' })
      console.log('Excel file parsed successfully')
    } catch (xlsxError) {
      console.error('Error importing or using XLSX:', xlsxError)
      throw new Error(`Failed to parse Excel file: ${xlsxError.message}`)
    }
    
    console.log(`Workbook sheets: ${workbook.SheetNames.join(', ')}`)

    // Extract sheets and their data
    const sheets = workbook.SheetNames
    const detectedFields: Record<string, string[]> = {}
    
    console.log('Processing sheets...')
    sheets.forEach(sheetName => {
      console.log(`Processing sheet: ${sheetName}`)
      const worksheet = workbook.Sheets[sheetName]
      if (worksheet) {
        try {
          // Convert to JSON to get headers/fields
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
          
          if (jsonData.length > 0) {
            // Get headers from first row
            const headers = jsonData[0] as string[]
            detectedFields[sheetName] = headers.filter(h => h && typeof h === 'string')
            console.log(`Sheet ${sheetName} headers:`, detectedFields[sheetName])
          } else {
            console.log(`Sheet ${sheetName} is empty`)
            detectedFields[sheetName] = []
          }
        } catch (sheetError) {
          console.error(`Error processing sheet ${sheetName}:`, sheetError)
          detectedFields[sheetName] = []
        }
      }
    })

    console.log(`Final detected fields:`, detectedFields)

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
    
    const { data: session, error: sessionError } = await supabase
      .from('test_sessions')
      .insert({
        user_id: user.id,
        session_name: sessionName,
        file_name: file.name,
        file_size: file.size,
        upload_status: 'completed',
        processing_status: 'completed',
        detected_sheets: sheets,
        detected_fields: detectedFields
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Database error:', sessionError)
      console.error('Full session error details:', JSON.stringify(sessionError, null, 2))
      throw new Error(`Failed to create test session: ${sessionError.message}`)
    }

    console.log(`Test session created with ID: ${session.id}`)

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        sheets,
        detectedFields,
        success: true,
        message: 'File processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in claude-testing-processor:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})