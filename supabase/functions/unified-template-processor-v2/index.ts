import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting unified template processor v2...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const templateType = formData.get('templateType') as string;
    const companyId = formData.get('companyId') as string;
    const dryRun = formData.get('dryRun') === 'true';

    if (!file || !templateType) {
      throw new Error('File and templateType are required');
    }

    console.log(`📋 Processing ${templateType} template for company ${companyId}`);

    // Read and parse CSV with improved parser
    const csvContent = await file.text();
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV must have at least header and one data row');
    }

    const headers = parseCSVLine(lines[0]);
    const dataRows = lines.slice(1).map(line => parseCSVLine(line));

    // Validate template structure
    const validation = validateTemplateStructure(templateType, headers, dataRows);
    
    if (!validation.isValid && !dryRun) {
      return new Response(JSON.stringify({
        success: false,
        errors: validation.errors,
        validation: validation
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Process rows based on template type
    let processedData: any[] = [];
    let insertResult = { success: true, inserted_count: 0, details: {} };

    switch (templateType) {
      case 'facts':
        processedData = await processFactsTemplate(headers, dataRows, companyId, user.id);
        if (!dryRun) {
          insertResult = await insertFactsData(supabase, processedData);
        }
        break;
        
      case 'debt_loans':
        processedData = await processDebtLoansTemplate(headers, dataRows, companyId, user.id);
        if (!dryRun) {
          insertResult = await insertDebtLoansData(supabase, processedData);
        }
        break;
        
      case 'debt_balances':
        processedData = await processDebtBalancesTemplate(headers, dataRows, companyId, user.id);
        if (!dryRun) {
          insertResult = await insertDebtBalancesData(supabase, processedData);
        }
        break;
        
      case 'company_profile_unified':
        processedData = await processCompanyProfileTemplate(headers, dataRows, companyId, user.id);
        if (!dryRun) {
          insertResult = await insertCompanyProfileData(supabase, processedData);
        }
        break;
        
      default:
        throw new Error(`Unsupported template type: ${templateType}`);
    }

    // Log upload history
    if (!dryRun) {
      await supabase.from('upload_history').insert({
        user_id: user.id,
        company_id: companyId,
        template_name: templateType,
        original_filename: file.name,
        upload_status: 'completed',
        file_size: file.size,
        validation_results: validation,
        processing_logs: [
          {
            timestamp: new Date().toISOString(),
            action: 'template_processed',
            details: insertResult
          }
        ]
      });
    }

    // Perform balance sheet validation for facts template
    let balanceValidation = null;
    if (templateType === 'facts' && !dryRun) {
      balanceValidation = await validateBalanceSheet(supabase, companyId, processedData);
    }

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      template_type: templateType,
      processed_rows: processedData.length,
      inserted_count: insertResult.inserted_count,
      validation,
      balance_validation: balanceValidation,
      preview_data: dryRun ? processedData.slice(0, 10) : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error processing template:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

// Robust CSV parser that handles escaped quotes and commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      // Check if this is an escaped quote (double quote)
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i += 2; // Skip both quotes
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  return result;
}

function validateTemplateStructure(templateType: string, headers: string[], dataRows: string[][]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Define expected fields for each template type
  const expectedFields: { [key: string]: string[] } = {
    'facts': [
      'company_id', 'metric_code', 'frequency', 'period', 'value', 'value_kind', 
      'unit', 'currency_code', 'scenario', 'as_of_date', 'source_url', 'confidence',
      'uploaded_by', 'job_id', 'product_code', 'region_code', 'customer_code', 'segment_json'
    ],
    'debt_loans': [
      'company_id', 'loan_key', 'lender', 'loan_type', 'currency_code', 'initial_amount',
      'start_date', 'maturity_date', 'rate_type', 'interest_rate_pct', 'rate_index', 'spread_bps',
      'amortization', 'collateral', 'covenants', 'notes', 'as_of_date', 'source_url', 'confidence',
      'uploaded_by', 'job_id'
    ],
    'debt_balances': [
      'company_id', 'loan_key', 'frequency', 'period', 'balance_amount', 'currency_code',
      'as_of_date', 'source_url', 'confidence', 'uploaded_by', 'job_id'
    ],
    'company_profile_unified': [
      'company_id', 'record_type', 'as_of_date', 'source_url', 'confidence', 'uploaded_by',
      'job_id', 'notes', 'extra_json', 'legal_name', 'year_founded', 'employees_exact',
      'sector', 'hq_city', 'hq_country_code', 'website', 'description', 'holder_name',
      'holder_type', 'direct_pct', 'indirect_pct'
    ]
  };

  const expected = expectedFields[templateType];
  if (!expected) {
    errors.push({
      row: 0,
      field: 'template_type',
      value: templateType,
      error: `Template type '${templateType}' is not supported`,
      severity: 'error'
    });
    return { isValid: false, errors, warnings, summary: { totalRows: 0, validRows: 0, errorRows: 1, warningRows: 0 } };
  }

  // Check headers match exactly
  if (headers.length !== expected.length) {
    errors.push({
      row: 0,
      field: 'headers',
      value: headers.length,
      error: `Expected ${expected.length} columns, but found ${headers.length}`,
      severity: 'error'
    });
  }

  for (let i = 0; i < expected.length; i++) {
    if (headers[i] !== expected[i]) {
      errors.push({
        row: 0,
        field: `column_${i + 1}`,
        value: headers[i] || 'missing',
        error: `Column ${i + 1}: expected '${expected[i]}', found '${headers[i] || 'missing'}'`,
        severity: 'error'
      });
    }
  }

  // Validate data rows
  dataRows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because index starts at 0 and we skip header row
    
    // Check row length - STRICT validation
    if (row.length !== expected.length) {
      errors.push({
        row: rowNumber,
        field: 'row_structure',
        value: row.length,
        error: `Expected exactly ${expected.length} columns, found ${row.length}. Check for unescaped commas or quotes.`,
        severity: 'error'
      });
      return; // Skip further validation for malformed rows
    }

    // Template-specific validations
    if (templateType === 'facts') {
      validateFactsRow(row, rowNumber, errors, warnings);
    } else if (templateType === 'debt_loans') {
      validateDebtLoansRow(row, rowNumber, errors, warnings);
    } else if (templateType === 'debt_balances') {
      validateDebtBalancesRow(row, rowNumber, errors, warnings);
    } else if (templateType === 'company_profile_unified') {
      validateCompanyProfileRow(row, rowNumber, errors, warnings);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRows: dataRows.length,
      validRows: dataRows.filter((_, index) => !errors.some(e => e.row === index + 2)).length,
      errorRows: errors.filter(e => e.row > 0).length,
      warningRows: warnings.filter(w => w.row > 0).length
    }
  };
}

function validateFactsRow(row: string[], rowNumber: number, errors: ValidationError[], warnings: ValidationError[]) {
  // Required fields validation
  if (!row[0]?.trim()) errors.push({ row: rowNumber, field: 'company_id', value: row[0], error: 'company_id is required', severity: 'error' });
  if (!row[1]?.trim()) errors.push({ row: rowNumber, field: 'metric_code', value: row[1], error: 'metric_code is required', severity: 'error' });
  if (!row[2]?.trim()) errors.push({ row: rowNumber, field: 'frequency', value: row[2], error: 'frequency is required', severity: 'error' });
  if (!row[3]?.trim()) errors.push({ row: rowNumber, field: 'period', value: row[3], error: 'period is required', severity: 'error' });
  if (!row[4]?.trim()) errors.push({ row: rowNumber, field: 'value', value: row[4], error: 'value is required', severity: 'error' });
  
  // Validate numeric value
  if (row[4] && isNaN(parseFloat(row[4]))) {
    errors.push({ row: rowNumber, field: 'value', value: row[4], error: 'value must be numeric', severity: 'error' });
  }
  
  // Validate value_kind
  if (row[5] && !['flow', 'stock'].includes(row[5])) {
    errors.push({ row: rowNumber, field: 'value_kind', value: row[5], error: 'value_kind must be "flow" or "stock"', severity: 'error' });
  }
  
  // Validate frequency
  if (row[2] && !['Y', 'Q', 'M', 'D'].includes(row[2])) {
    errors.push({ row: rowNumber, field: 'frequency', value: row[2], error: 'frequency must be Y, Q, M, or D', severity: 'error' });
  }
  
  // Validate currency consistency
  if (row[6] === 'currency' && !row[7]?.trim()) {
    errors.push({ row: rowNumber, field: 'currency_code', value: row[7], error: 'currency_code is required when unit="currency"', severity: 'error' });
  }
  
  if (row[6] && row[6] !== 'currency' && row[7]?.trim()) {
    warnings.push({ row: rowNumber, field: 'currency_code', value: row[7], error: `currency_code should be empty when unit="${row[6]}"`, severity: 'warning' });
  }
  
  // Validate period format
  if (row[2] && row[3]) {
    const frequency = row[2];
    const period = row[3];
    
    if (frequency === 'Y' && !/^\d{4}$/.test(period)) {
      errors.push({ row: rowNumber, field: 'period', value: period, error: 'For yearly frequency, period must be YYYY format', severity: 'error' });
    } else if (frequency === 'Q' && !/^\d{4}-Q[1-4]$/.test(period)) {
      errors.push({ row: rowNumber, field: 'period', value: period, error: 'For quarterly frequency, period must be YYYY-Q[1-4] format', severity: 'error' });
    } else if (frequency === 'M' && !/^\d{4}-\d{2}$/.test(period)) {
      errors.push({ row: rowNumber, field: 'period', value: period, error: 'For monthly frequency, period must be YYYY-MM format', severity: 'error' });
    }
  }
  
  // Validate segment_json if not empty
  if (row[17]?.trim()) {
    try {
      JSON.parse(row[17]);
    } catch (e) {
      errors.push({ row: rowNumber, field: 'segment_json', value: row[17], error: 'segment_json must be valid JSON', severity: 'error' });
    }
  }
  
  // Validate date format
  if (row[9] && !isValidDate(row[9])) {
    errors.push({ row: rowNumber, field: 'as_of_date', value: row[9], error: 'as_of_date must be in YYYY-MM-DD format', severity: 'error' });
  }
}

function validateDebtLoansRow(row: string[], rowNumber: number, errors: ValidationError[], warnings: ValidationError[]) {
  // Required fields
  if (!row[0]?.trim()) errors.push({ row: rowNumber, field: 'company_id', value: row[0], error: 'company_id is required', severity: 'error' });
  if (!row[1]?.trim()) errors.push({ row: rowNumber, field: 'loan_key', value: row[1], error: 'loan_key is required', severity: 'error' });
  if (!row[2]?.trim()) errors.push({ row: rowNumber, field: 'lender', value: row[2], error: 'lender is required', severity: 'error' });
  
  // Validate numeric fields
  if (row[5] && isNaN(parseFloat(row[5]))) {
    errors.push({ row: rowNumber, field: 'initial_amount', value: row[5], error: 'initial_amount must be numeric', severity: 'error' });
  }
  if (row[9] && isNaN(parseFloat(row[9]))) {
    errors.push({ row: rowNumber, field: 'interest_rate_pct', value: row[9], error: 'interest_rate_pct must be numeric', severity: 'error' });
  }
  if (row[11] && isNaN(parseFloat(row[11]))) {
    errors.push({ row: rowNumber, field: 'spread_bps', value: row[11], error: 'spread_bps must be numeric', severity: 'error' });
  }
  
  // Validate rate_index
  if (row[10] && !['FIXED', 'EURIBOR_1M', 'EURIBOR_3M', 'EURIBOR_6M', 'EURIBOR_12M'].includes(row[10])) {
    warnings.push({ row: rowNumber, field: 'rate_index', value: row[10], error: `rate_index '${row[10]}' is not a standard index`, severity: 'warning' });
  }
  
  // Validate dates
  if (row[6] && !isValidDate(row[6])) {
    errors.push({ row: rowNumber, field: 'start_date', value: row[6], error: 'start_date must be in YYYY-MM-DD format', severity: 'error' });
  }
  if (row[7] && !isValidDate(row[7])) {
    errors.push({ row: rowNumber, field: 'maturity_date', value: row[7], error: 'maturity_date must be in YYYY-MM-DD format', severity: 'error' });
  }
  if (row[16] && !isValidDate(row[16])) {
    errors.push({ row: rowNumber, field: 'as_of_date', value: row[16], error: 'as_of_date must be in YYYY-MM-DD format', severity: 'error' });
  }
  
  // Validate maturity_date >= start_date
  if (row[6] && row[7] && isValidDate(row[6]) && isValidDate(row[7])) {
    if (new Date(row[7]) < new Date(row[6])) {
      errors.push({ row: rowNumber, field: 'maturity_date', value: row[7], error: 'maturity_date must be greater than or equal to start_date', severity: 'error' });
    }
  }
}

function validateDebtBalancesRow(row: string[], rowNumber: number, errors: ValidationError[], warnings: ValidationError[]) {
  // Required fields
  if (!row[0]?.trim()) errors.push({ row: rowNumber, field: 'company_id', value: row[0], error: 'company_id is required', severity: 'error' });
  if (!row[1]?.trim()) errors.push({ row: rowNumber, field: 'loan_key', value: row[1], error: 'loan_key is required', severity: 'error' });
  if (!row[2]?.trim()) errors.push({ row: rowNumber, field: 'frequency', value: row[2], error: 'frequency is required', severity: 'error' });
  if (!row[3]?.trim()) errors.push({ row: rowNumber, field: 'period', value: row[3], error: 'period is required', severity: 'error' });
  
  // Validate numeric balance
  if (row[4] && isNaN(parseFloat(row[4]))) {
    errors.push({ row: rowNumber, field: 'balance_amount', value: row[4], error: 'balance_amount must be numeric', severity: 'error' });
  }
  
  // Validate frequency
  if (row[2] && !['Y', 'M'].includes(row[2])) {
    errors.push({ row: rowNumber, field: 'frequency', value: row[2], error: 'frequency must be Y or M', severity: 'error' });
  }
  
  // Validate period format
  if (row[2] && row[3]) {
    const frequency = row[2];
    const period = row[3];
    
    if (frequency === 'Y' && !/^\d{4}$/.test(period)) {
      errors.push({ row: rowNumber, field: 'period', value: period, error: 'For yearly frequency, period must be YYYY format', severity: 'error' });
    } else if (frequency === 'M' && !/^\d{4}-\d{2}$/.test(period)) {
      errors.push({ row: rowNumber, field: 'period', value: period, error: 'For monthly frequency, period must be YYYY-MM format', severity: 'error' });
    }
  }
  
  // Validate date format
  if (row[6] && !isValidDate(row[6])) {
    errors.push({ row: rowNumber, field: 'as_of_date', value: row[6], error: 'as_of_date must be in YYYY-MM-DD format', severity: 'error' });
  }
}

function validateCompanyProfileRow(row: string[], rowNumber: number, errors: ValidationError[], warnings: ValidationError[]) {
  // Required fields
  if (!row[0]?.trim()) errors.push({ row: rowNumber, field: 'company_id', value: row[0], error: 'company_id is required', severity: 'error' });
  if (!row[1]?.trim()) errors.push({ row: rowNumber, field: 'record_type', value: row[1], error: 'record_type is required', severity: 'error' });
  
  // Validate record_type
  if (row[1] && !['PROFILE', 'SHAREHOLDER'].includes(row[1])) {
    errors.push({ row: rowNumber, field: 'record_type', value: row[1], error: 'record_type must be "PROFILE" or "SHAREHOLDER"', severity: 'error' });
  }
  
  // Validate holder_type for SHAREHOLDER records
  if (row[1] === 'SHAREHOLDER' && row[18] && !['person', 'entity'].includes(row[18])) {
    errors.push({ row: rowNumber, field: 'holder_type', value: row[18], error: 'holder_type must be "person" or "entity" for SHAREHOLDER records', severity: 'error' });
  }
  
  // Validate percentages
  if (row[19] && (isNaN(parseFloat(row[19])) || parseFloat(row[19]) < 0 || parseFloat(row[19]) > 100)) {
    errors.push({ row: rowNumber, field: 'direct_pct', value: row[19], error: 'direct_pct must be a number between 0 and 100', severity: 'error' });
  }
  if (row[20] && (isNaN(parseFloat(row[20])) || parseFloat(row[20]) < 0 || parseFloat(row[20]) > 100)) {
    errors.push({ row: rowNumber, field: 'indirect_pct', value: row[20], error: 'indirect_pct must be a number between 0 and 100', severity: 'error' });
  }
  
  // Validate extra_json if not empty
  if (row[8]?.trim()) {
    try {
      JSON.parse(row[8]);
    } catch (e) {
      errors.push({ row: rowNumber, field: 'extra_json', value: row[8], error: 'extra_json must be valid JSON', severity: 'error' });
    }
  }
  
  // Validate date format
  if (row[2] && !isValidDate(row[2])) {
    errors.push({ row: rowNumber, field: 'as_of_date', value: row[2], error: 'as_of_date must be in YYYY-MM-DD format', severity: 'error' });
  }
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date.toISOString().slice(0, 10) === dateString;
}

async function processFactsTemplate(headers: string[], dataRows: string[][], companyId: string, userId: string) {
  const jobId = crypto.randomUUID();
  
  return dataRows.map(row => {
    const rowData: any = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] || null;
    });

    return {
      company_id: rowData.company_id || companyId,
      external_id: rowData.company_id,
      metric_code: rowData.metric_code,
      frequency: rowData.frequency,
      period: rowData.period,
      value: parseFloat(rowData.value) || 0,
      value_kind: rowData.value_kind,
      unit: rowData.unit,
      currency: rowData.currency_code,
      scenario: rowData.scenario || 'actual',
      as_of_date: rowData.as_of_date || new Date().toISOString().split('T')[0],
      source: rowData.source_url,
      notes: rowData.notes,
      confidence_score: parseFloat(rowData.confidence) || 1.0,
      product_code: rowData.product_code,
      region_code: rowData.region_code,
      customer_code: rowData.customer_code,
      segment_json: rowData.segment_json ? JSON.parse(rowData.segment_json || '{}') : {},
      uploaded_by: userId,
      job_id: jobId
    };
  });
}

async function processDebtLoansTemplate(headers: string[], dataRows: string[][], companyId: string, userId: string) {
  const jobId = crypto.randomUUID();
  
  return dataRows.map(row => {
    const rowData: any = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] || null;
    });

    return {
      company_id: rowData.company_id || companyId,
      loan_key: rowData.loan_key,
      entity_name: rowData.lender,
      loan_type: rowData.loan_type,
      currency_code: rowData.currency_code,
      initial_amount: parseFloat(rowData.initial_amount) || 0,
      maturity_date: rowData.maturity_date,
      interest_rate: parseFloat(rowData.interest_rate_pct) || 0,
      guarantees: rowData.collateral,
      observations: rowData.notes,
      uploaded_by: userId,
      job_id: jobId
    };
  });
}

async function processDebtBalancesTemplate(headers: string[], dataRows: string[][], companyId: string, userId: string) {
  const jobId = crypto.randomUUID();
  
  return dataRows.map(row => {
    const rowData: any = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] || null;
    });

    return {
      company_id: rowData.company_id || companyId,
      loan_id: rowData.loan_key, // Will need to resolve to actual loan ID
      year: parseInt(rowData.period) || new Date().getFullYear(),
      year_end_balance: parseFloat(rowData.balance_amount) || 0
    };
  });
}

async function processCompanyProfileTemplate(headers: string[], dataRows: string[][], companyId: string, userId: string) {
  const jobId = crypto.randomUUID();
  
  return dataRows.map(row => {
    const rowData: any = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] || null;
    });

    return {
      company_id: rowData.company_id || companyId,
      record_type: rowData.record_type,
      as_of_date: rowData.as_of_date,
      field_name: rowData.record_type === 'PROFILE' ? 'profile_data' : 'shareholder_data',
      field_value: rowData.record_type === 'PROFILE' ? rowData.legal_name : rowData.holder_name,
      source_url: rowData.source_url,
      confidence: parseFloat(rowData.confidence) || 1.0,
      notes: rowData.notes,
      extra_json: rowData.extra_json ? JSON.parse(rowData.extra_json || '{}') : {},
      // Profile fields
      legal_name: rowData.legal_name,
      year_founded: rowData.year_founded ? parseInt(rowData.year_founded) : null,
      employees_exact: rowData.employees_exact ? parseInt(rowData.employees_exact) : null,
      sector: rowData.sector,
      hq_city: rowData.hq_city,
      hq_country_code: rowData.hq_country_code,
      website: rowData.website,
      description: rowData.description,
      // Shareholder fields
      holder_name: rowData.holder_name,
      holder_type: rowData.holder_type,
      direct_pct: rowData.direct_pct ? parseFloat(rowData.direct_pct) : null,
      indirect_pct: rowData.indirect_pct ? parseFloat(rowData.indirect_pct) : null,
      uploaded_by: userId,
      job_id: jobId
    };
  });
}

async function insertFactsData(supabase: any, data: any[]) {
  const { data: result, error } = await supabase
    .from('financial_series_unified')
    .upsert(data, {
      onConflict: 'company_id,metric_code,period,scenario',
      ignoreDuplicates: false
    });

  if (error) throw error;
  
  return {
    success: true,
    inserted_count: data.length,
    details: result
  };
}

async function insertDebtLoansData(supabase: any, data: any[]) {
  const { data: result, error } = await supabase
    .from('debt_loans')
    .upsert(data, {
      onConflict: 'company_id,loan_key',
      ignoreDuplicates: false
    });

  if (error) throw error;
  
  return {
    success: true,
    inserted_count: data.length,
    details: result
  };
}

async function insertDebtBalancesData(supabase: any, data: any[]) {
  // First resolve loan_keys to actual IDs
  for (const row of data) {
    const { data: loan } = await supabase
      .from('debt_loans')
      .select('id')
      .eq('company_id', row.company_id)
      .eq('loan_key', row.loan_id)
      .single();
    
    if (loan) {
      row.loan_id = loan.id;
    }
  }

  const { data: result, error } = await supabase
    .from('debt_balances')
    .upsert(data, {
      onConflict: 'company_id,loan_id,year',
      ignoreDuplicates: false
    });

  if (error) throw error;
  
  return {
    success: true,
    inserted_count: data.length,
    details: result
  };
}

async function insertCompanyProfileData(supabase: any, data: any[]) {
  const { data: result, error } = await supabase
    .from('company_profile_unified')
    .upsert(data, {
      onConflict: 'company_id,record_type,field_name',
      ignoreDuplicates: false
    });

  if (error) throw error;
  
  return {
    success: true,
    inserted_count: data.length,
    details: result
  };
}

async function validateBalanceSheet(supabase: any, companyId: string, data: any[]) {
  const validationResults = [];
  
  // Group by period and scenario
  const groups = data.reduce((acc: any, row: any) => {
    const key = `${row.period}_${row.scenario}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
  
  for (const [key, rows] of Object.entries(groups)) {
    const [period, scenario] = key.split('_');
    
    try {
      const { data: validation } = await supabase.rpc('validate_balance_sheet_integrity', {
        company_uuid: companyId,
        period_text: period,
        scenario_text: scenario
      });
      
      validationResults.push(validation);
    } catch (error) {
      console.error(`Balance validation error for ${period} ${scenario}:`, error);
    }
  }
  
  return validationResults;
}