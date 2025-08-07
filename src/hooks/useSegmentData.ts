import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OperationalData {
  id: number;
  period_date: string;
  period_year: number;
  period_month?: number;
  metric_name: string;
  segment?: string;
  value: number;
  unit: string;
}

interface SegmentData {
  name: string;
  sales: number;
  participation: number;
  yoyGrowth: number;
}

interface UseSegmentDataResult {
  operationalData: OperationalData[];
  segmentsByType: {
    producto: SegmentData[];
    region: SegmentData[];
    cliente: SegmentData[];
  };
  isLoading: boolean;
  error: string | null;
  hasRealData: boolean;
  refetch: () => Promise<void>;
}

export const useSegmentData = (companyId?: string): UseSegmentDataResult => {
  const [operationalData, setOperationalData] = useState<OperationalData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchOperationalData = async () => {
    if (!user || !companyId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('operational_metrics')
        .select('*')
        .eq('company_id', companyId)
        .order('period_date', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const transformedData: OperationalData[] = (data || []).map(item => ({
        id: item.id,
        period_date: item.period_date,
        period_year: item.period_year,
        period_month: item.period_month,
        metric_name: item.metric_name,
        segment: item.segment,
        value: Number(item.value),
        unit: item.unit
      }));

      setOperationalData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading operational data');
      console.error('Error fetching operational data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationalData();
  }, [user, companyId]);

  const segmentsByType = useMemo(() => {
    if (operationalData.length === 0) {
      return {
        producto: [],
        region: [],
        cliente: []
      };
    }

    // Get latest two years for comparison
    const years = [...new Set(operationalData.map(item => item.period_year))].sort((a, b) => b - a);
    const latestYear = years[0];
    const previousYear = years[1] || latestYear;

    // Filter sales-related metrics by segment
    const salesData = operationalData.filter(item => 
      item.metric_name.toLowerCase().includes('ventas') ||
      item.metric_name.toLowerCase().includes('facturacion') ||
      item.metric_name.toLowerCase().includes('ingresos')
    );

    const latestSales = salesData.filter(item => item.period_year === latestYear);
    const previousSales = salesData.filter(item => item.period_year === previousYear);

    // Helper function to process segments by type
    const processSegmentsByType = (segmentType: string): SegmentData[] => {
      const segments = [...new Set(latestSales
        .filter(item => item.segment && item.segment.toLowerCase().includes(segmentType))
        .map(item => item.segment!)
      )];

      const totalSales = latestSales
        .filter(item => item.segment && item.segment.toLowerCase().includes(segmentType))
        .reduce((sum, item) => sum + item.value, 0);

      return segments.map(segment => {
        const currentSales = latestSales
          .filter(item => item.segment === segment)
          .reduce((sum, item) => sum + item.value, 0);

        const previousSegmentSales = previousSales
          .filter(item => item.segment === segment)
          .reduce((sum, item) => sum + item.value, 0);

        const participation = totalSales > 0 ? (currentSales / totalSales) * 100 : 0;
        const yoyGrowth = previousSegmentSales > 0 
          ? ((currentSales - previousSegmentSales) / previousSegmentSales) * 100 
          : 0;

        return {
          name: segment,
          sales: currentSales,
          participation,
          yoyGrowth
        };
      }).sort((a, b) => b.sales - a.sales);
    };

    return {
      producto: processSegmentsByType('producto'),
      region: processSegmentsByType('region'),
      cliente: processSegmentsByType('cliente')
    };
  }, [operationalData]);

  const hasRealData = operationalData.length > 0;

  const refetch = async () => {
    await fetchOperationalData();
  };

  return {
    operationalData,
    segmentsByType,
    isLoading,
    error,
    hasRealData,
    refetch
  };
};