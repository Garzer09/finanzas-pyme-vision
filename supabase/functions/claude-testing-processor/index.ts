import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
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
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)
    
    // Parse Excel file using SheetJS
    const workbook = XLSX.read(data, { type: 'array' })
    
    console.log(`Workbook sheets: ${workbook.SheetNames.join(', ')}`)

    // Extract sheets and their data
    const sheets = workbook.SheetNames
    const detectedFields: Record<string, string[]> = {}
    
    sheets.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName]
      if (worksheet) {
        // Convert to JSON to get headers/fields
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
        
        if (jsonData.length > 0) {
          // Get headers from first row
          const headers = jsonData[0] as string[]
          detectedFields[sheetName] = headers.filter(h => h && typeof h === 'string')
        }
      }
    })

    console.log(`Detected fields:`, detectedFields)

    // Create test session in database
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