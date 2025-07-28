import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  isValid: boolean;
  cleanedData: Record<string, any>;
  issues: ValidationIssue[];
  suggestions: ValidationSuggestion[];
  confidence: number;
  normalizedUnits: string;
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  originalValue: any;
  suggestedValue?: any;
}

interface ValidationSuggestion {
  type: 'unit_conversion' | 'data_cleanup' | 'missing_data' | 'calculation';
  message: string;
  action?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { mappedData, userId, fileId } = await req.json();

    console.log('Starting data validation for user:', userId);
    console.log('Mapped data fields:', Object.keys(mappedData || {}));

    // Ejecutar validación completa
    const validationResult = await validateAndCleanData(mappedData);

    // Guardar resultados de validación
    const { error: logError } = await supabase
      .from('data_quality_logs')
      .insert({
        user_id: userId,
        file_id: fileId,
        validation_type: 'data_validation',
        validation_result: validationResult,
        issues_found: validationResult.issues,
        suggestions: validationResult.suggestions,
        confidence_score: validationResult.confidence,
        status: validationResult.isValid ? 'passed' : 'failed'
      });

    if (logError) {
      console.error('Error saving validation log:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: validationResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in data validator:', error);
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

async function validateAndCleanData(data: Record<string, any>): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const suggestions: ValidationSuggestion[] = [];
  const cleanedData: Record<string, any> = {};
  
  let validFieldsCount = 0;
  let totalFieldsCount = 0;

  // 1. Detectar y normalizar unidades
  const unitDetection = detectUnits(data);
  const targetUnit = unitDetection.detectedUnit;
  
  if (unitDetection.mixedUnits) {
    suggestions.push({
      type: 'unit_conversion',
      message: `Se detectaron múltiples unidades. Normalizando todo a ${targetUnit}`,
      action: 'convert_units'
    });
  }

  // 2. Procesar cada campo
  Object.entries(data).forEach(([field, value]) => {
    totalFieldsCount++;
    
    try {
      const cleanedValue = cleanFieldValue(field, value, targetUnit, issues, suggestions);
      if (cleanedValue !== null && cleanedValue !== undefined) {
        cleanedData[field] = cleanedValue;
        validFieldsCount++;
      }
    } catch (error) {
      issues.push({
        type: 'error',
        field,
        message: `Error procesando campo: ${error.message}`,
        originalValue: value
      });
    }
  });

  // 3. Validaciones de coherencia financiera
  performFinancialValidations(cleanedData, issues, suggestions);

  // 4. Completar datos faltantes
  completeImpliedData(cleanedData, suggestions);

  // 5. Calcular confianza general
  const confidence = totalFieldsCount > 0 ? (validFieldsCount / totalFieldsCount) : 0;
  const hasErrors = issues.some(issue => issue.type === 'error');

  return {
    isValid: !hasErrors && confidence > 0.7,
    cleanedData,
    issues,
    suggestions,
    confidence,
    normalizedUnits: targetUnit
  };
}

function detectUnits(data: Record<string, any>): { detectedUnit: string; mixedUnits: boolean } {
  const values = Object.values(data).filter(v => typeof v === 'number' && v > 0);
  
  if (values.length === 0) return { detectedUnit: 'euros', mixedUnits: false };

  const maxValue = Math.max(...values);
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

  // Heurística para detectar unidades basada en magnitudes
  if (maxValue > 10000000) { // Valores muy altos, probablemente en euros
    return { detectedUnit: 'euros', mixedUnits: false };
  } else if (maxValue > 10000 && avgValue > 1000) { // Valores medios, probablemente en miles
    return { detectedUnit: 'k_euros', mixedUnits: false };
  } else if (maxValue < 1000) { // Valores bajos, probablemente en millones
    return { detectedUnit: 'm_euros', mixedUnits: false };
  }

  // Si no está claro, asumir euros y marcar como mixto
  return { detectedUnit: 'euros', mixedUnits: true };
}

function cleanFieldValue(
  field: string,
  value: any,
  targetUnit: string,
  issues: ValidationIssue[],
  suggestions: ValidationSuggestion[]
): any {
  
  // 1. Manejar valores nulos o indefinidos
  if (value === null || value === undefined || value === '') {
    issues.push({
      type: 'warning',
      field,
      message: 'Campo vacío o nulo',
      originalValue: value
    });
    return null;
  }

  // 2. Convertir a número si es necesario
  let numericValue: number;
  if (typeof value === 'string') {
    // Limpiar formato de número (comas, espacios, etc.)
    const cleanedString = value
      .replace(/[^\d.-]/g, '') // Mantener solo dígitos, puntos y guiones
      .replace(/,/g, '.'); // Reemplazar comas por puntos
    
    numericValue = parseFloat(cleanedString);
    
    if (isNaN(numericValue)) {
      issues.push({
        type: 'error',
        field,
        message: `No se pudo convertir "${value}" a número`,
        originalValue: value
      });
      return null;
    }
  } else if (typeof value === 'number') {
    numericValue = value;
  } else {
    issues.push({
      type: 'error',
      field,
      message: `Tipo de dato no válido: ${typeof value}`,
      originalValue: value
    });
    return null;
  }

  // 3. Validar rangos razonables
  if (isFinite(numericValue)) {
    if (Math.abs(numericValue) > 1e12) { // Muy grande
      issues.push({
        type: 'warning',
        field,
        message: `Valor muy grande: ${numericValue}`,
        originalValue: value
      });
    } else if (numericValue < 0 && isPositiveField(field)) {
      issues.push({
        type: 'warning',
        field,
        message: `Valor negativo en campo que suele ser positivo`,
        originalValue: value
      });
    }
  }

  // 4. Normalizar unidades
  const normalizedValue = normalizeToTargetUnit(numericValue, targetUnit, field);
  
  if (normalizedValue !== numericValue) {
    suggestions.push({
      type: 'unit_conversion',
      message: `Campo ${field}: ${numericValue} convertido a ${normalizedValue} (${targetUnit})`,
      action: 'unit_normalized'
    });
  }

  return normalizedValue;
}

function isPositiveField(field: string): boolean {
  const positiveFields = [
    'ventas', 'activo_total', 'patrimonio_neto', 'tesoreria',
    'ingresos', 'facturacion', 'activo', 'patrimonio'
  ];
  return positiveFields.some(pf => field.toLowerCase().includes(pf));
}

function normalizeToTargetUnit(value: number, targetUnit: string, field: string): number {
  // Esta es una heurística simple. En un caso real, necesitarías más lógica
  // para determinar la unidad original de cada campo
  
  switch (targetUnit) {
    case 'euros':
      return value; // Asumir que ya está en euros
    case 'k_euros':
      return value / 1000; // Convertir a miles
    case 'm_euros':
      return value / 1000000; // Convertir a millones
    default:
      return value;
  }
}

function performFinancialValidations(
  data: Record<string, any>,
  issues: ValidationIssue[],
  suggestions: ValidationSuggestion[]
): void {
  
  // Validación 1: Ecuación fundamental del balance
  if (data.activo_total && data.pasivo_total && data.patrimonio_neto) {
    const diferencia = Math.abs(data.activo_total - (data.pasivo_total + data.patrimonio_neto));
    const tolerancia = data.activo_total * 0.02; // 2% de tolerancia

    if (diferencia > tolerancia) {
      issues.push({
        type: 'error',
        field: 'balance_equation',
        message: `Balance no cuadra: Activo ${data.activo_total} ≠ Pasivo + Patrimonio ${data.pasivo_total + data.patrimonio_neto}`,
        originalValue: { activo: data.activo_total, pasivo: data.pasivo_total, patrimonio: data.patrimonio_neto }
      });
    }
  }

  // Validación 2: Ratios de coherencia
  if (data.ventas && data.coste_ventas) {
    const margenBruto = (data.ventas - data.coste_ventas) / data.ventas;
    if (margenBruto < 0) {
      issues.push({
        type: 'warning',
        field: 'margen_bruto',
        message: 'Margen bruto negativo. Verificar coste de ventas.',
        originalValue: margenBruto
      });
    } else if (margenBruto > 0.8) {
      issues.push({
        type: 'warning',
        field: 'margen_bruto',
        message: `Margen bruto muy alto (${(margenBruto * 100).toFixed(1)}%). Verificar datos.`,
        originalValue: margenBruto
      });
    }
  }

  // Validación 3: Liquidez básica
  if (data.activo_corriente && data.pasivo_corriente) {
    const ratioLiquidez = data.activo_corriente / data.pasivo_corriente;
    if (ratioLiquidez < 1) {
      issues.push({
        type: 'warning',
        field: 'liquidez',
        message: `Ratio de liquidez bajo (${ratioLiquidez.toFixed(2)}). Posibles problemas de tesorería.`,
        originalValue: ratioLiquidez
      });
    }
  }
}

function completeImpliedData(
  data: Record<string, any>,
  suggestions: ValidationSuggestion[]
): void {
  
  // Calcular margen bruto si tenemos ventas y coste
  if (data.ventas && data.coste_ventas && !data.margen_bruto) {
    data.margen_bruto = data.ventas - data.coste_ventas;
    suggestions.push({
      type: 'calculation',
      message: 'Margen bruto calculado automáticamente',
      action: 'calculated_margin'
    });
  }

  // Calcular EBITDA si tenemos los componentes
  if (data.resultado_explotacion && data.amortizaciones && !data.ebitda) {
    data.ebitda = data.resultado_explotacion + data.amortizaciones;
    suggestions.push({
      type: 'calculation',
      message: 'EBITDA calculado automáticamente',
      action: 'calculated_ebitda'
    });
  }

  // Calcular ratio de endeudamiento
  if (data.deuda_financiera && data.patrimonio_neto && !data.ratio_endeudamiento) {
    data.ratio_endeudamiento = data.deuda_financiera / data.patrimonio_neto;
    suggestions.push({
      type: 'calculation',
      message: 'Ratio de endeudamiento calculado automáticamente',
      action: 'calculated_debt_ratio'
    });
  }
}