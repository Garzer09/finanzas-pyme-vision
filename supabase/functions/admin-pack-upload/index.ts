import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

// Constants
const CANONICAL_CSV_NAMES = {
  // Obligatorios
  'cuenta-pyg.csv': 'pyg',
  'balance-situacion.csv': 'balance',
  // Opcionales
  'pool-deuda.csv': 'debt_pool',
  'pool-deuda-vencimientos.csv': 'debt_maturities',
  'estado-flujos.csv': 'cashflow',
  'datos-operativos.csv': 'operational',
  'supuestos-financieros.csv': 'assumptions',
  'info-empresa.csv': 'company_info',
  // Benchmark externo (no fuente de verdad)
  'ratios-financieros.csv': 'benchmarks'
}

const REQUIRED_FILES = ['cuenta-pyg.csv', 'balance-situacion.csv']

const PGC_CONCEPTS_PYG = [
  'Cifra de negocios',
  'Variación de existencias de productos terminados',
  'Trabajos realizados por la empresa para su activo',
  'Aprovisionamientos',
  'Otros ingresos de explotación',
  'Gastos de personal',
  'Otros gastos de explotación',
  'Amortización del inmovilizado',
  'Imputación de subvenciones',
  'Excesos de provisiones',
  'Deterioro y resultado por enajenaciones del inmovilizado',
  'Ingresos financieros',
  'Gastos financieros',
  'Variación de valor razonable en instrumentos financieros',
  'Diferencias de cambio',
  'Deterioro y resultado por enajenaciones de instrumentos financieros',
  'Impuesto sobre beneficios'
]

const BALANCE_SECTIONS = {
  'ACTIVO NO CORRIENTE': 'ACTIVO_NC',
  'ACTIVO CORRIENTE': 'ACTIVO_C',
  'PATRIMONIO NETO': 'PATRIMONIO_NETO',
  'PASIVO NO CORRIENTE': 'PASIVO_NC',
  'PASIVO CORRIENTE': 'PASIVO_C'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
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

    // Verify admin role
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse form data
    const formData = await req.formData()
    
    // Extract metadata
    const companyId = formData.get('companyId') as string
    const periodType = formData.get('period_type') as string
    const periodStart = formData.get('period_start') as string
    const periodEnd = formData.get('period_end') as string
    const currencyCode = formData.get('currency_code') as string || 'EUR'
    const accountingStandard = formData.get('accounting_standard') as string || 'PGC'
    const consolidation = formData.get('consolidation') as string || 'INDIVIDUAL'

    // Validate required metadata
    if (!companyId || !periodType || !periodStart) {
      return new Response(JSON.stringify({ 
        error: 'Missing required metadata: companyId, period_type, period_start' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extract CSV files
    const csvFiles: { [key: string]: File } = {}
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key.endsWith('.csv')) {
        const canonicalName = key.toLowerCase()
        if (CANONICAL_CSV_NAMES[canonicalName]) {
          csvFiles[canonicalName] = value
        }
      }
    }

    // Validate required files
    const missingRequired = REQUIRED_FILES.filter(fileName => !csvFiles[fileName])
    if (missingRequired.length > 0) {
      return new Response(JSON.stringify({ 
        error: `Missing required files: ${missingRequired.join(', ')}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create processing job
    const jobId = crypto.randomUUID()
    const { error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        id: jobId,
        company_id: companyId,
        user_id: user.id,
        status: 'PARSING',
        file_path: `admin-pack/${jobId}`,
        stats_json: {
          stage: 'PARSING',
          progress_pct: 0,
          eta_seconds: 120,
          files_received: Object.keys(csvFiles).length,
          message: 'Iniciando procesamiento de archivos CSV'
        }
      })

    if (jobError) {
      console.error('Error creating job:', jobError)
      return new Response(JSON.stringify({ error: 'Failed to create processing job' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Job ${jobId} created, starting background processing`)

    // Start background processing
    EdgeRuntime.waitUntil(processJob(supabase, jobId, csvFiles, {
      companyId,
      periodType,
      periodStart,
      periodEnd,
      currencyCode,
      accountingStandard,
      consolidation,
      uploadedBy: user.id
    }))

    // Return immediate response
    return new Response(JSON.stringify({ 
      job_id: jobId,
      status: 'accepted',
      message: 'CSV files accepted for processing'
    }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// Background processing function
async function processJob(
  supabase: any,
  jobId: string,
  csvFiles: { [key: string]: File },
  metadata: any
) {
  try {
    await setStatus(supabase, jobId, 'PARSING', 10, 'Parseando archivos CSV...')

    // Parse all CSV files
    const parsedFiles: { [key: string]: any[] } = {}
    for (const [fileName, file] of Object.entries(csvFiles)) {
      const text = await file.text()
      const rows = await parseCsvText(text)
      parsedFiles[fileName] = rows
      console.log(`Parsed ${fileName}: ${rows.length} rows`)
    }

    await setStatus(supabase, jobId, 'VALIDATING', 30, 'Validando datos contables...')

    // Validate each file
    const validationErrors: string[] = []
    const validatedData: { [key: string]: any[] } = {}

    for (const [fileName, rows] of Object.entries(parsedFiles)) {
      const fileType = CANONICAL_CSV_NAMES[fileName]
      const validation = await validateCsvData(fileType, rows, metadata)
      
      if (!validation.valid) {
        validationErrors.push(`${fileName}: ${validation.errors.join(', ')}`)
      } else {
        validatedData[fileName] = validation.data
      }
    }

    if (validationErrors.length > 0) {
      await setStatus(supabase, jobId, 'FAILED', 100, `Validación fallida: ${validationErrors.join('; ')}`)
      
      // Save error artifacts
      await saveErrorArtifacts(supabase, jobId, validationErrors)
      return
    }

    await setStatus(supabase, jobId, 'LOADING', 60, 'Cargando datos en base de datos...')

    // Transform and load data
    await loadNormalizedData(supabase, validatedData, metadata)

    await setStatus(supabase, jobId, 'AGGREGATING', 80, 'Calculando ratios financieros...')

    // Calculate ratios
    await supabase.rpc('refresh_ratios_mv')

    await setStatus(supabase, jobId, 'DONE', 100, 'Procesamiento completado exitosamente')

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error)
    await setStatus(supabase, jobId, 'FAILED', 100, `Error: ${error.message}`)
  }
}

// Helper functions
async function setStatus(supabase: any, jobId: string, status: string, progress: number, message: string) {
  await supabase
    .from('processing_jobs')
    .update({
      status,
      stats_json: {
        stage: status,
        progress_pct: progress,
        message,
        updated_at: new Date().toISOString()
      }
    })
    .eq('id', jobId)
}

async function parseCsvText(text: string): Promise<any[]> {
  // Normalize text
  const normalized = text
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\r/g, '\n')
    .trim()

  // Detect separator
  const firstLine = normalized.split('\n')[0]
  const separators = [',', ';', '\t']
  let separator = ','
  
  for (const sep of separators) {
    if (firstLine.includes(sep)) {
      separator = sep
      break
    }
  }

  const lines = normalized.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0].split(separator).map(h => h.trim().replace(/\"/g, ''))
  const rows: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/\"/g, ''))
    
    // Skip section headers (all empty except first column)
    if (values.length > 1 && values.slice(1).every(v => !v || v === '')) {
      continue
    }

    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return rows
}

async function validateCsvData(fileType: string, rows: any[], metadata: any): Promise<{ valid: boolean, errors: string[], data: any[] }> {
  const errors: string[] = []
  
  if (fileType === 'pyg') {
    return validatePyGData(rows, metadata)
  } else if (fileType === 'balance') {
    return validateBalanceData(rows, metadata)
  } else if (fileType === 'debt_pool') {
    return validateDebtPoolData(rows, metadata)
  } else if (fileType === 'cashflow') {
    return validateCashflowData(rows, metadata)
  }
  
  // Other file types - basic validation
  return { valid: true, errors: [], data: rows }
}

function validatePyGData(rows: any[], metadata: any): { valid: boolean, errors: string[], data: any[] } {
  const errors: string[] = []
  const validRows: any[] = []

  for (const row of rows) {
    const concept = row['Concepto']?.trim()
    
    if (!concept) continue

    // Check if concept is allowed
    if (!PGC_CONCEPTS_PYG.includes(concept)) {
      errors.push(`Concepto P&G no permitido: ${concept}`)
      continue
    }

    // Validate amounts are positive
    for (const [key, value] of Object.entries(row)) {
      if (key !== 'Concepto' && key !== 'Notas' && value) {
        const amount = parseFloat(String(value).replace(',', '.').replace(/[^\\d.-]/g, ''))
        if (isNaN(amount) || amount < 0) {
          errors.push(`Importe inválido en ${concept}, columna ${key}: ${value}`)
        }
      }
    }

    validRows.push(row)
  }

  return { valid: errors.length === 0, errors, data: validRows }
}

function validateBalanceData(rows: any[], metadata: any): { valid: boolean, errors: string[], data: any[] } {
  const errors: string[] = []
  const validRows: any[] = []
  const yearlyTotals: { [year: string]: { activo: number, pasivo_pn: number } } = {}

  for (const row of rows) {
    const concept = row['Concepto']?.trim()
    if (!concept) continue

    for (const [key, value] of Object.entries(row)) {
      if (key !== 'Concepto' && key !== 'Notas' && value && /^\d{4}$/.test(key)) {
        const year = key
        const amount = parseFloat(String(value).replace(',', '.').replace(/[^\\d.-]/g, ''))
        
        if (!isNaN(amount)) {
          if (!yearlyTotals[year]) {
            yearlyTotals[year] = { activo: 0, pasivo_pn: 0 }
          }

          // Determine section
          if (concept.includes('ACTIVO')) {
            yearlyTotals[year].activo += amount
          } else if (concept.includes('PATRIMONIO') || concept.includes('PASIVO')) {
            yearlyTotals[year].pasivo_pn += amount
          }
        }
      }
    }

    validRows.push(row)
  }

  // Check balance identity for each year
  for (const [year, totals] of Object.entries(yearlyTotals)) {
    const diff = Math.abs(totals.activo - totals.pasivo_pn)
    if (diff > 0.01) {
      errors.push(`Balance no cuadra en ${year}: Activo ${totals.activo.toFixed(2)} ≠ Pasivo+PN ${totals.pasivo_pn.toFixed(2)} (diff: ${diff.toFixed(2)})`)
    }
  }

  return { valid: errors.length === 0, errors, data: validRows }
}

function validateDebtPoolData(rows: any[], metadata: any): { valid: boolean, errors: string[], data: any[] } {
  const errors: string[] = []
  const validRows: any[] = []

  for (const row of rows) {
    const interestRate = parseFloat(row['Tipo de Interés (%)'] || '0')
    const maturityDate = row['Vencimiento']

    if (interestRate < 0 || interestRate > 100) {
      errors.push(`Tipo de interés inválido: ${interestRate}%`)
    }

    if (maturityDate && !/^\d{4}-\d{2}-\d{2}$/.test(maturityDate)) {
      errors.push(`Fecha de vencimiento inválida: ${maturityDate}`)
    }

    validRows.push(row)
  }

  return { valid: errors.length === 0, errors, data: validRows }
}

function validateCashflowData(rows: any[], metadata: any): { valid: boolean, errors: string[], data: any[] } {
  // Basic validation for cashflow - coherence check could be added
  return { valid: true, errors: [], data: rows }
}

async function loadNormalizedData(supabase: any, validatedData: { [key: string]: any[] }, metadata: any) {
  const { companyId, periodType, periodStart, currencyCode, uploadedBy } = metadata
  const periodDate = new Date(periodStart)
  const periodYear = periodDate.getFullYear()
  const periodQuarter = periodType === 'quarterly' ? Math.ceil((periodDate.getMonth() + 1) / 3) : null
  const periodMonth = periodType === 'monthly' ? periodDate.getMonth() + 1 : null
  const jobId = crypto.randomUUID()

  // Load P&L data
  if (validatedData['cuenta-pyg.csv']) {
    await loadPyGData(supabase, validatedData['cuenta-pyg.csv'], {
      companyId, periodDate, periodType, periodYear, periodQuarter, periodMonth, currencyCode, uploadedBy, jobId
    })
  }

  // Load Balance data
  if (validatedData['balance-situacion.csv']) {
    await loadBalanceData(supabase, validatedData['balance-situacion.csv'], {
      companyId, periodDate, periodType, periodYear, periodQuarter, periodMonth, currencyCode, uploadedBy, jobId
    })
  }

  // Load other data types...
  if (validatedData['pool-deuda.csv']) {
    await loadDebtData(supabase, validatedData['pool-deuda.csv'], {
      companyId, currencyCode, uploadedBy, jobId
    })
  }
}

async function loadPyGData(supabase: any, rows: any[], context: any) {
  // Delete existing data for this period (REPLACE mode)
  await supabase
    .from('fs_pyg_lines')
    .delete()
    .eq('company_id', context.companyId)
    .eq('period_type', context.periodType)
    .eq('period_year', context.periodYear)
    .eq('period_quarter', context.periodQuarter || null)
    .eq('period_month', context.periodMonth || null)

  // Transform to long format and insert
  const longData: any[] = []
  for (const row of rows) {
    const concept = row['Concepto']?.trim()
    if (!concept) continue

    for (const [key, value] of Object.entries(row)) {
      if (key !== 'Concepto' && key !== 'Notas' && value && /^\d{4}$/.test(key)) {
        const amount = parseFloat(String(value).replace(',', '.').replace(/[^\\d.-]/g, ''))
        if (!isNaN(amount)) {
          longData.push({
            company_id: context.companyId,
            period_date: context.periodDate,
            period_type: context.periodType,
            period_year: context.periodYear,
            period_quarter: context.periodQuarter,
            period_month: context.periodMonth,
            concept,
            amount,
            currency_code: context.currencyCode,
            uploaded_by: context.uploadedBy,
            job_id: context.jobId
          })
        }
      }
    }
  }

  if (longData.length > 0) {
    const { error } = await supabase.from('fs_pyg_lines').insert(longData)
    if (error) throw error
  }
}

async function loadBalanceData(supabase: any, rows: any[], context: any) {
  // Delete existing data for this period (REPLACE mode)
  await supabase
    .from('fs_balance_lines')
    .delete()
    .eq('company_id', context.companyId)
    .eq('period_type', context.periodType)
    .eq('period_year', context.periodYear)
    .eq('period_quarter', context.periodQuarter || null)
    .eq('period_month', context.periodMonth || null)

  // Transform to long format and insert
  const longData: any[] = []
  let currentSection = ''

  for (const row of rows) {
    const concept = row['Concepto']?.trim()
    if (!concept) continue

    // Detect section headers
    if (Object.keys(BALANCE_SECTIONS).includes(concept)) {
      currentSection = BALANCE_SECTIONS[concept]
      continue
    }

    for (const [key, value] of Object.entries(row)) {
      if (key !== 'Concepto' && key !== 'Notas' && value && /^\d{4}$/.test(key)) {
        const amount = parseFloat(String(value).replace(',', '.').replace(/[^\\d.-]/g, ''))
        if (!isNaN(amount)) {
          longData.push({
            company_id: context.companyId,
            period_date: context.periodDate,
            period_type: context.periodType,
            period_year: context.periodYear,
            period_quarter: context.periodQuarter,
            period_month: context.periodMonth,
            section: currentSection,
            concept,
            amount,
            currency_code: context.currencyCode,
            uploaded_by: context.uploadedBy,
            job_id: context.jobId
          })
        }
      }
    }
  }

  if (longData.length > 0) {
    const { error } = await supabase.from('fs_balance_lines').insert(longData)
    if (error) throw error
  }
}

async function loadDebtData(supabase: any, rows: any[], context: any) {
  // Process debt pool data
  for (const row of rows) {
    const entityName = row['Entidad Financiera']?.trim()
    const loanType = row['Tipo de Financiación']?.trim()
    const maturityDate = row['Vencimiento']

    if (!entityName || !loanType) continue

    // Generate stable loan key
    const loanKey = `${entityName}|${loanType}|${maturityDate}|${context.currencyCode}`.toLowerCase()

    // Upsert loan
    const { data: loan, error: loanError } = await supabase
      .from('debt_loans')
      .upsert({
        company_id: context.companyId,
        loan_key: loanKey,
        entity_name: entityName,
        loan_type: loanType,
        initial_amount: parseFloat(row['Principal Inicial'] || '0'),
        interest_rate: parseFloat(row['Tipo de Interés (%)'] || '0'),
        maturity_date: maturityDate,
        guarantees: row['Garantías'],
        observations: row['Observaciones'],
        currency_code: context.currencyCode,
        uploaded_by: context.uploadedBy,
        job_id: context.jobId
      }, {
        onConflict: 'company_id,loan_key'
      })
      .select()
      .single()

    if (loanError) {
      console.error('Error upserting loan:', loanError)
      continue
    }

    // Insert year-end balances
    for (const [key, value] of Object.entries(row)) {
      if (/^Saldo Pendiente \d{4}$/.test(key) && value) {
        const year = parseInt(key.match(/\d{4}/)?.[0] || '0')
        const balance = parseFloat(String(value).replace(',', '.').replace(/[^\\d.-]/g, ''))
        
        if (year > 0 && !isNaN(balance)) {
          await supabase
            .from('debt_balances')
            .upsert({
              company_id: context.companyId,
              loan_id: loan.id,
              year,
              year_end_balance: balance
            }, {
              onConflict: 'company_id,loan_id,year'
            })
        }
      }
    }
  }
}

async function saveErrorArtifacts(supabase: any, jobId: string, errors: string[]) {
  const artifactPath = `jobs/${jobId}/errors.json`
  const errorData = {
    job_id: jobId,
    timestamp: new Date().toISOString(),
    errors,
    summary: `${errors.length} validation errors found`
  }

  await supabase.storage
    .from('gl-artifacts')
    .upload(artifactPath, JSON.stringify(errorData, null, 2), {
      contentType: 'application/json',
      upsert: true
    })
}
