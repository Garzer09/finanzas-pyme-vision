// Enhanced Template Processor Edge Function
// Processes files using the new dynamic template system
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TemplateSchema {
  id: string
  name: string
  display_name: string
  schema_definition: {
    columns: Array<{
      name: string
      type: string
      required: boolean
      description?: string
      validations?: Array<any>
    }>
    variableYearColumns?: boolean
    yearColumnPattern?: string
    expectedConcepts?: string[]
  }
  validation_rules: Array<any>
}

interface ProcessingRequest {
  file: File
  template_name?: string
  company_id?: string
  selected_years?: number[]
  dry_run?: boolean
  custom_validations?: Array<any>
}

interface ValidationError {
  row?: number
  column?: string
  value?: any
  message: string
  type: string
  severity: 'error' | 'warning' | 'info'
}

interface ValidationResults {
  is_valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  statistics: {
    total_rows: number
    valid_rows: number
    invalid_rows: number
    warnings_count: number
    errors_count: number
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse form data
    const formData = await req.formData()
    
    const file = formData.get('file') as File
    const templateName = formData.get('template_name') as string
    const companyId = formData.get('company_id') as string
    const selectedYears = formData.getAll('selected_years[]').map(y => parseInt(y as string)).filter(y => !isNaN(y))
    const dryRun = formData.get('dry_run') === 'true'

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get template schema
    let templateSchema: TemplateSchema | null = null
    if (templateName) {
      const { data: schemaData, error: schemaError } = await supabase
        .from('template_schemas')
        .select('*')
        .eq('name', templateName)
        .eq('is_active', true)
        .single()

      if (schemaError || !schemaData) {
        return new Response(JSON.stringify({ error: `Template '${templateName}' not found` }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      templateSchema = schemaData as TemplateSchema

      // Apply company customizations if available
      if (companyId) {
        const { data: customization } = await supabase
          .from('company_template_customizations')
          .select('*')
          .eq('company_id', companyId)
          .eq('template_schema_id', templateSchema.id)
          .eq('is_active', true)
          .single()

        if (customization) {
          // Apply customizations
          if (customization.custom_schema) {
            templateSchema.schema_definition = {
              ...templateSchema.schema_definition,
              ...customization.custom_schema
            }
          }
          if (customization.custom_validations) {
            templateSchema.validation_rules = [
              ...templateSchema.validation_rules,
              ...customization.custom_validations
            ]
          }
        }
      }
    }

    // Analyze file
    const fileContent = await file.text()
    const analysis = await analyzeFile(fileContent, file.name)

    // Auto-detect template if not provided
    if (!templateSchema && analysis.headers.length > 0) {
      const detectedTemplate = await detectTemplate(supabase, analysis.headers, analysis.sampleRows)
      if (detectedTemplate) {
        templateSchema = detectedTemplate
      }
    }

    if (!templateSchema) {
      return new Response(JSON.stringify({ 
        error: 'No template specified and could not auto-detect template',
        analysis 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate file against template
    const validationResults = await validateAgainstTemplate(
      templateSchema,
      analysis.fileData,
      analysis.metadata
    )

    // Create upload history record
    const uploadRecord = {
      template_schema_id: templateSchema.id,
      template_name: templateSchema.name,
      original_filename: file.name,
      file_size: file.size,
      upload_status: dryRun ? 'completed' : 'pending',
      detected_years: analysis.detectedYears,
      selected_years: selectedYears.length > 0 ? selectedYears : analysis.detectedYears,
      validation_results: validationResults,
      file_metadata: analysis.metadata,
      company_id: companyId,
      user_id: user.id
    }

    const { data: uploadData, error: uploadError } = await supabase
      .from('upload_history')
      .insert(uploadRecord)
      .select()
      .single()

    if (uploadError) {
      console.warn('Failed to create upload history record:', uploadError)
    }

    // If not a dry run and validation passed, process data to staging tables
    if (!dryRun && validationResults.is_valid && companyId) {
      try {
        const jobId = uploadData?.id || crypto.randomUUID()
        
        // Process data to staging tables
        const stagingData = await processDataToStaging(
          analysis.fileData,
          templateSchema,
          companyId,
          user.id,
          jobId,
          selectedYears.length > 0 ? selectedYears : analysis.detectedYears
        )
        
        // Call processing function to move from staging to final tables
        const { data: processingResult, error: processingError } = await supabase
          .rpc('process_financial_staging', {
            p_job: jobId
          })
        
        if (processingError) {
          console.warn('Processing warning:', processingError)
        }

        return new Response(JSON.stringify({
          success: true,
          upload_id: jobId,
          template_name: templateSchema.name,
          template_display_name: templateSchema.display_name,
          validation_results: validationResults,
          detected_years: analysis.detectedYears,
          file_analysis: analysis,
          staging_result: stagingData,
          processing_result: processingResult,
          dry_run: false
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
        
      } catch (processingError) {
        console.error('Error processing data to staging:', processingError)
        return new Response(JSON.stringify({
          success: false,
          error: 'Processing failed',
          details: processingError instanceof Error ? processingError.message : 'Unknown processing error',
          upload_id: uploadData?.id
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Return response for dry run or validation failed
    return new Response(JSON.stringify({
      success: true,
      upload_id: uploadData?.id,
      template_name: templateSchema.name,
      template_display_name: templateSchema.display_name,
      validation_results: validationResults,
      detected_years: analysis.detectedYears,
      file_analysis: analysis,
      dry_run: dryRun
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in enhanced template processor:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function analyzeFile(content: string, filename: string) {
  const lines = content.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) {
    throw new Error('File is empty')
  }

  // Detect delimiter
  const delimiter = detectDelimiter(lines[0])
  
  // Parse headers
  const headers = parseCSVLine(lines[0], delimiter)
  
  // Parse all data
  const fileData: string[][] = []
  lines.forEach(line => {
    const row = parseCSVLine(line, delimiter)
    fileData.push(row)
  })

  // Get sample rows (excluding header)
  const sampleRows = fileData.slice(1, Math.min(11, fileData.length))

  // Detect years
  const detectedYears = detectYears(headers)

  // Create metadata
  const metadata = {
    delimiter,
    encoding: 'utf-8',
    headers,
    row_count: fileData.length - 1, // Excluding header
    column_count: headers.length,
    file_size: content.length,
    mime_type: 'text/csv'
  }

  return {
    headers,
    sampleRows,
    fileData,
    detectedYears,
    metadata
  }
}

function detectDelimiter(firstLine: string): string {
  const delimiters = [',', ';', '\t', '|']
  let bestDelimiter = ','
  let maxCount = 0

  delimiters.forEach(delimiter => {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length
    if (count > maxCount) {
      maxCount = count
      bestDelimiter = delimiter
    }
  })

  return bestDelimiter
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

function detectYears(headers: string[]): number[] {
  const years: number[] = []
  const yearPattern = /^(19|20)\d{2}$/

  headers.forEach(header => {
    const trimmed = header.trim()
    if (yearPattern.test(trimmed)) {
      years.push(parseInt(trimmed, 10))
    }
  })

  return years.sort()
}

async function detectTemplate(supabase: any, headers: string[], sampleData: string[][]): Promise<TemplateSchema | null> {
  const { data: templates, error } = await supabase
    .from('template_schemas')
    .select('*')
    .eq('is_active', true)

  if (error || !templates) {
    return null
  }

  let bestMatch: TemplateSchema | null = null
  let bestConfidence = 0

  for (const template of templates) {
    const confidence = calculateTemplateMatch(template, headers)
    if (confidence > bestConfidence && confidence > 0.5) {
      bestConfidence = confidence
      bestMatch = template
    }
  }

  return bestMatch
}

function calculateTemplateMatch(template: TemplateSchema, fileHeaders: string[]): number {
  const templateColumns = template.schema_definition.columns.map(col => col.name)
  const normalizedFileHeaders = fileHeaders.map(h => h.trim().toLowerCase())
  const normalizedTemplateColumns = templateColumns.map(col => col.toLowerCase())

  let matchedColumns = 0
  
  templateColumns.forEach(templateCol => {
    const normalizedTemplateCol = templateCol.toLowerCase()
    if (normalizedFileHeaders.includes(normalizedTemplateCol)) {
      matchedColumns++
    }
  })

  // Handle variable year columns
  if (template.schema_definition.variableYearColumns) {
    const yearPattern = new RegExp(template.schema_definition.yearColumnPattern || '^[0-9]{4}$')
    const yearColumns = fileHeaders.filter(h => yearPattern.test(h.trim()))
    if (yearColumns.length > 0) {
      matchedColumns += 1 // Give bonus for year columns
    }
  }

  return templateColumns.length > 0 ? matchedColumns / templateColumns.length : 0
}

async function validateAgainstTemplate(
  schema: TemplateSchema,
  fileData: string[][],
  metadata: any
): Promise<ValidationResults> {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  
  if (fileData.length === 0) {
    errors.push({
      message: 'File has no data rows',
      type: 'required',
      severity: 'error'
    })
    
    return {
      is_valid: false,
      errors,
      warnings,
      statistics: {
        total_rows: 0,
        valid_rows: 0,
        invalid_rows: 0,
        warnings_count: 0,
        errors_count: 1
      }
    }
  }

  const headers = fileData[0]
  const dataRows = fileData.slice(1)

  // Map columns
  const columnMapping = mapColumns(schema, headers)
  
  // Check for missing required columns
  const requiredColumns = schema.schema_definition.columns
    .filter(col => col.required)
    .map(col => col.name)

  const missingRequired = requiredColumns.filter(colName => 
    !columnMapping.mapped.hasOwnProperty(colName)
  )
  
  if (missingRequired.length > 0) {
    errors.push({
      message: `Missing required columns: ${missingRequired.join(', ')}`,
      type: 'required',
      severity: 'error'
    })
  }

  // Validate each row
  let validRows = 0
  let invalidRows = 0

  dataRows.forEach((row, rowIndex) => {
    const rowErrors = validateRow(schema, row, headers, columnMapping, rowIndex + 2)
    
    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
      invalidRows++
    } else {
      validRows++
    }
  })

  // Apply template validation rules
  const templateValidationErrors = applyTemplateValidations(
    schema.validation_rules,
    dataRows,
    headers,
    columnMapping
  )
  errors.push(...templateValidationErrors)

  const statistics = {
    total_rows: dataRows.length,
    valid_rows: validRows,
    invalid_rows: invalidRows,
    warnings_count: warnings.length,
    errors_count: errors.length
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    statistics
  }
}

function mapColumns(schema: TemplateSchema, fileHeaders: string[]) {
  const mapped: Record<string, number> = {}
  const unmapped: string[] = []

  schema.schema_definition.columns.forEach(column => {
    const headerIndex = fileHeaders.findIndex(h => 
      h.trim().toLowerCase() === column.name.toLowerCase()
    )
    
    if (headerIndex !== -1) {
      mapped[column.name] = headerIndex
    } else {
      unmapped.push(column.name)
    }
  })

  // Handle variable year columns
  if (schema.schema_definition.variableYearColumns) {
    const yearPattern = new RegExp(schema.schema_definition.yearColumnPattern || '^[0-9]{4}$')
    fileHeaders.forEach((header, index) => {
      if (yearPattern.test(header.trim())) {
        mapped[header] = index
      }
    })
  }

  return { mapped, unmapped }
}

async function processDataToStaging(
  fileData: string[][],
  schema: TemplateSchema,
  companyId: string,
  userId: string,
  jobId: string,
  selectedYears: number[]
): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  if (fileData.length === 0) {
    throw new Error('No data to process')
  }

  const headers = fileData[0]
  const dataRows = fileData.slice(1)
  const columnMapping = mapColumns(schema, headers)

  // Determine data type from template name
  let dataType = 'financial_data'
  if (schema.name.includes('balance') || schema.name.includes('situacion')) {
    dataType = 'balance_situacion'
  } else if (schema.name.includes('pyg') || schema.name.includes('perdidas')) {
    dataType = 'estado_pyg'
  } else if (schema.name.includes('flujo') || schema.name.includes('cash')) {
    dataType = 'estado_flujos'
  }

  const stagingRecords = []

  // Process each data row
  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
    const row = dataRows[rowIndex]
    
    // Extract concept (first column typically)
    const conceptIndex = columnMapping.mapped['concepto'] || columnMapping.mapped['concept'] || 0
    const concept = row[conceptIndex]?.toString().trim()
    
    if (!concept || concept === '') continue

    // Process year columns
    for (const year of selectedYears) {
      const yearColumnIndex = columnMapping.mapped[year.toString()]
      if (yearColumnIndex !== undefined) {
        const amount = parseFloat(row[yearColumnIndex]?.toString().replace(/[^\d.-]/g, '') || '0')
        
        if (!isNaN(amount) && amount !== 0) {
          // Set the appropriate field based on data type
          let recordData = {
            job_id: jobId,
            company_id: companyId,
            user_id: userId,
            data_type: dataType,
            period_type: 'annual',
            period_year: year,
            concept_original: concept,
            concept_normalized: normalizeFinancialConcept(concept),
            amount: amount,
            currency_code: 'EUR',
            file_name: schema.name,
            source: 'template_upload',
            status: 'pending'
          }
          
          // Add specific fields based on data type
          if (dataType === 'balance_situacion') {
            recordData.section = 'Activo' // Balance sheet needs section
          } else if (dataType === 'estado_flujos') {
            recordData.section = 'Operaciones' // Cash flow needs section mapped to category in DB
          }
          // P&G (estado_pyg) doesn't need section field
          
          stagingRecords.push(recordData)
        }
      }
    }
  }

  // Insert records to staging table
  if (stagingRecords.length > 0) {
    const { data, error } = await supabase
      .from('financial_lines_staging')
      .insert(stagingRecords)
      .select()

    if (error) {
      throw new Error(`Failed to insert staging data: ${error.message}`)
    }

    return {
      records_inserted: stagingRecords.length,
      data_type: dataType,
      years_processed: selectedYears,
      job_id: jobId
    }
  }

  return {
    records_inserted: 0,
    data_type: dataType,
    message: 'No valid records found to process'
  }
}

function normalizeFinancialConcept(concept: string): string {
  // Basic normalization - remove special characters, convert to lowercase
  return concept.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function validateRow(
  schema: TemplateSchema,
  row: string[],
  headers: string[],
  columnMapping: any,
  rowNumber: number
): ValidationError[] {
  const errors: ValidationError[] = []

  schema.schema_definition.columns.forEach(column => {
    const columnIndex = columnMapping.mapped[column.name]
    
    if (columnIndex === undefined) {
      if (column.required) {
        errors.push({
          row: rowNumber,
          column: column.name,
          message: `Required column '${column.name}' is missing`,
          type: 'required',
          severity: 'error'
        })
      }
      return
    }

    const value = row[columnIndex]

    // Check required fields
    if (column.required && (!value || value.trim() === '')) {
      errors.push({
        row: rowNumber,
        column: column.name,
        value,
        message: `Required field '${column.name}' is empty`,
        type: 'required',
        severity: 'error'
      })
      return
    }

    // Skip validation for empty optional fields
    if (!column.required && (!value || value.trim() === '')) {
      return
    }

    // Type validation
    const typeError = validateFieldType(column, value, rowNumber)
    if (typeError) {
      errors.push(typeError)
    }

    // Column-specific validations
    if (column.validations) {
      column.validations.forEach(validation => {
        const validationError = validateFieldRule(column, value, validation, rowNumber)
        if (validationError) {
          errors.push(validationError)
        }
      })
    }
  })

  return errors
}

function validateFieldType(column: any, value: string, rowNumber: number): ValidationError | null {
  const stringValue = value.trim()
  
  switch (column.type) {
    case 'number':
      if (stringValue && isNaN(Number(stringValue))) {
        return {
          row: rowNumber,
          column: column.name,
          value,
          message: `'${column.name}' must be a number`,
          type: 'format',
          severity: 'error'
        }
      }
      break
    
    case 'date':
      if (stringValue && isNaN(Date.parse(stringValue))) {
        return {
          row: rowNumber,
          column: column.name,
          value,
          message: `'${column.name}' must be a valid date`,
          type: 'format',
          severity: 'error'
        }
      }
      break
    
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (stringValue && !emailRegex.test(stringValue)) {
        return {
          row: rowNumber,
          column: column.name,
          value,
          message: `'${column.name}' must be a valid email address`,
          type: 'format',
          severity: 'error'
        }
      }
      break
  }

  return null
}

function validateFieldRule(column: any, value: string, validation: any, rowNumber: number): ValidationError | null {
  const numValue = Number(value)
  
  switch (validation.type) {
    case 'range':
      if (!isNaN(numValue)) {
        if (validation.min !== undefined && numValue < validation.min) {
          return {
            row: rowNumber,
            column: column.name,
            value,
            message: validation.message || `'${column.name}' must be at least ${validation.min}`,
            type: 'range',
            severity: 'error'
          }
        }
        if (validation.max !== undefined && numValue > validation.max) {
          return {
            row: rowNumber,
            column: column.name,
            value,
            message: validation.message || `'${column.name}' must be at most ${validation.max}`,
            type: 'range',
            severity: 'error'
          }
        }
      }
      break
    
    case 'format':
      if (validation.pattern) {
        const regex = new RegExp(validation.pattern)
        if (!regex.test(value)) {
          return {
            row: rowNumber,
            column: column.name,
            value,
            message: validation.message || `'${column.name}' format is invalid`,
            type: 'format',
            severity: 'error'
          }
        }
      }
      break
  }

  return null
}

function applyTemplateValidations(
  validationRules: any[],
  dataRows: string[][],
  headers: string[],
  columnMapping: any
): ValidationError[] {
  const errors: ValidationError[] = []

  validationRules.forEach(rule => {
    switch (rule.type) {
      case 'balance_check':
        // Balance check validation would be implemented here
        // This is complex business logic specific to financial statements
        break
      
      case 'calculation':
        // Calculation validation would be implemented here
        break
      
      case 'calculation_check':
        // Check for forbidden patterns in P&L
        const forbiddenPatterns = [
          /ebit/i, /ebitda/i, /\bbai\b/i, /beneficio.*antes.*impuesto/i,
          /margen/i, /ratio/i, /percentage/i, /%/
        ]
        
        dataRows.forEach((row, rowIndex) => {
          const concept = row[0]?.toLowerCase() || ''
          
          if (forbiddenPatterns.some(pattern => pattern.test(concept))) {
            errors.push({
              row: rowIndex + 2,
              column: 'Concepto',
              value: row[0],
              message: rule.message || 'No incluir EBIT/EBITDA/BAI/márgenes. Solo incluir cuentas base.',
              type: 'calculation',
              severity: 'warning'
            })
          }
        })
        break
    }
  })

  return errors
}