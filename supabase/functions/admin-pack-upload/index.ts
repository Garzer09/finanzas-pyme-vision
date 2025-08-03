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
  'info-empresa.csv': 'company_info'
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
    const companyId = formData.get('company_id') as string
    const periodType = formData.get('period_type') as string
    const periodYear = parseInt(formData.get('period_year') as string)
    const periodQuarter = formData.get('period_quarter') ? parseInt(formData.get('period_quarter') as string) : null
    const periodMonth = formData.get('period_month') ? parseInt(formData.get('period_month') as string) : null
    const currencyCode = formData.get('currency_code') as string || 'EUR'
    const accountingStandard = formData.get('accounting_standard') as string || 'PGC'
    const importMode = formData.get('import_mode') as string || 'REPLACE'
    const dryRun = formData.get('dry_run') === 'true'

    // Validate required metadata
    if (!companyId || !periodType || !periodYear) {
      return new Response(JSON.stringify({ 
        error: 'Missing required metadata: company_id, period_type, period_year' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check for existing job in progress
    const { data: existingJob } = await supabase
      .from('processing_jobs')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('period_type', periodType)
      .eq('period_year', periodYear)
      .eq('period_quarter', periodQuarter)
      .eq('period_month', periodMonth)
      .in('status', ['PARSING', 'VALIDATING', 'LOADING', 'AGGREGATING'])
      .single()

    if (existingJob) {
      return new Response(JSON.stringify({ 
        error: `Ya hay una carga en progreso para esta empresa y período (Job: ${existingJob.id})` 
      }), {
        status: 409,
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

    // Generate file pack hash for duplicate detection
    const fileNames = Object.keys(csvFiles).sort()
    const fileContents = await Promise.all(fileNames.map(name => csvFiles[name].text()))
    const filePackHash = await crypto.subtle.digest('SHA-256', 
      new TextEncoder().encode(fileNames.join('|') + fileContents.join('|'))
    ).then(buffer => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join(''))

    // Check for recent duplicate pack
    const { data: duplicateJob } = await supabase
      .from('processing_jobs')
      .select('id, created_at')
      .eq('file_pack_hash', filePackHash)
      .eq('status', 'DONE')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single()

    if (duplicateJob) {
      return new Response(JSON.stringify({ 
        error: `Pack de archivos duplicado procesado recientemente (Job: ${duplicateJob.id})` 
      }), {
        status: 409,
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
        period_type: periodType,
        period_year: periodYear,
        period_quarter: periodQuarter,
        period_month: periodMonth,
        import_mode: importMode,
        dry_run: dryRun,
        file_pack_hash: filePackHash,
        status: 'PARSING',
        file_path: `admin-pack/${jobId}`,
        stats_json: {
          stage: 'PARSING',
          progress_pct: 0,
          eta_seconds: 120,
          files_received: Object.keys(csvFiles).length,
          message: dryRun ? 'Iniciando validación (dry-run)' : 'Iniciando procesamiento de archivos CSV'
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
      periodYear,
      periodQuarter,
      periodMonth,
      currencyCode,
      accountingStandard,
      importMode,
      dryRun,
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
  } else if (fileType === 'debt_maturities') {
    return validateDebtMaturityData(rows, metadata)
  } else if (fileType === 'cashflow') {
    return validateCashflowData(rows, metadata)
  } else if (fileType === 'operational') {
    return validateOperationalData(rows, metadata)
  } else if (fileType === 'assumptions') {
    return validateAssumptionsData(rows, metadata)
  } else if (fileType === 'company_info') {
    return validateCompanyInfoData(rows, metadata)
  }
  
  // Unknown file types - basic validation
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

    // Validate amounts are numbers (negative values allowed in P&L)
    for (const [key, value] of Object.entries(row)) {
      if (key !== 'Concepto' && key !== 'Notas' && value) {
        const amount = parseFloat(String(value).replace(',', '.').replace(/[^\\d.-]/g, ''))
        if (isNaN(amount)) {
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
    const interestRate = parseFloat(row['Tipo_Interes'] || '0')
    const maturityDate = row['Vencimiento']
    const currency = row['Moneda'] || 'EUR'

    if (interestRate < 0 || interestRate > 100) {
      errors.push(`Tipo de interés inválido: ${interestRate}%`)
    }

    if (maturityDate && !/^\d{4}-\d{2}-\d{2}$/.test(maturityDate)) {
      errors.push(`Fecha de vencimiento inválida: ${maturityDate}`)
    }

    if (!['EUR', 'USD', 'GBP'].includes(currency)) {
      errors.push(`Moneda no soportada: ${currency}`)
    }

    validRows.push(row)
  }

  return { valid: errors.length === 0, errors, data: validRows }
}

function validateDebtMaturityData(rows: any[], metadata: any): { valid: boolean, errors: string[], data: any[] } {
  const errors: string[] = []
  const validRows: any[] = []

  for (const row of rows) {
    const loanKey = row['Loan_Key']?.trim()
    const year = parseInt(row['Year'] || '0')

    if (!loanKey) {
      errors.push('Loan_Key requerido para vincular con pool de deuda')
      continue
    }

    if (year < 2020 || year > 2050) {
      errors.push(`Año inválido: ${year}`)
    }

    validRows.push(row)
  }

  return { valid: errors.length === 0, errors, data: validRows }
}

function validateOperationalData(rows: any[], metadata: any): { valid: boolean, errors: string[], data: any[] } {
  const errors: string[] = []
  const validRows: any[] = []

  for (const row of rows) {
    const concept = row['Concepto']?.trim()
    const unit = row['Unidad']?.trim()

    if (!concept) {
      errors.push('Concepto requerido en datos operativos')
      continue
    }

    if (!unit) {
      errors.push(`Unidad requerida para concepto: ${concept}`)
    }

    validRows.push(row)
  }

  return { valid: errors.length === 0, errors, data: validRows }
}

function validateAssumptionsData(rows: any[], metadata: any): { valid: boolean, errors: string[], data: any[] } {
  const errors: string[] = []
  const validRows: any[] = []

  for (const row of rows) {
    const concept = row['Concepto']?.trim()
    const value = row['Valor']

    if (!concept) {
      errors.push('Concepto requerido en supuestos financieros')
      continue
    }

    if (value && isNaN(parseFloat(String(value).replace(',', '.')))) {
      errors.push(`Valor inválido para ${concept}: ${value}`)
    }

    validRows.push(row)
  }

  return { valid: errors.length === 0, errors, data: validRows }
}

function validateCompanyInfoData(rows: any[], metadata: any): { valid: boolean, errors: string[], data: any[] } {
  const errors: string[] = []
  const validRows: any[] = []

  const requiredFields = ['Nombre']
  for (const row of rows) {
    const campo = row['Campo']?.trim()
    const valor = row['Valor']?.trim()

    if (requiredFields.includes(campo) && !valor) {
      errors.push(`Campo requerido sin valor: ${campo}`)
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
  const { companyId, periodType, periodYear, periodQuarter, periodMonth, currencyCode, uploadedBy, importMode, dryRun } = metadata
  const periodDate = new Date(periodYear, (periodMonth || 1) - 1, 1)
  const jobId = crypto.randomUUID()

  if (dryRun) {
    console.log('Dry run mode: Skipping data insertion')
    return
  }

  // Load P&L data
  if (validatedData['cuenta-pyg.csv']) {
    await loadPyGData(supabase, validatedData['cuenta-pyg.csv'], {
      companyId, periodDate, periodType, periodYear, periodQuarter, periodMonth, currencyCode, uploadedBy, jobId, importMode
    })
  }

  // Load Balance data
  if (validatedData['balance-situacion.csv']) {
    await loadBalanceData(supabase, validatedData['balance-situacion.csv'], {
      companyId, periodDate, periodType, periodYear, periodQuarter, periodMonth, currencyCode, uploadedBy, jobId, importMode
    })
  }

  // Load Cashflow data
  if (validatedData['estado-flujos.csv']) {
    await loadCashflowData(supabase, validatedData['estado-flujos.csv'], {
      companyId, periodDate, periodType, periodYear, periodQuarter, periodMonth, currencyCode, uploadedBy, jobId, importMode
    })
  }

  // Load Operational data
  if (validatedData['datos-operativos.csv']) {
    await loadOperationalData(supabase, validatedData['datos-operativos.csv'], {
      companyId, periodDate, periodType, periodYear, periodQuarter, periodMonth, currencyCode, uploadedBy, jobId, importMode
    })
  }

  // Load Financial assumptions
  if (validatedData['supuestos-financieros.csv']) {
    await loadAssumptionsData(supabase, validatedData['supuestos-financieros.csv'], {
      companyId, currencyCode, uploadedBy, jobId
    })
  }

  // Load Company info
  if (validatedData['info-empresa.csv']) {
    await loadCompanyInfoData(supabase, validatedData['info-empresa.csv'], {
      companyId, uploadedBy, jobId
    })
  }

  // Load Debt pool data
  if (validatedData['pool-deuda.csv']) {
    await loadDebtData(supabase, validatedData['pool-deuda.csv'], {
      companyId, currencyCode, uploadedBy, jobId
    })
  }

  // Load Debt maturities
  if (validatedData['pool-deuda-vencimientos.csv']) {
    await loadDebtMaturityData(supabase, validatedData['pool-deuda-vencimientos.csv'], {
      companyId, uploadedBy, jobId
    })
  }
}

async function loadPyGData(supabase: any, rows: any[], context: any) {
  // Delete existing data for this period (REPLACE mode)
  if (context.importMode === 'REPLACE') {
    const deleteQuery = supabase
      .from('fs_pyg_lines')
      .delete()
      .eq('company_id', context.companyId)
      .eq('period_type', context.periodType)
      .eq('period_year', context.periodYear)

    if (context.periodQuarter) deleteQuery.eq('period_quarter', context.periodQuarter)
    if (context.periodMonth) deleteQuery.eq('period_month', context.periodMonth)

    await deleteQuery
  }

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
  if (context.importMode === 'REPLACE') {
    const deleteQuery = supabase
      .from('fs_balance_lines')
      .delete()
      .eq('company_id', context.companyId)
      .eq('period_type', context.periodType)
      .eq('period_year', context.periodYear)

    if (context.periodQuarter) deleteQuery.eq('period_quarter', context.periodQuarter)
    if (context.periodMonth) deleteQuery.eq('period_month', context.periodMonth)

    await deleteQuery
  }

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

async function loadCashflowData(supabase: any, rows: any[], context: any) {
  // Delete existing data for this period (REPLACE mode)
  if (context.importMode === 'REPLACE') {
    const deleteQuery = supabase
      .from('fs_cashflow_lines')
      .delete()
      .eq('company_id', context.companyId)
      .eq('period_type', context.periodType)
      .eq('period_year', context.periodYear)

    if (context.periodQuarter) deleteQuery.eq('period_quarter', context.periodQuarter)
    if (context.periodMonth) deleteQuery.eq('period_month', context.periodMonth)

    await deleteQuery
  }

  // Transform to long format and insert
  const longData: any[] = []
  for (const row of rows) {
    const concept = row['Concepto']?.trim()
    if (!concept) continue

    // Determine category based on concept
    let category = 'OPERATIVO'
    if (concept.includes('Inversión') || concept.includes('Inmovilizado')) category = 'INVERSION'
    if (concept.includes('Capital') || concept.includes('Dividendo') || concept.includes('Deuda')) category = 'FINANCIACION'

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
            category,
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
    const { error } = await supabase.from('fs_cashflow_lines').insert(longData)
    if (error) throw error
  }
}

async function loadOperationalData(supabase: any, rows: any[], context: any) {
  // Delete existing data for this period (REPLACE mode)
  if (context.importMode === 'REPLACE') {
    const deleteQuery = supabase
      .from('operational_metrics')
      .delete()
      .eq('company_id', context.companyId)
      .eq('period_type', context.periodType)
      .eq('period_year', context.periodYear)

    if (context.periodQuarter) deleteQuery.eq('period_quarter', context.periodQuarter)
    if (context.periodMonth) deleteQuery.eq('period_month', context.periodMonth)

    await deleteQuery
  }

  // Transform to long format and insert
  const longData: any[] = []
  for (const row of rows) {
    const concept = row['Concepto']?.trim()
    const unit = row['Unidad']?.trim() || 'units'
    if (!concept) continue

    for (const [key, value] of Object.entries(row)) {
      if (key !== 'Concepto' && key !== 'Unidad' && key !== 'Descripción' && value && /^\d{4}$/.test(key)) {
        const amount = parseFloat(String(value).replace(',', '.').replace(/[^\\d.-]/g, ''))
        if (!isNaN(amount)) {
          longData.push({
            company_id: context.companyId,
            period_date: context.periodDate,
            period_type: context.periodType,
            period_year: context.periodYear,
            period_quarter: context.periodQuarter,
            period_month: context.periodMonth,
            metric_name: concept,
            unit,
            value: amount,
            uploaded_by: context.uploadedBy,
            job_id: context.jobId
          })
        }
      }
    }
  }

  if (longData.length > 0) {
    const { error } = await supabase.from('operational_metrics').insert(longData)
    if (error) throw error
  }
}

async function loadAssumptionsData(supabase: any, rows: any[], context: any) {
  // Delete existing data (REPLACE mode)
  await supabase
    .from('financial_assumptions_normalized')
    .delete()
    .eq('company_id', context.companyId)

  // Transform and insert
  const longData: any[] = []
  for (const row of rows) {
    const concept = row['Concepto']?.trim()
    const value = row['Valor']
    const unit = row['Unidad']?.trim() || 'percentage'
    const notes = row['Notas']

    if (!concept || !value) continue

    const numericValue = parseFloat(String(value).replace(',', '.').replace(/[^\\d.-]/g, ''))
    if (isNaN(numericValue)) continue

    // Determine category
    let category = 'GENERAL'
    if (concept.includes('ingreso') || concept.includes('venta')) category = 'INGRESOS'
    if (concept.includes('coste') || concept.includes('gasto')) category = 'COSTES'
    if (concept.includes('CAPEX') || concept.includes('inversión')) category = 'INVERSION'
    if (concept.includes('WACC') || concept.includes('financiación')) category = 'FINANCIACION'

    longData.push({
      company_id: context.companyId,
      assumption_category: category,
      assumption_name: concept,
      assumption_value: numericValue,
      unit,
      notes,
      period_type: 'annual',
      period_year: new Date().getFullYear(),
      uploaded_by: context.uploadedBy,
      job_id: context.jobId
    })
  }

  if (longData.length > 0) {
    const { error } = await supabase.from('financial_assumptions_normalized').insert(longData)
    if (error) throw error
  }
}

async function loadCompanyInfoData(supabase: any, rows: any[], context: any) {
  // Upsert company info
  const companyData: any = { id: context.companyId }
  
  for (const row of rows) {
    const campo = row['Campo']?.trim()
    const valor = row['Valor']?.trim()
    
    if (!campo || !valor) continue

    // Map fields to company table columns
    switch (campo.toLowerCase()) {
      case 'nombre':
        companyData.name = valor
        break
      case 'sector':
        companyData.sector = valor
        break
      case 'currency_code':
        companyData.currency_code = valor
        break
      case 'accounting_standard':
        companyData.accounting_standard = valor
        break
    }
  }

  if (Object.keys(companyData).length > 1) {
    const { error } = await supabase
      .from('companies')
      .upsert(companyData, { onConflict: 'id' })
    
    if (error) throw error
  }

  // Also store full info in normalized table
  const infoData = {
    company_id: context.companyId,
    company_name: companyData.name || 'Unknown',
    sector: companyData.sector,
    uploaded_by: context.uploadedBy,
    job_id: context.jobId
  }

  for (const row of rows) {
    const campo = row['Campo']?.trim()
    const valor = row['Valor']?.trim()
    
    switch (campo?.toLowerCase()) {
      case 'industria':
        infoData.industry = valor
        break
      case 'empleados':
        infoData.employees_count = parseInt(valor) || null
        break
      case 'año fundación':
        infoData.founded_year = parseInt(valor) || null
        break
      case 'sede':
        infoData.headquarters = valor
        break
      case 'web':
        infoData.website = valor
        break
      case 'descripción':
        infoData.description = valor
        break
    }
  }

  await supabase
    .from('company_info_normalized')
    .upsert(infoData, { onConflict: 'company_id' })
}

async function loadDebtData(supabase: any, rows: any[], context: any) {
  // Process debt pool data
  for (const row of rows) {
    const entityName = row['Entidad']?.trim()
    const loanType = row['Tipo_Financiacion']?.trim()
    const maturityDate = row['Vencimiento']
    const currency = row['Moneda'] || context.currencyCode

    if (!entityName || !loanType) continue

    // Generate stable loan key
    const loanKey = `${entityName}|${loanType}|${maturityDate}|${currency}`.toLowerCase()

    // Upsert loan
    const { data: loan, error: loanError } = await supabase
      .from('debt_loans')
      .upsert({
        company_id: context.companyId,
        loan_key: loanKey,
        entity_name: entityName,
        loan_type: loanType,
        initial_amount: parseFloat(row['Principal_Inicial'] || '0'),
        interest_rate: parseFloat(row['Tipo_Interes'] || '0'),
        maturity_date: maturityDate,
        guarantees: row['Garantias'],
        observations: row['Observaciones'],
        currency_code: currency,
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
      if (/^Saldo_\d{4}$/.test(key) && value) {
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

async function loadDebtMaturityData(supabase: any, rows: any[], context: any) {
  // Process debt maturity schedule
  for (const row of rows) {
    const loanKey = row['Loan_Key']?.trim()
    const year = parseInt(row['Year'] || '0')
    
    if (!loanKey || year === 0) continue

    const maturityData = {
      company_id: context.companyId,
      maturity_year: year,
      principal_amount: parseFloat(row['Due_Principal'] || '0'),
      interest_amount: parseFloat(row['Due_Interest'] || '0'),
      total_amount: parseFloat(row['Due_Principal'] || '0') + parseFloat(row['Due_Interest'] || '0'),
      breakdown_json: {
        loan_key: loanKey,
        new_drawdowns: parseFloat(row['New_Drawdowns'] || '0'),
        scheduled_repayments: parseFloat(row['Scheduled_Repayments'] || '0')
      },
      uploaded_by: context.uploadedBy,
      job_id: context.jobId
    }

    await supabase
      .from('debt_maturities')
      .upsert(maturityData, { onConflict: 'company_id,maturity_year' })
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
