import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { company_name, search_type = 'full' } = await req.json();
    
    if (!company_name) {
      return new Response(
        JSON.stringify({ error: 'Company name is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Searching shareholder information for: ${company_name}`);

    // Construct search query based on type
    let searchQuery = '';
    switch (search_type) {
      case 'shareholders':
        searchQuery = `Estructura accionaria de ${company_name}. Lista de accionistas principales, participaciones, y propietarios de la empresa.`;
        break;
      case 'management':
        searchQuery = `Equipo directivo de ${company_name}. CEO, directores, ejecutivos principales, formación académica y experiencia profesional.`;
        break;
      case 'board':
        searchQuery = `Consejo de administración de ${company_name}. Miembros del consejo, presidente, consejeros independientes.`;
        break;
      default:
        searchQuery = `Información corporativa completa de ${company_name}: estructura accionaria, accionistas principales, equipo directivo, consejo de administración, CEO, fundadores, formación académica y experiencia profesional de directivos.`;
    }

    // Search with Perplexity API
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: `Eres un analista financiero especializado en investigación corporativa. Tu tarea es encontrar información precisa y actualizada sobre la estructura corporativa de empresas. 

Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "company_name": "nombre de la empresa",
  "shareholders": [
    {
      "name": "nombre del accionista",
      "percentage": "porcentaje de participación",
      "type": "individual/institutional/corporate",
      "description": "breve descripción"
    }
  ],
  "management_team": [
    {
      "name": "nombre completo",
      "position": "cargo",
      "education": "formación académica",
      "experience": "experiencia profesional relevante",
      "tenure": "tiempo en el cargo"
    }
  ],
  "board_of_directors": [
    {
      "name": "nombre completo",
      "position": "cargo en el consejo",
      "independent": "true/false",
      "background": "experiencia previa"
    }
  ],
  "founding_partners": [
    {
      "name": "nombre del fundador",
      "role": "rol actual en la empresa",
      "background": "experiencia previa a la fundación"
    }
  ],
  "key_investors": [
    {
      "name": "nombre del inversor",
      "type": "VC/PE/strategic/individual",
      "investment_details": "detalles de la inversión"
    }
  ],
  "data_sources": ["lista de fuentes utilizadas"],
  "confidence_score": "valor entre 0-100",
  "last_updated": "fecha de la información más reciente"
}

Si no encuentras información específica para alguna sección, devuelve un array vacío. Busca información en registros mercantiles, informes anuales, sitios web oficiales, y fuentes financieras confiables.`
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 2000,
        search_domain_filter: ['bloomberg.com', 'reuters.com', 'sec.gov', 'companieshouse.gov.uk'],
        search_recency_filter: 'year',
        return_images: false,
        return_related_questions: false
      }),
    });

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    const perplexityData = await perplexityResponse.json();
    const searchResults = perplexityData.choices[0]?.message?.content;

    console.log('Perplexity search completed');

    // Parse JSON response
    let parsedResults;
    try {
      // Clean the response to extract JSON
      const jsonMatch = searchResults.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResults = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Perplexity response:', parseError);
      // Fallback: create a structured response from the text
      parsedResults = {
        company_name: company_name,
        shareholders: [],
        management_team: [],
        board_of_directors: [],
        founding_partners: [],
        key_investors: [],
        raw_text: searchResults,
        data_sources: ['perplexity_search'],
        confidence_score: 50,
        last_updated: new Date().toISOString()
      };
    }

    // Store search results in database
    const { error: searchHistoryError } = await supabase
      .from('shareholder_search_history')
      .insert({
        user_id: user.id,
        company_name: company_name,
        search_query: searchQuery,
        search_results: parsedResults,
        status: 'completed'
      });

    if (searchHistoryError) {
      console.error('Error storing search history:', searchHistoryError);
    }

    // Check if company shareholder info already exists
    const { data: existingInfo } = await supabase
      .from('company_shareholder_info')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_name', company_name)
      .maybeSingle();

    if (existingInfo) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('company_shareholder_info')
        .update({
          shareholder_structure: parsedResults.shareholders || [],
          management_team: parsedResults.management_team || [],
          board_of_directors: parsedResults.board_of_directors || [],
          key_investors: parsedResults.key_investors || [],
          founding_partners: parsedResults.founding_partners || [],
          data_source: 'perplexity',
          last_updated_by: 'perplexity_search',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInfo.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('company_shareholder_info')
        .insert({
          user_id: user.id,
          company_name: company_name,
          shareholder_structure: parsedResults.shareholders || [],
          management_team: parsedResults.management_team || [],
          board_of_directors: parsedResults.board_of_directors || [],
          key_investors: parsedResults.key_investors || [],
          founding_partners: parsedResults.founding_partners || [],
          data_source: 'perplexity',
          last_updated_by: 'perplexity_search'
        });

      if (insertError) {
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedResults,
        message: 'Búsqueda completada y datos almacenados exitosamente'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in company-shareholder-search function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});