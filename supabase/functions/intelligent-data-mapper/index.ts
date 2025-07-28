import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MappingResult {
  mappedData: Record<string, any>;
  confidence: number;
  suggestions: string[];
  unmappedFields: string[];
}

interface SynonymData {
  canonical_term: string;
  synonyms: string[];
  category: string;
  confidence_score: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: requestData, clientConfig, userId } = await req.json();

    console.log('Processing data mapping for user:', userId);
    console.log('Input data keys:', Object.keys(requestData || {}));

    // 1. Obtener sinónimos de la base de datos
    const { data: synonyms, error: synonymsError } = await supabase
      .from('financial_synonyms')
      .select('*');

    if (synonymsError) {
      console.error('Error fetching synonyms:', synonymsError);
      throw new Error('Failed to fetch financial synonyms');
    }

    // 2. Obtener configuración del cliente si existe
    let config = {};
    if (clientConfig?.clientName) {
      const { data: clientData } = await supabase
        .from('client_configurations')
        .select('*')
        .eq('user_id', userId)
        .eq('client_name', clientConfig.clientName)
        .single();
      
      if (clientData) {
        config = clientData.field_mappings || {};
      }
    }

    // 3. Ejecutar el mapeo inteligente
    const mappingResult = await intelligentMapping(requestData, synonyms as SynonymData[], config);

    // 4. Guardar los resultados del mapeo
    const { error: logError } = await supabase
      .from('data_quality_logs')
      .insert({
        user_id: userId,
        validation_type: 'field_mapping',
        validation_result: mappingResult,
        confidence_score: mappingResult.confidence,
        status: 'completed'
      });

    if (logError) {
      console.error('Error saving mapping log:', logError);
    }

    // 5. Actualizar reglas de mapeo si es necesario
    await updateMappingRules(supabase, userId, mappingResult, requestData);

    return new Response(
      JSON.stringify({
        success: true,
        result: mappingResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in intelligent data mapper:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function intelligentMapping(
  data: Record<string, any>,
  synonyms: SynonymData[],
  clientConfig: Record<string, any>
): Promise<MappingResult> {
  const mappedData: Record<string, any> = {};
  const suggestions: string[] = [];
  const unmappedFields: string[] = [];
  let totalConfidence = 0;
  let mappedFieldsCount = 0;

  // Crear índice de sinónimos para búsqueda rápida
  const synonymIndex: Record<string, { canonical: string; confidence: number }> = {};
  
  synonyms.forEach(syn => {
    // Agregar el término canónico
    synonymIndex[syn.canonical_term.toLowerCase()] = {
      canonical: syn.canonical_term,
      confidence: syn.confidence_score
    };
    
    // Agregar todos los sinónimos
    syn.synonyms.forEach(synonym => {
      synonymIndex[synonym.toLowerCase()] = {
        canonical: syn.canonical_term,
        confidence: syn.confidence_score * 0.9 // Slightly lower confidence for synonyms
      };
    });
  });

  // Procesar cada campo de los datos de entrada
  Object.entries(data).forEach(([key, value]) => {
    const normalizedKey = normalizeFieldName(key);
    let mapped = false;
    let confidence = 0;

    // 1. Buscar mapeo exacto en configuración del cliente
    if (clientConfig[normalizedKey]) {
      mappedData[clientConfig[normalizedKey]] = value;
      confidence = 1.0;
      mapped = true;
    }
    // 2. Buscar en sinónimos
    else if (synonymIndex[normalizedKey]) {
      const match = synonymIndex[normalizedKey];
      mappedData[match.canonical] = value;
      confidence = match.confidence;
      mapped = true;
    }
    // 3. Búsqueda fuzzy en sinónimos
    else {
      const fuzzyMatch = findFuzzyMatch(normalizedKey, synonymIndex);
      if (fuzzyMatch && fuzzyMatch.confidence > 0.7) {
        mappedData[fuzzyMatch.canonical] = value;
        confidence = fuzzyMatch.confidence;
        mapped = true;
        suggestions.push(`Campo "${key}" mapeado a "${fuzzyMatch.canonical}" con confianza ${Math.round(fuzzyMatch.confidence * 100)}%`);
      }
    }

    if (mapped) {
      totalConfidence += confidence;
      mappedFieldsCount++;
    } else {
      unmappedFields.push(key);
      suggestions.push(`Campo "${key}" no pudo ser mapeado automáticamente`);
    }
  });

  // Calcular confianza general
  const overallConfidence = mappedFieldsCount > 0 ? totalConfidence / mappedFieldsCount : 0;

  // Validaciones de coherencia
  const validationResults = validateDataCoherence(mappedData);
  suggestions.push(...validationResults.suggestions);

  return {
    mappedData,
    confidence: overallConfidence,
    suggestions,
    unmappedFields
  };
}

function normalizeFieldName(fieldName: string): string {
  return fieldName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function findFuzzyMatch(
  target: string,
  synonymIndex: Record<string, { canonical: string; confidence: number }>
): { canonical: string; confidence: number } | null {
  let bestMatch: { canonical: string; confidence: number } | null = null;
  let bestScore = 0;

  Object.keys(synonymIndex).forEach(synonym => {
    const similarity = calculateSimilarity(target, synonym);
    if (similarity > bestScore && similarity > 0.7) {
      bestScore = similarity;
      bestMatch = {
        canonical: synonymIndex[synonym].canonical,
        confidence: synonymIndex[synonym].confidence * similarity
      };
    }
  });

  return bestMatch;
}

function calculateSimilarity(str1: string, str2: string): number {
  // Implementación simple de similitud basada en Levenshtein distance
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function validateDataCoherence(data: Record<string, any>): { isValid: boolean; suggestions: string[] } {
  const suggestions: string[] = [];
  
  // Validación 1: Balance (Activo = Pasivo + Patrimonio)
  if (data.activo_total && data.pasivo_total && data.patrimonio_neto) {
    const balance = Math.abs(data.activo_total - (data.pasivo_total + data.patrimonio_neto));
    const tolerance = data.activo_total * 0.01; // 1% de tolerancia
    
    if (balance > tolerance) {
      suggestions.push(`⚠️ Desbalance detectado: Activo (${data.activo_total}) ≠ Pasivo + Patrimonio (${data.pasivo_total + data.patrimonio_neto})`);
    } else {
      suggestions.push(`✅ Balance verificado correctamente`);
    }
  }
  
  // Validación 2: Coherencia de ventas y costes
  if (data.ventas && data.coste_ventas) {
    if (data.coste_ventas > data.ventas) {
      suggestions.push(`⚠️ Coste de ventas (${data.coste_ventas}) mayor que ventas (${data.ventas})`);
    }
  }
  
  // Validación 3: EBITDA coherencia
  if (data.ventas && data.ebitda && data.ebitda > data.ventas) {
    suggestions.push(`⚠️ EBITDA (${data.ebitda}) mayor que ventas (${data.ventas}). Verificar cálculo.`);
  }

  return {
    isValid: suggestions.filter(s => s.includes('⚠️')).length === 0,
    suggestions
  };
}

async function updateMappingRules(
  supabase: any,
  userId: string,
  mappingResult: MappingResult,
  originalData: Record<string, any>
): Promise<void> {
  try {
    // Crear reglas de mapeo para campos mapeados exitosamente
    const rules = Object.entries(mappingResult.mappedData).map(([targetField, value]) => {
      const sourceField = Object.keys(originalData).find(key => 
        originalData[key] === value
      );
      
      if (sourceField) {
        return {
          user_id: userId,
          rule_name: `${sourceField}_to_${targetField}`,
          source_field: sourceField,
          target_field: targetField,
          confidence_score: mappingResult.confidence,
          transformation_logic: { type: 'direct_mapping', applied_at: new Date().toISOString() }
        };
      }
      return null;
    }).filter(Boolean);

    if (rules.length > 0) {
      const { error } = await supabase
        .from('data_mapping_rules')
        .upsert(rules, { onConflict: 'user_id,source_field,target_field' });
      
      if (error) {
        console.error('Error updating mapping rules:', error);
      } else {
        console.log(`Updated ${rules.length} mapping rules`);
      }
    }
  } catch (error) {
    console.error('Error in updateMappingRules:', error);
  }
}