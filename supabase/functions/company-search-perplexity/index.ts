import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanySearchRequest {
  companyName: string;
  additionalContext?: string;
}

interface CompanyInfo {
  name: string;
  description: string;
  sector: string;
  industry: string;
  foundedYear?: number;
  employees?: string;
  revenue?: string;
  headquarters?: string;
  website?: string;
  products?: string[];
  competitors?: string[];
  keyFacts?: string[];
  marketPosition?: string;
  businessModel?: string;
  dataFound: boolean;
  source: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!PERPLEXITY_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'PERPLEXITY_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { companyName, additionalContext }: CompanySearchRequest = await req.json();

    if (!companyName) {
      return new Response(
        JSON.stringify({ error: 'Company name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching for company: ${companyName}`);

    const searchPrompt = `Busca información detallada sobre la empresa "${companyName}"${additionalContext ? ` ${additionalContext}` : ''}. 

Proporciona información estructurada sobre:
1. Descripción general del negocio
2. Sector e industria específica
3. Año de fundación
4. Número aproximado de empleados
5. Ingresos anuales (si está disponible)
6. Sede principal
7. Sitio web oficial
8. Principales productos o servicios
9. Competidores principales
10. Posición en el mercado
11. Modelo de negocio
12. Datos financieros relevantes

Si no encuentras información específica sobre esta empresa, indica claramente que no hay datos disponibles.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Eres un analista empresarial experto. Proporciona información precisa y estructurada sobre empresas. Si no encuentras información específica, indica claramente la falta de datos.'
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 2000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'year',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const searchResult = data.choices[0].message.content;

    console.log('Perplexity search result:', searchResult);

    // Analizar la respuesta para extraer información estructurada
    const companyInfo: CompanyInfo = {
      name: companyName,
      description: '',
      sector: '',
      industry: '',
      dataFound: false,
      source: 'Perplexity AI',
      keyFacts: []
    };

    // Verificar si se encontró información útil
    const noDataIndicators = [
      'no encuentro información',
      'no hay datos disponibles',
      'información no disponible',
      'no se encontraron datos',
      'no existe información',
      'empresa no identificada'
    ];

    const hasNoData = noDataIndicators.some(indicator => 
      searchResult.toLowerCase().includes(indicator.toLowerCase())
    );

    if (!hasNoData && searchResult.length > 100) {
      companyInfo.dataFound = true;
      companyInfo.description = searchResult;

      // Intentar extraer información específica usando patrones
      try {
        // Extraer sector/industria
        const sectorMatch = searchResult.match(/sector[:\s]+(.*?)(?:\n|\.)/i);
        const industryMatch = searchResult.match(/industria[:\s]+(.*?)(?:\n|\.)/i);
        
        if (sectorMatch) companyInfo.sector = sectorMatch[1].trim();
        if (industryMatch) companyInfo.industry = industryMatch[1].trim();

        // Extraer año de fundación
        const yearMatch = searchResult.match(/fundad[ao][:\s]*(\d{4})/i);
        if (yearMatch) companyInfo.foundedYear = parseInt(yearMatch[1]);

        // Extraer empleados
        const employeesMatch = searchResult.match(/empleados?[:\s]+([\d,.]+ ?(?:mil|thousand|million|millones)?)/i);
        if (employeesMatch) companyInfo.employees = employeesMatch[1].trim();

        // Extraer ingresos
        const revenueMatch = searchResult.match(/ingresos?[:\s]+([\d,.$€]+ ?(?:mil|million|millones|billion|billones)?)/i);
        if (revenueMatch) companyInfo.revenue = revenueMatch[1].trim();

        // Extraer sede
        const headquartersMatch = searchResult.match(/sede[:\s]+(.*?)(?:\n|\.)/i);
        if (headquartersMatch) companyInfo.headquarters = headquartersMatch[1].trim();

        // Extraer sitio web
        const websiteMatch = searchResult.match(/(https?:\/\/[^\s]+|www\.[^\s]+|\w+\.(com|es|org|net))/i);
        if (websiteMatch) companyInfo.website = websiteMatch[0].trim();

        console.log('Extracted company info:', companyInfo);
      } catch (error) {
        console.error('Error extracting structured data:', error);
      }
    }

    return new Response(
      JSON.stringify({
        companyInfo,
        rawSearchResult: searchResult,
        searchQuery: searchPrompt
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in company-search-perplexity function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        companyInfo: {
          name: '',
          description: '',
          sector: '',
          industry: '',
          dataFound: false,
          source: 'Error',
          keyFacts: []
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});