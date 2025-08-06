import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log('Financial Summary Analysis function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { companyId, period, financialData, kpis, companyInfo } = await req.json();
    
    console.log('Processing financial analysis for company:', companyId, 'period:', period);
    
    if (!financialData || !kpis) {
      throw new Error('Financial data and KPIs are required');
    }

    // Get company name and additional context
    const { data: company } = await supabase
      .from('companies')
      .select('name, currency_code, sector')
      .eq('id', companyId)
      .single();

    // Get company qualitative info if available
    const { data: qualitativeInfo } = await supabase
      .from('company_info_normalized')
      .select('*')
      .eq('company_id', companyId)
      .single();

    // Prepare context for analysis
    const analysisContext = {
      company: company?.name || 'Empresa',
      sector: company?.sector || qualitativeInfo?.sector || 'No especificado',
      currency: company?.currency_code || 'EUR',
      period: period,
      financialData: {
        revenue: financialData.revenue,
        ebitda: financialData.ebitda,
        netIncome: financialData.net_income,
        totalAssets: financialData.total_assets,
        totalEquity: financialData.total_equity,
        totalDebt: financialData.total_debt
      },
      kpis: kpis.map((kpi: any) => ({
        name: kpi.name,
        value: kpi.value,
        unit: kpi.unit
      })),
      qualitativeContext: qualitativeInfo ? {
        description: qualitativeInfo.description,
        industry: qualitativeInfo.industry,
        employees: qualitativeInfo.employees_count,
        headquarters: qualitativeInfo.headquarters
      } : null
    };

    // Create the analysis prompt
    const prompt = `Eres un analista financiero experto. Analiza los siguientes datos financieros y genera un resumen ejecutivo inteligente e insightful.

DATOS DE LA EMPRESA:
- Empresa: ${analysisContext.company}
- Sector: ${analysisContext.sector}
- Período: ${analysisContext.period}
- Moneda: ${analysisContext.currency}
${analysisContext.qualitativeContext ? `
- Industria: ${analysisContext.qualitativeContext.industry || 'No especificada'}
- Empleados: ${analysisContext.qualitativeContext.employees || 'No especificado'}
- Sede: ${analysisContext.qualitativeContext.headquarters || 'No especificada'}
- Descripción: ${analysisContext.qualitativeContext.description || 'No disponible'}
` : ''}

DATOS FINANCIEROS:
- Ingresos: ${analysisContext.financialData.revenue.toLocaleString()} ${analysisContext.currency}
- EBITDA: ${analysisContext.financialData.ebitda.toLocaleString()} ${analysisContext.currency}
- Resultado Neto: ${analysisContext.financialData.netIncome.toLocaleString()} ${analysisContext.currency}
- Total Activos: ${analysisContext.financialData.totalAssets.toLocaleString()} ${analysisContext.currency}
- Patrimonio Neto: ${analysisContext.financialData.totalEquity.toLocaleString()} ${analysisContext.currency}
- Deuda Total: ${analysisContext.financialData.totalDebt.toLocaleString()} ${analysisContext.currency}

RATIOS CLAVE:
${analysisContext.kpis.map(kpi => `- ${kpi.name}: ${kpi.value.toFixed(2)}${kpi.unit}`).join('\n')}

INSTRUCCIONES:
1. Genera un análisis financiero conciso pero completo (máximo 300 palabras)
2. Incluye insights sobre rentabilidad, solvencia y eficiencia
3. Identifica 2-3 fortalezas principales
4. Señala 2-3 áreas de atención o riesgo
5. Proporciona recomendaciones específicas y accionables
6. Usa un tono profesional pero accesible
7. Considera el contexto sectorial cuando sea relevante

Estructura el análisis en párrafos cortos y utiliza bullet points para las recomendaciones.`;

    console.log('Sending request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Eres un analista financiero senior con más de 15 años de experiencia en análisis empresarial y consultoría financiera. Tu especialidad es generar insights accionables a partir de datos financieros.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.9
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    console.log('Analysis generated successfully');

    return new Response(JSON.stringify({ 
      analysis,
      generatedAt: new Date().toISOString(),
      context: {
        company: analysisContext.company,
        period: analysisContext.period,
        dataPoints: analysisContext.kpis.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in financial-summary-analysis function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate financial analysis'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});