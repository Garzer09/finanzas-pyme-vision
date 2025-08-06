import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessedRow {
  external_id?: string;
  metric_code?: string;
  frequency?: string;
  period?: string;
  value?: number;
  currency?: string;
  unit?: string;
  value_kind?: string;
  source?: string;
  notes?: string;
  record_type?: string;
  as_of_date?: string;
  field_name?: string;
  field_value?: string;
  source_url?: string;
  confidence?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Processing unified template format...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    );

    if (userError || !user) {
      console.error('❌ Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('company_id') as string;
    const templateType = formData.get('template_type') as string || 'auto-detect';
    const dryRun = formData.get('dry_run') === 'true';

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📁 Processing file: ${file.name}, Company: ${companyId}, Type: ${templateType}`);

    // Read and parse CSV
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ error: 'File must contain at least header and one data row' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('📋 Headers detected:', headers);

    // Auto-detect template type based on headers
    const detectedType = detectTemplateType(headers);
    const finalTemplateType = templateType === 'auto-detect' ? detectedType : templateType;
    
    console.log(`🔍 Template type: ${finalTemplateType} (${templateType === 'auto-detect' ? 'auto-detected' : 'specified'})`);

    // Parse data rows
    const parsedRows: ProcessedRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
      
      if (row.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${row.length})`);
        continue;
      }

      const rowData: ProcessedRow = {};
      headers.forEach((header, index) => {
        const value = row[index];
        if (value) {
          (rowData as any)[header] = value;
        }
      });

      // Validate and process based on template type
      const validationResult = validateRow(rowData, finalTemplateType, i + 1);
      if (validationResult.isValid) {
        parsedRows.push(rowData);
      } else {
        errors.push(...validationResult.errors);
      }
    }

    console.log(`✅ Parsed ${parsedRows.length} valid rows, ${errors.length} errors`);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          template_type: finalTemplateType,
          parsed_rows: parsedRows.length,
          errors,
          preview: parsedRows.slice(0, 5),
          dry_run: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process and insert data
    const insertResults = await insertUnifiedData(
      supabase, 
      parsedRows, 
      finalTemplateType, 
      companyId, 
      user.id
    );

    // Log upload history
    await supabase.from('upload_history').insert({
      user_id: user.id,
      company_id: companyId,
      original_filename: file.name,
      template_name: finalTemplateType,
      upload_status: insertResults.success ? 'completed' : 'failed',
      file_size: file.size,
      validation_results: {
        rows_processed: parsedRows.length,
        errors_count: errors.length,
        inserted_records: insertResults.inserted_count
      },
      processing_logs: [
        `Template type: ${finalTemplateType}`,
        `Rows processed: ${parsedRows.length}`,
        `Errors: ${errors.length}`,
        `Records inserted: ${insertResults.inserted_count}`
      ]
    });

    return new Response(
      JSON.stringify({
        success: insertResults.success,
        template_type: finalTemplateType,
        rows_processed: parsedRows.length,
        inserted_count: insertResults.inserted_count,
        errors,
        details: insertResults.details
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function detectTemplateType(headers: string[]): string {
  const headerSet = new Set(headers.map(h => h.toLowerCase()));
  
  // Check for financial_series format
  if (headerSet.has('metric_code') && headerSet.has('frequency') && headerSet.has('period')) {
    return 'financial_series';
  }
  
  // Check for company_profile format
  if (headerSet.has('record_type') && headerSet.has('field_name') && headerSet.has('field_value')) {
    return 'company_profile';
  }
  
  // Legacy format detection
  if (headerSet.has('concepto') || headerSet.has('concept')) {
    return 'legacy_financial';
  }
  
  return 'unknown';
}

function validateRow(row: ProcessedRow, templateType: string, rowNumber: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (templateType === 'financial_series') {
    // Validate required fields for financial series
    if (!row.external_id) errors.push(`Row ${rowNumber}: external_id is required`);
    if (!row.metric_code) errors.push(`Row ${rowNumber}: metric_code is required`);
    if (!row.frequency) errors.push(`Row ${rowNumber}: frequency is required`);
    if (!row.period) errors.push(`Row ${rowNumber}: period is required`);
    if (row.value === undefined || row.value === null) errors.push(`Row ${rowNumber}: value is required`);
    
    // Validate frequency
    if (row.frequency && !['Y', 'Q', 'M', 'ASOF'].includes(row.frequency)) {
      errors.push(`Row ${rowNumber}: frequency must be Y, Q, M, or ASOF`);
    }
    
    // Validate period format
    if (row.period && !validatePeriodFormat(row.period, row.frequency || '')) {
      errors.push(`Row ${rowNumber}: period format invalid for frequency ${row.frequency}`);
    }
    
    // Validate numeric value
    if (row.value && isNaN(Number(row.value))) {
      errors.push(`Row ${rowNumber}: value must be numeric`);
    }
    
  } else if (templateType === 'company_profile') {
    // Validate required fields for company profile
    if (!row.external_id) errors.push(`Row ${rowNumber}: external_id is required`);
    if (!row.record_type) errors.push(`Row ${rowNumber}: record_type is required`);
    if (!row.as_of_date) errors.push(`Row ${rowNumber}: as_of_date is required`);
    if (!row.field_name) errors.push(`Row ${rowNumber}: field_name is required`);
    
    // Validate record_type
    if (row.record_type && !['PROFILE', 'SHAREHOLDER', 'PRODUCT', 'NEWS'].includes(row.record_type)) {
      errors.push(`Row ${rowNumber}: record_type must be PROFILE, SHAREHOLDER, PRODUCT, or NEWS`);
    }
    
    // Validate date format
    if (row.as_of_date && !isValidDate(row.as_of_date)) {
      errors.push(`Row ${rowNumber}: as_of_date must be in YYYY-MM-DD format`);
    }
    
    // Validate confidence score
    if (row.confidence && (isNaN(Number(row.confidence)) || Number(row.confidence) < 0 || Number(row.confidence) > 1)) {
      errors.push(`Row ${rowNumber}: confidence must be between 0 and 1`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

function validatePeriodFormat(period: string, frequency: string): boolean {
  switch (frequency) {
    case 'Y':
      return /^\d{4}$/.test(period);
    case 'Q':
      return /^\d{4}-Q[1-4]$/.test(period);
    case 'M':
      return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
    case 'ASOF':
      return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(period);
    default:
      return false;
  }
}

function isValidDate(dateString: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(dateString);
}

async function insertUnifiedData(
  supabase: any, 
  rows: ProcessedRow[], 
  templateType: string, 
  companyId: string, 
  userId: string
): Promise<{ success: boolean; inserted_count: number; details: any }> {
  let insertedCount = 0;
  const details: any = {};
  
  try {
    if (templateType === 'financial_series') {
      // Map metric codes using dictionary
      const metricCodes = [...new Set(rows.map(r => r.metric_code).filter(Boolean))];
      const { data: metrics } = await supabase
        .from('metrics_dictionary')
        .select('metric_code')
        .in('metric_code', metricCodes);
      
      const validMetrics = new Set(metrics?.map((m: any) => m.metric_code) || []);
      
      const financialRows = rows
        .filter(row => validMetrics.has(row.metric_code!))
        .map(row => ({
          company_id: companyId,
          external_id: row.external_id,
          metric_code: row.metric_code,
          frequency: row.frequency,
          period: row.period,
          value: Number(row.value),
          currency: row.currency || 'EUR',
          unit: row.unit || 'EUR',
          value_kind: row.value_kind || 'flow',
          source: row.source,
          confidence_score: 1.0,
          notes: row.notes,
          uploaded_by: userId
        }));
      
      if (financialRows.length > 0) {
        const { data, error } = await supabase
          .from('financial_series_unified')
          .upsert(financialRows, { 
            onConflict: 'company_id,metric_code,frequency,period',
            ignoreDuplicates: false 
          });
        
        if (error) throw error;
        insertedCount += financialRows.length;
      }
      
      details.invalid_metrics = metricCodes.filter(code => !validMetrics.has(code));
      
    } else if (templateType === 'company_profile') {
      const profileRows = rows.map(row => ({
        company_id: companyId,
        external_id: row.external_id,
        record_type: row.record_type,
        as_of_date: row.as_of_date,
        field_name: row.field_name,
        field_value: row.field_value,
        source_url: row.source_url,
        confidence: Number(row.confidence || 1.0),
        notes: row.notes,
        uploaded_by: userId
      }));
      
      const { data, error } = await supabase
        .from('company_profile_unified')
        .upsert(profileRows, { 
          onConflict: 'company_id,record_type,field_name,as_of_date',
          ignoreDuplicates: false 
        });
      
      if (error) throw error;
      insertedCount += profileRows.length;
    }
    
    return { success: true, inserted_count: insertedCount, details };
    
  } catch (error) {
    console.error('❌ Insert error:', error);
    return { success: false, inserted_count: insertedCount, details: { error: error.message } };
  }
}