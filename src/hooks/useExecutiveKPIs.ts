import { useMemo } from 'react';
import { useFinancialRatios } from './useFinancialRatios';
import { useValuation } from './useValuation';
import { useRealDebtData } from './useRealDebtData';
import { useFinancialData } from './useFinancialData';
import { TrendingUp, Target, AlertTriangle, CheckCircle } from 'lucide-react';

export interface ExecutiveKPI {
  label: string;
  value: string;
  status: 'positive' | 'warning' | 'negative' | 'neutral';
  icon: typeof TrendingUp;
  hasData: boolean;
  calculation?: string;
}

export interface UseExecutiveKPIsResult {
  kpis: ExecutiveKPI[];
  hasAnyData: boolean;
  dataStatus: {
    financial: boolean;
    debt: boolean;
    valuation: boolean;
    ratios: boolean;
  };
}

export const useExecutiveKPIs = (): UseExecutiveKPIsResult => {
  const { ratios, hasData: hasRatiosData } = useFinancialRatios();
  const { valuationData, calculateWACC } = useValuation();
  const { hasRealData, totalCapitalPendiente, riskMetrics } = useRealDebtData();
  const hasDebtData = hasRealData();
  const { hasRealData: hasFinancialData, getLatestData } = useFinancialData();

  const dataStatus = useMemo(() => ({
    financial: hasFinancialData,
    debt: hasDebtData,
    valuation: Boolean(valuationData),
    ratios: hasRatiosData
  }), [hasFinancialData, hasDebtData, valuationData, hasRatiosData]);

  const kpis = useMemo((): ExecutiveKPI[] => {
    const formatCurrency = (value: number): string => {
      if (Math.abs(value) >= 1000000) {
        return `€${(value / 1000000).toFixed(1)}M`;
      } else if (Math.abs(value) >= 1000) {
        return `€${(value / 1000).toFixed(0)}K`;
      }
      return `€${value.toFixed(0)}`;
    };

    const formatPercentage = (value: number): string => {
      return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    const formatRatio = (value: number): string => {
      return `${value.toFixed(1)}x`;
    };

    // 1. Valoración EVA
    const evaValuation: ExecutiveKPI = {
      label: 'Valoración EVA',
      value: valuationData ? formatCurrency(valuationData.weightedValue) : 'Sin datos',
      status: valuationData 
        ? (valuationData.weightedValue > 0 ? 'positive' : 'negative')
        : 'neutral',
      icon: TrendingUp,
      hasData: Boolean(valuationData),
      calculation: 'Valoración ponderada por métodos DCF, Book Value y Liquidación'
    };

    // 2. ROIC vs WACC
    let roicVsWacc: ExecutiveKPI;
    if (valuationData && hasFinancialData) {
      const wacc = calculateWACC();
      const pl = getLatestData('estado_pyg');
      
      if (pl?.data_content) {
        // Helper to read numeric values from flattened maps with synonyms
        const getNum = (obj: any, keys: string[]): number => {
          for (const k of keys) {
            const v = obj?.[k];
            if (v !== undefined && v !== null && !isNaN(Number(v))) return Number(v);
          }
          return 0;
        };
        
        // Prefer EBIT; fallback to EBITDA if needed
        const ebitAmount = getNum(pl.data_content, [
          'resultado_explotacion', 'ebit', 'resultado_operativo', 'ebitda', 'resultado_bruto_explotacion'
        ]);
        
        const balanceData = getLatestData('balance_situacion');
        const totalAssets = getNum(balanceData?.data_content || {}, [
          'activo_total', 'total_activo', 'activo'
        ]) || 1;


        const roic = (ebitAmount * 0.75) / totalAssets * 100; // Simplified ROIC with 25% tax assumption
        const difference = roic - (wacc * 100);
        
        roicVsWacc = {
          label: 'ROIC vs WACC',
          value: formatPercentage(difference),
          status: difference > 0 ? 'positive' : 'negative',
          icon: Target,
          hasData: true,
          calculation: `ROIC ${roic.toFixed(1)}% vs WACC ${(wacc * 100).toFixed(1)}%`
        };
      } else {
        roicVsWacc = {
          label: 'ROIC vs WACC',
          value: 'Sin P&G',
          status: 'neutral',
          icon: Target,
          hasData: false,
          calculation: 'Requiere datos de Cuenta de P&G'
        };
      }
    } else {
      roicVsWacc = {
        label: 'ROIC vs WACC',
        value: 'Sin datos',
        status: 'neutral',
        icon: Target,
        hasData: false,
        calculation: 'Requiere datos financieros y de valoración'
      };
    }

    // 3. Ratio Deuda/EBITDA
    let debtEbitdaRatio: ExecutiveKPI;
    if (hasDebtData && riskMetrics?.netDebtEbitda) {
      const ratio = riskMetrics.netDebtEbitda;
      debtEbitdaRatio = {
        label: 'Ratio Deuda/EBITDA',
        value: formatRatio(ratio),
        status: ratio < 2.5 ? 'positive' : ratio < 4 ? 'warning' : 'negative',
        icon: AlertTriangle,
        hasData: true,
        calculation: `Deuda Total ${formatCurrency(totalCapitalPendiente)} / EBITDA estimado`
      };
    } else if (hasDebtData) {
      debtEbitdaRatio = {
        label: 'Ratio Deuda/EBITDA',
        value: formatCurrency(totalCapitalPendiente),
        status: 'warning',
        icon: AlertTriangle,
        hasData: true,
        calculation: 'Deuda total disponible, EBITDA pendiente de calcular'
      };
    } else {
      debtEbitdaRatio = {
        label: 'Ratio Deuda/EBITDA',
        value: 'Sin datos',
        status: 'neutral',
        icon: AlertTriangle,
        hasData: false,
        calculation: 'Requiere datos de pool de deuda'
      };
    }

    // 4. Liquidez General
    let liquidityRatio: ExecutiveKPI;
    const liquidityRatioData = ratios.find(r => 
      r.name.toLowerCase().includes('liquidez') || 
      r.name.toLowerCase().includes('corriente') ||
      r.name.toLowerCase().includes('current')
    );

    if (liquidityRatioData?.isCalculated) {
      const value = liquidityRatioData.value;
      liquidityRatio = {
        label: 'Liquidez General',
        value: formatRatio(value),
        status: value > 1.2 ? 'positive' : value >= 1.0 ? 'warning' : 'negative',
        icon: CheckCircle,
        hasData: true,
        calculation: liquidityRatioData.formula || 'Activo Corriente / Pasivo Corriente'
      };
    } else {
      liquidityRatio = {
        label: 'Liquidez General',
        value: 'Sin datos',
        status: 'neutral',
        icon: CheckCircle,
        hasData: false,
        calculation: 'Requiere datos de balance (Activo/Pasivo Corriente)'
      };
    }

    return [evaValuation, roicVsWacc, debtEbitdaRatio, liquidityRatio];
  }, [valuationData, calculateWACC, hasFinancialData, hasDebtData, totalCapitalPendiente, riskMetrics, ratios, getLatestData, hasRatiosData]);

  const hasAnyData = kpis.some(kpi => kpi.hasData);

  return {
    kpis,
    hasAnyData,
    dataStatus
  };
};