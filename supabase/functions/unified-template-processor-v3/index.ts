import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingRequest {
  file: File;
  company_id?: string;
  template_type?: string;
  dry_run?: boolean;
  session_id?: string;
}

interface ProcessingResult {
  success: boolean;
  session_id: string;
  template_type: string;
  rows_processed: number;
  inserted_count?: number;
  errors: string[];
  warnings: string[];
  details?: any;
  preview?: any[];
  dry_run?: boolean;
  performance_metrics: {
    processing_time_ms: number;
    memory_usage_mb?: number;
    validation_time_ms: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();
  let sessionId = '';
  let supabase: any;

  try {
    console.log('🚀 Starting unified template processor v3...');
    
    // Initialize Supabase client
    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('company_id') as string;
    const templateType = formData.get('template_type') as string;
    const dryRun = formData.get('dry_run') === 'true';
    sessionId = formData.get('session_id') as string || crypto.randomUUID();

    // Validate required parameters
    if (!file) {
      throw new Error('File is required');
    }

    // Log processing start
    await logStep(supabase, sessionId, companyId, 'file_upload', 'started', {
      filename: file.name,
      file_size: file.size,
      template_type: templateType,
      dry_run: dryRun
    });

    console.log(`📋 Processing file: ${file.name} (${file.size} bytes)`);
    console.log(`🏢 Company ID: ${companyId}`);
    console.log(`📄 Template Type: ${templateType}`);
    console.log(`🧪 Dry Run: ${dryRun}`);

    // Read file content
    const validationStartTime = performance.now();
    const fileContent = await file.text();
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('File is empty or invalid');
    }

    // Parse CSV headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    console.log(`📊 Detected headers: ${headers.join(', ')}`);

    // Log file parsing completion
    await logStep(supabase, sessionId, companyId, 'file_parsing', 'completed', {
      headers_count: headers.length,
      data_rows: lines.length - 1
    });

    // Detect template type if not provided
    let detectedTemplateType = templateType;
    if (!detectedTemplateType) {
      detectedTemplateType = detectTemplateType(headers);
      console.log(`🔍 Auto-detected template type: ${detectedTemplateType}`);
    }

    // Validate headers against template schema
    const validationResult = await validateHeaders(supabase, detectedTemplateType, headers, sessionId, companyId);
    
    if (!validationResult.isValid && !dryRun) {
      throw new Error(`Header validation failed: ${validationResult.errors.join(', ')}`);
    }

    const validationEndTime = performance.now();
    const validationTime = validationEndTime - validationStartTime;

    // Process data rows
    const processedData = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let rowIndex = 1;

    for (const line of lines.slice(1)) {
      try {
        if (!line.trim()) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
        const rowData: any = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        // Validate row data
        const rowValidation = await validateRowData(supabase, detectedTemplateType, rowData, rowIndex);
        
        if (rowValidation.errors.length > 0) {
          errors.push(...rowValidation.errors.map(e => `Row ${rowIndex}: ${e}`));
        }
        
        if (rowValidation.warnings.length > 0) {
          warnings.push(...rowValidation.warnings.map(w => `Row ${rowIndex}: ${w}`));
        }

        // Add metadata
        rowData._row_index = rowIndex;
        rowData._template_type = detectedTemplateType;
        rowData._session_id = sessionId;
        rowData._company_id = companyId;
        
        processedData.push(rowData);
        rowIndex++;
      } catch (error) {
        errors.push(`Row ${rowIndex}: ${error.message}`);
        rowIndex++;
      }
    }

    console.log(`✅ Processed ${processedData.length} rows with ${errors.length} errors and ${warnings.length} warnings`);

    // Log validation completion
    await logStep(supabase, sessionId, companyId, 'data_validation', 'completed', {
      rows_processed: processedData.length,
      errors_count: errors.length,
      warnings_count: warnings.length
    });

    let insertedCount = 0;

    // Insert data if not dry run and no critical errors
    if (!dryRun && errors.length === 0) {
      try {
        insertedCount = await insertProcessedData(supabase, detectedTemplateType, processedData, companyId, sessionId);
        
        await logStep(supabase, sessionId, companyId, 'data_insertion', 'completed', {
          inserted_count: insertedCount
        });
      } catch (error) {
        await logStep(supabase, sessionId, companyId, 'data_insertion', 'failed', {}, {
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    }

    const endTime = performance.now();
    const totalProcessingTime = endTime - startTime;

    const result: ProcessingResult = {
      success: true,
      session_id: sessionId,
      template_type: detectedTemplateType,
      rows_processed: processedData.length,
      inserted_count: insertedCount,
      errors,
      warnings,
      preview: dryRun ? processedData.slice(0, 10) : undefined,
      dry_run: dryRun,
      performance_metrics: {
        processing_time_ms: totalProcessingTime,
        validation_time_ms: validationTime
      }
    };

    // Log final completion
    await logStep(supabase, sessionId, companyId, 'processing_complete', 'completed', result.performance_metrics);

    console.log(`🎉 Processing completed successfully in ${totalProcessingTime.toFixed(2)}ms`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error processing template:', error);
    
    // Log error if we have supabase client
    if (supabase && sessionId) {
      await logStep(supabase, sessionId, '', 'processing_error', 'failed', {}, {
        error: error.message,
        stack: error.stack
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        session_id: sessionId,
        errors: [error.message],
        warnings: [],
        performance_metrics: {
          processing_time_ms: performance.now() - startTime,
          validation_time_ms: 0
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function logStep(
  supabase: any,
  sessionId: string,
  companyId: string,
  stepName: string,
  stepStatus: string,
  stepData: any = {},
  errorDetails: any = {},
  performanceMetrics: any = {}
) {
  try {
    await supabase.rpc('log_processing_step', {
      _session_id: sessionId,
      _company_id: companyId || null,
      _user_id: 'system', // Will be replaced with actual user in production
      _step_name: stepName,
      _step_status: stepStatus,
      _step_data: stepData,
      _error_details: errorDetails,
      _performance_metrics: performanceMetrics
    });
  } catch (error) {
    console.error('Failed to log step:', error);
  }
}

function detectTemplateType(headers: string[]): string {
  const headerStr = headers.join(' ').toLowerCase();
  
  if (headerStr.includes('metric_code') && headerStr.includes('value')) {
    return 'financial_series';
  }
  
  if (headerStr.includes('field_name') && headerStr.includes('field_value')) {
    return 'company_profile';
  }
  
  if (headerStr.includes('loan') || headerStr.includes('debt')) {
    return 'debt_data';
  }
  
  return 'unknown';
}

async function validateHeaders(
  supabase: any,
  templateType: string,
  headers: string[],
  sessionId: string,
  companyId: string
): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Get validation rules for this template type
    const { data: validationRules } = await supabase
      .from('template_validation_rules')
      .select('*')
      .eq('record_type', templateType)
      .eq('rule_type', 'required')
      .eq('is_active', true);

    // Check required headers
    const requiredHeaders = validationRules?.map(rule => rule.validation_config?.field_name).filter(Boolean) || [];
    
    for (const requiredHeader of requiredHeaders) {
      if (!headers.includes(requiredHeader)) {
        errors.push(`Missing required header: ${requiredHeader}`);
      }
    }

    // Check for unknown headers
    const knownHeaders = await getKnownHeaders(supabase, templateType);
    for (const header of headers) {
      if (!knownHeaders.includes(header)) {
        warnings.push(`Unknown header: ${header}`);
      }
    }

  } catch (error) {
    console.error('Header validation error:', error);
    warnings.push('Header validation could not be completed');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

async function getKnownHeaders(supabase: any, templateType: string): Promise<string[]> {
  try {
    if (templateType === 'financial_series') {
      return ['metric_code', 'frequency', 'period', 'value', 'currency', 'scenario', 'unit'];
    }
    
    if (templateType === 'company_profile') {
      return ['record_type', 'field_name', 'field_value', 'data_type'];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting known headers:', error);
    return [];
  }
}

async function validateRowData(
  supabase: any,
  templateType: string,
  rowData: any,
  rowIndex: number
): Promise<{ errors: string[]; warnings: string[] }> {
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Get validation rules for this template type
    const { data: validationRules } = await supabase
      .from('template_validation_rules')
      .select('*')
      .eq('record_type', templateType)
      .eq('is_active', true);

    for (const rule of validationRules || []) {
      const fieldValue = rowData[rule.metric_code];
      const config = rule.validation_config;
      
      switch (rule.rule_type) {
        case 'required':
          if (!fieldValue || fieldValue.toString().trim() === '') {
            if (rule.severity === 'error') {
              errors.push(`${rule.error_message}: ${rule.metric_code}`);
            } else {
              warnings.push(`${rule.error_message}: ${rule.metric_code}`);
            }
          }
          break;
          
        case 'range':
          const numValue = parseFloat(fieldValue);
          if (!isNaN(numValue)) {
            if (config.min !== undefined && numValue < config.min) {
              errors.push(`${rule.metric_code} value ${numValue} is below minimum ${config.min}`);
            }
            if (config.max !== undefined && numValue > config.max) {
              errors.push(`${rule.metric_code} value ${numValue} is above maximum ${config.max}`);
            }
          }
          break;
          
        case 'pattern':
          if (fieldValue && config.regex) {
            const regex = new RegExp(config.regex);
            if (!regex.test(fieldValue)) {
              errors.push(`${rule.error_message}: ${fieldValue}`);
            }
          }
          break;
      }
    }
    
  } catch (error) {
    console.error('Row validation error:', error);
    warnings.push('Row validation could not be completed');
  }
  
  return { errors, warnings };
}

async function insertProcessedData(
  supabase: any,
  templateType: string,
  processedData: any[],
  companyId: string,
  sessionId: string
): Promise<number> {
  
  let insertedCount = 0;
  
  try {
    if (templateType === 'financial_series') {
      // Transform data for financial_series_unified table
      const financialData = processedData.map(row => ({
        company_id: companyId,
        metric_code: row.metric_code,
        frequency: row.frequency,
        period: row.period,
        value: parseFloat(row.value) || 0,
        currency: row.currency || 'EUR',
        scenario: row.scenario || 'actual',
        unit: row.unit || 'units',
        source: 'template_upload',
        external_id: sessionId
      }));
      
      const { data, error } = await supabase
        .from('financial_series_unified')
        .insert(financialData)
        .select();
        
      if (error) throw error;
      insertedCount = data?.length || 0;
      
    } else if (templateType === 'company_profile') {
      // Transform data for company_profile_unified table
      const profileData = processedData.map(row => ({
        company_id: companyId,
        record_type: row.record_type,
        field_name: row.field_name,
        field_value: row.field_value,
        data_type: row.data_type || 'text',
        external_id: sessionId
      }));
      
      const { data, error } = await supabase
        .from('company_profile_unified')
        .insert(profileData)
        .select();
        
      if (error) throw error;
      insertedCount = data?.length || 0;
    }
    
    console.log(`💾 Inserted ${insertedCount} records into ${templateType} table`);
    
  } catch (error) {
    console.error('Data insertion error:', error);
    throw new Error(`Failed to insert data: ${error.message}`);
  }
  
  return insertedCount;
}