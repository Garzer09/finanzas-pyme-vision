import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LongTemplateRequest {
  templateType: 'pyg' | 'balance' | 'cashflow' | 'debt-pool' | 'debt-maturities';
  years: number[];
  companyId?: string;
  periods?: Array<{
    year: number;
    quarter?: number;
    month?: number;
  }>;
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

    const { templateType, years, companyId, periods }: LongTemplateRequest = await req.json();

    console.log('Generating long template:', { templateType, years, companyId });

    // Get base concepts for each template type
    const templateConfig = getTemplateConfig(templateType);
    
    // Generate periods (default to year-end dates if not specified)
    const generatedPeriods = periods || years.map(year => ({
      year,
      period: `${year}-12-31`,
      periodType: 'annual'
    }));

    // Generate long format template content
    const templateContent = generateLongFormatContent(templateConfig, generatedPeriods);
    
    // Create filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const yearRange = years.length > 1 ? `${Math.min(...years)}-${Math.max(...years)}` : years[0].toString();
    const filename = `${templateConfig.name}-long-${yearRange}-${timestamp}.csv`;

    // Log generation history if user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (authHeader && companyId) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      
      if (user) {
        await supabase
          .from('upload_history')
          .insert({
            user_id: user.id,
            company_id: companyId,
            file_name: filename,
            file_type: 'template_generation',
            file_size: new TextEncoder().encode(templateContent).length,
            status: 'completed',
            metadata: {
              template_type: templateType,
              format: 'long',
              years: years,
              periods: generatedPeriods.length
            }
          });
      }
    }

    return new Response(JSON.stringify({
      content: templateContent,
      filename: filename,
      metadata: {
        templateType,
        format: 'long',
        years,
        periodsCount: generatedPeriods.length,
        conceptsCount: templateConfig.concepts.length
      }
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200
    });

  } catch (error) {
    console.error('Error generating long template:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function getTemplateConfig(templateType: string) {
  switch (templateType) {
    case 'pyg':
      return {
        name: 'cuenta-pyg',
        headers: ['Concepto', 'Periodo', 'Año', 'Importe', 'Notas'],
        concepts: [
          'Cifra de negocios',
          'Aprovisionamientos',
          'Gastos de personal',
          'Otros gastos de explotación',
          'Amortización del inmovilizado',
          'Imputación de subvenciones de inmovilizado no financiero y otras',
          'Excesos de provisiones',
          'Deterioro y resultado por enajenaciones del inmovilizado',
          'Otros resultados',
          'Ingresos financieros',
          'Gastos financieros',
          'Variación de valor razonable en instrumentos financieros',
          'Diferencias de cambio',
          'Deterioro y resultado por enajenaciones de instrumentos financieros',
          'Impuesto sobre beneficios'
        ]
      };
    
    case 'balance':
      return {
        name: 'balance-situacion',
        headers: ['Concepto', 'Seccion', 'Periodo', 'Año', 'Importe', 'Notas'],
        concepts: [
          { name: 'Inmovilizado intangible', section: 'Activo no corriente' },
          { name: 'Inmovilizado material', section: 'Activo no corriente' },
          { name: 'Inversiones inmobiliarias', section: 'Activo no corriente' },
          { name: 'Inversiones en empresas del grupo y asociadas a largo plazo', section: 'Activo no corriente' },
          { name: 'Inversiones financieras a largo plazo', section: 'Activo no corriente' },
          { name: 'Activos por impuesto diferido', section: 'Activo no corriente' },
          { name: 'Deudores comerciales no corrientes', section: 'Activo no corriente' },
          { name: 'Activos no corrientes mantenidos para la venta', section: 'Activo corriente' },
          { name: 'Existencias', section: 'Activo corriente' },
          { name: 'Deudores comerciales y otras cuentas a cobrar', section: 'Activo corriente' },
          { name: 'Inversiones en empresas del grupo y asociadas a corto plazo', section: 'Activo corriente' },
          { name: 'Inversiones financieras a corto plazo', section: 'Activo corriente' },
          { name: 'Periodificaciones a corto plazo', section: 'Activo corriente' },
          { name: 'Efectivo y otros activos líquidos equivalentes', section: 'Activo corriente' },
          { name: 'Capital', section: 'Patrimonio neto' },
          { name: 'Prima de emisión', section: 'Patrimonio neto' },
          { name: 'Reservas', section: 'Patrimonio neto' },
          { name: 'Acciones y participaciones en patrimonio propias', section: 'Patrimonio neto' },
          { name: 'Resultados de ejercicios anteriores', section: 'Patrimonio neto' },
          { name: 'Otras aportaciones de socios', section: 'Patrimonio neto' },
          { name: 'Resultado del ejercicio', section: 'Patrimonio neto' },
          { name: 'Dividendo a cuenta', section: 'Patrimonio neto' },
          { name: 'Otros instrumentos de patrimonio neto', section: 'Patrimonio neto' },
          { name: 'Ajustes por cambios de valor', section: 'Patrimonio neto' },
          { name: 'Subvenciones donaciones y legados recibidos', section: 'Patrimonio neto' },
          { name: 'Provisiones a largo plazo', section: 'Pasivo no corriente' },
          { name: 'Deudas a largo plazo', section: 'Pasivo no corriente' },
          { name: 'Deudas con empresas del grupo y asociadas a largo plazo', section: 'Pasivo no corriente' },
          { name: 'Pasivos por impuesto diferido', section: 'Pasivo no corriente' },
          { name: 'Periodificaciones a largo plazo', section: 'Pasivo no corriente' },
          { name: 'Acreedores comerciales no corrientes', section: 'Pasivo no corriente' },
          { name: 'Pasivos vinculados con activos no corrientes mantenidos para la venta', section: 'Pasivo corriente' },
          { name: 'Provisiones a corto plazo', section: 'Pasivo corriente' },
          { name: 'Deudas a corto plazo', section: 'Pasivo corriente' },
          { name: 'Deudas con empresas del grupo y asociadas a corto plazo', section: 'Pasivo corriente' },
          { name: 'Acreedores comerciales y otras cuentas a pagar', section: 'Pasivo corriente' },
          { name: 'Periodificaciones a corto plazo', section: 'Pasivo corriente' }
        ]
      };
    
    case 'cashflow':
      return {
        name: 'estado-flujos',
        headers: ['Concepto', 'Categoria', 'Periodo', 'Año', 'Importe', 'Notas'],
        concepts: [
          { name: 'Resultado del ejercicio antes de impuestos', category: 'Actividades de explotación' },
          { name: 'Ajustes del resultado', category: 'Actividades de explotación' },
          { name: 'Amortización del inmovilizado', category: 'Actividades de explotación' },
          { name: 'Correcciones valorativas por deterioro', category: 'Actividades de explotación' },
          { name: 'Variación de provisiones', category: 'Actividades de explotación' },
          { name: 'Imputación de subvenciones de inmovilizado no financiero y otras', category: 'Actividades de explotación' },
          { name: 'Resultados por bajas y enajenaciones del inmovilizado', category: 'Actividades de explotación' },
          { name: 'Resultados por bajas y enajenaciones de instrumentos financieros', category: 'Actividades de explotación' },
          { name: 'Ingresos financieros', category: 'Actividades de explotación' },
          { name: 'Gastos financieros', category: 'Actividades de explotación' },
          { name: 'Diferencias de cambio', category: 'Actividades de explotación' },
          { name: 'Variación de valor razonable en instrumentos financieros', category: 'Actividades de explotación' },
          { name: 'Otros ingresos y gastos', category: 'Actividades de explotación' },
          { name: 'Deudores y otras cuentas a cobrar', category: 'Actividades de explotación' },
          { name: 'Otros activos corrientes', category: 'Actividades de explotación' },
          { name: 'Acreedores y otras cuentas a pagar', category: 'Actividades de explotación' },
          { name: 'Otros pasivos corrientes', category: 'Actividades de explotación' },
          { name: 'Otros activos y pasivos no corrientes', category: 'Actividades de explotación' },
          { name: 'Pagos de inversiones', category: 'Actividades de inversión' },
          { name: 'Cobros de desinversiones', category: 'Actividades de inversión' },
          { name: 'Cobros por emisión de instrumentos de patrimonio', category: 'Actividades de financiación' },
          { name: 'Pagos por amortización y reembolso de instrumentos de patrimonio', category: 'Actividades de financiación' },
          { name: 'Cobros por emisión de instrumentos de pasivo financiero', category: 'Actividades de financiación' },
          { name: 'Pagos por amortización y reembolso de instrumentos de pasivo financiero', category: 'Actividades de financiación' },
          { name: 'Pagos por dividendos y remuneraciones de otros instrumentos de patrimonio', category: 'Actividades de financiación' }
        ]
      };
    
    default:
      throw new Error(`Template type ${templateType} not supported`);
  }
}

function generateLongFormatContent(config: any, periods: any[]): string {
  const lines = [config.headers.join(',')];
  
  for (const period of periods) {
    for (const concept of config.concepts) {
      const row = [];
      
      if (typeof concept === 'string') {
        // Simple concept (for P&G)
        row.push(concept);
        if (config.headers.includes('Seccion')) row.push('');
        if (config.headers.includes('Categoria')) row.push('');
        row.push(period.period);
        row.push(period.year.toString());
        row.push('0');
        row.push('');
      } else {
        // Complex concept with additional fields (for Balance/Cashflow)
        row.push(concept.name);
        if (config.headers.includes('Seccion')) row.push(concept.section || '');
        if (config.headers.includes('Categoria')) row.push(concept.category || '');
        row.push(period.period);
        row.push(period.year.toString());
        row.push('0');
        row.push('');
      }
      
      lines.push(row.join(','));
    }
  }
  
  return lines.join('\n');
}