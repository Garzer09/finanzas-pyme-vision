// Template Generator Edge Function
// Generates CSV templates dynamically based on template schemas
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TemplateSchema {
  id: string
  name: string
  display_name: string
  description?: string
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
    allowAdditionalColumns?: boolean
    delimiter?: string
  }
  validation_rules: Array<any>
}

interface GenerateTemplateRequest {
  template_name: string
  company_id?: string
  years?: number[]
  customizations?: any
  format?: 'csv' | 'xlsx'
  delimiter?: string
  include_sample_data?: boolean
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

    // Authenticate user (optional for template generation)
    const authHeader = req.headers.get('authorization')
    let user = null
    if (authHeader) {
      const { data: { user: authUser } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      user = authUser
    }

    // Parse request
    const request: GenerateTemplateRequest = await req.json()
    const { 
      template_name, 
      company_id, 
      years = [], 
      customizations, 
      format = 'csv', 
      delimiter = ',',
      include_sample_data = true
    } = request

    if (!template_name) {
      return new Response(JSON.stringify({ error: 'template_name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get template schema
    const { data: templateData, error: templateError } = await supabase
      .from('template_schemas')
      .select('*')
      .eq('name', template_name)
      .eq('is_active', true)
      .single()

    if (templateError || !templateData) {
      return new Response(JSON.stringify({ error: `Template '${template_name}' not found` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let templateSchema: TemplateSchema = templateData as TemplateSchema

    // Apply company customizations if available
    if (company_id) {
      const { data: customization } = await supabase
        .from('company_template_customizations')
        .select('*')
        .eq('company_id', company_id)
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
        if (customization.custom_display_name) {
          templateSchema.display_name = customization.custom_display_name
        }
      }
    }

    // Apply request-specific customizations
    if (customizations) {
      templateSchema.schema_definition = {
        ...templateSchema.schema_definition,
        ...customizations
      }
    }

    // Generate template content
    const templateContent = generateTemplateContent(templateSchema, years, delimiter, include_sample_data)

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const yearSuffix = years.length > 0 ? `_${years.join('-')}` : ''
    const companySuffix = company_id ? `_${company_id.slice(0, 8)}` : ''
    const filename = `${template_name}${yearSuffix}${companySuffix}_${timestamp}.${format}`

    // Log template generation
    if (user) {
      await supabase
        .from('upload_history')
        .insert({
          template_schema_id: templateSchema.id,
          template_name: templateSchema.name,
          original_filename: filename,
          file_size: templateContent.length,
          upload_status: 'completed',
          detected_years: years,
          selected_years: years,
          validation_results: {
            is_valid: true,
            errors: [],
            warnings: [],
            statistics: {
              total_rows: 0,
              valid_rows: 0,
              invalid_rows: 0,
              warnings_count: 0,
              errors_count: 0
            }
          },
          file_metadata: {
            delimiter,
            encoding: 'utf-8',
            headers: extractHeaders(templateSchema, years),
            row_count: include_sample_data ? templateSchema.schema_definition.expectedConcepts?.length || 0 : 0,
            column_count: calculateColumnCount(templateSchema, years),
            file_size: templateContent.length
          },
          company_id,
          user_id: user.id
        })
    }

    return new Response(JSON.stringify({
      success: true,
      template_content: templateContent,
      filename,
      template_name: templateSchema.name,
      template_display_name: templateSchema.display_name,
      metadata: {
        headers: extractHeaders(templateSchema, years),
        column_count: calculateColumnCount(templateSchema, years),
        has_sample_data: include_sample_data,
        format,
        delimiter
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in template generator:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function generateTemplateContent(
  schema: TemplateSchema, 
  years: number[], 
  delimiter: string, 
  includeSampleData: boolean
): string {
  const lines: string[] = []

  // Generate headers
  const headers = extractHeaders(schema, years)
  lines.push(headers.join(delimiter))

  // Add description row if sample data is requested
  if (includeSampleData) {
    const descriptionRow = headers.map(header => {
      // Find column definition
      const column = schema.schema_definition.columns.find(col => col.name === header)
      if (column && column.description) {
        return `"${column.description}"`
      }
      
      // Check if it's a year column
      if (schema.schema_definition.variableYearColumns) {
        const yearPattern = new RegExp(schema.schema_definition.yearColumnPattern || '^[0-9]{4}$')
        if (yearPattern.test(header)) {
          return `"Values for year ${header}"`
        }
      }
      
      return '""'
    })
    lines.push(descriptionRow.join(delimiter))
  }

  // Add expected concepts if available and sample data is requested
  if (includeSampleData && schema.schema_definition.expectedConcepts) {
    schema.schema_definition.expectedConcepts.forEach(concept => {
      const row = new Array(headers.length).fill('')
      row[0] = `"${concept}"` // Assuming first column is always 'Concepto'
      lines.push(row.join(delimiter))
    })
  }

  // Add validation instructions as comments (if CSV format)
  if (includeSampleData && schema.validation_rules.length > 0) {
    lines.push('') // Empty line
    lines.push(`"# Validation Rules:"`)
    schema.validation_rules.forEach((rule, index) => {
      lines.push(`"# ${index + 1}. ${rule.message || rule.type}"`)
    })
  }

  return lines.join('\n')
}

function extractHeaders(schema: TemplateSchema, years: number[]): string[] {
  const headers: string[] = []

  // Add regular columns
  schema.schema_definition.columns.forEach(column => {
    headers.push(column.name)
  })

  // Handle variable year columns
  if (schema.schema_definition.variableYearColumns && years.length > 0) {
    const yearPattern = new RegExp(schema.schema_definition.yearColumnPattern || '^[0-9]{4}$')
    
    // Remove existing year columns from headers
    const nonYearHeaders = headers.filter(h => !yearPattern.test(h))
    
    // Find position to insert year columns (before 'Notas' if it exists)
    const insertIndex = nonYearHeaders.findIndex(h => h.toLowerCase() === 'notas')
    const targetIndex = insertIndex === -1 ? nonYearHeaders.length : insertIndex
    
    // Insert year columns
    const finalHeaders = [...nonYearHeaders]
    years.sort().forEach((year, index) => {
      finalHeaders.splice(targetIndex + index, 0, year.toString())
    })
    
    return finalHeaders
  }

  return headers
}

function calculateColumnCount(schema: TemplateSchema, years: number[]): number {
  let count = schema.schema_definition.columns.length

  // Adjust for variable year columns
  if (schema.schema_definition.variableYearColumns) {
    const yearPattern = new RegExp(schema.schema_definition.yearColumnPattern || '^[0-9]{4}$')
    const yearColumnsInSchema = schema.schema_definition.columns.filter(col => yearPattern.test(col.name)).length
    
    // Remove existing year columns and add the requested ones
    count = count - yearColumnsInSchema + years.length
  }

  return count
}

// Additional utility functions for different export formats
function generateExcelTemplate(
  schema: TemplateSchema, 
  years: number[], 
  includeSampleData: boolean
): string {
  // This would generate Excel format (XLSX)
  // For now, return CSV format as placeholder
  // In a real implementation, you'd use a library like ExcelJS
  return generateTemplateContent(schema, years, ',', includeSampleData)
}

function generateTemplateDocumentation(schema: TemplateSchema): string {
  const docs: string[] = []
  
  docs.push(`# ${schema.display_name}`)
  docs.push('')
  
  if (schema.description) {
    docs.push(schema.description)
    docs.push('')
  }
  
  docs.push('## Columns')
  docs.push('')
  
  schema.schema_definition.columns.forEach(column => {
    docs.push(`### ${column.name}`)
    docs.push(`- **Type**: ${column.type}`)
    docs.push(`- **Required**: ${column.required ? 'Yes' : 'No'}`)
    if (column.description) {
      docs.push(`- **Description**: ${column.description}`)
    }
    if (column.validations && column.validations.length > 0) {
      docs.push(`- **Validations**: ${column.validations.length} rule(s)`)
    }
    docs.push('')
  })
  
  if (schema.validation_rules.length > 0) {
    docs.push('## Validation Rules')
    docs.push('')
    
    schema.validation_rules.forEach((rule, index) => {
      docs.push(`${index + 1}. **${rule.type}**: ${rule.message}`)
      if (rule.description) {
        docs.push(`   - ${rule.description}`)
      }
    })
  }
  
  return docs.join('\n')
}