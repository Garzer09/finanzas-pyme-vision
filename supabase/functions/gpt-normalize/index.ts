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
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin access
    const { data: admin, error: adminError } = await svc
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (adminError || !admin) {
      return new Response("Forbidden - Admin access required", { status: 403, headers: corsHeaders });
    }

    const { jobId, companyId, period } = await req.json();

    if (!jobId || !companyId) {
      return new Response("Bad Request - Missing jobId or companyId", { status: 400, headers: corsHeaders });
    }

    console.log(`GPT normalize started for job ${jobId} by ${user.id}`);

    // Start background processing
    processGPTNormalization({ 
      svc, 
      jobId, 
      companyId, 
      period 
    }).catch(error => {
      console.error(`GPT normalization failed for job ${jobId}:`, error);
    });

    return new Response(
      JSON.stringify({ message: "GPT normalization started" }), 
      { 
        status: 202, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error("GPT normalize error:", error);
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

async function processGPTNormalization({
  svc,
  jobId,
  companyId,
  period
}: {
  svc: any;
  jobId: string;
  companyId: string;
  period: string;
}) {
  const setStatus = async (status: string, stats?: any) => {
    console.log(`GPT normalization job ${jobId} - ${status}`);
    await svc.from('processing_jobs').update({ 
      status, 
      stats_json: stats || {},
      updated_at: new Date().toISOString()
    }).eq('id', jobId);
  };

  try {
    await setStatus('PARSING', {
      stage: 'GPT_NORMALIZE',
      progress_pct: 30,
      message: 'Preparando datos para normalización GPT...'
    });

    // Get job details to find file path
    const { data: job, error: jobError } = await svc
      .from('processing_jobs')
      .select('file_path, stats_json')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message}`);
    }

    // Download original CSV file
    const { data: fileData, error: downloadError } = await svc.storage
      .from('gl-uploads')
      .download(job.file_path);

    if (downloadError) {
      throw new Error(`Download failed: ${downloadError.message}`);
    }

    const csvText = await fileData.text();
    
    // Take sample for GPT (first 1000 rows to avoid token limits)
    const lines = csvText.split('\n');
    const sampleLines = lines.slice(0, Math.min(1001, lines.length)); // Header + 1000 rows
    const sampleCsv = sampleLines.join('\n');

    await setStatus('VALIDATING', {
      stage: 'GPT_PROCESSING',
      progress_pct: 50,
      message: 'Enviando datos a GPT para normalización...'
    });

    // Call OpenAI GPT with structured outputs
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-2024-08-06',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en contabilidad. Normaliza este CSV de asientos contables al formato estándar.

FORMATO ESTÁNDAR REQUERIDO:
- entry_no: Número de asiento (string)
- tx_date: Fecha formato YYYY-MM-DD
- account: Código de cuenta (3-9 dígitos)
- description: Descripción del asiento
- debit: Importe debe (formato decimal con punto)
- credit: Importe haber (formato decimal con punto)
- doc_ref: Referencia del documento

REGLAS CRÍTICAS:
1. NO inventes valores - si faltan datos, envía la fila a 'rejects' con razón
2. Cada asiento (entry_no) debe cuadrar: suma debe = suma haber
3. Si un asiento no cuadra, envía TODAS sus líneas a 'rejects' con reason: "unbalanced_entry"
4. Normaliza fechas a YYYY-MM-DD
5. Normaliza números a formato decimal con punto (ej: 1234.56)
6. Solo devuelve JSON válido, sin explicaciones`
          },
          {
            role: 'user',
            content: `Normaliza este CSV:\n\n${sampleCsv}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "normalized_journal",
            schema: {
              type: "object",
              properties: {
                rows: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      entry_no: { type: "string" },
                      tx_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                      account: { type: "string", pattern: "^\\d{3,9}$" },
                      description: { type: "string" },
                      debit: { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$" },
                      credit: { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$" },
                      doc_ref: { type: "string" }
                    },
                    required: ["entry_no", "tx_date", "account", "debit", "credit"]
                  }
                },
                rejects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      reason: { type: "string" },
                      row_data: { type: "object" }
                    }
                  }
                },
                meta: {
                  type: "object",
                  properties: {
                    headers_detected: { type: "array" },
                    total_processed: { type: "number" },
                    valid_entries: { type: "number" }
                  }
                }
              },
              required: ["rows", "rejects", "meta"]
            }
          }
        },
        temperature: 0.1
      }),
    });

    if (!gptResponse.ok) {
      throw new Error(`GPT API error: ${gptResponse.status} ${gptResponse.statusText}`);
    }

    const gptData = await gptResponse.json();
    const normalizedData = JSON.parse(gptData.choices[0].message.content);

    await setStatus('LOADING', {
      stage: 'SAVING_NORMALIZED',
      progress_pct: 70,
      message: `GPT procesó ${normalizedData.rows.length} filas válidas, insertando en BD...`
    });

    // Save normalized CSV to storage
    const normalizedCsv = convertToCSV(normalizedData.rows);
    const normalizedPath = `normalized/${jobId}.csv`;
    
    await svc.storage.from('gl-uploads').upload(normalizedPath, normalizedCsv, {
      contentType: 'text/csv',
      upsert: true
    });

    // Save rejects and metadata
    const rejectsPath = `jobs/${jobId}/gpt_rejects.json`;
    const metaPath = `jobs/${jobId}/gpt_meta.json`;
    
    await svc.storage.from('gl-artifacts').upload(rejectsPath, JSON.stringify(normalizedData.rejects, null, 2), {
      contentType: 'application/json',
      upsert: true
    });
    
    await svc.storage.from('gl-artifacts').upload(metaPath, JSON.stringify(normalizedData.meta, null, 2), {
      contentType: 'application/json',
      upsert: true
    });

    // Insert data in batches
    let totalInserted = 0;
    const batchSize = 1000;
    const batches = [];
    
    for (let i = 0; i < normalizedData.rows.length; i += batchSize) {
      batches.push(normalizedData.rows.slice(i, i + batchSize));
    }
    
    await setStatus('LOADING', {
      stage: 'INSERTING_BATCHES',
      batches_total: batches.length,
      batches_done: 0,
      progress_pct: 75,
      message: `Insertando lote 1/${batches.length}...`
    });
    
    for (const [index, batch] of batches.entries()) {
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

      // Update progress after each batch
      await setStatus('LOADING', {
        batches_done: index + 1,
        rows_loaded: totalInserted,
        progress_pct: 75 + Math.floor(20 * ((index + 1) / batches.length)),
        message: `Insertando lote ${index + 2}/${batches.length}...`
      });
    }

    await setStatus('AGGREGATING', {
      stage: 'FINALIZING',
      rows_loaded: totalInserted,
      progress_pct: 95,
      message: 'Generando estados financieros...'
    });

    // Refresh materialized views
    await svc.rpc("refresh_materialized_views", { _company: companyId });

    await setStatus('DONE', {
      stage: 'COMPLETED',
      rows_loaded: totalInserted,
      gpt_processed: true,
      artifacts: {
        normalized_csv: normalizedPath,
        rejects: rejectsPath,
        meta: metaPath
      },
      progress_pct: 100,
      message: `Normalización GPT completada. ${totalInserted} asientos insertados.`,
      completed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error(`GPT normalization job ${jobId} failed:`, error);
    
    const errorPath = `jobs/${jobId}/gpt_failure.json`;
    const errorLog = JSON.stringify({ 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, null, 2);
    
    await svc.storage.from('gl-artifacts').upload(errorPath, errorLog, {
      contentType: 'application/json',
      upsert: true
    });

    await setStatus('FAILED', { 
      message: `Error en normalización GPT: ${String(error)}`,
      error_log_path: errorPath,
      failed_at: new Date().toISOString()
    });
  }
}

function convertToCSV(rows: any[]): string {
  if (rows.length === 0) return '';
  
  const headers = ['entry_no', 'tx_date', 'account', 'description', 'debit', 'credit', 'doc_ref'];
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : String(value);
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}