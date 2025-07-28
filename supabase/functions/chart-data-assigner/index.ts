import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChartAssignment {
  chartId: string;
  dataMapping: Record<string, string>;
  confidence: number;
  missingFields: string[];
  syntheticData?: Record<string, any>;
}

interface DashboardData {
  charts: ChartAssignment[];
  kpis: Record<string, any>;
  globalMetrics: Record<string, any>;
  completionScore: number;
}

// Definición de requerimientos de datos para cada gráfico
const CHART_REQUIREMENTS = {
  'profit_loss': {
    required: ['ventas', 'coste_ventas', 'gastos_personal', 'otros_gastos'],
    optional: ['ebitda', 'resultado_neto', 'amortizaciones'],
    generates: ['margen_bruto', 'resultado_explotacion']
  },
  'balance_sheet': {
    required: ['activo_total', 'patrimonio_neto'],
    optional: ['pasivo_total', 'activo_corriente', 'pasivo_corriente', 'deuda_financiera'],
    generates: ['ratio_liquidez', 'ratio_endeudamiento']
  },
  'cash_flow': {
    required: ['ebitda'],
    optional: ['flujo_operativo', 'flujo_inversion', 'flujo_financiacion', 'tesoreria'],
    generates: ['flujo_libre', 'variacion_tesoreria']
  },
  'financial_ratios': {
    required: ['ventas', 'activo_total', 'patrimonio_neto'],
    optional: ['resultado_neto', 'ebitda', 'deuda_financiera'],
    generates: ['roe', 'roa', 'margen_ebitda', 'rotacion_activos']
  },
  'sales_segments': {
    required: ['ventas'],
    optional: ['segmentos_producto', 'segmentos_region', 'segmentos_cliente'],
    generates: ['distribucion_ventas', 'crecimiento_segmentos']
  },
  'debt_service': {
    required: ['ebitda', 'deuda_financiera'],
    optional: ['gastos_financieros', 'amortizacion_deuda'],
    generates: ['dscr', 'cobertura_intereses']
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { validatedData, userId, requestedCharts } = await req.json();

    console.log('Assigning data to charts for user:', userId);
    console.log('Available data fields:', Object.keys(validatedData || {}));
    console.log('Requested charts:', requestedCharts);

    // Ejecutar asignación automática
    const dashboardData = await assignDataToCharts(validatedData, requestedCharts || Object.keys(CHART_REQUIREMENTS));

    // Guardar resultados de asignación
    const { error: logError } = await supabase
      .from('data_quality_logs')
      .insert({
        user_id: userId,
        validation_type: 'chart_assignment',
        validation_result: dashboardData,
        confidence_score: dashboardData.completionScore,
        status: 'completed'
      });

    if (logError) {
      console.error('Error saving assignment log:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: dashboardData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in chart data assigner:', error);
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

async function assignDataToCharts(
  data: Record<string, any>,
  requestedCharts: string[]
): Promise<DashboardData> {
  const charts: ChartAssignment[] = [];
  const globalMetrics: Record<string, any> = {};
  let totalConfidence = 0;

  // Procesar cada gráfico solicitado
  for (const chartId of requestedCharts) {
    const requirements = CHART_REQUIREMENTS[chartId];
    if (!requirements) {
      console.warn(`Unknown chart: ${chartId}`);
      continue;
    }

    const assignment = await assignSingleChart(chartId, data, requirements);
    charts.push(assignment);
    totalConfidence += assignment.confidence;

    // Agregar datos sintéticos generados a los datos globales
    if (assignment.syntheticData) {
      Object.assign(globalMetrics, assignment.syntheticData);
    }
  }

  // Calcular KPIs globales
  const kpis = calculateGlobalKPIs(data, globalMetrics);

  // Calcular puntuación de completitud
  const completionScore = charts.length > 0 ? totalConfidence / charts.length : 0;

  return {
    charts,
    kpis,
    globalMetrics: { ...data, ...globalMetrics },
    completionScore
  };
}

async function assignSingleChart(
  chartId: string,
  data: Record<string, any>,
  requirements: any
): Promise<ChartAssignment> {
  const dataMapping: Record<string, string> = {};
  const missingFields: string[] = [];
  const syntheticData: Record<string, any> = {};
  
  let requiredFound = 0;
  let optionalFound = 0;

  // Verificar campos requeridos
  requirements.required.forEach((field: string) => {
    if (data[field] !== undefined && data[field] !== null) {
      dataMapping[field] = field;
      requiredFound++;
    } else {
      missingFields.push(field);
    }
  });

  // Verificar campos opcionales
  requirements.optional.forEach((field: string) => {
    if (data[field] !== undefined && data[field] !== null) {
      dataMapping[field] = field;
      optionalFound++;
    }
  });

  // Generar datos sintéticos para campos derivados
  if (requirements.generates) {
    for (const generatedField of requirements.generates) {
      const syntheticValue = generateSyntheticValue(generatedField, data, dataMapping);
      if (syntheticValue !== null) {
        syntheticData[generatedField] = syntheticValue;
        dataMapping[generatedField] = generatedField;
      }
    }
  }

  // Completar con datos sintéticos si faltan campos críticos
  if (requiredFound < requirements.required.length) {
    const syntheticFields = generateMissingData(chartId, data, missingFields);
    Object.assign(syntheticData, syntheticFields);
    
    // Actualizar mapeo con datos sintéticos
    Object.keys(syntheticFields).forEach(field => {
      dataMapping[field] = field;
      const index = missingFields.indexOf(field);
      if (index > -1) {
        missingFields.splice(index, 1);
        requiredFound++;
      }
    });
  }

  // Calcular confianza
  const requiredRatio = requiredFound / requirements.required.length;
  const optionalRatio = requirements.optional.length > 0 ? optionalFound / requirements.optional.length : 1;
  const confidence = (requiredRatio * 0.8) + (optionalRatio * 0.2);

  return {
    chartId,
    dataMapping,
    confidence,
    missingFields,
    syntheticData: Object.keys(syntheticData).length > 0 ? syntheticData : undefined
  };
}

function generateSyntheticValue(field: string, data: Record<string, any>, mapping: Record<string, string>): number | null {
  switch (field) {
    case 'margen_bruto':
      if (data.ventas && data.coste_ventas) {
        return data.ventas - data.coste_ventas;
      }
      break;
      
    case 'resultado_explotacion':
      if (data.margen_bruto && data.gastos_personal && data.otros_gastos) {
        return data.margen_bruto - data.gastos_personal - data.otros_gastos;
      }
      break;
      
    case 'roe':
      if (data.resultado_neto && data.patrimonio_neto) {
        return (data.resultado_neto / data.patrimonio_neto) * 100;
      }
      break;
      
    case 'roa':
      if (data.resultado_neto && data.activo_total) {
        return (data.resultado_neto / data.activo_total) * 100;
      }
      break;
      
    case 'margen_ebitda':
      if (data.ebitda && data.ventas) {
        return (data.ebitda / data.ventas) * 100;
      }
      break;
      
    case 'ratio_liquidez':
      if (data.activo_corriente && data.pasivo_corriente) {
        return data.activo_corriente / data.pasivo_corriente;
      }
      break;
      
    case 'ratio_endeudamiento':
      if (data.deuda_financiera && data.patrimonio_neto) {
        return data.deuda_financiera / data.patrimonio_neto;
      }
      break;
      
    case 'dscr':
      if (data.ebitda && data.gastos_financieros) {
        return data.ebitda / data.gastos_financieros;
      }
      break;
  }
  
  return null;
}

function generateMissingData(chartId: string, data: Record<string, any>, missingFields: string[]): Record<string, any> {
  const synthetic: Record<string, any> = {};
  
  // Generar datos basados en el contexto y patrones típicos
  switch (chartId) {
    case 'profit_loss':
      if (missingFields.includes('coste_ventas') && data.ventas) {
        // Asumir margen bruto típico del 30-40%
        synthetic.coste_ventas = data.ventas * 0.65;
      }
      if (missingFields.includes('gastos_personal') && data.ventas) {
        // Asumir 15-20% de ventas en gastos de personal
        synthetic.gastos_personal = data.ventas * 0.18;
      }
      if (missingFields.includes('otros_gastos') && data.ventas) {
        // Asumir 10-15% de ventas en otros gastos
        synthetic.otros_gastos = data.ventas * 0.12;
      }
      break;
      
    case 'balance_sheet':
      if (missingFields.includes('pasivo_total') && data.activo_total && data.patrimonio_neto) {
        synthetic.pasivo_total = data.activo_total - data.patrimonio_neto;
      }
      if (missingFields.includes('activo_corriente') && data.activo_total) {
        // Asumir 40-60% del activo total
        synthetic.activo_corriente = data.activo_total * 0.5;
      }
      if (missingFields.includes('deuda_financiera') && data.pasivo_total) {
        // Asumir 60-70% del pasivo total
        synthetic.deuda_financiera = data.pasivo_total * 0.65;
      }
      break;
      
    case 'cash_flow':
      if (missingFields.includes('flujo_operativo') && data.ebitda) {
        // Aproximar flujo operativo como 80-90% del EBITDA
        synthetic.flujo_operativo = data.ebitda * 0.85;
      }
      if (missingFields.includes('tesoreria') && data.ventas) {
        // Aproximar tesorería como 5-10% de ventas anuales
        synthetic.tesoreria = data.ventas * 0.075;
      }
      break;
  }
  
  return synthetic;
}

function calculateGlobalKPIs(data: Record<string, any>, syntheticData: Record<string, any>): Record<string, any> {
  const allData = { ...data, ...syntheticData };
  const kpis: Record<string, any> = {};
  
  // KPIs de rentabilidad
  if (allData.resultado_neto && allData.ventas) {
    kpis.margen_neto = (allData.resultado_neto / allData.ventas) * 100;
  }
  
  if (allData.ebitda && allData.ventas) {
    kpis.margen_ebitda = (allData.ebitda / allData.ventas) * 100;
  }
  
  // KPIs de eficiencia
  if (allData.ventas && allData.activo_total) {
    kpis.rotacion_activos = allData.ventas / allData.activo_total;
  }
  
  // KPIs de solvencia
  if (allData.deuda_financiera && allData.ebitda) {
    kpis.ratio_deuda_ebitda = allData.deuda_financiera / allData.ebitda;
  }
  
  // KPIs de liquidez
  if (allData.tesoreria && allData.ventas) {
    kpis.dias_tesoreria = (allData.tesoreria / allData.ventas) * 365;
  }
  
  return kpis;
}