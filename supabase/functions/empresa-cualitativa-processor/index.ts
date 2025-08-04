import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyData {
  company_name: string;
  sector?: string;
  industry?: string;
  founded_year?: number;
  employees?: string;
  revenue?: string;
  headquarters?: string;
  website?: string;
  description?: string;
  currency_code?: string;
  accounting_standard?: string;
  consolidation?: string;
  cif?: string;
}

interface ShareholderData {
  shareholder_name: string;
  shareholder_type: 'persona' | 'empresa';
  country?: string;
  ownership_pct?: number;
  notes?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function parseCSVContent(csvContent: string): { companyData: CompanyData | null; shareholderData: ShareholderData[] } {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  
  let companyData: CompanyData | null = null;
  const shareholderData: ShareholderData[] = [];
  let currentSection = '';
  
  for (const line of lines) {
    // Detect section headers
    if (line.includes('EMPRESA')) {
      currentSection = 'empresa';
      continue;
    } else if (line.includes('ESTRUCTURA_ACCIONARIAL')) {
      currentSection = 'accionarial';
      continue;
    }
    
    // Skip header lines
    if (line.includes('company_name') || line.includes('shareholder_name')) {
      continue;
    }
    
    // Parse data lines
    const values = line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
    
    if (currentSection === 'empresa' && values.length >= 3) {
      const [
        company_name,
        sector,
        industry,
        founded_year,
        employees_range,
        annual_revenue_range,
        hq_city,
        hq_country,
        website,
        business_description,
        currency_code,
        accounting_standard,
        consolidation,
        cif
      ] = values;
      
      companyData = {
        company_name,
        sector: sector || undefined,
        industry: industry || undefined,
        founded_year: founded_year && !isNaN(Number(founded_year)) ? Number(founded_year) : undefined,
        employees: employees_range || undefined,
        revenue: annual_revenue_range || undefined,
        headquarters: (hq_city && hq_country) ? `${hq_city}, ${hq_country}` : (hq_city || hq_country || undefined),
        website: website || undefined,
        description: business_description || undefined,
        currency_code: currency_code || undefined,
        accounting_standard: accounting_standard || undefined,
        consolidation: consolidation || undefined,
        cif: cif || undefined
      };
    } else if (currentSection === 'accionarial' && values.length >= 4) {
      const [
        shareholder_name,
        shareholder_type,
        country,
        ownership_pct,
        notes
      ] = values;
      
      if (shareholder_name && (shareholder_type === 'persona' || shareholder_type === 'empresa')) {
        shareholderData.push({
          shareholder_name,
          shareholder_type,
          country: country || undefined,
          ownership_pct: ownership_pct && !isNaN(Number(ownership_pct)) ? Number(ownership_pct) : undefined,
          notes: notes || undefined
        });
      }
    }
  }
  
  return { companyData, shareholderData };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const targetUserId = formData.get('targetUserId') as string;

    if (!file) {
      throw new Error('No se proporcionó archivo');
    }

    if (!targetUserId) {
      throw new Error('No se proporcionó ID de usuario objetivo');
    }

    // Read and parse CSV content
    const csvContent = await file.text();
    const { companyData, shareholderData } = parseCSVContent(csvContent);

    if (!companyData) {
      throw new Error('No se encontró información válida de empresa en el archivo CSV');
    }

    console.log('Parsed company data:', companyData);
    console.log('Parsed shareholder data:', shareholderData);

    // Check for existing company by CIF or name
    let company = null;
    if (companyData.cif) {
      // Try to find by CIF first
      const { data: existingByCif } = await supabase
        .from('company_info_normalized')
        .select('company_id, companies(name, currency_code, accounting_standard)')
        .ilike('company_name', `%${companyData.cif}%`)
        .maybeSingle();
      
      if (existingByCif?.companies) {
        company = {
          id: existingByCif.company_id,
          name: existingByCif.companies.name,
          currency_code: existingByCif.companies.currency_code,
          accounting_standard: existingByCif.companies.accounting_standard
        };
      }
    }

    if (!company) {
      // Try to find by normalized name
      const { data: existingByName } = await supabase
        .from('companies')
        .select('id, name, currency_code, accounting_standard')
        .ilike('name', companyData.company_name)
        .maybeSingle();
      
      if (existingByName) {
        company = existingByName;
      }
    }

    let companyId: string;

    if (company) {
      // Update existing company info
      companyId = company.id;
      console.log(`Updating existing company: ${company.name} (${companyId})`);
      
      // Update company basic info if needed
      if (companyData.currency_code || companyData.accounting_standard || companyData.sector) {
        const updateData: any = {};
        if (companyData.currency_code) updateData.currency_code = companyData.currency_code;
        if (companyData.accounting_standard) updateData.accounting_standard = companyData.accounting_standard;
        if (companyData.sector) updateData.sector = companyData.sector;
        
        await supabase
          .from('companies')
          .update(updateData)
          .eq('id', companyId);
      }
    } else {
      // Create new company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyData.company_name,
          currency_code: companyData.currency_code || 'EUR',
          accounting_standard: companyData.accounting_standard || 'PGC',
          sector: companyData.sector,
          created_by: targetUserId
        })
        .select('id, name, currency_code, accounting_standard')
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        throw new Error('Failed to create company');
      }

      companyId = newCompany.id;
      company = newCompany;
      console.log(`Created new company: ${newCompany.name} (${companyId})`);
    }

    // Upsert company info normalized data
    await supabase
      .from('company_info_normalized')
      .upsert({
        company_id: companyId,
        company_name: companyData.company_name,
        sector: companyData.sector,
        industry: companyData.industry,
        employees_count: companyData.employees ? parseInt(companyData.employees) : null,
        founded_year: companyData.founded_year,
        headquarters: companyData.headquarters,
        website: companyData.website,
        description: companyData.description,
        products: [],
        competitors: [],
        uploaded_by: targetUserId
      }, {
        onConflict: 'company_id'
      });

    // Save company description
    const { error: companyError } = await supabase
      .from('company_descriptions')
      .upsert({
        user_id: targetUserId,
        company_name: companyData.company_name,
        description: companyData.description,
        sector: companyData.sector,
        industry: companyData.industry,
        founded_year: companyData.founded_year,
        employees: companyData.employees,
        revenue: companyData.revenue,
        headquarters: companyData.headquarters,
        website: companyData.website,
        data_source: 'csv_upload'
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (companyError) {
      console.error('Error saving company data:', companyError);
      throw new Error(`Error guardando datos de empresa: ${companyError.message}`);
    }

    // Save shareholder data if provided
    let shareholderResult = null;
    if (shareholderData.length > 0) {
      // First, get or create shareholder info record
      const { data: existingInfo, error: getError } = await supabase
        .from('company_shareholder_info')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('company_name', companyData.company_name)
        .maybeSingle();

      if (getError && getError.code !== 'PGRST116') {
        console.error('Error checking existing shareholder info:', getError);
        throw new Error(`Error verificando información accionarial: ${getError.message}`);
      }

      // Prepare shareholder structure data
      const shareholderStructure = shareholderData.map(item => ({
        name: item.shareholder_name,
        type: item.shareholder_type,
        country: item.country,
        ownership_percentage: item.ownership_pct,
        notes: item.notes,
        data_source: 'csv_upload'
      }));

      if (existingInfo) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('company_shareholder_info')
          .update({
            shareholder_structure: shareholderStructure,
            data_source: 'csv_upload',
            last_updated_by: 'csv_upload'
          })
          .eq('id', existingInfo.id);

        if (updateError) {
          console.error('Error updating shareholder data:', updateError);
          throw new Error(`Error actualizando estructura accionarial: ${updateError.message}`);
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('company_shareholder_info')
          .insert({
            user_id: targetUserId,
            company_name: companyData.company_name,
            shareholder_structure: shareholderStructure,
            data_source: 'csv_upload',
            last_updated_by: 'csv_upload'
          });

        if (insertError) {
          console.error('Error inserting shareholder data:', insertError);
          throw new Error(`Error guardando estructura accionarial: ${insertError.message}`);
        }
      }

      shareholderResult = shareholderData;
    }

    const response = {
      success: true,
      message: `Información cargada exitosamente: ${companyData.company_name}${shareholderData.length > 0 ? ` con ${shareholderData.length} accionista(s)` : ''}`,
      companyId,
      company_name: company?.name || companyData.company_name,
      currency_code: company?.currency_code || companyData.currency_code || 'EUR',
      accounting_standard: company?.accounting_standard || companyData.accounting_standard || 'PGC',
      meta: {
        sector: companyData.sector,
        industry: companyData.industry,
        employees: companyData.employees,
        founded_year: companyData.founded_year?.toString(),
        headquarters: companyData.headquarters,
        website: companyData.website,
        description: companyData.description,
        from_template: !!(companyData.currency_code || companyData.accounting_standard)
      },
      companyData,
      shareholderData: shareholderResult
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in empresa-cualitativa-processor:', error);
    
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido procesando plantilla'
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});