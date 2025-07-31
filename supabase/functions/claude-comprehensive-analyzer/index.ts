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

    // Create comprehensive system prompt
    const systemPrompt = `Assume the role of an expert financial analyst. Your task is to analyze financial statements of a company to develop a comprehensive financial dashboard. Follow these instructions carefully:

1. Review the financial files provided and the EDA results:
<eda_results>
${JSON.stringify(edaResults, null, 2)}
</eda_results>

2. Conduct a comprehensive analysis:
   - Examine the structure and content of each file
   - Identify key financial metrics and their relationships
   - Note any anomalies, trends, or patterns in the data

3. Identify existing variables and potential gaps:
   - List all variables present in the provided files
   - Compare these with the required dashboard variables:
   <dashboard_variables>
   ${JSON.stringify(dashboardVariables, null, 2)}
   </dashboard_variables>
   - Identify any missing variables needed to complete the dashboard

4. Perform necessary calculations:
   - Use the available data to calculate any missing variables
   - Apply standard financial formulas and ratios as needed
   - Ensure all calculations are accurate and properly documented
   - Show your work step by step for each calculation

5. Provide relevant insights for the specified variables:
   - Analyze trends and patterns in the data
   - Compare key metrics to industry standards or historical performance
   - Highlight any significant findings or potential areas of concern
   - Provide actionable recommendations

6. Generate confidence scores:
   - Assign confidence scores (0-1) for each calculated variable
   - Note data quality issues or limitations
   - Highlight areas where additional data would improve accuracy

You must respond with a valid JSON object following this exact structure:

{
  "calculations": {
    "performed": [
      {
        "variable": "variable_name",
        "formula": "formula_used",
        "inputs": {"input1": value1, "input2": value2},
        "result": calculated_value,
        "confidence": 0.95,
        "explanation": "step by step explanation"
      }
    ],
    "missing_data": ["variable1", "variable2"],
    "estimated": [
      {
        "variable": "variable_name", 
        "method": "estimation_method",
        "result": estimated_value,
        "confidence": 0.7,
        "explanation": "explanation of estimation"
      }
    ]
  },
  "insights": [
    {
      "category": "liquidity|profitability|solvency|efficiency|growth",
      "title": "insight_title",
      "description": "detailed_analysis",
      "severity": "low|medium|high",
      "recommendation": "actionable_recommendation",
      "affected_metrics": ["metric1", "metric2"]
    }
  ],
  "dashboard_data": {
    "balance": {
      "activo_corriente": value,
      "activo_no_corriente": value,
      // ... all balance variables
    },
    "pyg": {
      "ingresos_explotacion": value,
      "gastos_explotacion": value,
      // ... all P&G variables
    },
    "ratios": {
      "ratio_corriente": value,
      "roe": value,
      // ... all ratio variables
    },
    "cashflow": {
      "flujo_operativo": value,
      // ... all cashflow variables
    },
    "kpis": {
      "ebitda": value,
      "working_capital": value,
      // ... all KPI variables
    }
  },
  "data_quality": {
    "overall_score": 0.85,
    "completeness": 0.9,
    "consistency": 0.8,
    "issues": ["description of data quality issues"],
    "recommendations": ["recommendations to improve data quality"]
  },
  "metadata": {
    "analysis_date": "${new Date().toISOString()}",
    "model": "claude-opus-4-20250514",
    "confidence": 0.9,
    "variables_calculated": 25,
    "variables_estimated": 5,
    "total_variables": 30
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