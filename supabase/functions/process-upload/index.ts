import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { parse, CsvParseStream } from "jsr:@std/csv/parse";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Auth client for RLS validation
const createAuthClient = (authToken: string) => 
  createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${authToken}` } }
  });

// Service client for bulk operations
const svcClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

interface JobLogEntry {
  job_id: string;
  phase: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  duration_ms?: number;
  meta?: any;
}

// Utility functions
function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function normalizeDecimal(value: string): string {
  return value?.replace(/\./g, '').replace(',', '.') ?? value;
}

function calculateFileHash(data: Uint8Array): string {
  const crypto = globalThis.crypto;
  const hashBuffer = crypto.subtle.digestSync("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function logJobEntry(entry: JobLogEntry) {
  try {
    await svcClient.from('upload_job_logs').insert(entry);
  } catch (error) {
    console.error('Failed to log entry:', error);
  }
}

async function updateJobStatus(jobId: string, status: string, updates: any = {}) {
  try {
    await svcClient.from('upload_jobs')
      .update({ status, updated_at: new Date().toISOString(), ...updates })
      .eq('id', jobId);
  } catch (error) {
    console.error('Failed to update job status:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return new Response('Authorization required', { status: 401, headers: corsHeaders });
    }

    const { job_id, validate_only = false, error_cap = 5000 } = await req.json();
    if (!job_id) {
      return new Response('job_id required', { status: 400, headers: corsHeaders });
    }

    console.log(`Processing upload job: ${job_id}, validate_only: ${validate_only}`);

    // Create auth client for RLS validation
    const authClient = createAuthClient(authToken);

    // 1. Load and validate job with RLS
    const { data: job, error: jobError } = await authClient
      .from('upload_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found or access denied: ${jobError?.message}`);
    }

    await logJobEntry({
      job_id,
      phase: 'validation',
      level: 'info',
      message: 'Job loaded successfully',
      meta: { file_type: job.file_type, file_path: job.file_path }
    });

    // 2. Download file from storage
    const { data: signedUrlData } = await svcClient.storage
      .from('finance-uploads')
      .createSignedUrl(job.file_path, 3600);

    if (!signedUrlData?.signedUrl) {
      throw new Error('Failed to create signed URL for file download');
    }

    await updateJobStatus(job_id, 'validating');

    const fileResponse = await fetch(signedUrlData.signedUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status} ${fileResponse.statusText}`);
    }

    const fileData = await fileResponse.arrayBuffer();
    const fileBytes = new Uint8Array(fileData);

    // Calculate file hash for deduplication (if not validate_only)
    if (!validate_only) {
      const fileHash = calculateFileHash(fileBytes);
      
      // Check for duplicate file
      const { data: existingJob } = await svcClient
        .from('upload_jobs')
        .select('id, status')
        .eq('company_id', job.company_id)
        .eq('file_sha256', fileHash)
        .neq('id', job_id)
        .maybeSingle();

      if (existingJob) {
        await updateJobStatus(job_id, 'failed', {
          error_message: `Duplicate file detected. Already processed in job: ${existingJob.id}`
        });
        return new Response(JSON.stringify({
          success: false,
          error: 'DUPLICATE_FILE',
          existing_job_id: existingJob.id
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Update job with file hash
      await svcClient.from('upload_jobs')
        .update({ file_sha256: fileHash })
        .eq('id', job_id);
    }

    // Check file size (20MB limit)
    if (fileBytes.length > 20 * 1024 * 1024) {
      throw new Error('File size exceeds 20MB limit');
    }

    // 3. Parse CSV with streaming
    const textDecoder = new TextDecoder();
    const csvText = textDecoder.decode(fileBytes);
    const csvLines = csvText.split('\n').filter(line => line.trim());

    if (csvLines.length > 200000) {
      throw new Error('File exceeds 200k rows limit');
    }

    const [header, ...dataLines] = csvLines;
    const headers = header.split(/[,;]/).map(h => h.trim().replace(/"/g, ''));

    await logJobEntry({
      job_id,
      phase: 'parsing',
      level: 'info',
      message: `Starting to parse ${dataLines.length} rows`,
      meta: { headers, total_rows: dataLines.length }
    });

    const stagingBatch: any[] = [];
    const errorBatch: any[] = [];
    let rowsProcessed = 0;
    let rowsOk = 0;
    let rowsError = 0;

    await updateJobStatus(job_id, 'inserting');

    // Process each data row
    for (const [index, line] of dataLines.entries()) {
      try {
        const values = line.split(/[,;]/).map(v => v.trim().replace(/"/g, ''));
        const record: any = {};
        
        headers.forEach((header, i) => {
          record[header] = values[i] || '';
        });

        rowsProcessed++;

        // Extract and validate required fields
        const concepto = String(record.Concepto || record.concepto || '').trim();
        const seccion = job.file_type === 'balance' 
          ? String(record.Seccion || record.seccion || '').trim() 
          : null;
        const anioStr = String(record.Año || record.Anio || record.anio || '');
        const periodoStr = String(record.Periodo || record.periodo || '');
        const importeStr = String(record.Importe || record.importe || '0');
        const moneda = String(record.Moneda || record.moneda || 'EUR');
        const notas = record.Notas || record.notas || null;

        // Validation
        if (!concepto) {
          throw new Error('Concepto is required');
        }

        const anio = parseInt(anioStr);
        if (!anio || anio < 1900 || anio > 2100) {
          throw new Error('Invalid year');
        }

        const importeNormalized = normalizeDecimal(importeStr);
        const importe = parseFloat(importeNormalized);
        if (isNaN(importe)) {
          throw new Error('Invalid amount');
        }

        // Parse and normalize period to end of month
        let periodo: Date;
        if (periodoStr.includes('-')) {
          // Format: YYYY-MM or YYYY-MM-DD
          const dateParts = periodoStr.split('-');
          const year = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]) || 12;
          periodo = endOfMonth(new Date(year, month - 1, 1));
        } else {
          // Assume month number
          const month = parseInt(periodoStr) || 12;
          periodo = endOfMonth(new Date(anio, month - 1, 1));
        }

        // Normalize balance section if applicable
        let seccionNormalizada = seccion;
        if (job.file_type === 'balance' && seccion) {
          const { data: mapping } = await svcClient
            .from('balance_section_mapping')
            .select('canonical_section')
            .eq('input_variant', seccion.toLowerCase())
            .maybeSingle();
          
          seccionNormalizada = mapping?.canonical_section || seccion;
        }

        // Calculate source hash
        const sourceHashInput = [
          job_id,
          concepto,
          seccionNormalizada || '',
          periodo.toISOString().slice(0, 10),
          anio.toString(),
          importe.toString()
        ].join('|');
        
        const sourceHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sourceHashInput));
        const sourceHash = Array.from(new Uint8Array(sourceHashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Determine data type mapping
        const dataTypeMap = {
          'pyg': 'estado_pyg',
          'balance': 'balance_situacion',
          'cashflow': 'estado_flujos'
        };

        const stagingRow = {
          company_id: job.company_id,
          job_id: job_id,
          user_id: job.user_id,
          data_type: dataTypeMap[job.file_type as keyof typeof dataTypeMap],
          concept_normalized: concepto,
          section: seccionNormalizada,
          period_date: periodo.toISOString().slice(0, 10),
          period_year: anio,
          period_quarter: Math.ceil((periodo.getMonth() + 1) / 3),
          period_month: periodo.getMonth() + 1,
          period_type: 'monthly',
          amount: importe,
          currency_code: moneda,
          source_hash: sourceHash,
          status: 'pending',
          error: {},
          sheet_name: job.file_type,
          file_name: job.file_path.split('/').pop(),
          source: 'upload',
          created_at: new Date().toISOString()
        };

        stagingBatch.push(stagingRow);
        rowsOk++;

        // Insert in batches of 1000
        if (stagingBatch.length >= 1000) {
          if (!validate_only) {
            await svcClient.from('financial_lines_staging').insert(stagingBatch);
          }
          stagingBatch.length = 0;
          
          await updateJobStatus(job_id, 'inserting', {
            rows_total: rowsProcessed,
            rows_ok: rowsOk,
            rows_error: rowsError
          });
        }

      } catch (error) {
        rowsError++;
        const errorEntry = {
          job_id,
          row_number: index + 2, // +2 because index is 0-based and we skip header
          error_code: 'VALIDATION_ERROR',
          error_detail: String(error),
          raw_record: dataLines[index]
        };

        errorBatch.push(errorEntry);

        // Insert errors in batches
        if (errorBatch.length >= 500) {
          await svcClient.from('staging_errors').insert(errorBatch);
          errorBatch.length = 0;
        }

        // Check error cap
        if (rowsError >= error_cap) {
          await updateJobStatus(job_id, 'failed', {
            error_message: `Too many errors (${rowsError}). Stopping processing.`,
            rows_total: rowsProcessed,
            rows_error: rowsError
          });
          
          return new Response(JSON.stringify({
            success: false,
            error: 'TOO_MANY_ERRORS',
            rows_processed: rowsProcessed,
            rows_error: rowsError
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    }

    // Insert remaining batches
    if (stagingBatch.length > 0 && !validate_only) {
      await svcClient.from('financial_lines_staging').insert(stagingBatch);
    }
    if (errorBatch.length > 0) {
      await svcClient.from('staging_errors').insert(errorBatch);
    }

    await logJobEntry({
      job_id,
      phase: 'parsing',
      level: 'info',
      message: 'Parsing completed',
      meta: { rows_total: rowsProcessed, rows_ok: rowsOk, rows_error: rowsError }
    });

    if (validate_only) {
      await updateJobStatus(job_id, 'completed', {
        rows_total: rowsProcessed,
        rows_ok: rowsOk,
        rows_error: rowsError
      });

      return new Response(JSON.stringify({
        success: true,
        validation_only: true,
        rows_total: rowsProcessed,
        rows_ok: rowsOk,
        rows_error: rowsError
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. Transform to final tables
    await updateJobStatus(job_id, 'transforming');

    const { data: transformResult, error: transformError } = await svcClient
      .rpc('process_financial_staging', {
        p_company_id: job.company_id,
        p_job_id: job_id
      });

    if (transformError) {
      throw new Error(`Transformation failed: ${transformError.message}`);
    }

    // 5. Refresh materialized views
    await updateJobStatus(job_id, 'refreshed');
    
    await svcClient.rpc('refresh_financial_materialized_views', {
      p_company_id: job.company_id
    }).catch(() => {
      // Non-critical error, continue
    });

    // 6. Mark as completed
    await updateJobStatus(job_id, 'completed', {
      rows_total: rowsProcessed,
      rows_ok: rowsOk,
      rows_error: rowsError
    });

    await logJobEntry({
      job_id,
      phase: 'completed',
      level: 'info',
      message: 'Upload processing completed successfully',
      meta: {
        rows_total: rowsProcessed,
        rows_ok: rowsOk,
        rows_error: rowsError,
        transform_result: transformResult
      }
    });

    return new Response(JSON.stringify({
      success: true,
      rows_total: rowsProcessed,
      rows_ok: rowsOk,
      rows_error: rowsError,
      transform_result: transformResult
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Upload processing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Try to update job status if we have job_id
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.job_id) {
        await updateJobStatus(body.job_id, 'failed', {
          error_message: errorMessage
        });
        
        await logJobEntry({
          job_id: body.job_id,
          phase: 'error',
          level: 'error',
          message: `Processing failed: ${errorMessage}`,
          meta: { error: errorMessage }
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});