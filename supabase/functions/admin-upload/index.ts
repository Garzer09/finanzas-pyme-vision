import { parse as parseCSV } from "https://deno.land/std@0.224.0/csv/mod.ts";
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

    // Only accept CSV files - Excel conversion happens on client
    if (!file.type.includes("csv") && !file.name.endsWith('.csv')) {
      return new Response("Por favor, sube un CSV. Los archivos Excel se convierten automáticamente en el cliente.", { status: 400, headers: corsHeaders });
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
        status: "UPLOADING",
        period: period ? `[${period},${period}]` : null,
        stats_json: {
          stage: "UPLOADING",
          progress_pct: 15,
          eta_seconds: 0,
          message: "Archivo subido, iniciando procesamiento..."
        }
      })
      .select()
      .single();

    if (jobError) {
      console.error("Job creation error:", jobError);
      return new Response(jobError.message, { status: 400, headers: corsHeaders });
    }

    console.log(`Job ${job.id} created, starting background processing`);

    // Start background processing
    processJob({ 
      svc, 
      jobId: job.id, 
      companyId, 
      period, 
      filePath: path 
    }).catch(error => {
      console.error(`Background processing failed for job ${job.id}:`, error);
    });

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

async function processJob({ svc, jobId, companyId, period, filePath, headerMapOverride }: {
  svc: any;
  jobId: string;
  companyId: string;
  period: string;
  filePath: string;
  headerMapOverride?: Record<string, string>;
}) {
  const setStatus = async (stage: string, extraStats: any = {}) => {
    // Get current stats
    const { data: currentJob } = await svc
      .from("processing_jobs")
      .select("stats_json")
      .eq("id", jobId)
      .single();
    
    const currentStats = currentJob?.stats_json || {};
    const stats = { ...currentStats, stage, ...extraStats };
    
    // Calculate progress percentage
    const progress_pct = typeof stats.progress_pct === "number" ? 
      stats.progress_pct : 
      stageToPct(stage, stats);
    
    // Calculate ETA
    const eta_seconds = calcETA(stats);
    
    const finalStats = { ...stats, progress_pct, eta_seconds };
    
    const { error } = await svc
      .from("processing_jobs")
      .update({ 
        status: stage, 
        stats_json: finalStats,
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId);
    
    if (error) {
      console.error(`Failed to update job ${jobId} to ${stage}:`, error);
    }
  };

  const stageToPct = (stage: string, stats: any): number => {
    switch (stage) {
      case "PARSING": return 20;
      case "VALIDATING": return 35;
      case "LOADING":
        if (stats.batches_total > 0 && stats.batches_done !== undefined) {
          return 35 + Math.floor(55 * (stats.batches_done / stats.batches_total));
        }
        return 35;
      case "AGGREGATING": return 95;
      case "DONE": return 100;
      case "FAILED": return 0;
      default: return 15; // UPLOADING
    }
  };

  const calcETA = (stats: any): number => {
    if (stats.stage !== "LOADING" || !stats.avg_batch_ms || !stats.batches_total) {
      return 0;
    }
    const remaining = Math.max(0, (stats.batches_total - (stats.batches_done || 0)));
    return Math.round((stats.avg_batch_ms || 0) * remaining / 1000);
  };

  try {
    console.log(`Processing job ${jobId} - PARSING`);
    await setStatus("PARSING", { message: "Leyendo archivo CSV..." });

    // Download file from storage
    const { data: fileData, error: downloadError } = await svc.storage
      .from("gl-uploads")
      .download(filePath);

    if (downloadError) {
      throw new Error(`Download failed: ${downloadError.message}`);
    }

    // Robust CSV parsing with auto-detection
    const csvText = await fileData.text();
    const { headers, rows: parsedRows, sep } = await parseCsvText(csvText);
    
    // Normalize headers for better matching
    const headersRaw = [...headers];
    const headersNorm = headers.map(h => normalizeHeader(h));
    
    console.log(`Processing job ${jobId} - VALIDATING (${parsedRows.length} rows)`);
    await setStatus("VALIDATING", { 
      total_rows: parsedRows.length,
      headers_raw: headersRaw,
      headers_norm: headersNorm,
      csv_sep: sep,
      progress_pct: 40,
      message: `Validando ${parsedRows.length} filas con separador '${sep}'...`
    });

    // Build header mapping (use override if provided)
    let headerMap = headerMapOverride || buildHeaderMap(headers);
    
    console.log('=== HEADER MAPPING DEBUG ===');
    console.log('Raw headers:', headersRaw);
    console.log('Normalized headers:', headersNorm);
    console.log('Header mapping result:', headerMap);
    console.log('Required fields:', ['entry_no', 'tx_date', 'account', 'debit', 'credit']);
    
    const requiredFields = ['entry_no', 'tx_date', 'account', 'debit', 'credit'];
    const mappedFields = Object.keys(headerMap);
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
    
    console.log('Mapped fields:', mappedFields);
    console.log('Missing required fields:', missingFields);

    // Check mapping quality - if too many required fields missing, mark as needs mapping
    if (Object.keys(headerMap).length === 0 || missingFields.length > 2) {
      await setStatus("NEEDS_MAPPING", { 
        total_rows: parsedRows.length,
        headers_raw: headersRaw,
        headers_norm: headersNorm,
        headers_map: headerMap,
        missing_fields: missingFields,
        reason: 'poor_mapping',
        progress_pct: 40,
        message: 'Mapeo automático falló. Se requiere mapeo manual o normalización GPT.'
      });
      return;
    }

    // Transform and validate data with intelligent mapping
    const { ok: mappedRows, bad: mappingErrors, headers_map } = mapRows(parsedRows, headerMap);
    const { ok: validRows, rej: rejectedRows } = validateByEntry(mappedRows);
    
    console.log(`Validation results: ${validRows.length} valid, ${rejectedRows.length} rejected`);
    
    // Quality threshold check
    const validRatio = validRows.length / parsedRows.length;
    console.log(`Quality ratio: ${validRatio} (${validRows.length}/${parsedRows.length})`);
    
    // If quality is low and no override provided, suggest manual mapping or GPT
    if (validRatio < 0.8 && !headerMapOverride) {
      // Save reject sample for manual review
      const rejectSample = rejectedRows.slice(0, 50);
      const rejectCsv = createCSVFromRejectedRows(rejectSample);
      const rejectPath = `jobs/${jobId}/rejects_sample.csv`;
      
      await svc.storage.from('gl-artifacts').upload(rejectPath, rejectCsv, {
        contentType: 'text/csv',
        upsert: true
      });
      
      await setStatus('NEEDS_MAPPING', {
        total_rows: parsedRows.length,
        valid_rows: validRows.length,
        rejected_rows: rejectedRows.length,
        valid_ratio: validRatio,
        headers_raw: headersRaw,
        headers_norm: headersNorm,
        headers_map: headerMap,
        reason: 'low_confidence',
        artifacts: { rejects_sample: rejectPath },
        progress_pct: 40,
        message: `Solo ${Math.round(validRatio * 100)}% de filas válidas. Requiere mapeo manual o normalización GPT.`
      });
      return;
    }
    
    // Combine mapping and validation errors
    const errors = mappingErrors.map(e => `Row ${e.i}: ${e.reason}`);
    const allRejected = [...mappingErrors, ...rejectedRows];

    // Save artifacts
    let rejects_csv_path = null;
    let error_log_path = null;

    // Save sample of rejected rows for debugging
    if (allRejected.length > 0) {
      const sample = allRejected.slice(0, 50);
      const csv = toCSV(sample);
      const rejectsPath = `jobs/${jobId}/rejects_sample.csv`;
      await svc.storage
        .from("gl-artifacts")
        .upload(rejectsPath, new Blob([csv]), { upsert: true });
      rejects_csv_path = rejectsPath;
    }

    if (errors.length > 0) {
      const errorLog = JSON.stringify({ errors, headers_map, timestamp: new Date().toISOString() }, null, 2);
      const errorsPath = `jobs/${jobId}/errors.json`;
      await svc.storage
        .from("gl-artifacts")
        .upload(errorsPath, new Blob([errorLog]), { upsert: true });
      error_log_path = errorsPath;
    }

    console.log(`Processing job ${jobId} - LOADING (${validRows.length} valid, ${allRejected.length} rejected)`);
    await setStatus("LOADING", { 
      total_rows: parsedRows.length,
      rows_valid: validRows.length,
      rows_reject: allRejected.length,
      rows_loaded: 0,
      headers_map,
      rejects_csv_path,
      error_log_path,
      message: `Preparando ${validRows.length} filas para inserción...`
    });

    // Insert data in batches with progress tracking
    let totalInserted = 0;
    const batches = createDynamicBatches(validRows, 3 * 1024 * 1024); // 3MB batches
    let totalMs = 0;
    
    await setStatus("LOADING", { 
      batches_total: batches.length,
      batches_done: 0,
      avg_batch_ms: 0,
      message: `Insertando lote 1/${batches.length}...`
    });
    
    for (const [index, batch] of batches.entries()) {
      const startTime = performance.now();
      
      const { data: result, error: rpcError } = await svc.rpc("import_journal_lines", {
        _company: companyId,
        _period: period ? `[${period},${period}]` : null,
        _rows: batch
      });

      const batchMs = performance.now() - startTime;
      totalMs += batchMs;

      if (rpcError) {
        throw new Error(`Batch insert failed: ${rpcError.message}`);
      }

      if (result && result.inserted_lines) {
        totalInserted += result.inserted_lines;
      }

      // Update progress after each batch
      const avg_batch_ms = Math.round(totalMs / (index + 1));
      await setStatus("LOADING", {
        batches_done: index + 1,
        rows_loaded: totalInserted,
        avg_batch_ms,
        message: `Insertando lote ${index + 2}/${batches.length}...`
      });
    }

    console.log(`Processing job ${jobId} - AGGREGATING`);
    await setStatus("AGGREGATING", { 
      rows_loaded: totalInserted,
      message: "Generando estados financieros..."
    });

    // Refresh materialized views
    const { error: refreshError } = await svc.rpc("refresh_materialized_views", {
      _company: companyId
    });

    if (refreshError) {
      console.warn(`MV refresh warning for job ${jobId}:`, refreshError);
    }

    console.log(`Processing job ${jobId} - DONE`);
    await setStatus("DONE", { 
      rows_loaded: totalInserted,
      message: `Procesamiento completado. ${totalInserted} asientos insertados.`,
      completed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Processing job ${jobId} failed:`, error);
    
    const errorPath = `jobs/${jobId}/failure.json`;
    const errorLog = JSON.stringify({ 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, null, 2);
    
    await svc.storage
      .from("gl-artifacts")
      .upload(errorPath, new Blob([errorLog]), { upsert: true });

    await setStatus("FAILED", { 
      message: `Error: ${String(error)}`,
      error_log_path: errorPath,
      failed_at: new Date().toISOString()
    });
  }
}

// Helper functions

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

// ===== ROBUST CSV PARSER AND INTELLIGENT MAPPING =====

async function parseCsvText(text: string): Promise<{ headers: string[]; rows: Record<string, string>[]; sep: string }> {
  const firstLine = text.split(/\r?\n/).find(l => l.trim().length > 0) ?? "";
  const candidates = [",", ";", "\t"];
  const counts = candidates.map(c => (firstLine.match(new RegExp(`\\${c}`, "g")) || []).length);
  const sep = candidates[counts.indexOf(Math.max(...counts))] || ",";

  const parsed = parseCSV(text, { skipFirstRow: false, separator: sep, strip: true });
  const [rawHeaders, ...rawRows] = parsed as string[][];
  const headers = rawHeaders.map(h => h ?? "");
  const rows = rawRows
    .filter(r => r.some(cell => (cell ?? "").toString().trim() !== ""))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
  return { headers, rows, sep };
}

const SYN = {
  entry_no: ["entry_no","asiento","num_asiento","n_asiento","nº asiento","numero asiento","nº","numasiento"],
  tx_date:  ["tx_date","fecha","f contable","fecha asiento","date"],
  account:  ["account","cuenta","codigo cuenta","cod cuenta","cta","cta contable"],
  description:["description","descripcion","concepto","glosa","detalle"],
  debit:    ["debit","debe","cargo","importe debe"],
  credit:   ["credit","haber","abono","importe haber"],
  amount:   ["importe","amount","monto","importe neto"],
  side:     ["dh","debe_haber","tipo","signo"],
  doc_ref:  ["doc_ref","documento","doc","ref","referencia","nº doc","num doc"],
  line_no:  ["line_no","apunte","num_apunte","nº apunte","linea","line"]
};

function normalizeHeader(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // Remove accents
    .replace(/[\u00A0\u2000-\u200B\u2028\u2029\uFEFF]/g, " ")  // Remove NBSP and other whitespace
    .replace(/\s+/g, " ")  // Normalize spaces
    .trim()
    .replace(/^[\uFEFF\uBBBF]/, "");  // Remove BOM
}

function slugify(s: string) {
  return normalizeHeader(s);
}

function buildHeaderMap(headers: string[]) {
  const norm = headers.map(h => slugify(h));
  const map: Record<string,string> = {};
  const bind = (target: keyof typeof SYN) => {
    for (const h of norm) {
      if (SYN[target].some(alias => h === slugify(alias))) { 
        map[target] = headers[norm.indexOf(h)]; 
        return; 
      }
    }
  };
  bind("entry_no"); bind("tx_date"); bind("account"); bind("description");
  bind("debit"); bind("credit"); bind("amount"); bind("side");
  bind("doc_ref"); bind("line_no");
  return map;
}

function normNumber(v: any): number {
  if (v == null) return 0;
  const s = String(v).trim();
  if (s === "") return 0;
  const t = s.replace(/\s/g,"").replace(/\./g,"").replace(/,/g,".");
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

function normDate(v: any): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [_, d, M, y] = m; 
    if (y.length === 2) y = (Number(y) > 50 ? "19"+y : "20"+y);
    return `${y.padStart(4,"0")}-${M.padStart(2,"0")}-${d.padStart(2,"0")}`;
  }
  return null;
}

type RowOut = { 
  entry_no: string; tx_date: string; account: string; description?: string|null;
  debit: string; credit: string; doc_ref?: string|null; line_no: number 
};

function mapRows(rows: Record<string,string>[], H: Record<string,string>): { ok: RowOut[], bad: any[], headers_map: any } {
  const ok: RowOut[] = []; 
  const bad: any[] = [];
  const counter: Record<string, number> = {};
  let autoEntry = 0;

  for (const [i, r] of rows.entries()) {
    const date = normDate(r[H.tx_date!] ?? r["Fecha"]);
    const account = (r[H.account!] ?? "").toString().trim();
    const desc = (r[H.description!] ?? null) as any;
    const doc = (r[H.doc_ref!] ?? null) as any;

    let debit = 0, credit = 0;

    if (H.debit && H.credit) {
      debit = normNumber(r[H.debit]); 
      credit = normNumber(r[H.credit]);
    } else if (H.amount) {
      const amt = normNumber(r[H.amount]);
      const side = (r[H.side!] ?? "").toString().trim().toUpperCase();
      if (side === "D" || side === "DEBE" || amt < 0) debit = Math.abs(amt);
      else credit = Math.abs(amt);
    }

    let entry = (r[H.entry_no!] ?? "").toString().trim();
    if (!entry) {
      const ln = Number(r[H.line_no!]) || (i+1);
      entry = `${normDate(r[H.tx_date!] ?? "") || "0000-00-00"}#${Math.ceil(ln/2)}`;
    }

    if (!date || !/^\d{3,9}$/.test(account) || (debit===0 && credit===0)) {
      bad.push({ i, reason:"invalid_fields", entry, date, account, debit, credit });
      continue;
    }

    counter[entry] = (counter[entry] ?? 0) + 1;
    const line_no = counter[entry];

    ok.push({
      entry_no: entry,
      tx_date: date,
      account,
      description: desc,
      debit: debit.toFixed(2),
      credit: credit.toFixed(2),
      doc_ref: doc,
      line_no
    });
  }
  return { ok, bad, headers_map: H };
}

function validateByEntry(rows: RowOut[]): { ok: RowOut[], rej: any[] } {
  const by: Record<string, { d:number; c:number }> = {};
  for (const r of rows) {
    const k = r.entry_no;
    by[k] = by[k] ?? { d:0, c:0 };
    by[k].d += Number(r.debit);
    by[k].c += Number(r.credit);
  }
  const TOL = 0.05; // 5 centimos tolerance
  const unbalanced = new Set(Object.entries(by).filter(([_,s]) => Math.abs(s.d - s.c) > TOL).map(([k]) => k));

  const ok = rows.filter(r => !unbalanced.has(r.entry_no));
  const rej = rows.filter(r => unbalanced.has(r.entry_no)).map(r => ({ reason:"unbalanced_entry", ...r }));
  return { ok, rej };
}

function toCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
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

function createCSVFromRejectedRows(rejectedRows: any[]): string {
  return toCSV(rejectedRows);
}