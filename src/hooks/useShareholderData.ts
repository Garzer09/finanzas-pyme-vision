import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface ShareholderInfo {
  name: string;
  percentage?: string;
  type: 'individual' | 'institutional' | 'corporate';
  description?: string;
}

export interface ManagementMember {
  name: string;
  position: string;
  education?: string;
  experience?: string;
  tenure?: string;
}

export interface BoardMember {
  name: string;
  position: string;
  independent: boolean;
  background?: string;
}

export interface FoundingPartner {
  name: string;
  role?: string;
  background?: string;
}

export interface KeyInvestor {
  name: string;
  type: 'VC' | 'PE' | 'strategic' | 'individual';
  investment_details?: string;
}

export interface CompanyShareholderData {
  id?: string;
  company_name: string;
  shareholder_structure: ShareholderInfo[];
  management_team: ManagementMember[];
  board_of_directors: BoardMember[];
  founding_partners: FoundingPartner[];
  key_investors: KeyInvestor[];
  data_source: 'manual' | 'perplexity' | 'mixed';
  last_updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const useShareholderData = (companyName?: string) => {
  const [data, setData] = useState<CompanyShareholderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch data from database
  const fetchData = async () => {
    if (!companyName) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: shareholderData, error: fetchError } = await supabase
        .from('company_shareholder_info')
        .select('*')
        .eq('company_name', companyName)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (shareholderData) {
        setData({
          ...shareholderData,
          shareholder_structure: (shareholderData.shareholder_structure as any) || [],
          management_team: (shareholderData.management_team as any) || [],
          board_of_directors: (shareholderData.board_of_directors as any) || [],
          founding_partners: (shareholderData.founding_partners as any) || [],
          key_investors: (shareholderData.key_investors as any) || [],
          data_source: (shareholderData.data_source as any) || 'manual',
        } as CompanyShareholderData);
      } else {
        // Initialize empty structure if no data found
        setData({
          company_name: companyName,
          shareholder_structure: [],
          management_team: [],
          board_of_directors: [],
          founding_partners: [],
          key_investors: [],
          data_source: 'manual'
        });
      }
    } catch (err) {
      console.error('Error fetching shareholder data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast({
        title: "Error",
        description: "No se pudo cargar la información accionaria",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Save or update data
  const saveData = async (updatedData: Partial<CompanyShareholderData>) => {
    if (!companyName) return false;

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const dataToSave = {
        company_name: companyName,
        user_id: user.id,
        shareholder_structure: updatedData.shareholder_structure || data?.shareholder_structure || [],
        management_team: updatedData.management_team || data?.management_team || [],
        board_of_directors: updatedData.board_of_directors || data?.board_of_directors || [],
        founding_partners: updatedData.founding_partners || data?.founding_partners || [],
        key_investors: updatedData.key_investors || data?.key_investors || [],
        data_source: data?.data_source === 'perplexity' ? 'mixed' : 'manual',
        last_updated_by: 'manual_edit'
      };

      if (data?.id) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('company_shareholder_info')
          .update(dataToSave as any)
          .eq('id', data.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { data: insertedData, error: insertError } = await supabase
          .from('company_shareholder_info')
          .insert(dataToSave as any)
          .select()
          .single();

        if (insertError) throw insertError;
        setData({
          ...insertedData,
          shareholder_structure: insertedData.shareholder_structure as any || [],
          management_team: insertedData.management_team as any || [],
          board_of_directors: insertedData.board_of_directors as any || [],
          founding_partners: insertedData.founding_partners as any || [],
          key_investors: insertedData.key_investors as any || [],
          data_source: insertedData.data_source as any || 'manual',
        } as CompanyShareholderData);
      }

      toast({
        title: "Éxito",
        description: "Información accionaria guardada correctamente",
      });

      // Refresh data
      await fetchData();
      return true;
    } catch (err) {
      console.error('Error saving shareholder data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast({
        title: "Error",
        description: "No se pudo guardar la información",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add new item to any array
  const addItem = (section: keyof Pick<CompanyShareholderData, 'shareholder_structure' | 'management_team' | 'board_of_directors' | 'founding_partners' | 'key_investors'>, item: any) => {
    if (!data) return;

    const updatedData = {
      ...data,
      [section]: [...(data[section] as any[]), item]
    };
    setData(updatedData);
  };

  // Remove item from any array
  const removeItem = (section: keyof Pick<CompanyShareholderData, 'shareholder_structure' | 'management_team' | 'board_of_directors' | 'founding_partners' | 'key_investors'>, index: number) => {
    if (!data) return;

    const updatedData = {
      ...data,
      [section]: (data[section] as any[]).filter((_, i) => i !== index)
    };
    setData(updatedData);
  };

  // Update specific item in array
  const updateItem = (section: keyof Pick<CompanyShareholderData, 'shareholder_structure' | 'management_team' | 'board_of_directors' | 'founding_partners' | 'key_investors'>, index: number, updatedItem: any) => {
    if (!data) return;

    const updatedData = {
      ...data,
      [section]: (data[section] as any[]).map((item, i) => i === index ? updatedItem : item)
    };
    setData(updatedData);
  };

  useEffect(() => {
    if (companyName) {
      fetchData();
    }
  }, [companyName]);

  return {
    data,
    loading,
    error,
    fetchData,
    saveData,
    addItem,
    removeItem,
    updateItem,
    setData
  };
};