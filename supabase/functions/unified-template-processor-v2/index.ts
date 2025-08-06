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

    // Read and parse CSV
    const csvContent = await file.text();
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV must have at least header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1).map(line => {
      // Simple CSV parsing (handles basic quotes)
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      return values.map(v => v.replace(/"/g, ''));
    });

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

function validateTemplateStructure(templateType: string, headers: string[], dataRows: string[][]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Define required fields for each template
  const requiredFields: Record<string, string[]> = {
    facts: ['company_id', 'metric_code', 'frequency', 'period', 'value', 'value_kind', 'unit', 'currency_code', 'scenario'],
    debt_loans: ['company_id', 'loan_key', 'lender', 'loan_type', 'currency_code', 'initial_amount', 'start_date', 'maturity_date'],
    debt_balances: ['company_id', 'loan_key', 'frequency', 'period', 'balance_amount', 'currency_code'],
    company_profile_unified: ['company_id', 'record_type', 'as_of_date', 'source_url', 'confidence']
  };

  const required = requiredFields[templateType] || [];
  
  // Check required headers
  for (const field of required) {
    if (!headers.includes(field)) {
      errors.push({
        row: 0,
        field,
        value: 'missing',
        error: `Required field '${field}' not found in headers`,
        severity: 'error'
      });
    }
  }

  // Validate data rows
  dataRows.forEach((row, rowIndex) => {
    if (row.length !== headers.length) {
      errors.push({
        row: rowIndex + 2,
        field: 'row_structure',
        value: row.length,
        error: `Row has ${row.length} columns, expected ${headers.length}`,
        severity: 'error'
      });
    }

    // Validate specific fields based on template type
    headers.forEach((header, colIndex) => {
      const value = row[colIndex];
      
      // Check required fields are not empty
      if (required.includes(header) && (!value || value.trim() === '')) {
        errors.push({
          row: rowIndex + 2,
          field: header,
          value,
          error: `Required field '${header}' is empty`,
          severity: 'error'
        });
      }

      // Validate specific field types
      if (header === 'value' && value && isNaN(Number(value))) {
        errors.push({
          row: rowIndex + 2,
          field: header,
          value,
          error: 'Value must be numeric',
          severity: 'error'
        });
      }

      if (header.includes('_pct') && value && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
        warnings.push({
          row: rowIndex + 2,
          field: header,
          value,
          error: 'Percentage should be between 0 and 100',
          severity: 'warning'
        });
      }

      if (header.includes('_date') && value && !isValidDate(value)) {
        errors.push({
          row: rowIndex + 2,
          field: header,
          value,
          error: 'Date must be in YYYY-MM-DD format',
          severity: 'error'
        });
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRows: dataRows.length,
      validRows: dataRows.length - errors.filter(e => e.row > 0).length,
      errorRows: errors.filter(e => e.row > 0).length,
      warningRows: warnings.filter(w => w.row > 0).length
    }
  };
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
      segment_json: rowData.segment_json ? JSON.parse(rowData.segment_json) : {},
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
      extra_json: rowData.extra_json ? JSON.parse(rowData.extra_json) : {},
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
  // Get unique periods and scenarios from the data
  const periodsScenarios = [...new Set(data.map(d => `${d.period}_${d.scenario}`))];
  
  const validations = [];
  
  for (const periodScenario of periodsScenarios) {
    const [period, scenario] = periodScenario.split('_');
    
    const { data: validation } = await supabase.rpc('validate_balance_sheet_integrity', {
      company_uuid: companyId,
      period_text: period,
      scenario_text: scenario
    });
    
    if (validation) {
      validations.push(validation);
    }
  }
  
  return validations;
}