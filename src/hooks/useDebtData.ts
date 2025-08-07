import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export interface DebtItem {
  id: string;
  entidad: string;
  tipo: string;
  capitalInicial: number;
  capitalPendiente: number;
  tipoInteres: number;
  plazoRestante: number;
  cuota: number;
  proximoVencimiento: string;
  ultimoVencimiento: string;
  frecuencia: string;
  garantias?: string;
}

export interface RiskMetrics {
  dscr: number; // Debt Service Coverage Ratio
  netDebtEbitda: number; // Net Debt / EBITDA
  interestCoverage: number; // EBITDA / Interest Payments
}

export const useDebtData = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [debtItems, setDebtItems] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch debt data from database
  useEffect(() => {
    if (!companyId) return;

    const fetchDebtData = async () => {
      setLoading(true);
      try {
        // Fetch from debt_balances table
        const { data, error: fetchError } = await supabase
          .from('debt_balances')
          .select('*')
          .eq('company_id', companyId);

        if (fetchError) throw fetchError;

        // Transform database data to DebtItem format
        const transformedData: DebtItem[] = (data || []).map((item: any) => ({
          id: item.id.toString(),
          entidad: `Entidad ${item.loan_id}`,
          tipo: 'Préstamo',
          capitalInicial: item.year_end_balance,
          capitalPendiente: item.year_end_balance,
          tipoInteres: 3.5, // Default value
          plazoRestante: 12,
          cuota: item.year_end_balance / 12,
          proximoVencimiento: `${item.year + 1}-12-31`,
          ultimoVencimiento: `${item.year + 3}-12-31`,
          frecuencia: 'Mensual',
          garantias: 'Por definir'
        }));

        setDebtItems(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading debt data');
      } finally {
        setLoading(false);
      }
    };

    fetchDebtData();
  }, [companyId]);

  // Cálculos principales
  const totalCapitalPendiente = useMemo(() => 
    debtItems.reduce((sum, item) => sum + item.capitalPendiente, 0)
  , [debtItems]);

  const tirPromedio = useMemo(() => 
    debtItems.reduce((sum, item) => 
      sum + (item.tipoInteres * item.capitalPendiente) / totalCapitalPendiente, 0)
  , [debtItems, totalCapitalPendiente]);

  const cuotaMensualTotal = useMemo(() => 
    debtItems.reduce((sum, item) => 
      sum + (item.frecuencia === 'Mensual' ? item.cuota : 0), 0)
  , [debtItems]);

  // Datos para gráficos por entidad (barra horizontal apilada)
  const debtByEntity = useMemo(() => 
    debtItems.map((item, index) => ({
      name: item.entidad,
      value: item.capitalPendiente,
      percentage: (item.capitalPendiente / totalCapitalPendiente) * 100,
      color: ['#005E8A', '#6BD1FF', '#0ea5e9', '#0284c7', '#0369a1'][index % 5]
    }))
  , [debtItems, totalCapitalPendiente]);

  // Datos para treemap por tipo
  const debtByType = useMemo(() => {
    const typeGroups = debtItems.reduce((acc: any[], item) => {
      const existing = acc.find(d => d.name === item.tipo);
      if (existing) {
        existing.value += item.capitalPendiente;
      } else {
        acc.push({
          name: item.tipo,
          value: item.capitalPendiente,
          color: ['#005E8A', '#6BD1FF', '#0ea5e9', '#0284c7', '#0369a1'][acc.length % 5]
        });
      }
      return acc;
    }, []);

    return typeGroups.map(group => ({
      ...group,
      percentage: (group.value / totalCapitalPendiente) * 100
    }));
  }, [debtItems, totalCapitalPendiente]);

  // Calendar de vencimientos con color coding
  const vencimientos = useMemo(() => {
    const getDaysUntil = (dateStr: string): number => {
      return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    };

    const getUrgency = (days: number): 'alta' | 'media' | 'baja' => {
      if (days <= 30) return 'alta';
      if (days <= 90) return 'media';
      return 'baja';
    };

    return debtItems
      .filter(item => item.cuota > 0 || item.frecuencia === 'A vencimiento')
      .map(item => {
        const daysUntil = getDaysUntil(item.proximoVencimiento);
        return {
          id: item.id,
          entidad: item.entidad,
          tipo: item.tipo,
          importe: item.cuota > 0 ? item.cuota : item.capitalPendiente,
          fecha: item.proximoVencimiento,
          daysUntil,
          urgency: getUrgency(daysUntil)
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [debtItems]);

  // Métricas de riesgo (simuladas)
  const riskMetrics = useMemo((): RiskMetrics => {
    const ebitda = 450000; // Simulado
    const totalAnnualDebtService = cuotaMensualTotal * 12;
    const totalInterest = debtItems.reduce((sum, item) => 
      sum + (item.capitalPendiente * item.tipoInteres / 100), 0);

    return {
      dscr: ebitda / totalAnnualDebtService,
      netDebtEbitda: totalCapitalPendiente / ebitda,
      interestCoverage: ebitda / totalInterest
    };
  }, [debtItems, cuotaMensualTotal, totalCapitalPendiente]);

  const addDebtItem = (newItem: Omit<DebtItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setDebtItems(prev => [...prev, { ...newItem, id }]);
  };

  const updateDebtItem = (id: string, updates: Partial<DebtItem>) => {
    setDebtItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteDebtItem = (id: string) => {
    setDebtItems(prev => prev.filter(item => item.id !== id));
  };

  return {
    debtItems,
    totalCapitalPendiente,
    tirPromedio,
    cuotaMensualTotal,
    debtByEntity,
    debtByType,
    vencimientos,
    riskMetrics,
    loading,
    error,
    addDebtItem,
    updateDebtItem,
    deleteDebtItem
  };
};