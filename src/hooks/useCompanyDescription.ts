import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';

interface CompanyDescription {
  id: string;
  user_id: string;
  company_name: string;
  description?: string;
  sector?: string;
  industry?: string;
  founded_year?: number;
  employees?: string;
  revenue?: string;
  headquarters?: string;
  website?: string;
  products?: string[];
  competitors?: string[];
  key_facts?: string[];
  market_position?: string;
  business_model?: string;
  raw_search_result?: string;
  search_query?: string;
  data_source?: string;
  created_at: string;
  updated_at: string;
}

export const useCompanyDescription = (companyId?: string) => {
  const [companyDescription, setCompanyDescription] = useState<CompanyDescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { impersonatedUserId } = useAdminImpersonation();

  // Use impersonated user if admin is impersonating, otherwise use current user
  const targetUserId = impersonatedUserId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchCompanyDescription();
    }
  }, [targetUserId, companyId]);

  const fetchCompanyDescription = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get data from company_descriptions (manual entries)
      const { data: manualData, error: manualError } = await supabase
        .from('company_descriptions')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      // Get qualitative data - prioritize provided companyId, then membership
      let qualitativeData = null;
      let effectiveCompanyId = companyId;
      
      if (!effectiveCompanyId) {
        // Check if we have a company associated with this user
        const { data: membershipData } = await supabase
          .from('memberships')
          .select('company_id')
          .eq('user_id', targetUserId)
          .single();
        effectiveCompanyId = membershipData?.company_id;
      }

      if (effectiveCompanyId) {
        console.debug('[useCompanyDescription] Fetching qualitative data for company:', effectiveCompanyId);
        
        // Get qualitative template data from company_info_normalized
        const { data: qualData } = await supabase
          .from('company_info_normalized')
          .select('*')
          .eq('company_id', effectiveCompanyId)
          .single();
        qualitativeData = qualData;
        
        console.debug('[useCompanyDescription] Qualitative data found:', !!qualData, qualData?.company_name);
      }

      // Merge data prioritizing qualitative template data when available
      let mergedData = null;
      
      if (manualData) {
        mergedData = manualData;
        
        // If we have qualitative data, merge it in (template data takes priority)
        if (qualitativeData) {
          mergedData = {
            ...manualData,
            company_name: qualitativeData.company_name || manualData.company_name,
            description: qualitativeData.description || manualData.description,
            sector: qualitativeData.sector || manualData.sector,
            industry: qualitativeData.industry || manualData.industry,
            founded_year: qualitativeData.founded_year || manualData.founded_year,
            employees: qualitativeData.employees_count?.toString() || manualData.employees,
            headquarters: qualitativeData.headquarters || manualData.headquarters,
            website: qualitativeData.website || manualData.website,
            products: qualitativeData.products || manualData.products,
            competitors: qualitativeData.competitors || manualData.competitors,
            key_facts: qualitativeData.key_facts || manualData.key_facts,
            data_source: qualitativeData ? 'template_enhanced' : manualData.data_source
          };
        }
      } else if (qualitativeData) {
        // Only qualitative data available, create a company description from it
        mergedData = {
          id: '', // Will be created when saved
          user_id: targetUserId,
          company_name: qualitativeData.company_name || 'Empresa Sin Nombre',
          description: qualitativeData.description,
          sector: qualitativeData.sector,
          industry: qualitativeData.industry,
          founded_year: qualitativeData.founded_year,
          employees: qualitativeData.employees_count?.toString(),
          headquarters: qualitativeData.headquarters,
          website: qualitativeData.website,
          products: qualitativeData.products,
          competitors: qualitativeData.competitors,
          key_facts: qualitativeData.key_facts,
          data_source: 'template',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      setCompanyDescription(mergedData);
    } catch (err) {
      console.error('Error fetching company description:', err);
      setError(err instanceof Error ? err.message : 'Error fetching company data');
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyDescription = async (data: Partial<CompanyDescription>) => {
    if (!targetUserId) {
      toast({
        title: "Error",
        description: "No hay usuario autenticado",
        variant: "destructive"
      });
      return false;
    }

    try {
      let result;
      
      if (companyDescription && companyDescription.id) {
        // Update existing - only include the fields we want to update
        const updateData = {
          company_name: data.company_name || companyDescription.company_name,
          description: data.description,
          sector: data.sector,
          industry: data.industry,
          founded_year: data.founded_year,
          employees: data.employees,
          revenue: data.revenue,
          headquarters: data.headquarters,
          website: data.website,
          products: data.products,
          competitors: data.competitors,
          key_facts: data.key_facts,
          market_position: data.market_position,
          business_model: data.business_model
        };

        const { data: updatedData, error: updateError } = await supabase
          .from('company_descriptions')
          .update(updateData)
          .eq('id', companyDescription.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = updatedData;
      } else {
        // Create new - ensure company_name is required
        const insertData = {
          user_id: targetUserId,
          company_name: data.company_name || 'Empresa Sin Nombre',
          description: data.description,
          sector: data.sector,
          industry: data.industry,
          founded_year: data.founded_year,
          employees: data.employees,
          revenue: data.revenue,
          headquarters: data.headquarters,
          website: data.website,
          products: data.products || [],
          competitors: data.competitors || [],
          key_facts: data.key_facts || [],
          market_position: data.market_position,
          business_model: data.business_model,
          raw_search_result: data.raw_search_result,
          search_query: data.search_query,
          data_source: data.data_source || 'manual'
        };

        const { data: newData, error: insertError } = await supabase
          .from('company_descriptions')
          .insert(insertData)
          .select()
          .single();

        if (insertError) throw insertError;
        result = newData;
      }

      setCompanyDescription(result);
      toast({
        title: "Guardado exitoso",
        description: "La información de la empresa se ha guardado correctamente"
      });
      return true;
    } catch (err) {
      console.error('Error saving company description:', err);
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: "destructive"
      });
      return false;
    }
  };

  const createFromPerplexityResult = async (perplexityResult: any) => {
    if (!perplexityResult?.companyInfo) return false;

    const info = perplexityResult.companyInfo;
    
    const companyData = {
      company_name: info.name,
      description: info.description,
      sector: info.sector,
      industry: info.industry,
      founded_year: info.foundedYear,
      employees: info.employees,
      revenue: info.revenue,
      headquarters: info.headquarters,
      website: info.website,
      products: info.products || [],
      competitors: info.competitors || [],
      key_facts: info.keyFacts || [],
      market_position: info.marketPosition,
      business_model: info.businessModel,
      raw_search_result: perplexityResult.rawSearchResult,
      search_query: perplexityResult.searchQuery,
      data_source: 'perplexity'
    };

    return await saveCompanyDescription(companyData);
  };

  return {
    companyDescription,
    loading,
    error,
    saveCompanyDescription,
    createFromPerplexityResult,
    refetch: fetchCompanyDescription
  };
};