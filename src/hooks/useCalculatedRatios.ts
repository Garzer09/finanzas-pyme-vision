import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/contexts/CompanyContext';

export interface CalculatedRatio {
  name: string;
  value: number | null;
  unit: string;
  category: string;
  description: string;
  formula: string;
  isCalculated: boolean;
  period_year: number;
  period_date: string;
}

interface UseCalculatedRatiosResult {
  ratios: CalculatedRatio[];
  loading: boolean;
  error: string | null;
  hasData: boolean;
  refreshRatios: () => Promise<void>;
}

export const useCalculatedRatios = (companyId?: string): UseCalculatedRatiosResult => {
  const [ratios, setRatios] = useState<CalculatedRatio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { companyId: contextCompanyId } = useCompanyContext();
  
  const effectiveCompanyId = companyId || contextCompanyId;

  const fetchCalculatedRatios = async () => {
    if (!user || !effectiveCompanyId) {
      setRatios([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Primero refrescar la vista materializada
      const { error: refreshError } = await supabase.rpc('refresh_ratios_mv');
      if (refreshError) {
        console.warn('Warning refreshing ratios view:', refreshError);
      }

      // Consultar ratios calculados de la vista materializada
      const { data: ratiosData, error: ratiosError } = await supabase
        .from('fs_ratios_mv')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .order('period_year', { ascending: false })
        .limit(1);

      if (ratiosError) {
        throw new Error(ratiosError.message);
      }

      if (!ratiosData || ratiosData.length === 0) {
        setRatios([]);
        setLoading(false);
        return;
      }

      const latestRatios = ratiosData[0];
      
      // Transformar los datos de la vista materializada a nuestro formato
      const transformedRatios: CalculatedRatio[] = [
        // LIQUIDEZ
        {
          name: 'Ratio Corriente',
          value: latestRatios.ratio_corriente,
          unit: '',
          category: 'Liquidez',
          description: 'Capacidad para cubrir deudas a corto plazo',
          formula: 'Activo Corriente / Pasivo Corriente',
          isCalculated: latestRatios.ratio_corriente !== null,
          period_year: latestRatios.period_year,
          period_date: `${latestRatios.period_year}-12-31`
        },
        {
          name: 'Prueba Ácida',
          value: latestRatios.prueba_acida,
          unit: '',
          category: 'Liquidez',
          description: 'Liquidez sin considerar existencias',
          formula: '(Activo Corriente - Existencias) / Pasivo Corriente',
          isCalculated: latestRatios.prueba_acida !== null,
          period_year: latestRatios.period_year,
          period_date: `${latestRatios.period_year}-12-31`
        },
        {
          name: 'Ratio Tesorería',
          value: latestRatios.ratio_tesoreria,
          unit: '',
          category: 'Liquidez',
          description: 'Capacidad inmediata de pago',
          formula: 'Efectivo / Pasivo Corriente',
          isCalculated: latestRatios.ratio_tesoreria !== null,
          period_year: latestRatios.period_year,
          period_date: `${latestRatios.period_year}-12-31`
        },
        // ENDEUDAMIENTO
        {
          name: 'Ratio Endeudamiento Total',
          value: latestRatios.ratio_endeudamiento_total,
          unit: '%',
          category: 'Endeudamiento',
          description: 'Proporción de activos financiados con deuda',
          formula: '(Total Pasivo / Total Activo) × 100',
          isCalculated: latestRatios.ratio_endeudamiento_total !== null,
          period_year: latestRatios.period_year,
          period_date: `${latestRatios.period_year}-12-31`
        },
        {
          name: 'Ratio Endeudamiento Financiero',
          value: latestRatios.ratio_endeudamiento_financiero,
          unit: '%',
          category: 'Endeudamiento',
          description: 'Deuda total sobre patrimonio neto',
          formula: '(Total Pasivo / Patrimonio Neto) × 100',
          isCalculated: latestRatios.ratio_endeudamiento_financiero !== null,
          period_year: latestRatios.period_year,
          period_date: `${latestRatios.period_year}-12-31`
        },
        {
          name: 'Autonomía Financiera',
          value: latestRatios.autonomia_financiera,
          unit: '%',
          category: 'Endeudamiento',
          description: 'Proporción de activos financiados con recursos propios',
          formula: '(Patrimonio Neto / Total Activo) × 100',
          isCalculated: latestRatios.autonomia_financiera !== null,
          period_year: latestRatios.period_year,
          period_date: `${latestRatios.period_year}-12-31`
        },
        // RENTABILIDAD
        {
          name: 'ROA (Return on Assets)',
          value: latestRatios.roa,
          unit: '%',
          category: 'Rentabilidad',
          description: 'Rentabilidad sobre activos',
          formula: '(Resultado Neto / Total Activo) × 100',
          isCalculated: latestRatios.roa !== null,
          period_year: latestRatios.period_year,
          period_date: `${latestRatios.period_year}-12-31`
        },
        {
          name: 'ROE (Return on Equity)',
          value: latestRatios.roe,
          unit: '%',
          category: 'Rentabilidad',
          description: 'Rentabilidad sobre patrimonio neto',
          formula: '(Resultado Neto / Patrimonio Neto) × 100',
          isCalculated: latestRatios.roe !== null,
          period_year: latestRatios.period_year,
          period_date: `${latestRatios.period_year}-12-31`
        },
        {
          name: 'Margen Neto',
          value: latestRatios.margen_neto,
          unit: '%',
          category: 'Rentabilidad',
          description: 'Margen de beneficio sobre ventas',
          formula: '(Resultado Neto / Ventas) × 100',
          isCalculated: latestRatios.margen_neto !== null,
          period_year: latestRatios.period_year,
          period_date: `${latestRatios.period_year}-12-31`
        },
        // ACTIVIDAD
        {
          name: 'Rotación de Activos',
          value: latestRatios.rotacion_activos,
          unit: 'x',
          category: 'Actividad',
          description: 'Eficiencia en el uso de activos',
          formula: 'Ventas / Total Activo',
          isCalculated: latestRatios.rotacion_activos !== null,
          period_year: latestRatios.period_year,
          period_date: `${latestRatios.period_year}-12-31`
        }
      ];

      setRatios(transformedRatios);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading calculated ratios');
      console.error('Error fetching calculated ratios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalculatedRatios();
  }, [user, effectiveCompanyId]);

  const refreshRatios = async () => {
    await fetchCalculatedRatios();
  };

  const hasData = ratios.some(r => r.isCalculated);

  return {
    ratios,
    loading,
    error,
    hasData,
    refreshRatios
  };
};
