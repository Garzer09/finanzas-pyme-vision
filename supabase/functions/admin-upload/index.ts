// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin user
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { 
          headers: { 
            Authorization: req.headers.get("Authorization") ?? "" 
          } 
        }
      }
    );

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    // Check if user is admin using service role
    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: admin, error: adminError } = await svc
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (adminError || !admin) {
      console.error("Admin check failed:", adminError);
      return new Response("Forbidden - Admin access required", { status: 403, headers: corsHeaders });
    }

    // Parse form data
    const form = await req.formData();
    const companyId = String(form.get("companyId") || "");
    const period = String(form.get("period") || "");
    const file = form.get("file") as File;

    if (!file || !companyId) {
      return new Response("Bad Request - Missing file or companyId", { status: 400, headers: corsHeaders });
    }

    console.log(`Admin upload started by ${user.id} for company ${companyId}`);

    // Generate file path
    const yyyyMM = new Date().toISOString().slice(0, 7).replace("-", "");
    const path = `company/${companyId}/${yyyyMM}/${crypto.randomUUID()}_${file.name}`;

    // Upload file to storage with service role
    const fileBuffer = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await svc.storage
      .from("gl-uploads")
      .upload(path, fileBuffer, { 
        contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: false 
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(uploadError.message, { status: 400, headers: corsHeaders });
    }

    // Create processing job
    const { data: job, error: jobError } = await svc
      .from("processing_jobs")
      .insert({
        company_id: companyId,
        user_id: user.id,
        file_path: path,
        status: "PENDING",
        period: period ? `[${period},${period}]` : null,
        stats_json: {}
      })
      .select()
      .single();

    if (jobError) {
      console.error("Job creation error:", jobError);
      return new Response(jobError.message, { status: 400, headers: corsHeaders });
    }

    console.log(`Job ${job.id} created, starting background processing`);

    // Start background processing
    EdgeRuntime.waitUntil(processJob({ 
      svc, 
      jobId: job.id, 
      companyId, 
      period, 
      filePath: path 
    }));

    return new Response(
      JSON.stringify({ jobId: job.id }), 
      { 
        status: 202, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error("Admin upload error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }), 
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

async function processJob({ svc, jobId, companyId, period, filePath }: {
  svc: any;
  jobId: string;
  companyId: string;
  period: string;
  filePath: string;
}) {
  const updateJobStatus = async (status: string, extraStats: any = {}) => {
    const { error } = await svc
      .from("processing_jobs")
      .update({ 
        status, 
        stats_json: extraStats,
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId);
    
    if (error) {
      console.error(`Failed to update job ${jobId} to ${status}:`, error);
    }
  };

  try {
    console.log(`Processing job ${jobId} - PARSING`);
    await updateJobStatus("PARSING");

    // Download file from storage
    const { data: fileData, error: downloadError } = await svc.storage
      .from("gl-uploads")
      .download(filePath);

    if (downloadError) {
      throw new Error(`Download failed: ${downloadError.message}`);
    }

    // Parse Excel with SheetJS
    const buffer = await fileData.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null });

    console.log(`Processing job ${jobId} - VALIDATING (${rawRows.length} rows)`);
    await updateJobStatus("VALIDATING", { totalRows: rawRows.length });

    // Normalize and validate data
    const normalized = normalizeRows(rawRows);
    const { validRows, rejectedRows, errors } = validateByEntry(normalized);

    // Save rejected rows if any
    if (rejectedRows.length > 0) {
      const csv = createCSVFromRejectedRows(rejectedRows);
      await svc.storage
        .from("gl-artifacts")
        .upload(`jobs/${jobId}/rejects.csv`, new Blob([csv]), { upsert: true });
    }

    // Save error log if any
    if (errors.length > 0) {
      const errorLog = JSON.stringify({ errors, timestamp: new Date().toISOString() }, null, 2);
      await svc.storage
        .from("gl-artifacts")
        .upload(`jobs/${jobId}/errors.json`, new Blob([errorLog]), { upsert: true });
    }

    console.log(`Processing job ${jobId} - LOADING (${validRows.length} valid, ${rejectedRows.length} rejected)`);
    await updateJobStatus("LOADING", { 
      totalRows: rawRows.length,
      validRows: validRows.length,
      rejectedRows: rejectedRows.length,
      errors: errors.length
    });

    // Insert data in batches
    let totalInserted = 0;
    const batches = createDynamicBatches(validRows, 3 * 1024 * 1024); // 3MB batches
    
    for (const batch of batches) {
      const { data: result, error: rpcError } = await svc.rpc("import_journal_lines", {
        _company: companyId,
        _period: period ? `[${period},${period}]` : null,
        _rows: batch
      });

      if (rpcError) {
        throw new Error(`Batch insert failed: ${rpcError.message}`);
      }

      if (result && result.inserted_lines) {
        totalInserted += result.inserted_lines;
      }
    }

    console.log(`Processing job ${jobId} - AGGREGATING`);
    await updateJobStatus("AGGREGATING", { 
      totalRows: rawRows.length,
      validRows: validRows.length,
      rejectedRows: rejectedRows.length,
      totalInserted,
      errors: errors.length
    });

    // Refresh materialized views
    const { error: refreshError } = await svc.rpc("refresh_materialized_views", {
      _company: companyId
    });

    if (refreshError) {
      console.warn(`MV refresh warning for job ${jobId}:`, refreshError);
    }

    console.log(`Processing job ${jobId} - DONE`);
    await updateJobStatus("DONE", { 
      totalRows: rawRows.length,
      validRows: validRows.length,
      rejectedRows: rejectedRows.length,
      totalInserted,
      errors: errors.length,
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Processing job ${jobId} failed:`, error);
    await updateJobStatus("FAILED", { 
      error: String(error),
      failedAt: new Date().toISOString()
    });

    // Save detailed error log
    const errorLog = JSON.stringify({ 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, null, 2);
    
    await svc.storage
      .from("gl-artifacts")
      .upload(`jobs/${jobId}/failure.json`, new Blob([errorLog]), { upsert: true });
  }
}

// Helper functions
function normalizeRows(rawRows: any[]): any[] {
  return rawRows.map((row, index) => {
    try {
      return {
        entry_no: parseInt(String(row.entry_no || row.EntryNo || row.asiento || row.Asiento || '').replace(/[^\d]/g, '')) || null,
        tx_date: normalizeDate(row.tx_date || row.TxDate || row.fecha || row.Fecha),
        memo: String(row.memo || row.Memo || row.concepto || row.Concepto || '').trim(),
        line_no: parseInt(String(row.line_no || row.LineNo || row.linea || row.Linea || '').replace(/[^\d]/g, '')) || (index + 1),
        account: String(row.account || row.Account || row.cuenta || row.Cuenta || '').trim(),
        description: String(row.description || row.Description || row.descripcion || row.Descripcion || '').trim(),
        debit: parseAmount(row.debit || row.Debit || row.debe || row.Debe || '0'),
        credit: parseAmount(row.credit || row.Credit || row.haber || row.Haber || '0'),
        doc_ref: String(row.doc_ref || row.DocRef || row.referencia || row.Referencia || '').trim()
      };
    } catch (e) {
      console.warn(`Error normalizing row ${index}:`, e);
      return null;
    }
  }).filter(row => row !== null);
}

function normalizeDate(dateValue: any): string | null {
  if (!dateValue) return null;
  
  try {
    // Handle Excel serial numbers
    if (typeof dateValue === 'number') {
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // Handle string dates
    const dateStr = String(dateValue);
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

function parseAmount(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const cleanStr = String(value)
    .replace(/[€$£¥₹]/g, '')
    .replace(/\s/g, '')
    .replace(/,(\d{3})/g, '$1')
    .replace(/,(\d{1,2})$/, '.$1');
  
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}

function validateByEntry(rows: any[]): { validRows: any[], rejectedRows: any[], errors: string[] } {
  const validRows: any[] = [];
  const rejectedRows: any[] = [];
  const errors: string[] = [];
  
  // Group by entry_no and tx_date
  const entriesMap = new Map<string, any[]>();
  
  for (const row of rows) {
    if (!row.entry_no || !row.tx_date || !row.account) {
      rejectedRows.push({ ...row, rejectReason: 'Missing required fields' });
      continue;
    }
    
    const entryKey = `${row.entry_no}_${row.tx_date}`;
    if (!entriesMap.has(entryKey)) {
      entriesMap.set(entryKey, []);
    }
    entriesMap.get(entryKey)!.push(row);
  }
  
  // Validate each entry balances
  for (const [entryKey, entryRows] of entriesMap) {
    const totalDebit = entryRows.reduce((sum, row) => sum + (row.debit || 0), 0);
    const totalCredit = entryRows.reduce((sum, row) => sum + (row.credit || 0), 0);
    const diff = Math.abs(totalDebit - totalCredit);
    
    if (diff > 0.01) { // Allow for small rounding differences
      const rejectReason = `Entry doesn't balance: Debit=${totalDebit}, Credit=${totalCredit}`;
      entryRows.forEach(row => rejectedRows.push({ ...row, rejectReason }));
      errors.push(`Entry ${entryKey}: ${rejectReason}`);
    } else {
      entryRows.forEach(row => validRows.push(row));
    }
  }
  
  return { validRows, rejectedRows, errors };
}

function createDynamicBatches(rows: any[], targetSizeBytes: number): any[][] {
  const batches: any[][] = [];
  let currentBatch: any[] = [];
  let currentSize = 0;
  
  for (const row of rows) {
    const rowSize = JSON.stringify(row).length * 2; // Rough UTF-16 size
    
    if (currentSize + rowSize > targetSizeBytes && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentSize = 0;
    }
    
    currentBatch.push(row);
    currentSize += rowSize;
  }
  
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  
  return batches;
}

function createCSVFromRejectedRows(rejectedRows: any[]): string {
  if (rejectedRows.length === 0) return '';
  
  const headers = Object.keys(rejectedRows[0]);
  const csvContent = [
    headers.join(','),
    ...rejectedRows.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : String(value || '');
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}