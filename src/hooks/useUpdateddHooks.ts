// Updated hooks that accept companyId parameter

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '@/hooks/useCompanyData';

// Enhanced hooks that automatically get companyId from URL params
export const useDebtData = () => {
  return useCompanyData('debt');
};

export const useCashFlowData = () => {
  return useCompanyData('estado_flujos');
};

export const useFinancialAssumptionsData = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [assumptions, setAssumptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    const fetchAssumptions = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('financial_assumptions_normalized')
          .select('*')
          .eq('company_id', companyId);

        if (fetchError) throw fetchError;

        setAssumptions(data || []);
        setHasRealData((data || []).length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading assumptions');
      } finally {
        setLoading(false);
      }
    };

    fetchAssumptions();
  }, [companyId]);

  return { assumptions, loading, error, hasRealData };
};

export const useOperationalData = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [operationalMetrics, setOperationalMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    const fetchOperationalData = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('operational_metrics')
          .select('*')
          .eq('company_id', companyId);

        if (fetchError) throw fetchError;

        setOperationalMetrics(data || []);
        setHasRealData((data || []).length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading operational data');
      } finally {
        setLoading(false);
      }
    };

    fetchOperationalData();
  }, [companyId]);

  return { operationalMetrics, loading, error, hasRealData };
};

export const useSegmentData = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [operationalData, setOperationalData] = useState<any[]>([]);
  const [segmentsByType, setSegmentsByType] = useState<{ producto: any[], region: any[], cliente: any[] }>({
    producto: [],
    region: [],
    cliente: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRealData, setHasRealData] = useState(false);

  const fetchData = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      // Use operational_metrics table instead for segment data
      const { data, error: fetchError } = await supabase
        .from('operational_metrics')
        .select('*')
        .eq('company_id', companyId)
        .not('segment', 'is', null);

      if (fetchError) throw fetchError;

      setOperationalData(data || []);
      
      // Group by segment type
      const grouped = (data || []).reduce((acc: any, item: any) => {
        const segment = item.segment;
        if (segment?.includes('producto')) acc.producto.push(item);
        if (segment?.includes('region')) acc.region.push(item);
        if (segment?.includes('cliente')) acc.cliente.push(item);
        return acc;
      }, { producto: [], region: [], cliente: [] });

      setSegmentsByType(grouped);
      setHasRealData((data || []).length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading segment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  return { 
    operationalData, 
    segmentsByType, 
    loading, 
    error, 
    hasRealData,
    refetch: fetchData
  };
};