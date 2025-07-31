// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingJob {
  id: string;
  companyId: string;
  userId: string;
  filePath: string;
  period?: string;
  fiscalYear?: number;
}

interface JournalLine {
  entry_no: number;
  tx_date: string;
  memo?: string;
  line_no: number;
  account: string;
  description?: string;
  debit: number;
  credit: number;
  doc_ref?: string;
}

interface ValidationResult {
  validRows: JournalLine[];
  rejectedRows: any[];
  metrics: {
    totalRows: number;
    validRows: number;
    rejectedRows: number;
    totalDebit: number;
    totalCredit: number;
    entriesBalance: boolean;
  };
}

const log = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`, data ? JSON.stringify(data) : '');
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, companyId, userId, period, fiscalYear, jobId } = await req.json();
    
    log('INFO', '🚀 Starting ledger processing job', { 
      jobId, 
      filePath, 
      companyId, 
      userId,
      period,
      fiscalYear
    });

    // Validate required parameters
    if (!filePath || !companyId || !userId || !jobId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Start background processing with EdgeRuntime.waitUntil
    EdgeRuntime.waitUntil(processJobInBackground({
      id: jobId,
      companyId,
      userId,
      filePath,
      period,
      fiscalYear
    }));

    // Return immediate 202 response
    return new Response(
      JSON.stringify({ 
        jobId,
        status: 'accepted',
        message: 'Processing started in background'
      }),
      { status: 202, headers: corsHeaders }
    );

  } catch (error) {
    log('ERROR', 'Request handling failed', { error: error.message });
    return new Response(
      JSON.stringify({ error: 'Invalid request format' }),
      { status: 400, headers: corsHeaders }
    );
  }
});

async function processJobInBackground(job: ProcessingJob) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    log('INFO', 'Starting background processing', { jobId: job.id });

    // Update job status to PARSING
    await updateJobStatus(supabase, job.id, 'PARSING');

    // Check file size first
    const fileSize = await getFileSize(supabase, job.filePath);
    const maxSize = 40 * 1024 * 1024; // 40MB limit
    
    if (fileSize > maxSize) {
      throw new Error(`File too large: ${(fileSize / 1024 / 1024).toFixed(1)}MB. Maximum allowed: 40MB. Please use CSV format for larger files.`);
    }

    // Read Excel file from Storage
    log('INFO', 'Reading Excel file from Storage', { filePath: job.filePath, sizeMB: (fileSize / 1024 / 1024).toFixed(1) });
    const fileBuffer = await readFileFromStorage(supabase, job.filePath);
    
    // Parse Excel with SheetJS
    log('INFO', 'Parsing Excel with SheetJS');
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      throw new Error('No worksheets found in Excel file');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false, 
      defval: null,
      header: 1 // Get as array of arrays first to detect headers
    });

    if (rawRows.length === 0) {
      throw new Error('No data found in Excel worksheet');
    }

    // Convert to objects with proper headers
    const headers = rawRows[0] as string[];
    const dataRows = rawRows.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = (row as any[])[index];
      });
      return obj;
    });

    log('INFO', 'Excel parsed successfully', { 
      totalRows: dataRows.length, 
      headers: headers.slice(0, 10) 
    });

    // Update job status to VALIDATING
    await updateJobStatus(supabase, job.id, 'VALIDATING');

    // Validate and normalize data
    const validationResult = validateAndNormalizeData(dataRows);
    
    log('INFO', 'Validation completed', validationResult.metrics);

    // Save rejected rows if any
    if (validationResult.rejectedRows.length > 0) {
      await saveRejectedRows(supabase, job.id, validationResult.rejectedRows);
    }

    if (validationResult.validRows.length === 0) {
      throw new Error('No valid journal entries found after validation');
    }

    // Update job status to LOADING
    await updateJobStatus(supabase, job.id, 'LOADING', {
      metrics: validationResult.metrics
    });

    // Create dynamic batches based on JSON size (target 2-5MB per batch)
    const batches = createDynamicBatches(validationResult.validRows, 3 * 1024 * 1024); // 3MB target
    
    log('INFO', 'Created batches for processing', { 
      totalBatches: batches.length,
      avgBatchSize: Math.round(validationResult.validRows.length / batches.length)
    });

    let totalInserted = 0;
    let batchErrors = 0;

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        log('INFO', `Processing batch ${i + 1}/${batches.length}`, { batchSize: batch.length });
        
        const result = await supabase.rpc('import_journal_lines', {
          _company: job.companyId,
          _period: job.period ? `[${job.period},${job.period}]` : null,
          _rows: batch
        });

        if (result.error) {
          log('ERROR', `Batch ${i + 1} failed`, { error: result.error });
          batchErrors++;
        } else {
          totalInserted += result.data?.inserted_lines || 0;
          log('INFO', `Batch ${i + 1} completed`, { 
            inserted: result.data?.inserted_lines,
            totalSoFar: totalInserted
          });
        }
      } catch (error) {
        log('ERROR', `Batch ${i + 1} processing failed`, { error: error.message });
        batchErrors++;
      }
    }

    // Update job status to AGGREGATING
    await updateJobStatus(supabase, job.id, 'AGGREGATING', {
      metrics: { ...validationResult.metrics, totalInserted, batchErrors }
    });

    // Refresh materialized views
    log('INFO', 'Refreshing materialized views');
    const refreshResult = await supabase.rpc('refresh_materialized_views', {
      _company: job.companyId
    });

    if (refreshResult.error) {
      log('WARN', 'Failed to refresh materialized views', { error: refreshResult.error });
    }

    // Final status update
    const finalStatus = batchErrors > 0 ? 'PARTIAL_OK' : 'DONE';
    await updateJobStatus(supabase, job.id, finalStatus, {
      metrics: { 
        ...validationResult.metrics, 
        totalInserted, 
        batchErrors,
        completedAt: new Date().toISOString()
      }
    });

    log('INFO', 'Processing completed successfully', { 
      jobId: job.id, 
      status: finalStatus,
      totalInserted,
      batchErrors
    });

  } catch (error) {
    log('ERROR', 'Processing failed', { 
      jobId: job.id, 
      error: error.message, 
      stack: error.stack 
    });

    // Save error details
    await saveErrorLog(supabase, job.id, error);
    
    // Update job status to FAILED
    await updateJobStatus(supabase, job.id, 'FAILED', {
      error_message: error.message,
      failed_at: new Date().toISOString()
    });
  }
}

async function updateJobStatus(supabase: any, jobId: string, status: string, additionalData?: any) {
  const updateData: any = { 
    status, 
    updated_at: new Date().toISOString() 
  };
  
  if (additionalData) {
    updateData.stats_json = additionalData;
  }

  const { error } = await supabase
    .from('processing_jobs')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    log('ERROR', 'Failed to update job status', { jobId, status, error });
  } else {
    log('INFO', 'Job status updated', { jobId, status });
  }
}

async function getFileSize(supabase: any, filePath: string): Promise<number> {
  try {
    // Try to get file info from Storage
    const { data, error } = await supabase.storage
      .from('gl-uploads')
      .list(filePath.substring(0, filePath.lastIndexOf('/')), {
        search: filePath.substring(filePath.lastIndexOf('/') + 1)
      });

    if (error || !data || data.length === 0) {
      throw new Error(`File not found: ${filePath}`);
    }

    return data[0].metadata?.size || 0;
  } catch (error) {
    log('WARN', 'Could not get file size, proceeding with download', { filePath, error: error.message });
    return 0; // Allow processing to continue
  }
}

async function readFileFromStorage(supabase: any, filePath: string): Promise<ArrayBuffer> {
  try {
    // Try reading from mounted filesystem first (if available)
    try {
      const fsPath = `/s3/${filePath}`;
      const fileData = await Deno.readFile(fsPath);
      log('INFO', 'File read from mounted filesystem', { filePath: fsPath });
      return fileData.buffer;
    } catch {
      // Fall back to Storage API download
      log('INFO', 'Mounted filesystem not available, using Storage API');
    }

    // Download from Supabase Storage
    const { data, error } = await supabase.storage
      .from('gl-uploads')
      .download(filePath);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return await data.arrayBuffer();
  } catch (error) {
    throw new Error(`Failed to read file from storage: ${error.message}`);
  }
}

function validateAndNormalizeData(rawRows: any[]): ValidationResult {
  const validRows: JournalLine[] = [];
  const rejectedRows: any[] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  // Group rows by entry_no to validate balance per entry
  const entriesByNo = new Map<number, any[]>();

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowIndex = i + 2; // +2 because Excel is 1-indexed and we skipped header

    try {
      // Extract and validate fields
      const entry_no = parseInt(row['Asiento'] || row['Entry'] || row['entry_no'] || '');
      const account = String(row['Cuenta'] || row['Account'] || row['account'] || '').trim();
      const debitStr = String(row['Debe'] || row['Debit'] || row['debit'] || '0').replace(/[^\d.,\-]/g, '');
      const creditStr = String(row['Haber'] || row['Credit'] || row['credit'] || '0').replace(/[^\d.,\-]/g, '');
      const tx_date = normalizeDate(row['Fecha'] || row['Date'] || row['tx_date']);
      
      // Validate required fields
      if (!entry_no || isNaN(entry_no)) {
        throw new Error('Invalid or missing entry number');
      }

      if (!account || !/^\d{3,9}$/.test(account)) {
        throw new Error('Invalid account code format (must be 3-9 digits)');
      }

      if (!tx_date) {
        throw new Error('Invalid or missing date');
      }

      // Parse amounts
      const debit = parseAmount(debitStr);
      const credit = parseAmount(creditStr);

      // Validate amounts
      if (debit < 0 || credit < 0) {
        throw new Error('Negative amounts not allowed');
      }

      if (debit === 0 && credit === 0) {
        throw new Error('Both debit and credit cannot be zero');
      }

      if (debit > 0 && credit > 0) {
        throw new Error('Both debit and credit cannot be positive');
      }

      // Create normalized journal line
      const journalLine: JournalLine = {
        entry_no,
        tx_date,
        memo: String(row['Concepto'] || row['Memo'] || row['memo'] || '').trim() || undefined,
        line_no: parseInt(row['Linea'] || row['Line'] || row['line_no'] || '1'),
        account,
        description: String(row['Descripcion'] || row['Description'] || row['description'] || '').trim() || undefined,
        debit,
        credit,
        doc_ref: String(row['Documento'] || row['Document'] || row['doc_ref'] || '').trim() || undefined
      };

      // Group by entry for balance validation
      if (!entriesByNo.has(entry_no)) {
        entriesByNo.set(entry_no, []);
      }
      entriesByNo.get(entry_no)!.push({ journalLine, rowIndex });

      totalDebit += debit;
      totalCredit += credit;

    } catch (error) {
      rejectedRows.push({
        row_index: rowIndex,
        original_data: row,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Validate balance per entry
  let entriesBalance = true;
  for (const [entryNo, lines] of entriesByNo.entries()) {
    const entryDebit = lines.reduce((sum, { journalLine }) => sum + journalLine.debit, 0);
    const entryCredit = lines.reduce((sum, { journalLine }) => sum + journalLine.credit, 0);
    
    if (Math.abs(entryDebit - entryCredit) > 0.01) { // Allow for rounding
      entriesBalance = false;
      // Move all lines of this entry to rejected
      lines.forEach(({ journalLine, rowIndex }) => {
        rejectedRows.push({
          row_index: rowIndex,
          original_data: journalLine,
          error: `Entry ${entryNo} does not balance: Debit ${entryDebit}, Credit ${entryCredit}`,
          timestamp: new Date().toISOString()
        });
      });
    } else {
      // Add valid lines
      lines.forEach(({ journalLine }) => validRows.push(journalLine));
    }
  }

  return {
    validRows,
    rejectedRows,
    metrics: {
      totalRows: rawRows.length,
      validRows: validRows.length,
      rejectedRows: rejectedRows.length,
      totalDebit,
      totalCredit,
      entriesBalance
    }
  };
}

function normalizeDate(dateValue: any): string | null {
  if (!dateValue) return null;

  try {
    let date: Date;

    if (typeof dateValue === 'number') {
      // Excel serial date
      date = XLSX.SSF.parse_date_code(dateValue);
    } else if (typeof dateValue === 'string') {
      // String date - try various formats
      const cleaned = dateValue.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        date = new Date(cleaned);
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
        const [day, month, year] = cleaned.split('/');
        date = new Date(`${year}-${month}-${day}`);
      } else {
        date = new Date(cleaned);
      }
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) {
      return null;
    }

    // Format as YYYY-MM-DD
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === '') return 0;
  
  // Remove any non-numeric characters except dots, commas, and minus
  const cleaned = amountStr.replace(/[^\d.,\-]/g, '');
  
  // Handle European format (comma as decimal separator)
  let normalized = cleaned;
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Both comma and dot - assume comma is thousands separator
    normalized = cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Only comma - assume decimal separator
    normalized = cleaned.replace(',', '.');
  }
  
  const amount = parseFloat(normalized);
  return isNaN(amount) ? 0 : Math.abs(amount); // Always positive, sign determined by debit/credit column
}

function createDynamicBatches(rows: JournalLine[], targetSizeBytes: number): JournalLine[][] {
  const batches: JournalLine[][] = [];
  let currentBatch: JournalLine[] = [];
  let currentBatchSize = 0;

  for (const row of rows) {
    const rowSize = JSON.stringify(row).length;
    
    if (currentBatchSize + rowSize > targetSizeBytes && currentBatch.length > 0) {
      // Start new batch
      batches.push(currentBatch);
      currentBatch = [row];
      currentBatchSize = rowSize;
    } else {
      // Add to current batch
      currentBatch.push(row);
      currentBatchSize += rowSize;
    }
  }

  // Add final batch if not empty
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

async function saveRejectedRows(supabase: any, jobId: string, rejectedRows: any[]) {
  try {
    const csv = createCSVFromRejectedRows(rejectedRows);
    const fileName = `jobs/${jobId}/rejected_rows.csv`;
    
    const { error } = await supabase.storage
      .from('gl-artifacts')
      .upload(fileName, new Blob([csv], { type: 'text/csv' }), { upsert: true });

    if (error) {
      log('ERROR', 'Failed to save rejected rows CSV', { jobId, error });
    } else {
      log('INFO', 'Rejected rows saved to CSV', { jobId, fileName, count: rejectedRows.length });
      
      // Update job with error log path
      await supabase
        .from('processing_jobs')
        .update({ error_log_path: fileName })
        .eq('id', jobId);
    }
  } catch (error) {
    log('ERROR', 'Failed to save rejected rows', { jobId, error: error.message });
  }
}

function createCSVFromRejectedRows(rejectedRows: any[]): string {
  if (rejectedRows.length === 0) return '';

  const headers = ['Row Index', 'Error', 'Timestamp', 'Original Data'];
  const csvRows = [headers.join(',')];

  for (const rejected of rejectedRows) {
    const row = [
      rejected.row_index,
      `"${rejected.error.replace(/"/g, '""')}"`,
      rejected.timestamp,
      `"${JSON.stringify(rejected.original_data).replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

async function saveErrorLog(supabase: any, jobId: string, error: Error) {
  try {
    const errorLog = {
      jobId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    const fileName = `jobs/${jobId}/error.log`;
    const logContent = JSON.stringify(errorLog, null, 2);
    
    const { error: uploadError } = await supabase.storage
      .from('gl-artifacts')
      .upload(fileName, new Blob([logContent], { type: 'application/json' }), { upsert: true });

    if (!uploadError) {
      // Update job with error log path
      await supabase
        .from('processing_jobs')
        .update({ error_log_path: fileName })
        .eq('id', jobId);
    }
  } catch (saveError) {
    log('ERROR', 'Failed to save error log', { jobId, saveError: saveError.message });
  }
}