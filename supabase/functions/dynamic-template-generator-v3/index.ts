import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateAllTemplatesRequest {
  company_id?: string;
  external_id?: string;
  years?: number[];
  include_sample_data?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 Generating all dynamic templates...');
    
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

    const request: GenerateAllTemplatesRequest = await req.json();
    const {
      company_id,
      external_id = 'COMPANY_ID',
      years = [2022, 2023, 2024],
      include_sample_data = true
    } = request;

    console.log(`📋 Generating all templates for years: ${years.join(', ')}`);

    // Generate all templates
    const templates = await generateAllTemplates(supabase, external_id, years, include_sample_data);

    // Create ZIP file with all templates
    const zipContent = await createTemplatesZip(templates);

    // Log generation history
    if (company_id) {
      await supabase.from('template_generation_history').insert({
        user_id: user.id,
        company_id,
        generated_filename: `templates_pack_${Date.now()}.zip`,
        generation_parameters: {
          template_type: 'all_templates',
          external_id,
          years,
          include_sample_data,
          templates_count: templates.length
        },
        file_size: zipContent.length
      });
    }

    return new Response(zipContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="templates_pack_${Date.now()}.zip"`
      }
    });

  } catch (error) {
    console.error('❌ Template generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateAllTemplates(
  supabase: any,
  externalId: string,
  years: number[],
  includeSampleData: boolean
): Promise<Array<{ name: string; content: string }>> {
  
  const templates = [];

  // 1. Financial Series Template (dynamic from metrics_dictionary)
  const financialSeriesContent = await generateFinancialSeriesTemplate(
    supabase, externalId, years, ['Y', 'Q', 'M'], includeSampleData
  );
  templates.push({
    name: 'financial_series_unified.csv',
    content: financialSeriesContent
  });

  // 2. Company Profile Template (dynamic structure)
  const companyProfileContent = await generateCompanyProfileTemplate(
    supabase, externalId, includeSampleData
  );
  templates.push({
    name: 'company_profile_unified.csv',
    content: companyProfileContent
  });

  // 3. Debt Loans Template (with dynamic validations)
  const debtLoansContent = generateDebtLoansTemplate(externalId, includeSampleData);
  templates.push({
    name: 'debt_loans.csv',
    content: debtLoansContent
  });

  // 4. Debt Balances Template
  const debtBalancesContent = generateDebtBalancesTemplate(externalId, years, includeSampleData);
  templates.push({
    name: 'debt_balances.csv',
    content: debtBalancesContent
  });

  console.log(`✅ Generated ${templates.length} templates`);
  return templates;
}

async function generateFinancialSeriesTemplate(
  supabase: any,
  externalId: string,
  years: number[],
  frequencies: string[],
  includeSampleData: boolean
): Promise<string> {
  
  // Get metrics from dictionary with aliases
  const { data: metrics, error } = await supabase
    .from('metrics_dictionary')
    .select(`
      metric_code,
      metric_name,
      category,
      value_kind,
      default_unit,
      description
    `)
    .eq('is_active', true)
    .order('category, metric_code');

  if (error) {
    console.error('❌ Error fetching metrics:', error);
    throw new Error('Failed to fetch metrics dictionary');
  }

  let content = 'external_id,metric_code,frequency,period,value,currency,unit,value_kind,scenario,product_code,region_code,customer_code,source,notes\n';

  if (includeSampleData && metrics) {
    // Generate comprehensive sample data
    const scenarios = ['actual', 'budget', 'forecast'];
    const sampleMetrics = metrics.slice(0, 15); // More comprehensive sample

    for (const metric of sampleMetrics) {
      for (const frequency of frequencies) {
        for (const year of years) {
          for (const scenario of scenarios.slice(0, frequency === 'Y' ? 3 : 1)) { // Full scenarios only for yearly
            const period = formatPeriod(year, frequency);
            const sampleValue = generateSampleValue(metric.category, metric.value_kind);
            
            content += `${externalId},${metric.metric_code},${frequency},${period},${sampleValue},EUR,${metric.default_unit},${metric.value_kind},${scenario},,ES,ALL,financial_statements,"${metric.description || metric.metric_name}"\n`;
          }
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
    
    // Extended profile fields based on real requirements
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
      ['website', 'https://empresa-ejemplo.es', 'https://empresa.com', '0.7', 'Sitio web corporativo'],
      ['description', 'Empresa de desarrollo de software empresarial', 'https://empresa.com', '0.8', 'Descripción de la actividad'],
      ['business_model', 'B2B SaaS', 'internal_analysis', '0.9', 'Modelo de negocio principal'],
      ['market_position', 'Líder regional', 'market_research', '0.7', 'Posición en el mercado'],
      ['main_products', 'Software de gestión empresarial', 'website', '0.8', 'Productos principales'],
      ['key_clients', 'PYMES y empresas medianas', 'sales_analysis', '0.8', 'Tipología de clientes'],
      ['competitive_advantage', 'Especialización sectorial', 'internal_analysis', '0.8', 'Ventaja competitiva clave']
    ];

    for (const [fieldName, fieldValue, sourceUrl, confidence, notes] of profileFields) {
      content += `${externalId},PROFILE,${currentDate},${fieldName},"${fieldValue}",${sourceUrl},${confidence},"${notes}"\n`;
    }

    // Extended shareholder data
    const shareholderData = [
      ['holder_name', 'Juan Pérez González', 'https://registromercantil.org', '1.0', 'Fundador y CEO'],
      ['holder_type', 'person', 'https://registromercantil.org', '1.0', 'Persona física'],
      ['direct_pct', '60.5', 'https://registromercantil.org', '1.0', 'Participación directa mayoritaria'],
      ['control_mechanism', 'ordinary_shares', 'https://registromercantil.org', '1.0', 'Acciones ordinarias'],
      ['holder_name', 'Capital Semilla Ventures', 'https://registromercantil.org', '1.0', 'Fondo de inversión'],
      ['holder_type', 'entity', 'https://registromercantil.org', '1.0', 'Entidad jurídica'],
      ['direct_pct', '25.0', 'https://registromercantil.org', '1.0', 'Participación minoritaria estratégica'],
      ['control_mechanism', 'preferred_shares', 'https://registromercantil.org', '1.0', 'Acciones preferentes']
    ];

    for (const [fieldName, fieldValue, sourceUrl, confidence, notes] of shareholderData) {
      content += `${externalId},SHAREHOLDER,${currentDate},${fieldName},"${fieldValue}",${sourceUrl},${confidence},"${notes}"\n`;
    }
  }

  return content;
}

function generateDebtLoansTemplate(externalId: string, includeSampleData: boolean): string {
  let content = 'external_id,loan_key,entity_name,loan_type,initial_amount,interest_rate,maturity_date,guarantees,observations,currency_code\n';

  if (includeSampleData) {
    const sampleLoans = [
      ['LOAN_001', 'Banco Santander', 'Préstamo participativo', '500000', '4.5', '2027-12-31', 'Sin garantías específicas', 'Financiación para expansión', 'EUR'],
      ['LOAN_002', 'BBVA', 'Línea de crédito', '200000', '3.2', '2025-06-30', 'Aval personal fundador', 'Circulante para operaciones', 'EUR'],
      ['LOAN_003', 'ICO', 'Préstamo innovación', '150000', '2.8', '2026-03-31', 'Garantía hipotecaria', 'Proyecto I+D+i', 'EUR']
    ];

    for (const loan of sampleLoans) {
      content += `${externalId},${loan.join(',')}\n`;
    }
  }

  return content;
}

function generateDebtBalancesTemplate(externalId: string, years: number[], includeSampleData: boolean): string {
  let content = 'external_id,loan_id,year,year_end_balance\n';

  if (includeSampleData) {
    const loanIds = [1, 2, 3]; // Corresponding to LOAN_001, LOAN_002, LOAN_003
    
    for (const loanId of loanIds) {
      for (const year of years) {
        // Simulate decreasing balances over time
        const baseBalance = loanId === 1 ? 500000 : loanId === 2 ? 200000 : 150000;
        const yearIndex = years.indexOf(year);
        const balance = Math.round(baseBalance * (1 - (yearIndex * 0.2))); // 20% reduction per year
        
        content += `${externalId},${loanId},${year},${Math.max(balance, 0)}\n`;
      }
    }
  }

  return content;
}

async function createTemplatesZip(templates: Array<{ name: string; content: string }>): Promise<Uint8Array> {
  // Simple ZIP implementation for templates
  // In a real implementation, you'd use a proper ZIP library
  // For now, we'll return the templates as a JSON bundle that can be processed by the frontend
  
  const bundle = {
    templates: templates,
    generated_at: new Date().toISOString(),
    format: 'template_bundle_v1'
  };
  
  const bundleString = JSON.stringify(bundle, null, 2);
  return new TextEncoder().encode(bundleString);
}

function formatPeriod(year: number, frequency: string): string {
  switch (frequency) {
    case 'Y':
      return year.toString();
    case 'Q':
      return `${year}-Q4`; // Default to Q4 for sample
    case 'M':
      return `${year}-12`; // Default to December
    case 'ASOF':
      return `${year}-12-31`; // Default to year-end
    default:
      return year.toString();
  }
}

function generateSampleValue(category: string, valueKind: string): number {
  // Enhanced sample value generation
  const baseValues: Record<string, number> = {
    'balance': valueKind === 'stock' ? Math.floor(Math.random() * 15000000) + 2000000 : 0,
    'pyg': Math.floor(Math.random() * 8000000) + 1000000,
    'cashflow': Math.floor(Math.random() * 3000000) + 200000,
    'operational': Math.floor(Math.random() * 150) + 20,
    'debt': Math.floor(Math.random() * 5000000) + 500000,
    'assumptions': Math.round((Math.random() * 25 + 1) * 100) / 100, // 1-26% range
    'ratios': Math.round((Math.random() * 50 + 5) * 100) / 100 // 5-55% range
  };

  return baseValues[category] || Math.floor(Math.random() * 2000000);
}