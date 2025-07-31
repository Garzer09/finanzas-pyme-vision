import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not found');
    }

    const { sessionId, edaResults } = await req.json();
    console.log('Starting comprehensive analysis for session:', sessionId);

    // Get session data
    const { data: session, error: sessionError } = await supabaseClient
      .from('test_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    // Define required dashboard variables
    const dashboardVariables = {
      balance: [
        'activo_corriente', 'activo_no_corriente', 'total_activo',
        'pasivo_corriente', 'pasivo_no_corriente', 'total_pasivo',
        'patrimonio_neto', 'tesoreria', 'existencias', 'deudores',
        'inmovilizado_material', 'inmovilizado_inmaterial'
      ],
      pyg: [
        'ingresos_explotacion', 'gastos_explotacion', 'resultado_explotacion',
        'gastos_financieros', 'ingresos_financieros', 'resultado_financiero',
        'resultado_antes_impuestos', 'impuesto_sociedades', 'resultado_neto',
        'amortizaciones', 'gastos_personal', 'otros_gastos_explotacion'
      ],
      ratios: [
        'ratio_corriente', 'ratio_acido', 'ratio_tesoreria',
        'ratio_endeudamiento', 'ratio_deuda_patrimonio', 'ratio_autonomia',
        'roe', 'roa', 'roi', 'margen_bruto', 'margen_ebitda', 'margen_neto',
        'rotacion_activos', 'rotacion_existencias', 'periodo_cobro'
      ],
      cashflow: [
        'flujo_operativo', 'flujo_inversion', 'flujo_financiacion',
        'flujo_neto', 'variacion_tesoreria'
      ],
      kpis: [
        'ebitda', 'ebit', 'working_capital', 'deuda_neta', 'fondo_maniobra',
        'capital_empleado', 'valor_anadido', 'productividad_empleado'
      ]
    };

    // Create comprehensive system prompt with Spanish financial analysis expertise
    const systemPrompt = `Eres un analista financiero experto especializado en contabilidad española y análisis integral de estados financieros. Tu objetivo es analizar datos financieros de empresas españolas y crear un dashboard financiero completo y preciso.

CONTEXTO Y OBJETIVOS:
- Analizar estados financieros según normativas contables españolas (PGC)
- Calcular métricas financieras faltantes usando fórmulas estándar
- Estimar variables cuando falten datos usando métodos inteligentes
- Validar coherencia contable (ej: Activo = Pasivo + Patrimonio Neto)
- Generar insights accionables y recomendaciones estratégicas
- Asignar scores de confianza precisos para cada cálculo

DATOS DISPONIBLES:
<eda_results>
${JSON.stringify(edaResults, null, 2)}
</eda_results>

VARIABLES REQUERIDAS PARA EL DASHBOARD:
<dashboard_variables>
${JSON.stringify(dashboardVariables, null, 2)}
</dashboard_variables>

PROCESO DE ANÁLISIS:

1. ANÁLISIS EXPLORATORIO:
   - Examina la estructura y contenido de cada archivo
   - Identifica períodos disponibles y su consistencia temporal
   - Detecta patrones, tendencias y anomalías en los datos
   - Evalúa la calidad y completitud de la información

2. IDENTIFICACIÓN Y MAPEO:
   - Lista todas las variables presentes en los archivos
   - Identifica variables faltantes para completar el dashboard
   - Mapea terminología contable española a variables estándar
   - Detecta posibles duplicados o inconsistencias

3. CÁLCULOS AVANZADOS:
   Utiliza estas fórmulas cuando falten datos:

   BALANCE:
   - total_activo = activo_corriente + activo_no_corriente
   - total_pasivo = pasivo_corriente + pasivo_no_corriente
   - patrimonio_neto = total_activo - total_pasivo
   - working_capital = activo_corriente - pasivo_corriente

   RATIOS DE LIQUIDEZ:
   - ratio_corriente = activo_corriente / pasivo_corriente
   - ratio_acido = (activo_corriente - existencias) / pasivo_corriente
   - ratio_tesoreria = tesoreria / pasivo_corriente

   RATIOS DE ENDEUDAMIENTO:
   - ratio_endeudamiento = total_pasivo / total_activo
   - ratio_deuda_patrimonio = total_pasivo / patrimonio_neto
   - ratio_autonomia = patrimonio_neto / total_activo

   RATIOS DE RENTABILIDAD:
   - roe = (resultado_neto / patrimonio_neto) * 100
   - roa = (resultado_neto / total_activo) * 100
   - margen_neto = (resultado_neto / ingresos_explotacion) * 100
   - margen_ebitda = (ebitda / ingresos_explotacion) * 100

   MÉTRICAS OPERATIVAS:
   - ebitda = resultado_explotacion + amortizaciones
   - ebit = resultado_explotacion
   - deuda_neta = (pasivo_corriente + pasivo_no_corriente) - tesoreria
   - rotacion_activos = ingresos_explotacion / total_activo
   - rotacion_existencias = (existencias * 365) / gastos_explotacion

4. ESTIMACIÓN INTELIGENTE:
   Cuando falten datos críticos, usa estos métodos:
   - Interpolación temporal para períodos intermedios
   - Porcentajes sectoriales estándar para variables específicas
   - Relaciones contables fundamentales para coherencia
   - Estimaciones basadas en ratios históricos de la empresa

5. VALIDACIONES DE CALIDAD:
   - Ecuación contable básica: Activo = Pasivo + Patrimonio
   - Rangos lógicos para ratios (ej: liquidez > 0, endeudamiento 0-100%)
   - Consistencia temporal entre períodos
   - Detección de outliers y valores anómalos
   - Completitud mínima del 80% en variables core

6. INSIGHTS Y RECOMENDACIONES:
   - Analiza salud financiera, liquidez, solvencia y rentabilidad
   - Compara con benchmarks sectoriales cuando sea posible
   - Identifica tendencias, fortalezas y áreas de mejora
   - Proporciona recomendaciones específicas y accionables
   - Evalúa riesgos financieros y oportunidades de crecimiento

ESTRUCTURA DE RESPUESTA OBLIGATORIA:
Debes responder ÚNICAMENTE con un objeto JSON válido siguiendo esta estructura exacta:

{
  "data_quality": {
    "overall_score": 0.85,
    "completeness": 0.90,
    "consistency": 0.80,
    "accounting_coherence": 0.95,
    "issues": ["descripción de problemas detectados"],
    "recommendations": ["recomendaciones para mejorar calidad"],
    "periods_analyzed": ["2023", "2022"],
    "missing_critical_data": ["variable1", "variable2"]
  },
  "calculations": {
    "performed": [
      {
        "variable": "ratio_corriente",
        "formula": "activo_corriente / pasivo_corriente",
        "inputs": {"activo_corriente": 150000, "pasivo_corriente": 100000},
        "result": 1.50,
        "confidence": 0.95,
        "explanation": "Calculado usando valores exactos del balance"
      }
    ],
    "estimated": [
      {
        "variable": "gastos_financieros", 
        "method": "porcentaje_sectorial",
        "inputs": {"ingresos_explotacion": 500000, "sector_percentage": 0.02},
        "result": 10000,
        "confidence": 0.70,
        "explanation": "Estimado usando 2% estándar sectorial sobre ingresos"
      }
    ],
    "validation_results": {
      "accounting_equation_valid": true,
      "ratio_ranges_valid": true,
      "temporal_consistency": 0.85,
      "outliers_detected": ["ratio_endeudamiento_2021"]
    }
  },
  "dashboard_data": {
    "balance": {
      "activo_corriente": 150000,
      "activo_no_corriente": 350000,
      "total_activo": 500000,
      "pasivo_corriente": 100000,
      "pasivo_no_corriente": 200000,
      "total_pasivo": 300000,
      "patrimonio_neto": 200000,
      "tesoreria": 25000,
      "existencias": 50000,
      "deudores": 75000,
      "inmovilizado_material": 300000,
      "inmovilizado_inmaterial": 50000
    },
    "pyg": {
      "ingresos_explotacion": 600000,
      "gastos_explotacion": 450000,
      "resultado_explotacion": 150000,
      "gastos_financieros": 15000,
      "ingresos_financieros": 2000,
      "resultado_financiero": -13000,
      "resultado_antes_impuestos": 137000,
      "impuesto_sociedades": 34250,
      "resultado_neto": 102750,
      "amortizaciones": 35000,
      "gastos_personal": 200000,
      "otros_gastos_explotacion": 215000
    },
    "ratios": {
      "ratio_corriente": 1.50,
      "ratio_acido": 1.00,
      "ratio_tesoreria": 0.25,
      "ratio_endeudamiento": 0.60,
      "ratio_deuda_patrimonio": 1.50,
      "ratio_autonomia": 0.40,
      "roe": 51.38,
      "roa": 20.55,
      "roi": 30.00,
      "margen_bruto": 65.00,
      "margen_ebitda": 30.83,
      "margen_neto": 17.13,
      "rotacion_activos": 1.20,
      "rotacion_existencias": 40.56,
      "periodo_cobro": 45.63
    },
    "cashflow": {
      "flujo_operativo": 120000,
      "flujo_inversion": -50000,
      "flujo_financiacion": -30000,
      "flujo_neto": 40000,
      "variacion_tesoreria": 40000
    },
    "kpis": {
      "ebitda": 185000,
      "ebit": 150000,
      "working_capital": 50000,
      "deuda_neta": 275000,
      "fondo_maniobra": 50000,
      "capital_empleado": 450000,
      "valor_anadido": 350000,
      "productividad_empleado": 25000
    }
  },
  "insights": [
    {
      "category": "liquidez",
      "title": "Liquidez adecuada pero mejorable",
      "description": "El ratio corriente de 1.5 indica capacidad para cubrir obligaciones a corto plazo, aunque está cerca del mínimo recomendado de 1.5-2.0",
      "severity": "medium",
      "recommendation": "Considerar aumentar el efectivo disponible o renegociar plazos de pago con proveedores",
      "affected_metrics": ["ratio_corriente", "tesoreria", "working_capital"],
      "impact": "medium",
      "confidence": 0.90
    },
    {
      "category": "rentabilidad",
      "title": "Excelente rentabilidad operativa",
      "description": "ROE del 51.4% y margen EBITDA del 30.8% muestran una rentabilidad superior al promedio sectorial",
      "severity": "low",
      "recommendation": "Mantener eficiencia operativa y evaluar oportunidades de reinversión",
      "affected_metrics": ["roe", "margen_ebitda", "margen_neto"],
      "impact": "high",
      "confidence": 0.95
    }
  ],
  "recommendations": {
    "strategic": [
      "Optimizar gestión de capital de trabajo para mejorar liquidez",
      "Evaluar oportunidades de crecimiento dada la alta rentabilidad",
      "Considerar refinanciación de deuda para reducir costes financieros"
    ],
    "operational": [
      "Implementar mejor control de existencias",
      "Revisar política de cobros para reducir período medio",
      "Análizar estructura de costes para mantener márgenes"
    ],
    "financial": [
      "Diversificar fuentes de financiación",
      "Establecer líneas de crédito preventivas",
      "Optimizar estructura de capital"
    ]
  },
  "metadata": {
    "analysis_date": "${new Date().toISOString()}",
    "model": "claude-opus-4-20250514",
    "confidence": 0.90,
    "variables_calculated": 42,
    "variables_estimated": 8,
    "total_variables": 50,
    "processing_time": "comprehensive",
    "data_sources": ["balance", "pyg", "eda_results"],
    "validation_passed": true
  }
}`;

    const userPrompt = `Please analyze the financial data from the EDA results and perform a comprehensive financial analysis. Calculate all missing variables, provide insights, and generate the complete dashboard data structure.`;

    console.log('Calling Anthropic API for comprehensive analysis...');

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-20250514',
        max_tokens: 8000,
        temperature: 0,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Anthropic API response received');

    // Parse the analysis result
    let analysisResult;
    try {
      const content = result.content[0].text;
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      console.error('Raw content:', result.content[0].text);
      throw new Error('Invalid response format from Claude');
    }

    // Save calculated financial data to financial_data table
    const financialDataEntries = [];
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Prepare financial data entries for each category
    for (const [category, data] of Object.entries(analysisResult.dashboard_data)) {
      if (data && typeof data === 'object') {
        financialDataEntries.push({
          user_id: session.user_id,
          period_date: currentDate,
          data_type: category,
          period_type: 'annual',
          data_content: data,
          period_year: new Date().getFullYear()
        });
      }
    }

    // Insert financial data
    if (financialDataEntries.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('financial_data')
        .insert(financialDataEntries);

      if (insertError) {
        console.error('Error saving financial data:', insertError);
      } else {
        console.log('Financial data saved successfully');
      }
    }

    // Update test session with comprehensive results
    const { error: updateError } = await supabaseClient
      .from('test_sessions')
      .update({
        financial_analysis_results: analysisResult,
        financial_analysis_status: 'completed',
        analysis_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      throw new Error(`Error updating session: ${updateError.message}`);
    }

    console.log('Comprehensive analysis completed for session:', sessionId);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in comprehensive analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});