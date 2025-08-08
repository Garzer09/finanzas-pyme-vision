
import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useFinancialData } from './useFinancialData';
import { useRealDebtData } from './useRealDebtData';
import { useFinancialAssumptionsData } from './useFinancialAssumptionsData';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/contexts/CompanyContext';

export interface ValuationMethod {
  id: string;
  name: string;
  value: number;
  weight: number;
}

export interface DCFParameters {
  wacc: number;
  growthRate: number;
  horizon: number;
  netDebt: number;
  fcfProjections: number[];
  terminalValue: number;
}

export interface DataStatus {
  hasFinancialData: boolean;
  hasDebtData: boolean;
  hasAssumptions: boolean;
  availableYears: number[];
  missingData: string[];
}

export interface FinancialData {
  // P&L data (years 0-5)
  revenue: number[];
  ebitda: number[];
  ebit: number[];
  netIncome: number[];
  
  // Balance Sheet data
  totalAssets: number[];
  currentAssets: number[];
  fixedAssets: number[];
  totalDebt: number[];
  equity: number[];
  
  // Cash Flow data
  operatingCashFlow: number[];
  freeCashFlow: number[];
  cash?: number[];
  
  // Financial metrics
  interestExpense: number[];
  taxRate: number;
  sharesOutstanding: number;
}

export interface ValuationData {
  methods: ValuationMethod[];
  dcfParameters: DCFParameters;
  financialData: FinancialData;
  weightedValue: number;
  valuePerShare: number;
  valuationRange: [number, number];
  dataStatus: DataStatus;
  horizon: number;
}

export const useValuation = (companyId?: string) => {
  const { user } = useAuth();
  const { companyId: contextCompanyId } = useCompanyContext();
  const effectiveCompanyId = companyId || contextCompanyId;
  const { data: financialDataRaw, hasRealData: hasFinancialData } = useFinancialData(undefined, effectiveCompanyId);
  const { debtLoans, hasRealData: hasDebtDataFn } = useRealDebtData(effectiveCompanyId);
  const { getLatestAssumption, hasRealData: hasAssumptionsFn } = useFinancialAssumptionsData(effectiveCompanyId);
  
  const hasDebtData = hasDebtDataFn();
  const hasAssumptions = hasAssumptionsFn();
  
  const [horizon, setHorizon] = useState<number>(3);

  const [methods, setMethods] = useState<ValuationMethod[]>([
    { id: 'dcf', name: 'DCF', value: 0, weight: 60 },
    { id: 'book_value', name: 'Valor Libros Ajustado', value: 0, weight: 30 },
    { id: 'liquidation', name: 'Valor Liquidación', value: 0, weight: 10 }
  ]);

  // Get growth rate from assumptions or use default
  const growthAssumption = getLatestAssumption('crecimiento_terminal') || getLatestAssumption('crecimiento_ingresos');
  const [growthRate, setGrowthRate] = useState(growthAssumption?.assumption_value ?? 2.5);
  const taxAssumption = getLatestAssumption('tipo_impositivo');
  const sharesAssumption = getLatestAssumption('acciones_en_circulacion');

  // Helpers to build series from multiple yearly snapshots
  const sortByDateAsc = (arr: any[]) =>
    [...arr].sort((a, b) => new Date(a.period_date).getTime() - new Date(b.period_date).getTime());

  const getSeriesFrom = (items: any[], keys: string[]) => {
    const ordered = sortByDateAsc(items);
    return ordered.map(it => {
      const content = it.data_content || {};
      for (const k of keys) {
        const v = Number(content[k]);
        if (isFinite(v)) return v;
      }
      return 0;
    });
  };

  // Transform real financial data into required format (no dummy fallbacks)
  const financialData = useMemo<FinancialData>(() => {
    const pygItems = financialDataRaw.filter(d => d.data_type === 'estado_pyg');
    const balItems = financialDataRaw.filter(d => d.data_type === 'balance_situacion');
    const cfItems  = financialDataRaw.filter(d => d.data_type === 'estado_flujos');

    return {
      revenue: getSeriesFrom(pygItems, ['ingresos_explotacion', 'importe_neto_cifra_negocios', 'ventas']),
      ebitda: getSeriesFrom(pygItems, ['ebitda', 'resultado_explotacion']), // proxy si no hay EBITDA
      ebit: getSeriesFrom(pygItems, ['resultado_explotacion', 'ebit']),
      netIncome: getSeriesFrom(pygItems, ['resultado_neto', 'beneficio_neto']),
      totalAssets: getSeriesFrom(balItems, ['activo_total', 'total_activo']),
      currentAssets: getSeriesFrom(balItems, ['activo_circulante', 'activo_corriente']),
      fixedAssets: getSeriesFrom(balItems, ['activo_no_corriente', 'inmovilizado']),
      totalDebt: getSeriesFrom(balItems, ['deuda_total', 'deudas_largo_plazo', 'deudas_corto_plazo']),
      equity: getSeriesFrom(balItems, ['patrimonio_neto', 'fondos_propios']),
      operatingCashFlow: getSeriesFrom(cfItems, ['flujos_explotacion', 'cashflow_operaciones']),
      freeCashFlow: getSeriesFrom(cfItems, ['flujo_caja_libre', 'fcf']),
      cash: getSeriesFrom(balItems, ['efectivo', 'caja', 'equivalentes_efectivo', 'disponibilidades']),
      interestExpense: getSeriesFrom(pygItems, ['gastos_financieros', 'coste_financiero']),
      taxRate: Number(taxAssumption?.assumption_value) || 25,
      sharesOutstanding: Number(sharesAssumption?.assumption_value) || 1000000
    };
  }, [financialDataRaw, taxAssumption, sharesAssumption]);

  // Data status for UI indicators
  const dataStatus = useMemo<DataStatus>(() => {
    const availableYears: number[] = [];
    const missingData: string[] = [];

    if (hasFinancialData) {
      financialDataRaw.forEach(item => {
        const year = new Date(item.period_date).getFullYear();
        if (!availableYears.includes(year)) {
          availableYears.push(year);
        }
      });
    }

    if (!hasFinancialData) missingData.push('Estados financieros');
    if (!hasDebtData) missingData.push('Datos de deuda');
    if (!hasAssumptions) missingData.push('Supuestos financieros');

    // Validación de mínimo 3 años utilizando ingresos/ebitda como referencia
    const minYears = Math.min(
      financialData.revenue.length,
      financialData.ebitda.length,
      financialData.netIncome.length
    );
    if (minYears < 3) {
      missingData.push('Histórico insuficiente (mínimo 3 años)');
    }

    return {
      hasFinancialData,
      hasDebtData,
      hasAssumptions,
      availableYears: availableYears.sort((a, b) => b - a),
      missingData
    };
  }, [hasFinancialData, hasDebtData, hasAssumptions, financialDataRaw, financialData]);

  // Calculate WACC from assumptions or financial data
  const calculateWACC = useCallback(() => {
    // Try to get WACC from financial assumptions first
    const waccAssumption = getLatestAssumption('wacc');
    if (waccAssumption && waccAssumption.assumption_value > 0) {
      return waccAssumption.assumption_value;
    }

    // Fallback to calculation from financial data (si existen)
    const years = Math.min(horizon, Math.max(1, financialData.totalDebt.length));
    if (years < 1) return 0;

    const avgDebt = financialData.totalDebt.slice(-years).reduce((a, b) => a + b, 0) / years || 0;
    const avgEquity = financialData.equity.slice(-years).reduce((a, b) => a + b, 0) / years || 0;
    const avgInterest = financialData.interestExpense.slice(-years).reduce((a, b) => a + b, 0) / years || 0;
    const avgNetIncome = financialData.netIncome.slice(-years).reduce((a, b) => a + b, 0) / years || 0;
    
    if (avgDebt === 0 || avgEquity === 0) return 0;
    
    const costOfDebt = avgInterest / avgDebt;
    const costOfEquity = avgNetIncome / avgEquity;
    const totalCapital = avgDebt + avgEquity;
    const debtWeight = totalCapital ? (avgDebt / totalCapital) : 0;
    const equityWeight = totalCapital ? (avgEquity / totalCapital) : 0;
    const wacc = (costOfDebt * (1 - financialData.taxRate / 100) * debtWeight) + (costOfEquity * equityWeight);
    
    return wacc * 100; // %
  }, [financialData, horizon, getLatestAssumption]);

  // Calculate DCF value
  const calculateDCFValue = useCallback(() => {
    // Requerir mínimo datos de flujo de caja y 3 años
    if (financialData.freeCashFlow.length < Math.max(3, horizon)) return 0;

    const wacc = calculateWACC() / 100;
    if (wacc <= 0) return 0;

    const g = growthRate / 100;
    const fcfProjections = financialData.freeCashFlow.slice(-horizon); // últimos N años
    
    let pvFCF = 0;
    fcfProjections.forEach((fcf, index) => {
      const year = index + 1;
      pvFCF += fcf / Math.pow(1 + wacc, year);
    });
    
    const terminalFCF = fcfProjections[fcfProjections.length - 1] * (1 + g);
    const denominator = (wacc - g);
    if (denominator <= 0) return 0;

    const terminalValue = terminalFCF / denominator;
    const pvTerminalValue = terminalValue / Math.pow(1 + wacc, fcfProjections.length);
    
    const enterpriseValue = pvFCF + pvTerminalValue;
    
    const currentDebt = financialData.totalDebt[financialData.totalDebt.length - 1] || 0;
    const currentCash = financialData.cash && financialData.cash.length > 0 
      ? (financialData.cash[financialData.cash.length - 1] || 0)
      : 0;
    const netDebt = currentDebt - currentCash;
    
    return Math.max(0, enterpriseValue - netDebt);
  }, [financialData, growthRate, calculateWACC, horizon]);

  // Calculate Book Value
  const calculateBookValue = useCallback(() => {
    const currentEquity = financialData.equity[financialData.equity.length - 1] || 0;
    const fixedAssets = financialData.fixedAssets[financialData.fixedAssets.length - 1] || 0;
    const revalAssumption = getLatestAssumption('ajuste_revalorizacion_fijos_pct');
    const revaluationPct = Number(revalAssumption?.assumption_value) || 10;
    const revaluationAdjustment = fixedAssets * (revaluationPct / 100);
    return Math.max(0, currentEquity + revaluationAdjustment);
  }, [financialData, getLatestAssumption]);

  // Calculate Liquidation Value
  const calculateLiquidationValue = useCallback(() => {
    const currentAssets = financialData.currentAssets[financialData.currentAssets.length - 1] || 0;
    const fixedAssets = financialData.fixedAssets[financialData.fixedAssets.length - 1] || 0;
    const totalDebt = financialData.totalDebt[financialData.totalDebt.length - 1] || 0;
    
    const caCoeffAss = getLatestAssumption('coef_liquidacion_activo_corriente_pct');
    const faCoeffAss = getLatestAssumption('coef_liquidacion_activo_fijo_pct');
    const costsAss = getLatestAssumption('costes_liquidacion_pct');
    const currentAssetsCoeff = (Number(caCoeffAss?.assumption_value) || 80) / 100;
    const fixedAssetsCoeff = (Number(faCoeffAss?.assumption_value) || 60) / 100;
    const liquidationCosts = (Number(costsAss?.assumption_value) || 15) / 100;
    
    const grossLiquidationValue = (currentAssets * currentAssetsCoeff) + (fixedAssets * fixedAssetsCoeff);
    const netLiquidationValue = grossLiquidationValue * (1 - liquidationCosts) - totalDebt;
    
    return Math.max(0, netLiquidationValue);
  }, [financialData, getLatestAssumption]);

  // Update method values when parameters change
  const updateMethodValues = useCallback(() => {
    const dcfValue = calculateDCFValue();
    const bookValue = calculateBookValue();
    const liquidationValue = calculateLiquidationValue();
    
    setMethods(prev => [
      { ...prev[0], value: dcfValue },
      { ...prev[1], value: bookValue },
      { ...prev[2], value: liquidationValue }
    ]);
  }, [calculateDCFValue, calculateBookValue, calculateLiquidationValue]);

  // Recalculate values when dependencies change
  useMemo(() => {
    updateMethodValues();
  }, [updateMethodValues]);

  // Calculate weighted value
  const weightedValue = useMemo(() => {
    return methods.reduce((total, method) => {
      return total + (method.value * method.weight / 100);
    }, 0);
  }, [methods]);

  // Calculate value per share
  const valuePerShare = useMemo(() => {
    return financialData.sharesOutstanding > 0 ? (weightedValue / financialData.sharesOutstanding) : 0;
  }, [weightedValue, financialData.sharesOutstanding]);

  // Calculate valuation range using sensitivity analysis (±10% on WACC and growth)
  const valuationRange = useMemo<[number, number]>(() => {
    if (financialData.freeCashFlow.length < Math.max(3, horizon)) return [0, 0];

    const baseWACC = calculateWACC();
    if (baseWACC <= 0) return [0, 0];

    const scenarios = [
      { wacc: baseWACC - 1, growth: growthRate - 0.5 },
      { wacc: baseWACC + 1, growth: growthRate + 0.5 },
      { wacc: baseWACC - 1, growth: growthRate + 0.5 },
      { wacc: baseWACC + 1, growth: growthRate - 0.5 }
    ];
    
    const values = scenarios.map(scenario => {
      const wacc = scenario.wacc / 100;
      const g = scenario.growth / 100;
      const fcfProjections = financialData.freeCashFlow.slice(-horizon);
      
      let pvFCF = 0;
      fcfProjections.forEach((fcf, index) => {
        const year = index + 1;
        pvFCF += fcf / Math.pow(1 + wacc, year);
      });
      
      const denominator = (wacc - g);
      if (denominator <= 0) return 0;

      const terminalFCF = fcfProjections[fcfProjections.length - 1] * (1 + g);
      const terminalValue = terminalFCF / denominator;
      const pvTerminalValue = terminalValue / Math.pow(1 + wacc, horizon);
      const enterpriseValue = pvFCF + pvTerminalValue;
      const currentDebt = financialData.totalDebt[financialData.totalDebt.length - 1] || 0;
      const currentCash = financialData.cash && financialData.cash.length > 0 
        ? (financialData.cash[financialData.cash.length - 1] || 0)
        : 0;
      const netDebt = currentDebt - currentCash;
      return Math.max(0, enterpriseValue - netDebt);
    });
    
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    return [minValue, maxValue];
  }, [calculateWACC, growthRate, financialData, horizon]);

  // DCF Parameters
  const dcfParameters = useMemo<DCFParameters>(() => ({
    wacc: calculateWACC(),
    growthRate,
    horizon,
    netDebt: (financialData.totalDebt[financialData.totalDebt.length - 1] || 0) - ((financialData.currentAssets[financialData.currentAssets.length - 1] || 0) * 0.3),
    fcfProjections: financialData.freeCashFlow.slice(-horizon),
    terminalValue: 0
  }), [calculateWACC, growthRate, financialData, horizon]);

  // Debounced weight update
  const debouncedUpdateWeights = useMemo(
    () => debounce((newWeights: number[]) => {
      setMethods(prev => 
        prev.map((method, index) => ({
          ...method,
          weight: newWeights[index] || 0
        }))
      );
    }, 500),
    []
  );

  const updateMethodWeights = useCallback((newWeights: number[]) => {
    const total = newWeights.reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(total - 100) < 0.1) {
      debouncedUpdateWeights(newWeights);
    }
  }, [debouncedUpdateWeights]);

  const updateGrowthRate = useCallback((newRate: number) => {
    setGrowthRate(newRate);
  }, []);

  const updateHorizon = useCallback((newHorizon: number) => {
    const clamped = Math.max(3, newHorizon);
    setHorizon(clamped);
  }, []);

  const valuationData: ValuationData = {
    methods,
    dcfParameters,
    financialData,
    weightedValue,
    valuePerShare,
    valuationRange,
    dataStatus,
    horizon
  };

  return {
    valuationData,
    updateMethodWeights,
    updateGrowthRate,
    updateHorizon,
    calculateWACC
  };
};
