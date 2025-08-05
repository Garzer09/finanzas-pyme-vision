import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OperationalMetric {
  id: string;
  metric_name: string;
  value: number;
  unit: string;
  period_date: string;
  period_year: number;
  period_type: string;
  segment?: string;
}

export interface OperationalKPI {
  title: string;
  value: string | number;
  unit: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  subtitle?: string;
}

export const useOperationalData = (companyId?: string) => {
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && companyId) {
      fetchOperationalData();
    } else {
      setIsLoading(false);
    }
  }, [user, companyId]);

  const fetchOperationalData = async () => {
    if (!companyId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('operational_metrics')
        .select('*')
        .eq('company_id', companyId)
        .order('period_date', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedMetrics: OperationalMetric[] = data.map(metric => ({
        id: metric.id.toString(),
        metric_name: metric.metric_name,
        value: Number(metric.value),
        unit: metric.unit,
        period_date: metric.period_date,
        period_year: metric.period_year,
        period_type: metric.period_type,
        segment: metric.segment
      }));

      setOperationalMetrics(transformedMetrics);
    } catch (err) {
      console.error('Error fetching operational data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos operativos');
    } finally {
      setIsLoading(false);
    }
  };

  // Get latest metrics by name
  const getLatestMetric = (metricName: string) => {
    return operationalMetrics
      .filter(m => m.metric_name === metricName)
      .sort((a, b) => new Date(b.period_date).getTime() - new Date(a.period_date).getTime())[0];
  };

  // Generate operational KPIs
  const getOperationalKPIs = (): OperationalKPI[] => {
    if (operationalMetrics.length === 0) return [];

    const kpis: OperationalKPI[] = [];

    // Units sold
    const unitsSold = getLatestMetric('unidades_vendidas');
    if (unitsSold) {
      kpis.push({
        title: 'Unidades Vendidas',
        value: unitsSold.value.toLocaleString(),
        unit: unitsSold.unit,
        subtitle: 'Total del período'
      });
    }

    // Production volume
    const production = getLatestMetric('volumen_produccion');
    if (production) {
      kpis.push({
        title: 'Volumen Producido',
        value: production.value.toLocaleString(),
        unit: production.unit,
        subtitle: 'Capacidad utilizada'
      });
    }

    // Employee count
    const employees = getLatestMetric('empleados');
    if (employees) {
      kpis.push({
        title: 'Empleados',
        value: employees.value.toLocaleString(),
        unit: 'personas',
        subtitle: 'Plantilla actual'
      });
    }

    // Productivity metrics
    const productivity = getLatestMetric('productividad');
    if (productivity) {
      kpis.push({
        title: 'Productividad',
        value: productivity.value.toFixed(1),
        unit: productivity.unit,
        subtitle: 'Eficiencia operativa'
      });
    }

    return kpis;
  };

  // Group metrics by segment
  const getMetricsBySegment = () => {
    const segments = new Map<string, OperationalMetric[]>();
    
    operationalMetrics.forEach(metric => {
      const segment = metric.segment || 'General';
      if (!segments.has(segment)) {
        segments.set(segment, []);
      }
      segments.get(segment)!.push(metric);
    });

    return Array.from(segments.entries()).map(([segment, metrics]) => ({
      segment,
      metrics: metrics.sort((a, b) => new Date(b.period_date).getTime() - new Date(a.period_date).getTime())
    }));
  };

  const hasRealData = () => operationalMetrics.length > 0;

  return {
    operationalMetrics,
    getOperationalKPIs,
    getMetricsBySegment,
    getLatestMetric,
    isLoading,
    error,
    hasRealData,
    refetch: fetchOperationalData
  };
};