import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface CompanyData {
  company_name: string;
  sector: string;
  industry?: string;
  founded_year?: number;
  employees_range?: string;
  annual_revenue_range?: string;
  hq_city?: string;
  hq_country?: string;
  website?: string;
  business_description?: string;
  currency_code?: string;
  accounting_standard?: string;
  consolidation?: string;
  cif?: string;
}

interface ShareholderData {
  shareholder_name: string;
  shareholder_type?: string;
  country?: string;
  ownership_pct?: number;
  notes?: string;
}

interface FieldSynonym {
  canonical: string;
  synonyms_es: string[];
  synonyms_en: string[];
  required: boolean;
  category: 'company_info' | 'shareholder_info';
}

interface FieldMappingResult {
  canonical: string;
  detected: string;
  confidence_score: number;
  source: 'exact' | 'synonym' | 'fuzzy';
  required: boolean;
}

// Field synonyms dictionary
const FIELD_SYNONYMS: FieldSynonym[] = [
  // Company info fields
  { canonical: 'company_name', synonyms_es: ['nombre_empresa', 'empresa', 'razon_social', 'denominacion'], synonyms_en: ['company_name', 'business_name', 'firm_name'], required: true, category: 'company_info' },
  { canonical: 'sector', synonyms_es: ['sector', 'sector_economico', 'actividad'], synonyms_en: ['sector', 'business_sector', 'economic_sector'], required: true, category: 'company_info' },
  { canonical: 'industry', synonyms_es: ['industria', 'rama', 'subsector'], synonyms_en: ['industry', 'business_area'], required: false, category: 'company_info' },
  { canonical: 'founded_year', synonyms_es: ['año_fundacion', 'fundacion', 'creacion'], synonyms_en: ['founded_year', 'foundation_year', 'established'], required: false, category: 'company_info' },
  { canonical: 'employees_range', synonyms_es: ['empleados', 'trabajadores', 'plantilla'], synonyms_en: ['employees_range', 'staff_size', 'workforce'], required: false, category: 'company_info' },
  { canonical: 'annual_revenue_range', synonyms_es: ['facturacion', 'ingresos', 'ventas'], synonyms_en: ['annual_revenue_range', 'revenue', 'turnover'], required: false, category: 'company_info' },
  { canonical: 'hq_city', synonyms_es: ['ciudad', 'sede', 'domicilio'], synonyms_en: ['hq_city', 'city', 'headquarters'], required: false, category: 'company_info' },
  { canonical: 'hq_country', synonyms_es: ['pais', 'nacionalidad'], synonyms_en: ['hq_country', 'country'], required: false, category: 'company_info' },
  { canonical: 'website', synonyms_es: ['web', 'pagina_web', 'sitio_web'], synonyms_en: ['website', 'web', 'url'], required: false, category: 'company_info' },
  { canonical: 'business_description', synonyms_es: ['descripcion', 'actividad_principal', 'negocio'], synonyms_en: ['business_description', 'description', 'business'], required: false, category: 'company_info' },
  { canonical: 'currency_code', synonyms_es: ['moneda', 'divisa'], synonyms_en: ['currency_code', 'currency'], required: false, category: 'company_info' },
  { canonical: 'accounting_standard', synonyms_es: ['normativa_contable', 'plan_contable'], synonyms_en: ['accounting_standard', 'accounting_framework'], required: false, category: 'company_info' },
  { canonical: 'consolidation', synonyms_es: ['consolidacion', 'tipo_consolidacion'], synonyms_en: ['consolidation', 'consolidation_type'], required: false, category: 'company_info' },
  { canonical: 'cif', synonyms_es: ['cif', 'nif', 'identificacion_fiscal'], synonyms_en: ['cif', 'tax_id', 'vat_number'], required: false, category: 'company_info' },
  
  // Shareholder info fields
  { canonical: 'shareholder_name', synonyms_es: ['accionista', 'socio', 'propietario'], synonyms_en: ['shareholder_name', 'owner', 'stakeholder'], required: true, category: 'shareholder_info' },
  { canonical: 'shareholder_type', synonyms_es: ['tipo_accionista', 'tipo_socio', 'categoria'], synonyms_en: ['shareholder_type', 'owner_type'], required: false, category: 'shareholder_info' },
  { canonical: 'country', synonyms_es: ['pais', 'nacionalidad'], synonyms_en: ['country', 'nationality'], required: false, category: 'shareholder_info' },
  { canonical: 'ownership_pct', synonyms_es: ['participacion', 'porcentaje', 'pct'], synonyms_en: ['ownership_pct', 'percentage', 'stake'], required: false, category: 'shareholder_info' },
  { canonical: 'notes', synonyms_es: ['notas', 'observaciones', 'comentarios'], synonyms_en: ['notes', 'comments', 'remarks'], required: false, category: 'shareholder_info' }
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Levenshtein distance function
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Calculate similarity score (0-1)
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - (distance / maxLength);
}

// Normalize header text
function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '');
}

// Detect CSV delimiter
function detectDelimiter(csvContent: string): string {
  const sample = csvContent.split('\n')[0];
  const delimiters = [',', ';', '\t'];
  let maxCount = 0;
  let detectedDelimiter = ',';
  
  for (const delimiter of delimiters) {
    const count = (sample.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  }
  
  return detectedDelimiter;
}

// Parse CSV content
function parseCSV(content: string): { headers: string[], rows: string[][] } {
  // Remove BOM if present
  const cleanContent = content.replace(/^\uFEFF/, '');
  
  const delimiter = detectDelimiter(cleanContent);
  const lines = cleanContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  // Parse headers
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  
  // Parse rows
  const rows = lines.slice(1).map(line => 
    line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );
  
  return { headers, rows };
}

// Find best field mapping using synonyms and fuzzy matching
function findFieldMapping(detectedHeader: string, category: 'company_info' | 'shareholder_info'): FieldMappingResult | null {
  const normalizedDetected = normalizeHeader(detectedHeader);
  const categoryFields = FIELD_SYNONYMS.filter(f => f.category === category);
  
  let bestMatch: FieldMappingResult | null = null;
  let bestScore = 0;
  
  for (const field of categoryFields) {
    // Check exact match with canonical name
    const normalizedCanonical = normalizeHeader(field.canonical);
    if (normalizedDetected === normalizedCanonical) {
      return {
        canonical: field.canonical,
        detected: detectedHeader,
        confidence_score: 1.0,
        source: 'exact',
        required: field.required
      };
    }
    
    // Check synonyms
    const allSynonyms = [...field.synonyms_es, ...field.synonyms_en];
    for (const synonym of allSynonyms) {
      const normalizedSynonym = normalizeHeader(synonym);
      if (normalizedDetected === normalizedSynonym) {
        return {
          canonical: field.canonical,
          detected: detectedHeader,
          confidence_score: 0.95,
          source: 'synonym',
          required: field.required
        };
      }
    }
    
    // Fuzzy matching
    const canonicalSimilarity = calculateSimilarity(normalizedDetected, normalizedCanonical);
    if (canonicalSimilarity > bestScore && canonicalSimilarity >= 0.6) {
      bestScore = canonicalSimilarity;
      bestMatch = {
        canonical: field.canonical,
        detected: detectedHeader,
        confidence_score: canonicalSimilarity,
        source: 'fuzzy',
        required: field.required
      };
    }
    
    // Check fuzzy matching against synonyms
    for (const synonym of allSynonyms) {
      const synonymSimilarity = calculateSimilarity(normalizedDetected, normalizeHeader(synonym));
      if (synonymSimilarity > bestScore && synonymSimilarity >= 0.6) {
        bestScore = synonymSimilarity;
        bestMatch = {
          canonical: field.canonical,
          detected: detectedHeader,
          confidence_score: synonymSimilarity * 0.9, // Slightly lower for synonym fuzzy match
          source: 'fuzzy',
          required: field.required
        };
      }
    }
  }
  
  return bestMatch;
}

// Load mapping profile for organization
async function loadMappingProfile(orgId: string): Promise<Record<string, string> | null> {
  try {
    const { data, error } = await supabase
      .from('organization_field_mappings')
      .select('field_mappings')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) return null;
    
    return data.field_mappings as Record<string, string>;
  } catch (error) {
    console.error('Error loading mapping profile:', error);
    return null;
  }
}

// Process company data
function processCompanyData(headers: string[], rows: string[][], mappedFields: Record<string, FieldMappingResult>): CompanyData | null {
  if (rows.length === 0) return null;
  
  const firstRow = rows[0];
  const companyData: Partial<CompanyData> = {};
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const mapping = mappedFields[header];
    
    if (mapping && firstRow[i]) {
      const value = firstRow[i].trim();
      if (value) {
        if (mapping.canonical === 'founded_year') {
          const year = parseInt(value, 10);
          if (!isNaN(year)) {
            companyData[mapping.canonical as keyof CompanyData] = year as any;
          }
        } else {
          companyData[mapping.canonical as keyof CompanyData] = value as any;
        }
      }
    }
  }
  
  // Check required fields
  if (!companyData.company_name || !companyData.sector) {
    return null;
  }
  
  return companyData as CompanyData;
}

// Process shareholder data
function processShareholderData(headers: string[], rows: string[][], mappedFields: Record<string, FieldMappingResult>): ShareholderData[] {
  const shareholders: ShareholderData[] = [];
  
  for (const row of rows) {
    const shareholderData: Partial<ShareholderData> = {};
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const mapping = mappedFields[header];
      
      if (mapping && row[i]) {
        const value = row[i].trim();
        if (value) {
          if (mapping.canonical === 'ownership_pct') {
            const pct = parseFloat(value);
            if (!isNaN(pct)) {
              shareholderData[mapping.canonical as keyof ShareholderData] = pct as any;
            }
          } else {
            shareholderData[mapping.canonical as keyof ShareholderData] = value as any;
          }
        }
      }
    }
    
    // Only add if has shareholder name
    if (shareholderData.shareholder_name) {
      shareholders.push(shareholderData as ShareholderData);
    }
  }
  
  return shareholders;
}

Deno.serve(async (req) => {
  const reqId = crypto.randomUUID();
  
  console.log(`[${reqId}] Starting empresa-cualitativa-processor`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse FormData instead of JSON
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const targetUserId = formData.get('targetUserId') as string;
    
    console.log(`[${reqId}] Processing FormData`, { fileName: file?.name, targetUserId });
    
    if (!file || !targetUserId) {
      return new Response(JSON.stringify({
        success: false,
        reqId,
        code: 'MISSING_FILE_OR_USER',
        message: 'File and target user ID are required'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({
        success: false,
        reqId,
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds 10MB limit'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Convert file to text directly
    const csvContent = await file.text();
    console.log(`[${reqId}] File content length:`, csvContent.length);
    
    // Parse CSV
    const { headers, rows } = parseCSV(csvContent);
    console.log(`[${reqId}] Parsed CSV:`, { headerCount: headers.length, rowCount: rows.length });
    
    // Load existing mapping profile (using first user as org for now)
    const orgId = 'default'; // TODO: Get from actual organization context
    const existingProfile = await loadMappingProfile(orgId);
    
    // Map fields for company info
    const mappedFields: Record<string, FieldMappingResult> = {};
    const unmappedColumns: string[] = [];
    
    // Apply existing profile if available
    if (existingProfile) {
      console.log(`[${reqId}] Using existing profile with ${Object.keys(existingProfile).length} mappings`);
      for (const header of headers) {
        if (existingProfile[header]) {
          const synonymField = FIELD_SYNONYMS.find(f => f.canonical === existingProfile[header]);
          if (synonymField) {
            mappedFields[header] = {
              canonical: synonymField.canonical,
              detected: header,
              confidence_score: 1.0,
              source: 'exact',
              required: synonymField.required
            };
          }
        }
      }
    }
    
    // Map unmapped fields using fuzzy matching
    for (const header of headers) {
      if (!mappedFields[header]) {
        const mapping = findFieldMapping(header, 'company_info');
        if (mapping) {
          mappedFields[header] = mapping;
        } else {
          unmappedColumns.push(header);
        }
      }
    }
    
    console.log(`[${reqId}] Field mapping results:`, { 
      mapped: Object.keys(mappedFields).length, 
      unmapped: unmappedColumns.length 
    });
    
    // Calculate confidence scores
    const mappedCount = Object.keys(mappedFields).length;
    const totalColumns = headers.length;
    const confidenceScores = Object.values(mappedFields).map(m => m.confidence_score);
    const avgConfidence = confidenceScores.length > 0 ? 
      confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length : 0;
    
    // Check required fields
    const requiredFields = FIELD_SYNONYMS.filter(f => f.required && f.category === 'company_info');
    const requiredMapped = requiredFields.filter(rf => 
      Object.values(mappedFields).some(mf => mf.canonical === rf.canonical)
    );
    
    if (requiredMapped.length < requiredFields.length) {
      const missingFields = requiredFields
        .filter(rf => !Object.values(mappedFields).some(mf => mf.canonical === rf.canonical))
        .map(rf => rf.canonical);
      
      return new Response(JSON.stringify({
        success: false,
        reqId,
        code: 'MISSING_COLUMNS',
        message: 'Required fields are missing',
        missing_fields: missingFields
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Process data
    const companyData = processCompanyData(headers, rows, mappedFields);
    const shareholderData = processShareholderData(headers, rows, mappedFields);
    
    if (!companyData) {
      return new Response(JSON.stringify({
        success: false,
        reqId,
        code: 'INVALID_COMPANY_DATA',
        message: 'Could not extract valid company data'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const stats = {
      total_columns: totalColumns,
      mapped_columns: mappedCount,
      required_mapped: requiredMapped.length,
      confidence_avg: avgConfidence
    };
    
    // Determine if review is needed
    const needsReview = avgConfidence < 0.8;
    
    const result = {
      success: true,
      needs_review: needsReview,
      confidence_score: avgConfidence,
      reqId,
      mapped_fields: mappedFields,
      unmapped_columns: unmappedColumns,
      mapping_profile_used: existingProfile ? 'default' : undefined,
      company_data: companyData,
      shareholder_data: shareholderData,
      stats
    };
    
    console.log(`[${reqId}] Processing complete:`, { 
      success: true, 
      needsReview, 
      avgConfidence, 
      companyName: companyData.company_name 
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${reqId}] Error in empresa-cualitativa-processor:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      reqId,
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});