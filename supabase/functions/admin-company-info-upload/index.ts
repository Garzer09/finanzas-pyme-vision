import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify admin role
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse form data
    const formData = await req.formData()
    const infoEmpresaFile = formData.get('info-empresa.csv') as File

    if (!infoEmpresaFile) {
      return new Response(JSON.stringify({ error: 'Missing info-empresa.csv file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate file size (40MB limit)
    if (infoEmpresaFile.size > 40 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large (max 40MB)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Processing info-empresa.csv: ${infoEmpresaFile.size} bytes`)

    // Parse CSV content
    const csvContent = await infoEmpresaFile.text()
    const companyData = await parseCompanyInfoCsv(csvContent)

    if (!companyData.company_name) {
      return new Response(JSON.stringify({ error: 'Missing company name in CSV' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check for existing company by CIF or name
    let company = null
    if (companyData.cif) {
      // Try to find by CIF first
      const { data: existingByCif } = await supabase
        .from('company_info_normalized')
        .select('company_id, companies(name, currency_code, accounting_standard)')
        .ilike('company_name', `%${companyData.cif}%`)
        .single()
      
      if (existingByCif) {
        company = {
          id: existingByCif.company_id,
          name: existingByCif.companies.name,
          currency_code: existingByCif.companies.currency_code,
          accounting_standard: existingByCif.companies.accounting_standard
        }
      }
    }

    if (!company) {
      // Try to find by normalized name
      const { data: existingByName } = await supabase
        .from('companies')
        .select('id, name, currency_code, accounting_standard')
        .ilike('name', companyData.company_name)
        .single()
      
      if (existingByName) {
        company = existingByName
      }
    }

    let companyId: string

    if (company) {
      // Update existing company info
      companyId = company.id
      console.log(`Updating existing company: ${company.name} (${companyId})`)
      
      // Update company basic info if needed
      if (companyData.currency_code || companyData.accounting_standard || companyData.sector) {
        const updateData: any = {}
        if (companyData.currency_code) updateData.currency_code = companyData.currency_code
        if (companyData.accounting_standard) updateData.accounting_standard = companyData.accounting_standard
        if (companyData.sector) updateData.sector = companyData.sector
        
        await supabase
          .from('companies')
          .update(updateData)
          .eq('id', companyId)
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
          created_by: user.id
        })
        .select('id, name, currency_code, accounting_standard')
        .single()

      if (companyError) {
        console.error('Error creating company:', companyError)
        return new Response(JSON.stringify({ error: 'Failed to create company' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      companyId = newCompany.id
      company = newCompany
      console.log(`Created new company: ${newCompany.name} (${companyId})`)
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
        founded_year: companyData.founded_year ? parseInt(companyData.founded_year) : null,
        headquarters: companyData.headquarters,
        website: companyData.website,
        description: companyData.description,
        products: companyData.products ? [companyData.products] : [],
        competitors: companyData.competitors ? companyData.competitors.split(',').map(c => c.trim()) : [],
        uploaded_by: user.id
      }, {
        onConflict: 'company_id'
      })

    // Return company info for Step 2
    return new Response(JSON.stringify({
      companyId,
      company_name: company.name,
      currency_code: company.currency_code,
      accounting_standard: company.accounting_standard,
      meta: {
        sector: companyData.sector,
        industry: companyData.industry,
        employees: companyData.employees,
        founded_year: companyData.founded_year,
        headquarters: companyData.headquarters,
        website: companyData.website,
        description: companyData.description,
        from_template: !!(companyData.currency_code || companyData.accounting_standard)
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function parseCompanyInfoCsv(csvContent: string): Promise<any> {
  // Normalize CSV content
  const normalized = csvContent
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\r/g, '\n')
    .trim()

  // Detect separator
  const firstLine = normalized.split('\n')[0]
  const separators = [',', ';']
  let separator = ','
  
  for (const sep of separators) {
    if (firstLine.includes(sep)) {
      separator = sep
      break
    }
  }

  const lines = normalized.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    throw new Error('Empty CSV file')
  }

  // Parse field-value pairs
  const companyData: any = {}
  
  for (const line of lines) {
    if (line.startsWith('Campo,') || line.startsWith('Field,')) continue // Skip header
    
    const [field, value] = line.split(separator).map(s => s.trim().replace(/"/g, ''))
    
    if (field && value) {
      switch (field.toLowerCase()) {
        case 'nombre':
        case 'name':
          companyData.company_name = value
          break
        case 'cif':
        case 'tax_id':
          companyData.cif = value
          break
        case 'sector':
          companyData.sector = value
          break
        case 'industria':
        case 'industry':
          companyData.industry = value
          break
        case 'año fundación':
        case 'founded_year':
          companyData.founded_year = value
          break
        case 'empleados':
        case 'employees':
          companyData.employees = value
          break
        case 'sede':
        case 'headquarters':
          companyData.headquarters = value
          break
        case 'web':
        case 'website':
          companyData.website = value
          break
        case 'descripción':
        case 'description':
          companyData.description = value
          break
        case 'productos':
        case 'products':
          companyData.products = value
          break
        case 'competidores':
        case 'competitors':
          companyData.competitors = value
          break
        case 'currency_code':
          companyData.currency_code = value
          break
        case 'accounting_standard':
          companyData.accounting_standard = value
          break
      }
    }
  }

  return companyData
}