import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DetectedPeriod {
  id: string;
  file_id?: string;
  period_date: string;
  period_type: string;
  period_label: string;
  is_selected: boolean;
  confidence_score: number;
}

export interface PeriodConfiguration {
  id?: string;
  periods_selected: string[];
  comparison_enabled: boolean;
  comparison_periods: string[];
  default_period?: string;
}

interface PeriodContextType {
  // Estado
  availablePeriods: DetectedPeriod[];
  selectedPeriods: string[];
  comparisonEnabled: boolean;
  comparisonPeriods: string[];
  currentPeriod?: string;
  loading: boolean;
  
  // Funciones
  setSelectedPeriods: (periods: string[]) => void;
  setComparisonEnabled: (enabled: boolean) => void;
  setComparisonPeriods: (periods: string[]) => void;
  setCurrentPeriod: (period: string) => void;
  saveConfiguration: () => Promise<void>;
  loadDetectedPeriods: (fileId?: string) => Promise<void>;
  addDetectedPeriods: (periods: DetectedPeriod[]) => Promise<void>;
  getPeriodFilteredData: (dataType: string, companyId?: string) => Promise<any[]>;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const usePeriodContext = () => {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriodContext must be used within a PeriodProvider');
  }
  return context;
};

interface PeriodProviderProps {
  children: ReactNode;
}

export const PeriodProvider: React.FC<PeriodProviderProps> = ({ children }) => {
  const [availablePeriods, setAvailablePeriods] = useState<DetectedPeriod[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonPeriods, setComparisonPeriods] = useState<string[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<string>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Cargar configuración del usuario al inicializar
  useEffect(() => {
    loadUserConfiguration();
  }, []);

  const loadUserConfiguration = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_period_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('configuration_type', 'period_selection')
        .single();

      if (error && error.code !== 'PGRST116') { // No rows found
        console.error('Error loading period configuration:', error);
        return;
      }

      if (data) {
        setSelectedPeriods(
          Array.isArray(data.periods_selected) 
            ? data.periods_selected.filter((p): p is string => typeof p === 'string')
            : []
        );
        setComparisonEnabled(data.comparison_enabled || false);
        setComparisonPeriods(
          Array.isArray(data.comparison_periods) 
            ? data.comparison_periods.filter((p): p is string => typeof p === 'string')
            : []
        );
        setCurrentPeriod(typeof data.default_period === 'string' ? data.default_period : undefined);
      }

      // Cargar periodos detectados
      await loadDetectedPeriods();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading user configuration:', error);
      }
    }
  }, []);

  const loadDetectedPeriods = useCallback(async (fileId?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('detected_periods')
        .select('*')
        .eq('user_id', user.id)
        .order('period_date', { ascending: false });

      if (fileId) {
        query = query.eq('file_id', fileId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading detected periods:', error);
        return;
      }

      setAvailablePeriods((data || []).map(period => ({
        ...period,
        period_type: period.period_type as 'monthly' | 'quarterly' | 'yearly'
      })));
      
      // Si no hay periodos seleccionados, seleccionar los más recientes por defecto
      if (selectedPeriods.length === 0 && data && data.length > 0) {
        const defaultSelected = data
          .filter(p => p.is_selected)
          .slice(0, 3)
          .map(p => p.id);
        setSelectedPeriods(defaultSelected);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading detected periods:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedPeriods]);

  const addDetectedPeriods = async (periods: DetectedPeriod[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const periodsToInsert = periods.map(period => ({
        ...period,
        user_id: user.id,
        id: undefined // Let database generate ID
      }));

      const { error } = await supabase
        .from('detected_periods')
        .insert(periodsToInsert);

      if (error) {
        console.error('Error adding detected periods:', error);
        return;
      }

      // Recargar periodos
      await loadDetectedPeriods();
    } catch (error) {
      console.error('Error adding detected periods:', error);
    }
  };

  const saveConfiguration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const configuration: PeriodConfiguration = {
        periods_selected: selectedPeriods,
        comparison_enabled: comparisonEnabled,
        comparison_periods: comparisonPeriods,
        default_period: currentPeriod
      };

      const { error } = await supabase
        .from('user_period_configurations')
        .upsert({
          user_id: user.id,
          configuration_type: 'period_selection',
          ...configuration
        });

      if (error) {
        console.error('Error saving configuration:', error);
        toast({
          title: "Error",
          description: "No se pudo guardar la configuración de periodos",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Configuración guardada",
        description: "La selección de periodos se ha actualizado correctamente"
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  const getPeriodFilteredData = useCallback(async (dataType: string, companyId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Use company-specific data fetching if companyId is provided
      if (companyId) {
        return await getCompanyFilteredData(dataType, companyId);
      }

      // Original logic for user-based data
      if (selectedPeriods.length === 0) {
        const { data, error } = await supabase
          .from('financial_data')
          .select('*')
          .eq('user_id', user.id)
          .eq('data_type', dataType)
          .order('period_date', { ascending: false })
          .limit(12);

        return data || [];
      }

      const selectedPeriodDates = availablePeriods
        .filter(p => selectedPeriods.includes(p.id))
        .map(p => p.period_date);

      const { data, error } = await supabase
        .from('financial_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('data_type', dataType)
        .in('period_date', selectedPeriodDates)
        .order('period_date', { ascending: false });

      return data || [];
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting period filtered data:', error);
      }
      return [];
    }
  }, [selectedPeriods, availablePeriods]);

  const getCompanyFilteredData = async (dataType: string, companyId: string) => {
    try {
      // Map data types to appropriate company tables
      switch (dataType) {
        case 'pyg':
        case 'profit_loss':
          const { data: pygData, error: pygError } = await supabase
            .from('fs_pyg_lines')
            .select('*')
            .eq('company_id', companyId)
            .order('period_date', { ascending: false });
          
          if (pygError) throw pygError;
          return pygData || [];

        case 'balance':
        case 'balance_sheet':
          const { data: balanceData, error: balanceError } = await supabase
            .from('fs_balance_lines')
            .select('*')
            .eq('company_id', companyId)
            .order('period_date', { ascending: false });
          
          if (balanceError) throw balanceError;
          return balanceData || [];

        case 'operational':
          const { data: opData, error: opError } = await supabase
            .from('operational_metrics')
            .select('*')
            .eq('company_id', companyId)
            .order('period_date', { ascending: false });
          
          if (opError) throw opError;
          return opData || [];

        case 'financial_assumptions':
          const { data: assumptionsData, error: assumptionsError } = await supabase
            .from('financial_assumptions_normalized')
            .select('*')
            .eq('company_id', companyId)
            .order('period_year', { ascending: false });
          
          if (assumptionsError) throw assumptionsError;
          return assumptionsData || [];

        default:
          const { data: unifiedData, error: unifiedError } = await supabase
            .from('financial_series_unified')
            .select('*')
            .eq('company_id', companyId)
            .order('period', { ascending: false });
          
          if (unifiedError) throw unifiedError;
          return unifiedData || [];
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting company filtered data:', error);
      }
      return [];
    }
  };

  const value = useMemo((): PeriodContextType => ({
    availablePeriods,
    selectedPeriods,
    comparisonEnabled,
    comparisonPeriods,
    currentPeriod,
    loading,
    setSelectedPeriods,
    setComparisonEnabled,
    setComparisonPeriods,
    setCurrentPeriod,
    saveConfiguration,
    loadDetectedPeriods,
    addDetectedPeriods,
    getPeriodFilteredData
  }), [
    availablePeriods,
    selectedPeriods,
    comparisonEnabled,
    comparisonPeriods,
    currentPeriod,
    loading,
    loadDetectedPeriods,
    getPeriodFilteredData
  ]);

  return (
    <PeriodContext.Provider value={value}>
      {children}
    </PeriodContext.Provider>
  );
};