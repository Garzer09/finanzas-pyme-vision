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

// Patrones inteligentes para detección de archivos con variaciones
const FILE_DETECTION_PATTERNS = {
  'pyg': {
    patterns: [
      /cuenta.*p.*g/i,
      /perdidas.*ganancias/i,
      /p.*g/i,
      /resultado/i,
      /income.*statement/i,
      /profit.*loss/i
    ],
    canonical: 'cuenta-pyg.csv',
    requiredConcepts: ['Cifra de negocios', 'Aprovisionamientos', 'Gastos de personal']
  },
  'balance': {
    patterns: [
      /balance.*situacion/i,
      /balance.*sheet/i,
      /balance/i,
      /situacion.*patrimonial/i,
      /activo.*pasivo/i
    ],
    canonical: 'balance-situacion.csv',
    requiredConcepts: ['ACTIVO', 'PASIVO', 'PATRIMONIO']
  },
  'cashflow': {
    patterns: [
      /estado.*flujos/i,
      /flujos.*efectivo/i,
      /cash.*flow/i,
      /tesoreria/i,
      /flujos/i
    ],
    canonical: 'estado-flujos.csv',
    requiredConcepts: ['ACTIVIDADES DE EXPLOTACIÓN', 'EFECTIVO']
  },
  'debt_pool': {
    patterns: [
      /pool.*deuda/i,
      /deuda.*financiera/i,
      /prestamos/i,
      /debt.*pool/i,
      /financiacion/i
    ],
    canonical: 'pool-deuda.csv',
    requiredConcepts: ['Entidad', 'Importe']
  },
  'operational': {
    patterns: [
      /datos.*operativos/i,
      /operativo/i,
      /unidades.*fisicas/i,
      /produccion/i,
      /ventas.*unidades/i
    ],
    canonical: 'datos-operativos.csv',
    requiredConcepts: ['Concepto', 'Unidad']
  }
}

const REQUIRED_FILES = ['cuenta-pyg.csv', 'balance-situacion.csv']

const PGC_CONCEPTS_PYG = [
  'Cifra de negocios',
  'Variación de existencias de productos terminados',
  'Trabajos realizados por la empresa para su activo',
  'Aprovisionamientos',
  'Aprovisionamientos (compras)', // Support both formats
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

// Mapeo inteligente de conceptos con sinónimos
const CONCEPT_SYNONYMS = {
  // P&G Concepts
  'Cifra de negocios': [
    'importe neto cifra negocios', 'ventas', 'ingresos', 'facturación', 'ingresos explotación',
    'ingresos operacionales', 'ingresos ordinarios', 'ventas netas', 'revenue', 'sales'
  ],
  'Aprovisionamientos': [
    'compras', 'consumos', 'coste ventas', 'coste mercancías', 'materias primas',
    'consumo materias primas', 'purchases', 'cost of goods sold', 'cogs'
  ],
  'Gastos de personal': [
    'sueldos salarios', 'costes personal', 'nóminas', 'seguridad social',
    'gastos empleados', 'staff costs', 'payroll', 'employee costs'
  ],
  'Otros gastos de explotación': [
    'gastos explotación', 'gastos operativos', 'gastos generales', 'gastos administración',
    'otros gastos operacionales', 'operating expenses', 'opex'
  ],
  'Amortización del inmovilizado': [
    'amortizaciones', 'depreciación', 'amortización', 'depreciation', 'amortization'
  ],
  'Ingresos financieros': [
    'ingresos financieros', 'intereses cobrados', 'dividendos', 'financial income', 'interest income'
  ],
  'Gastos financieros': [
    'intereses', 'gastos financieros', 'intereses pagados', 'financial expenses', 'interest expenses'
  ],
  'Impuesto sobre beneficios': [
    'impuestos', 'impuesto sociedades', 'tax', 'income tax', 'corporate tax'
  ],
  
  // Balance Concepts
  'Inmovilizado material': [
    'activos fijos', 'propiedad planta equipo', 'inmovilizado tangible', 'fixed assets', 'ppe'
  ],
  'Inmovilizado intangible': [
    'activos intangibles', 'patentes', 'marcas', 'software', 'intangible assets'
  ],
  'Existencias': [
    'inventarios', 'stock', 'mercaderías', 'productos terminados', 'inventory'
  ],
  'Deudores comerciales y otras cuentas a cobrar': [
    'clientes', 'cuentas cobrar', 'deudores', 'accounts receivable', 'trade receivables'
  ],
  'Efectivo y otros activos líquidos equivalentes': [
    'tesorería', 'efectivo', 'bancos', 'caja', 'cash', 'cash equivalents'
  ],
  'Acreedores comerciales y otras cuentas a pagar': [
    'proveedores', 'cuentas pagar', 'acreedores', 'accounts payable', 'trade payables'
  ]
}

const BALANCE_SECTIONS = {
  'ACTIVO NO CORRIENTE': 'ACTIVO_NC',
  'ACTIVO CORRIENTE': 'ACTIVO_C',
  'PATRIMONIO NETO': 'PATRIMONIO_NETO',
  'PASIVO NO CORRIENTE': 'PASIVO_NC',
  'PASIVO CORRIENTE': 'PASIVO_C'
}

const CASHFLOW_CATEGORIES = {
  'ACTIVIDADES DE EXPLOTACIÓN': 'OPERATIVO',
  'ACTIVIDADES DE INVERSIÓN': 'INVERSION',
  'ACTIVIDADES DE FINANCIACIÓN': 'FINANCIACION',
  'EFECTIVO': 'EFECTIVO'
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

    // Detect content type and parse accordingly
    const contentType = req.headers.get('content-type') || ''
    let parsedData: any
    let csvFiles: { [key: string]: File } = {}
    
    if (contentType.includes('application/json')) {
      // Parse JSON (from wizard)
      parsedData = await req.json()
      console.log('Received JSON data:', JSON.stringify(parsedData, null, 2))
      
      // Extract metadata from JSON
      const companyId = parsedData.companyId || parsedData.company_id
      const selectedYears = parsedData.selectedYears || parsedData.selected_years || []
      const currencyCode = parsedData.currencyCode || parsedData.currency_code || 'EUR'
      const accountingStandard = parsedData.accountingStandard || parsedData.accounting_standard || 'PGC'
      const importMode = parsedData.importMode || parsedData.import_mode || 'REPLACE'
      const dryRun = parsedData.dryRun || parsedData.dry_run || false
      
      // Handle files from wizard - convert parsed data back to CSV strings
      if (parsedData.files && Array.isArray(parsedData.files)) {
        for (const fileData of parsedData.files) {
          if (fileData.fileName && fileData.data && Array.isArray(fileData.data)) {
            // Convert array data back to CSV string
            const headers = Object.keys(fileData.data[0] || {})
            const csvRows = [
              headers.join(','),
              ...fileData.data.map(row => 
                headers.map(header => {
                  const value = row[header] || ''
                  // Escape commas and quotes
                  return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                    ? `"${value.replace(/"/g, '""')}"` 
                    : value
                }).join(',')
              )
            ]
            const csvContent = csvRows.join('\n')
            
            const file = new File([csvContent], fileData.fileName, { type: 'text/csv' })
            
            // Detección inteligente de archivos usando patrones y contenido
            let canonicalName = fileData.canonicalName || fileData.fileName.toLowerCase()
            let detectionResult = detectFileTypeIntelligently(fileData.fileName, csvContent)
            
            if (detectionResult.canonical) {
              canonicalName = detectionResult.canonical
              console.log(`🎯 Detección inteligente: ${fileData.fileName} → ${canonicalName} (confianza: ${detectionResult.confidence})`)
            } else {
              // Fallback al mapeo básico existente
              if (canonicalName.includes('cuenta-pyg') || canonicalName.includes('pyg')) {
                canonicalName = 'cuenta-pyg.csv'
              } else if (canonicalName.includes('balance-situacion') || canonicalName.includes('balance')) {
                canonicalName = 'balance-situacion.csv'
              } else if (canonicalName.includes('estado-flujos') || canonicalName.includes('flujos')) {
                canonicalName = 'estado-flujos.csv'
              } else if (canonicalName.includes('datos-operativos') || canonicalName.includes('operativos')) {
                canonicalName = 'datos-operativos.csv'
              } else if (canonicalName.includes('pool-deuda-vencimientos')) {
                canonicalName = 'pool-deuda-vencimientos.csv'
              } else if (canonicalName.includes('pool-deuda')) {
                canonicalName = 'pool-deuda.csv'
              } else if (canonicalName.includes('supuestos-financieros') || canonicalName.includes('supuestos')) {
                canonicalName = 'supuestos-financieros.csv'
              }
            }
            
            console.log(`Processing file: ${fileData.fileName} -> ${canonicalName}`)
            if (CANONICAL_CSV_NAMES[canonicalName]) {
              csvFiles[canonicalName] = file
            } else {
              // Mensaje de error mejorado con sugerencias
              const suggestions = detectionResult.suggestions || []
              console.warn(`❌ Archivo no reconocido: ${fileData.fileName}`)
              if (suggestions.length > 0) {
                console.warn(`💡 Sugerencias:`)
                suggestions.forEach(suggestion => console.warn(`   ${suggestion}`))
              }
              console.warn(`📋 Nombres de archivo válidos: ${Object.keys(CANONICAL_CSV_NAMES).join(', ')}`)
            }
          }
        }
      }
      
      // Set metadata for further processing
      parsedData = {
        companyId,
        selectedYears,
        currencyCode,
        accountingStandard,
        importMode,
        dryRun,
        force: Boolean((parsedData && (parsedData.force ?? parsedData.forceReprocess)) || false)
      }
    } else {
      // Parse FormData (legacy support)
      const formData = await req.formData()
      
      // Extract metadata - support both old and new formats
      const companyId = formData.get('companyId') || formData.get('company_id') as string
      const selectedYears = formData.getAll('selected_years[]').map(y => parseInt(y as string)).filter(y => !isNaN(y))
      const currencyCode = formData.get('currency_code') as string || 'EUR'
      const accountingStandard = formData.get('accounting_standard') as string || 'PGC'
      const importMode = formData.get('import_mode') as string || 'REPLACE'
      const dryRun = formData.get('dry_run') === 'true'
      
      // Extract CSV files from FormData
      for (const [key, value] of formData.entries()) {
        if (value instanceof File && key.endsWith('.csv')) {
          const canonicalName = key.toLowerCase()
          if (CANONICAL_CSV_NAMES[canonicalName]) {
            csvFiles[canonicalName] = value
          }
        }
      }
      
      // Set metadata for further processing
      parsedData = {
        companyId,
        selectedYears,
        currencyCode,
        accountingStandard,
        importMode,
        dryRun,
        force: (formData.get('force') === 'true' || formData.get('force') === '1')
      }
    }
    
    // Use parsed metadata
    const { companyId, selectedYears, currencyCode, accountingStandard, importMode, dryRun } = parsedData

    // Legacy support for period-based metadata
    const periodType = 'annual'
    const periodYear = selectedYears.length > 0 ? selectedYears[0] : new Date().getFullYear()
    const periodQuarter = null
    const periodMonth = null

    // Validate required metadata
    if (!companyId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required metadata: companyId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If selectedYears is provided, use it; otherwise use legacy period approach
    const yearsToProcess = selectedYears.length > 0 ? selectedYears : [periodYear]

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

    // csvFiles was already populated above based on content type

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

    if (duplicateJob && !parsedData.force) {
      return new Response(JSON.stringify({ 
        error: `Pack de archivos duplicado procesado recientemente (Job: ${duplicateJob.id})`
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (duplicateJob && parsedData.force) {
      console.warn(`Force reprocess enabled - bypassing duplicate check for job ${duplicateJob.id}`)
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
          detected_years: [],
          selected_years: yearsToProcess,
          per_year: {},
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
      yearsToProcess,
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
    await setStatus(supabase, jobId, 'PARSING', 10, 'Parseando archivos CSV...', metadata.yearsToProcess)

    // Parse all CSV files
    const parsedFiles: { [key: string]: any[] } = {}
    const detectedYears: number[] = []
    
    for (const [fileName, file] of Object.entries(csvFiles)) {
      const text = await file.text()
      const rows = await parseCsvText(text)
      parsedFiles[fileName] = rows
      console.log(`Parsed ${fileName}: ${rows.length} rows`)
      
      // Detect years from P&L and Balance files
      if (fileName === 'cuenta-pyg.csv' || fileName === 'balance-situacion.csv') {
        const fileYears = extractYearsFromCsvContent(text)
        fileYears.forEach(year => {
          if (!detectedYears.includes(year)) {
            detectedYears.push(year)
          }
        })
      }
    }

    // Update detected years
    await updateJobStats(supabase, jobId, {
      detected_years: detectedYears.sort(),
      selected_years: metadata.yearsToProcess
    })

    await setStatus(supabase, jobId, 'VALIDATING', 30, 'Validando datos contables...', metadata.yearsToProcess)

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
      await setStatus(supabase, jobId, 'FAILED', 100, `Validación fallida: ${validationErrors.join('; ')}`, metadata.yearsToProcess)
      
      // Save error artifacts
      await saveErrorArtifacts(supabase, jobId, validationErrors)
      return
    }

    // Skip loading if dry run
    if (metadata.dryRun) {
      await setStatus(supabase, jobId, 'DONE', 100, 'Validación completada exitosamente (dry-run)', metadata.yearsToProcess)
      return
    }

    await setStatus(supabase, jobId, 'LOADING', 60, 'Cargando datos en base de datos...', metadata.yearsToProcess)

    // Transform and load data per year (REPLACE mode)
    for (const year of metadata.yearsToProcess) {
      await updateYearStatus(supabase, jobId, year, 'LOADING')
      await loadNormalizedDataForYear(supabase, validatedData, metadata, year)
      await updateYearStatus(supabase, jobId, year, 'DONE')
    }

    await setStatus(supabase, jobId, 'AGGREGATING', 80, 'Calculando ratios financieros...', metadata.yearsToProcess)

    // Calculate ratios
    await supabase.rpc('refresh_ratios_mv')

    await setStatus(supabase, jobId, 'DONE', 100, 'Procesamiento completado exitosamente', metadata.yearsToProcess)

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error)
    await setStatus(supabase, jobId, 'FAILED', 100, `Error: ${error.message}`, metadata.yearsToProcess || [])
  }
}

// Helper functions
async function setStatus(supabase: any, jobId: string, status: string, progress: number, message: string, yearsToProcess: number[] = []) {
  await supabase
    .from('processing_jobs')
    .update({
      status,
      stats_json: {
        stage: status,
        progress_pct: progress,
        message,
        selected_years: yearsToProcess,
        updated_at: new Date().toISOString()
      }
    })
    .eq('id', jobId)
}

async function updateJobStats(supabase: any, jobId: string, stats: any) {
  const { data: currentJob } = await supabase
    .from('processing_jobs')
    .select('stats_json')
    .eq('id', jobId)
    .single()

  const updatedStats = { ...currentJob?.stats_json, ...stats }
  
  await supabase
    .from('processing_jobs')
    .update({ stats_json: updatedStats })
    .eq('id', jobId)
}

async function updateYearStatus(supabase: any, jobId: string, year: number, status: string) {
  const { data: currentJob } = await supabase
    .from('processing_jobs')
    .select('stats_json')
    .eq('id', jobId)
    .single()

  const currentStats = currentJob?.stats_json || {}
  const perYear = currentStats.per_year || {}
  perYear[year] = { status, rows_valid: 0, rows_reject: 0 }

  await updateJobStats(supabase, jobId, { per_year: perYear })
}

function extractYearsFromCsvContent(csvContent: string): number[] {
  const lines = csvContent.split('\n')
  if (lines.length === 0) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const years: number[] = []
  
  headers.forEach(header => {
    const year = parseInt(header)
    if (!isNaN(year) && year >= 2000 && year <= 2030) {
      years.push(year)
    }
  })
  
  return years.sort()
}

async function loadNormalizedDataForYear(supabase: any, validatedData: { [key: string]: any[] }, metadata: any, year: number) {
  // Similar to loadNormalizedData but filtered for specific year
  await loadNormalizedData(supabase, validatedData, { ...metadata, periodYear: year })
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

    // Relaxed concept validation: allow unknown concepts and focus on numeric checks
    // This avoids false negatives due to naming variations; mapping happens downstream

    // Validate amounts are numbers (negative values allowed in P&L)
    for (const [key, value] of Object.entries(row)) {
      if (key !== 'Concepto' && key !== 'Notas' && value) {
        // Accept both specific years (2022, 2023) and generic formats (Año1, Año2)
        const isYearColumn = /^\d{4}$/.test(key) || /^Año\d+$/i.test(key)
        if (isYearColumn) {
          const amount = parseFloat(String(value).replace(',', '.').replace(/[^\d.-]/g, ''))
          if (isNaN(amount)) {
            errors.push(`Importe inválido en ${concept}, columna ${key}: ${value}`)
          }
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
      // Accept both specific years (2022, 2023) and generic formats (Año1, Año2) for balance validation
      const isYearColumn = /^\d{4}$/.test(key) || /^Año\d+$/i.test(key)
      if (key !== 'Concepto' && key !== 'Notas' && value && isYearColumn) {
        const year = key
        const amount = parseFloat(String(value).replace(',', '.').replace(/[^\d.-]/g, ''))
        
        if (!isNaN(amount)) {
          if (!yearlyTotals[year]) {
            yearlyTotals[year] = { activo: 0, pasivo_pn: 0 }
          }

          // Determine section using explicit 'Seccion' if present, fallback to concept
          const sectionSource = (row['Seccion']?.toString() || concept || '').toUpperCase()
          if (sectionSource.includes('ACTIVO')) {
            yearlyTotals[year].activo += amount
          } else if (sectionSource.includes('PATRIMONIO') || sectionSource.includes('PASIVO')) {
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
  console.log('Loading P&G data...')
  
  // First, detect all years present in the CSV
  const yearsInCSV = new Set<number>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (key !== 'Concepto' && key !== 'Notas') {
        if (/^\d{4}$/.test(key)) {
          // Specific year like "2022"
          yearsInCSV.add(parseInt(key))
        } else if (/^Año(\d+)$/i.test(key)) {
          // Generic year like "Año1" - convert to actual year
          const match = key.match(/^Año(\d+)$/i)
          if (match) {
            const yearOffset = parseInt(match[1]) - 1
            const actualYear = context.periodYear + yearOffset
            yearsInCSV.add(actualYear)
          }
        }
      }
    }
  }
  
  console.log(`Detected years in P&G CSV: ${Array.from(yearsInCSV).join(', ')}`)
  
  // Delete existing data only for the years we're about to update (REPLACE mode)
  if (context.importMode === 'REPLACE') {
    for (const year of yearsInCSV) {
      const deleteQuery = supabase
        .from('fs_pyg_lines')
        .delete()
        .eq('company_id', context.companyId)
        .eq('period_type', context.periodType)
        .eq('period_year', year)

      if (context.periodQuarter) deleteQuery.eq('period_quarter', context.periodQuarter)
      if (context.periodMonth) deleteQuery.eq('period_month', context.periodMonth)

      const { error: deleteError } = await deleteQuery
      if (deleteError) {
        console.error(`Error deleting existing P&G data for year ${year}:`, deleteError)
        throw new Error(`Error deleting existing P&G data for year ${year}: ${deleteError.message}`)
      }
      console.log(`Deleted existing P&G data for year ${year}`)
    }
  }

  // Transform to long format and insert
  const longData: any[] = []
  const mappingLogs: string[] = []
  
  for (const row of rows) {
    const originalConcept = row['Concepto']?.trim()
    if (!originalConcept) continue
    
    // Aplicar mapeo inteligente de conceptos
    const mappingResult = mapConceptIntelligently(originalConcept)
    const concept = mappingResult.mapped || originalConcept
    
    // Log del mapeo si se aplicó
    if (mappingResult.mapped && mappingResult.mapped !== originalConcept) {
      mappingLogs.push(`P&G: "${originalConcept}" → "${concept}" (${Math.round(mappingResult.confidence * 100)}%)`)
    }

    for (const [key, value] of Object.entries(row)) {
      // Accept both specific years (2022, 2023) and generic formats (Año1, Año2) for data loading
      const isYearColumn = /^\d{4}$/.test(key) || /^Año\d+$/i.test(key)
      if (key !== 'Concepto' && key !== 'Notas' && value && isYearColumn) {
        const amount = parseFloat(String(value).replace(',', '.').replace(/[^\d.-]/g, ''))
        if (!isNaN(amount)) {
          // Extract the actual year from the column header
          let actualYear: number
          if (/^\d{4}$/.test(key)) {
            // Specific year like "2022"
            actualYear = parseInt(key)
          } else {
            // Generic year like "Año1" - convert to actual year
            const match = key.match(/^Año(\d+)$/i)
            if (match) {
              const yearOffset = parseInt(match[1]) - 1
              actualYear = context.periodYear + yearOffset
            } else {
              actualYear = context.periodYear // fallback
            }
          }
          
          longData.push({
            company_id: context.companyId,
            period_date: new Date(actualYear, 11, 31), // December 31st of the actual year
            period_type: context.periodType,
            period_year: actualYear, // Use the actual year from the column
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
    
    // Log mapeos aplicados
    if (mappingLogs.length > 0) {
      console.log('🔄 Mapeos de conceptos aplicados:')
      mappingLogs.forEach(log => console.log(`  ${log}`))
    }
  }
}

async function loadBalanceData(supabase: any, rows: any[], context: any) {
  console.log('Loading Balance data...')
  
  // First, detect all years present in the CSV
  const yearsInCSV = new Set<number>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (key !== 'Concepto' && key !== 'Notas') {
        if (/^\d{4}$/.test(key)) {
          // Specific year like "2022"
          yearsInCSV.add(parseInt(key))
        } else if (/^Año(\d+)$/i.test(key)) {
          // Generic year like "Año1" - convert to actual year
          const match = key.match(/^Año(\d+)$/i)
          if (match) {
            const yearOffset = parseInt(match[1]) - 1
            const actualYear = context.periodYear + yearOffset
            yearsInCSV.add(actualYear)
          }
        }
      }
    }
  }
  
  console.log(`Detected years in Balance CSV: ${Array.from(yearsInCSV).join(', ')}`)
  
  // Delete existing data only for the years we're about to update (REPLACE mode)
  if (context.importMode === 'REPLACE') {
    for (const year of yearsInCSV) {
      const deleteQuery = supabase
        .from('fs_balance_lines')
        .delete()
        .eq('company_id', context.companyId)
        .eq('period_type', context.periodType)
        .eq('period_year', year)

      if (context.periodQuarter) deleteQuery.eq('period_quarter', context.periodQuarter)
      if (context.periodMonth) deleteQuery.eq('period_month', context.periodMonth)

      const { error: deleteError } = await deleteQuery
      if (deleteError) {
        console.error(`Error deleting existing Balance data for year ${year}:`, deleteError)
        throw new Error(`Error deleting existing Balance data for year ${year}: ${deleteError.message}`)
      }
      console.log(`Deleted existing Balance data for year ${year}`)
    }
  }

  // Transform to long format and insert
  const longData: any[] = []
  const mappingLogs: string[] = []
  let currentSection = ''

  for (const row of rows) {
    const originalConcept = row['Concepto']?.trim()
    if (!originalConcept) continue

    // Detect section headers first
    if (Object.keys(BALANCE_SECTIONS).includes(originalConcept)) {
      currentSection = BALANCE_SECTIONS[originalConcept]
      continue
    }

    // Apply intelligent concept mapping for non-section items
    const mappingResult = mapConceptIntelligently(originalConcept)
    const concept = mappingResult.mapped || originalConcept
    
    // Log mapping if applied
    if (mappingResult.mapped && mappingResult.mapped !== originalConcept) {
      mappingLogs.push(`Balance: "${originalConcept}" → "${concept}" (${Math.round(mappingResult.confidence * 100)}%)`)
    }

    for (const [key, value] of Object.entries(row)) {
      // Accept both specific years (2022, 2023) and generic formats (Año1, Año2) for balance data loading
      const isYearColumn = /^\d{4}$/.test(key) || /^Año\d+$/i.test(key)
      if (key !== 'Concepto' && key !== 'Notas' && value && isYearColumn) {
        const amount = parseFloat(String(value).replace(',', '.').replace(/[^\d.-]/g, ''))
        if (!isNaN(amount)) {
          // Extract the actual year from the column header
          let actualYear: number
          if (/^\d{4}$/.test(key)) {
            // Specific year like "2022"
            actualYear = parseInt(key)
          } else {
            // Generic year like "Año1" - convert to actual year
            const match = key.match(/^Año(\d+)$/i)
            if (match) {
              const yearOffset = parseInt(match[1]) - 1
              actualYear = context.periodYear + yearOffset
            } else {
              actualYear = context.periodYear // fallback
            }
          }
          
          longData.push({
            company_id: context.companyId,
            period_date: new Date(actualYear, 11, 31), // December 31st of the actual year
            period_type: context.periodType,
            period_year: actualYear, // Use the actual year from the column
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
    
    // Log mapeos aplicados
    if (mappingLogs.length > 0) {
      console.log('🔄 Mapeos de conceptos aplicados:')
      mappingLogs.forEach(log => console.log(`  ${log}`))
    }
  }
}

async function loadCashflowData(supabase: any, rows: any[], context: any) {
  console.log('Loading Cash Flow data...')
  
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
  let currentCategory = 'OPERATIVO'

  for (const row of rows) {
    const concept = row['Concepto']?.trim()
    if (!concept) continue

    // Detect category headers
    if (Object.keys(CASHFLOW_CATEGORIES).includes(concept)) {
      currentCategory = CASHFLOW_CATEGORIES[concept]
      continue
    }

    // Skip EFECTIVO category items for now (they're informational)
    if (currentCategory === 'EFECTIVO') continue

    for (const [key, value] of Object.entries(row)) {
      // Accept both specific years (2022, 2023) and generic formats (Año1, Año2)
      const isYearColumn = /^\d{4}$/.test(key) || /^Año\d+$/i.test(key)
      if (key !== 'Concepto' && key !== 'Notas' && value && isYearColumn) {
        const amount = parseFloat(String(value).replace(',', '.').replace(/[^\d.-]/g, ''))
        if (!isNaN(amount)) {
          // Extract the actual year from the column header
          let actualYear: number
          if (/^\d{4}$/.test(key)) {
            // Specific year like "2022"
            actualYear = parseInt(key)
          } else {
            // Generic year like "Año1" - convert to actual year
            const match = key.match(/^Año(\d+)$/i)
            if (match) {
              const yearOffset = parseInt(match[1]) - 1
              actualYear = context.periodYear + yearOffset
            } else {
              actualYear = context.periodYear // fallback
            }
          }

          longData.push({
            company_id: context.companyId,
            period_date: new Date(actualYear, 11, 31), // December 31st of the actual year
            period_type: context.periodType,
            period_year: actualYear, // Use the actual year from the column
            period_quarter: context.periodQuarter,
            period_month: context.periodMonth,
            category: currentCategory,
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

// Función de detección inteligente de tipo de archivo
function detectFileTypeIntelligently(fileName: string, csvContent: string): { canonical: string | null, confidence: number, suggestions?: string[] } {
  const normalizedFileName = fileName.toLowerCase().replace(/[_\s-]+/g, ' ')
  const normalizedContent = csvContent.toLowerCase()
  
  let bestMatch = { type: '', score: 0, canonical: '' }
  const suggestions: string[] = []
  
  // Evaluar cada patrón de archivo
  for (const [fileType, config] of Object.entries(FILE_DETECTION_PATTERNS)) {
    let score = 0
    
    // 1. Puntuación por nombre de archivo (40% del peso)
    for (const pattern of config.patterns) {
      if (pattern.test(normalizedFileName)) {
        score += 0.4
        break
      }
    }
    
    // 2. Puntuación por conceptos requeridos en contenido (60% del peso)
    const conceptMatches = config.requiredConcepts.filter(concept => 
      normalizedContent.includes(concept.toLowerCase())
    )
    const conceptScore = conceptMatches.length / config.requiredConcepts.length
    score += conceptScore * 0.6
    
    // Actualizar mejor coincidencia
    if (score > bestMatch.score) {
      bestMatch = { type: fileType, score, canonical: config.canonical }
    }
    
    // Generar sugerencias si hay coincidencias parciales
    if (score > 0.3 && score < 0.7) {
      suggestions.push(`El archivo podría ser ${config.canonical} (confianza: ${Math.round(score * 100)}%)`)
    }
  }
  
  // Solo devolver resultado si la confianza es suficiente
  if (bestMatch.score >= 0.7) {
    return {
      canonical: bestMatch.canonical,
      confidence: bestMatch.score,
      suggestions
    }
  }
  
  return {
    canonical: null,
    confidence: bestMatch.score,
    suggestions: suggestions.length > 0 ? suggestions : [`Archivo no reconocido automáticamente. Sugerencias: ${Object.values(FILE_DETECTION_PATTERNS).map(p => p.canonical).join(', ')}`]
  }
}

// Función de mapeo inteligente de conceptos
function mapConceptIntelligently(inputConcept: string): { mapped: string | null, confidence: number, suggestions: string[] } {
  const normalizedInput = inputConcept.toLowerCase().trim()
  const suggestions: string[] = []
  
  // 1. Búsqueda exacta
  for (const [canonical, synonyms] of Object.entries(CONCEPT_SYNONYMS)) {
    if (canonical.toLowerCase() === normalizedInput) {
      return { mapped: canonical, confidence: 1.0, suggestions: [] }
    }
  }
  
  // 2. Búsqueda en sinónimos
  for (const [canonical, synonyms] of Object.entries(CONCEPT_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (synonym.toLowerCase() === normalizedInput) {
        return { mapped: canonical, confidence: 0.95, suggestions: [] }
      }
    }
  }
  
  // 3. Búsqueda parcial/fuzzy
  let bestMatch = { concept: '', confidence: 0 }
  
  for (const [canonical, synonyms] of Object.entries(CONCEPT_SYNONYMS)) {
    // Verificar coincidencia parcial con concepto canónico
    const canonicalWords = canonical.toLowerCase().split(' ')
    const inputWords = normalizedInput.split(' ')
    
    let matchingWords = 0
    for (const inputWord of inputWords) {
      if (canonicalWords.some(canonicalWord => 
        canonicalWord.includes(inputWord) || inputWord.includes(canonicalWord)
      )) {
        matchingWords++
      }
    }
    
    const canonicalScore = matchingWords / Math.max(canonicalWords.length, inputWords.length)
    
    // Verificar coincidencia parcial con sinónimos
    let bestSynonymScore = 0
    for (const synonym of synonyms) {
      const synonymWords = synonym.split(' ')
      let synonymMatchingWords = 0
      
      for (const inputWord of inputWords) {
        if (synonymWords.some(synonymWord => 
          synonymWord.includes(inputWord) || inputWord.includes(synonymWord)
        )) {
          synonymMatchingWords++
        }
      }
      
      const synonymScore = synonymMatchingWords / Math.max(synonymWords.length, inputWords.length)
      bestSynonymScore = Math.max(bestSynonymScore, synonymScore)
    }
    
    const overallScore = Math.max(canonicalScore, bestSynonymScore)
    
    if (overallScore > bestMatch.confidence) {
      bestMatch = { concept: canonical, confidence: overallScore }
    }
    
    // Añadir sugerencias para coincidencias parciales
    if (overallScore > 0.4 && overallScore < 0.8) {
      suggestions.push(`¿Quizás "${canonical}"? (${Math.round(overallScore * 100)}% similar)`)
    }
  }
  
  // Devolver resultado si la confianza es suficiente
  if (bestMatch.confidence >= 0.8) {
    return {
      mapped: bestMatch.concept,
      confidence: bestMatch.confidence,
      suggestions: [`Concepto mapeado automáticamente: "${inputConcept}" → "${bestMatch.concept}"`]
    }
  }
  
  return {
    mapped: null,
    confidence: bestMatch.confidence,
    suggestions: suggestions.length > 0 ? suggestions : [`Concepto "${inputConcept}" no reconocido. Usar tal como está.`]
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
