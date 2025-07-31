import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NORMALIZATION_TIMEOUT = 20000 // 20 segundos

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Normalization timeout exceeded')), NORMALIZATION_TIMEOUT)
  })

  try {
    return await Promise.race([timeoutPromise, normalizeData(req)])
  } catch (error) {
    console.error('Error in data-normalizer:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stage: 'normalization'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function normalizeData(req: Request) {
  console.log('Starting data normalization...')
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { extractedData, documentType, sessionId } = await req.json()

  if (!extractedData || !documentType || !sessionId) {
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

  // Normalizar datos a esquema común
  const normalizedData = await normalizeToCommonSchema(extractedData, documentType)
  
  // Aplicar reglas de mapeo del usuario (si existen)
  const userMappingRules = await getUserMappingRules(supabase, user.id)
  const mappedData = await applyMappingRules(normalizedData, userMappingRules)
  
  // Validar integridad de datos normalizados
  const integrityCheck = await validateDataIntegrity(mappedData, documentType)

  console.log('Data normalization completed successfully')

  return new Response(
    JSON.stringify({
      success: true,
      normalized_data: mappedData,
      integrity_check: integrityCheck,
      normalization_stats: {
        sheets_normalized: Object.keys(normalizedData).length,
        fields_mapped: Object.values(mappedData).reduce((acc: number, sheet: any) => acc + Object.keys(sheet.fields || {}).length, 0),
        normalization_timestamp: new Date().toISOString()
      },
      nextStage: 'validation'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function normalizeToCommonSchema(extractedData: any, documentType: string) {
  console.log('Normalizing to common schema...')
  
  const normalizedData: any = {}
  
  for (const [sheetName, fields] of Object.entries(extractedData.fields || {})) {
    const normalizedSheet = {
      original_name: sheetName,
      normalized_name: normalizeSheetName(sheetName, documentType),
      fields: normalizeFields(fields as string[], documentType),
      data_type: classifySheetDataType(sheetName, fields as string[]),
      confidence: calculateNormalizationConfidence(sheetName, fields as string[], documentType)
    }
    
    normalizedData[sheetName] = normalizedSheet
  }
  
  return normalizedData
}

function normalizeSheetName(sheetName: string, documentType: string): string {
  const lowerName = sheetName.toLowerCase()
  
  // Mapeo de nombres comunes
  const sheetMappings: Record<string, string> = {
    'balance': 'balance_sheet',
    'situacion': 'balance_sheet',
    'balance general': 'balance_sheet',
    'pyg': 'income_statement',
    'p&g': 'income_statement',
    'perdidas y ganancias': 'income_statement',
    'estado de resultados': 'income_statement',
    'cash flow': 'cash_flow_statement',
    'flujo de efectivo': 'cash_flow_statement',
    'efectivo': 'cash_flow_statement',
    'ratios': 'financial_ratios',
    'kpis': 'financial_ratios',
    'indicadores': 'financial_ratios',
    'diario': 'journal_entries',
    'journal': 'journal_entries'
  }
  
  for (const [key, value] of Object.entries(sheetMappings)) {
    if (lowerName.includes(key)) {
      return value
    }
  }
  
  return 'financial_data'
}

function normalizeFields(fields: string[], documentType: string): Record<string, string> {
  const normalizedFields: Record<string, string> = {}
  
  // Diccionario de normalización de campos financieros
  const fieldMappings: Record<string, string> = {
    // Balance Sheet
    'activo': 'assets',
    'activos': 'assets',
    'assets': 'assets',
    'pasivo': 'liabilities',
    'pasivos': 'liabilities',
    'liabilities': 'liabilities',
    'patrimonio': 'equity',
    'equity': 'equity',
    'capital': 'equity',
    'efectivo': 'cash',
    'cash': 'cash',
    'inventario': 'inventory',
    'inventory': 'inventory',
    'deuda': 'debt',
    'debt': 'debt',
    
    // Income Statement
    'ingresos': 'revenue',
    'ventas': 'revenue',
    'revenue': 'revenue',
    'sales': 'revenue',
    'costos': 'cost_of_goods_sold',
    'costes': 'cost_of_goods_sold',
    'cogs': 'cost_of_goods_sold',
    'gastos': 'expenses',
    'expenses': 'expenses',
    'beneficio': 'profit',
    'profit': 'profit',
    'ganancia': 'profit',
    'utilidad': 'profit',
    'perdida': 'loss',
    'loss': 'loss',
    
    // General
    'fecha': 'date',
    'date': 'date',
    'periodo': 'period',
    'period': 'period',
    'importe': 'amount',
    'amount': 'amount',
    'valor': 'value',
    'value': 'value'
  }
  
  for (const field of fields) {
    const lowerField = field.toLowerCase().trim()
    let normalizedField = field // Mantener original por defecto
    
    // Buscar mapeo exacto primero
    if (fieldMappings[lowerField]) {
      normalizedField = fieldMappings[lowerField]
    } else {
      // Buscar mapeo parcial
      for (const [key, value] of Object.entries(fieldMappings)) {
        if (lowerField.includes(key)) {
          normalizedField = value
          break
        }
      }
    }
    
    normalizedFields[field] = normalizedField
  }
  
  return normalizedFields
}

function classifySheetDataType(sheetName: string, fields: string[]): string {
  const lowerName = sheetName.toLowerCase()
  const lowerFields = fields.map(f => f.toLowerCase()).join(' ')
  
  // Clasificación basada en nombre y campos
  if (lowerName.includes('balance') || lowerFields.includes('activo') || lowerFields.includes('pasivo')) {
    return 'balance_sheet'
  }
  if (lowerName.includes('pyg') || lowerName.includes('p&g') || lowerFields.includes('ingresos') || lowerFields.includes('ventas')) {
    return 'income_statement'
  }
  if (lowerName.includes('cash') || lowerName.includes('efectivo') || lowerFields.includes('flujo')) {
    return 'cash_flow'
  }
  if (lowerName.includes('ratio') || lowerName.includes('kpi') || lowerFields.includes('ratio')) {
    return 'financial_ratios'
  }
  
  return 'financial_data'
}

function calculateNormalizationConfidence(sheetName: string, fields: string[], documentType: string): number {
  let confidence = 0.5 // Base
  
  const dataType = classifySheetDataType(sheetName, fields)
  if (dataType !== 'financial_data') confidence += 0.3
  
  // Bonus por número de campos reconocidos
  const recognizedFields = fields.filter(field => {
    const lowerField = field.toLowerCase()
    return ['activo', 'pasivo', 'ingresos', 'ventas', 'costos', 'gastos', 'efectivo', 'deuda'].some(keyword => 
      lowerField.includes(keyword)
    )
  }).length
  
  confidence += Math.min(0.2, recognizedFields / fields.length * 0.2)
  
  return Math.min(confidence, 1.0)
}

async function getUserMappingRules(supabase: any, userId: string) {
  console.log('Loading user mapping rules...')
  
  const { data: rules, error } = await supabase
    .from('data_mapping_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
  
  if (error) {
    console.error('Error loading mapping rules:', error)
    return []
  }
  
  return rules || []
}

async function applyMappingRules(normalizedData: any, mappingRules: any[]) {
  console.log('Applying user mapping rules...')
  
  const mappedData = { ...normalizedData }
  
  for (const rule of mappingRules) {
    const { source_field, target_field, transformation_logic } = rule
    
    // Aplicar regla a todos los sheets relevantes
    for (const [sheetName, sheetData] of Object.entries(mappedData)) {
      const sheet = sheetData as any
      if (sheet.fields && sheet.fields[source_field]) {
        sheet.fields[source_field] = target_field
        
        // Aplicar lógica de transformación si existe
        if (transformation_logic) {
          sheet.transformation_applied = true
          sheet.transformations = sheet.transformations || []
          sheet.transformations.push({
            source: source_field,
            target: target_field,
            logic: transformation_logic,
            applied_at: new Date().toISOString()
          })
        }
      }
    }
  }
  
  return mappedData
}

async function validateDataIntegrity(mappedData: any, documentType: string) {
  console.log('Validating data integrity...')
  
  const integrityCheck = {
    is_valid: true,
    warnings: [] as string[],
    errors: [] as string[],
    balance_check: null as any,
    completeness_score: 0
  }
  
  const sheets = Object.keys(mappedData)
  
  // Verificar completitud básica
  if (sheets.length === 0) {
    integrityCheck.errors.push('No sheets found after normalization')
    integrityCheck.is_valid = false
  }
  
  // Verificar balance (si es balance sheet)
  const balanceSheet = sheets.find(name => mappedData[name].data_type === 'balance_sheet')
  if (balanceSheet && documentType.includes('balance')) {
    integrityCheck.balance_check = await checkBalanceIntegrity(mappedData[balanceSheet])
  }
  
  // Calcular score de completitud
  const totalFields = sheets.reduce((acc, sheet) => acc + Object.keys(mappedData[sheet].fields || {}).length, 0)
  const recognizedFields = sheets.reduce((acc, sheet) => {
    const fields = mappedData[sheet].fields || {}
    return acc + Object.values(fields).filter((field: any) => 
      typeof field === 'string' && !field.includes(' ') && field !== field.toLowerCase()
    ).length
  }, 0)
  
  integrityCheck.completeness_score = totalFields > 0 ? recognizedFields / totalFields : 0
  
  if (integrityCheck.completeness_score < 0.3) {
    integrityCheck.warnings.push('Low field recognition rate - consider reviewing field mappings')
  }
  
  return integrityCheck
}

async function checkBalanceIntegrity(balanceSheetData: any) {
  // Placeholder para verificación de balance
  // En un escenario real, aquí verificaríamos que Activos = Pasivos + Patrimonio
  return {
    assets_total: null,
    liabilities_total: null,
    equity_total: null,
    is_balanced: null,
    difference: null,
    message: 'Balance check requires actual numerical data'
  }
}