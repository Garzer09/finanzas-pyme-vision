import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateTemplateRequest {
  template_type: 'financial_series' | 'company_profile';
  company_id?: string;
  external_id?: string;
  years?: number[];
  frequencies?: string[];
  include_sample_data?: boolean;
  format?: 'csv';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 Generating dynamic template...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    );

    if (userError || !user) {
      console.error('❌ Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const request: GenerateTemplateRequest = await req.json();
    const {
      template_type,
      company_id,
      external_id = 'COMPANY_ID',
      years = [2022, 2023, 2024],
      frequencies = ['Y'],
      include_sample_data = true,
      format = 'csv'
    } = request;

    console.log(`📋 Generating ${template_type} template for years: ${years.join(', ')}`);

    let content = '';
    let filename = '';

    if (template_type === 'financial_series') {
      content = await generateFinancialSeriesTemplate(
        supabase,
        external_id,
        years,
        frequencies,
        include_sample_data
      );
      filename = `financial_series_${years.join('-')}_${Date.now()}.csv`;
      
    } else if (template_type === 'company_profile') {
      content = await generateCompanyProfileTemplate(
        supabase,
        external_id,
        include_sample_data
      );
      filename = `company_profile_${Date.now()}.csv`;
      
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid template_type. Must be financial_series or company_profile' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log generation history
    if (company_id) {
      await supabase.from('template_generation_history').insert({
        user_id: user.id,
        company_id,
        generated_filename: filename,
        generation_parameters: {
          template_type,
          external_id,
          years,
          frequencies,
          include_sample_data
        },
        file_size: content.length
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        template_type,
        filename,
        content,
        size: content.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Template generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateFinancialSeriesTemplate(
  supabase: any,
  externalId: string,
  years: number[],
  frequencies: string[],
  includeSampleData: boolean
): Promise<string> {
  
  // Get metrics from dictionary
  const { data: metrics, error } = await supabase
    .from('metrics_dictionary')
    .select('metric_code, metric_name, category, value_kind, default_unit')
    .eq('is_active', true)
    .order('category, metric_code');

  if (error) {
    console.error('❌ Error fetching metrics:', error);
    throw new Error('Failed to fetch metrics dictionary');
  }

  let content = 'external_id,metric_code,frequency,period,value,currency,unit,value_kind,source,notes\n';

  if (includeSampleData && metrics) {
    // Generate sample data for each metric, frequency, and year
    for (const metric of metrics.slice(0, 10)) { // Limit to first 10 metrics for sample
      for (const frequency of frequencies) {
        for (const year of years) {
          const period = formatPeriod(year, frequency);
          const sampleValue = generateSampleValue(metric.category, metric.value_kind);
          
          content += `${externalId},${metric.metric_code},${frequency},${period},${sampleValue},EUR,${metric.default_unit},${metric.value_kind},financial_statements,${metric.metric_name}\n`;
        }
      }
    }
  }

  return content;
}

async function generateCompanyProfileTemplate(
  supabase: any,
  externalId: string,
  includeSampleData: boolean
): Promise<string> {
  
  let content = 'external_id,record_type,as_of_date,field_name,field_value,source_url,confidence,notes\n';

  if (includeSampleData) {
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Sample PROFILE data
    const profileFields = [
      ['legal_name', 'Empresa Ejemplo S.L.', 'https://registromercantil.org', '1.0', 'Denominación social oficial'],
      ['year_founded', '2010', 'https://registromercantil.org', '1.0', 'Año de constitución'],
      ['employees_exact', '85', 'https://seg-social.es', '0.9', 'Plantilla actual'],
      ['annual_revenue_value', '5750000', 'https://registromercantil.org', '1.0', 'Cifra de negocios anual'],
      ['annual_revenue_currency', 'EUR', 'https://registromercantil.org', '1.0', 'Moneda de las cuentas'],
      ['hq_city', 'Madrid', 'https://registromercantil.org', '1.0', 'Domicilio social'],
      ['hq_country_code', 'ES', 'https://registromercantil.org', '1.0', 'País del domicilio'],
      ['sector', 'Tecnología', 'https://cnae.com.es', '0.8', 'Sector de actividad'],
      ['industry_isic', '6201', 'https://cnae.com.es', '0.9', 'Código CNAE'],
      ['website', 'https://empresa-ejemplo.es', 'https://empresa.com', '0.7', 'Sitio web'],
      ['description', 'Empresa de desarrollo de software', 'https://empresa.com', '0.8', 'Descripción actividad']
    ];

    for (const [fieldName, fieldValue, sourceUrl, confidence, notes] of profileFields) {
      content += `${externalId},PROFILE,${currentDate},${fieldName},${fieldValue},${sourceUrl},${confidence},${notes}\n`;
    }

    // Sample SHAREHOLDER data
    const shareholderData = [
      ['holder_name', 'Juan Pérez González', 'https://registromercantil.org', '1.0', 'Accionista principal'],
      ['holder_type', 'person', 'https://registromercantil.org', '1.0', 'Tipo de titular'],
      ['direct_pct', '60.5', 'https://registromercantil.org', '1.0', 'Participación directa'],
      ['control_mechanism', 'ordinary_shares', 'https://registromercantil.org', '1.0', 'Mecanismo de control']
    ];

    for (const [fieldName, fieldValue, sourceUrl, confidence, notes] of shareholderData) {
      content += `${externalId},SHAREHOLDER,${currentDate},${fieldName},${fieldValue},${sourceUrl},${confidence},${notes}\n`;
    }
  }

  return content;
}

function formatPeriod(year: number, frequency: string): string {
  switch (frequency) {
    case 'Y':
      return year.toString();
    case 'Q':
      return `${year}-Q1`; // Default to Q1, user can modify
    case 'M':
      return `${year}-12`; // Default to December
    case 'ASOF':
      return `${year}-12-31`; // Default to year-end
    default:
      return year.toString();
  }
}

function generateSampleValue(category: string, valueKind: string): number {
  // Generate realistic sample values based on category and value kind
  const baseValues: Record<string, number> = {
    'balance': valueKind === 'stock' ? Math.floor(Math.random() * 10000000) + 1000000 : 0,
    'pyg': Math.floor(Math.random() * 5000000) + 500000,
    'cashflow': Math.floor(Math.random() * 2000000) + 100000,
    'operational': Math.floor(Math.random() * 100) + 10,
    'debt': Math.floor(Math.random() * 3000000) + 500000,
    'assumptions': Math.round((Math.random() * 20 + 2) * 100) / 100 // 2-22% range
  };

  return baseValues[category] || Math.floor(Math.random() * 1000000);
}