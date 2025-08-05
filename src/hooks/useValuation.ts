import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useFinancialData } from './useFinancialData';
import { useRealDebtData } from './useRealDebtData';
import { useFinancialAssumptionsData } from './useFinancialAssumptionsData';
import { useAuth } from '@/contexts/AuthContext';

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
  const { data: financialDataRaw, hasRealData: hasFinancialData } = useFinancialData();
  const { debtLoans, hasRealData: hasDebtDataFn } = useRealDebtData(companyId);
  const { getLatestAssumption, hasRealData: hasAssumptionsFn } = useFinancialAssumptionsData(companyId);
  
  const hasDebtData = hasDebtDataFn();
  const hasAssumptions = hasAssumptionsFn();
  
  const [horizon, setHorizon] = useState<number>(3); // Default to 3 years per client requirement

  const [methods, setMethods] = useState<ValuationMethod[]>([
    { id: 'dcf', name: 'DCF', value: 0, weight: 60 },
    { id: 'book_value', name: 'Valor Libros Ajustado', value: 0, weight: 30 },
    { id: 'liquidation', name: 'Valor Liquidación', value: 0, weight: 10 }
  ]);

  // Get growth rate from assumptions or use default
  const growthAssumption = getLatestAssumption('crecimiento_terminal') || getLatestAssumption('crecimiento_ingresos');
  const [growthRate, setGrowthRate] = useState(growthAssumption?.assumption_value || 2.5);

  // Transform real financial data into required format
  const financialData = useMemo<FinancialData>(() => {
    if (!hasFinancialData) {
      // Fallback mock data when no real data is available
      return {
        revenue: [2500000, 2750000, 3025000, 3327500, 3660250, 4026275],
        ebitda: [450000, 495000, 544500, 598950, 658845, 724730],
        ebit: [350000, 385000, 423500, 465850, 512435, 563679],
        netIncome: [210000, 231000, 254100, 279510, 307461, 338207],
        totalAssets: [3500000, 3850000, 4235000, 4658500, 5124350, 5636785],
        currentAssets: [1200000, 1320000, 1452000, 1597200, 1756920, 1932612],
        fixedAssets: [2300000, 2530000, 2783000, 3061300, 3367430, 3704173],
        totalDebt: [1800000, 1980000, 2178000, 2395800, 2635380, 2898918],
        equity: [1700000, 1870000, 2057000, 2262700, 2488970, 2737867],
        operatingCashFlow: [380000, 418000, 459800, 505780, 556358, 611994],
        freeCashFlow: [280000, 308000, 338800, 372680, 409948, 450943],
        interestExpense: [90000, 99000, 108900, 119790, 131769, 144946],
        taxRate: 25,
        sharesOutstanding: 1000000
      };
    }

    // Extract data from real financial statements
    const pygData = financialDataRaw.find(d => d.data_type === 'estado_pyg')?.data_content || {};
    const balanceData = financialDataRaw.find(d => d.data_type === 'balance_situacion')?.data_content || {};
    const cashflowData = financialDataRaw.find(d => d.data_type === 'estado_flujos')?.data_content || {};

    // Helper function to extract multi-year data or create projections
    const extractOrProject = (value: any, fallbackArray: number[]): number[] => {
      if (typeof value === 'object' && value !== null) {
        const years = Object.keys(value).sort();
        const values = years.map(year => Number(value[year]) || 0);
        
        // If we have historical data, project forward for the remaining years
        if (values.length > 0) {
          const avgGrowth = 0.1; // 10% default growth
          const lastValue = values[values.length - 1];
          const projectedValues = [...values];
          
          for (let i = values.length; i < horizon + 1; i++) {
            projectedValues.push(lastValue * Math.pow(1 + avgGrowth, i - values.length + 1));
          }
          
          return projectedValues.slice(0, horizon + 1);
        }
      }
      
      return fallbackArray.slice(0, horizon + 1);
    };

    return {
      revenue: extractOrProject(pygData['Importe neto de la cifra de negocios'] || pygData['Ventas'], [2500000, 2750000, 3025000, 3327500]),
      ebitda: extractOrProject(pygData['EBITDA'], [450000, 495000, 544500, 598950]),
      ebit: extractOrProject(pygData['EBIT'] || pygData['Resultado de explotación'], [350000, 385000, 423500, 465850]),
      netIncome: extractOrProject(pygData['Resultado del ejercicio'], [210000, 231000, 254100, 279510]),
      totalAssets: extractOrProject(balanceData['TOTAL ACTIVO'], [3500000, 3850000, 4235000, 4658500]),
      currentAssets: extractOrProject(balanceData['Activo circulante'] || balanceData['Activo corriente'], [1200000, 1320000, 1452000, 1597200]),
      fixedAssets: extractOrProject(balanceData['Inmovilizado'] || balanceData['Activo no corriente'], [2300000, 2530000, 2783000, 3061300]),
      totalDebt: extractOrProject(balanceData['Deudas a largo plazo'] || balanceData['Pasivo no corriente'], [1800000, 1980000, 2178000, 2395800]),
      equity: extractOrProject(balanceData['Fondos propios'] || balanceData['Patrimonio neto'], [1700000, 1870000, 2057000, 2262700]),
      operatingCashFlow: extractOrProject(cashflowData['Flujos de efectivo de las actividades de explotación'], [380000, 418000, 459800, 505780]),
      freeCashFlow: extractOrProject(cashflowData['Flujo de caja libre'], [280000, 308000, 338800, 372680]),
      interestExpense: extractOrProject(pygData['Gastos financieros'], [90000, 99000, 108900, 119790]),
      taxRate: 25, // TODO: Calculate from real data
      sharesOutstanding: 1000000 // TODO: Get from company data
    };
  }, [financialDataRaw, hasFinancialData, horizon]);

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

    return {
      hasFinancialData,
      hasDebtData,
      hasAssumptions,
      availableYears: availableYears.sort((a, b) => b - a),
      missingData
    };
  }, [hasFinancialData, hasDebtData, hasAssumptions, financialDataRaw]);

  // Calculate WACC from assumptions or financial data
  const calculateWACC = useCallback(() => {
    // Try to get WACC from financial assumptions first
    const waccAssumption = getLatestAssumption('wacc');
    if (waccAssumption && waccAssumption.assumption_value > 0) {
      return waccAssumption.assumption_value;
    }

    // Fallback to calculation from financial data
    const years = Math.min(horizon, financialData.totalDebt.length - 1);
    const avgDebt = financialData.totalDebt.slice(0, years).reduce((a, b) => a + b, 0) / years;
    const avgEquity = financialData.equity.slice(0, years).reduce((a, b) => a + b, 0) / years;
    const avgInterest = financialData.interestExpense.slice(0, years).reduce((a, b) => a + b, 0) / years;
    const avgNetIncome = financialData.netIncome.slice(0, years).reduce((a, b) => a + b, 0) / years;
    
    if (avgDebt === 0 || avgEquity === 0) return 8.5; // Default WACC if no data
    
    // Cost of debt = Interest expense / Average debt
    const costOfDebt = avgInterest / avgDebt;
    
    // Cost of equity = ROE = Net Income / Average Equity
    const costOfEquity = avgNetIncome / avgEquity;
    
    // Capital structure weights
    const totalCapital = avgDebt + avgEquity;
    const debtWeight = avgDebt / totalCapital;
    const equityWeight = avgEquity / totalCapital;
    
    // WACC = (Cost of debt * (1 - tax rate) * debt weight) + (Cost of equity * equity weight)
    const wacc = (costOfDebt * (1 - financialData.taxRate / 100) * debtWeight) + (costOfEquity * equityWeight);
    
    return wacc * 100; // Convert to percentage
  }, [financialData, horizon, getLatestAssumption]);

  // Calculate DCF value
  const calculateDCFValue = useCallback(() => {
    const wacc = calculateWACC() / 100;
    const g = growthRate / 100;
    const fcfProjections = financialData.freeCashFlow.slice(1, horizon + 1); // Use configurable horizon
    
    // Present value of FCF
    let pvFCF = 0;
    fcfProjections.forEach((fcf, index) => {
      const year = index + 1;
      pvFCF += fcf / Math.pow(1 + wacc, year);
    });
    
    // Terminal value
    const terminalFCF = fcfProjections[fcfProjections.length - 1] * (1 + g);
    const terminalValue = terminalFCF / (wacc - g);
    const pvTerminalValue = terminalValue / Math.pow(1 + wacc, horizon);
    
    // Enterprise value
    const enterpriseValue = pvFCF + pvTerminalValue;
    
    // Equity value = Enterprise value - Net debt
    const currentDebt = financialData.totalDebt[0];
    const currentCash = financialData.currentAssets[0] * 0.3; // Assume 30% of current assets is cash
    const netDebt = currentDebt - currentCash;
    
    return Math.max(0, enterpriseValue - netDebt);
  }, [financialData, growthRate, calculateWACC, horizon]);

  // Calculate Book Value
  const calculateBookValue = useCallback(() => {
    const currentEquity = financialData.equity[0];
    // Add potential revaluation adjustments (10% uplift for real estate, equipment)
    const revaluationAdjustment = financialData.fixedAssets[0] * 0.1;
    return currentEquity + revaluationAdjustment;
  }, [financialData]);

  // Calculate Liquidation Value
  const calculateLiquidationValue = useCallback(() => {
    const currentAssets = financialData.currentAssets[0];
    const fixedAssets = financialData.fixedAssets[0];
    const totalDebt = financialData.totalDebt[0];
    
    // Liquidation coefficients (can be adjusted by user)
    const currentAssetsCoeff = 0.8; // 80% recovery on current assets
    const fixedAssetsCoeff = 0.6;   // 60% recovery on fixed assets
    const liquidationCosts = 0.15;  // 15% liquidation costs
    
    const grossLiquidationValue = (currentAssets * currentAssetsCoeff) + (fixedAssets * fixedAssetsCoeff);
    const netLiquidationValue = grossLiquidationValue * (1 - liquidationCosts) - totalDebt;
    
    return Math.max(0, netLiquidationValue);
  }, [financialData]);

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
    return weightedValue / financialData.sharesOutstanding;
  }, [weightedValue, financialData.sharesOutstanding]);

  // Calculate valuation range using sensitivity analysis (±10% on WACC and growth)
  const valuationRange = useMemo<[number, number]>(() => {
    const baseWACC = calculateWACC();
    const scenarios = [
      { wacc: baseWACC - 1, growth: growthRate - 0.5 },
      { wacc: baseWACC + 1, growth: growthRate + 0.5 },
      { wacc: baseWACC - 1, growth: growthRate + 0.5 },
      { wacc: baseWACC + 1, growth: growthRate - 0.5 }
    ];
    
    const values = scenarios.map(scenario => {
      const wacc = scenario.wacc / 100;
      const g = scenario.growth / 100;
      const fcfProjections = financialData.freeCashFlow.slice(1, horizon + 1);
      
      let pvFCF = 0;
      fcfProjections.forEach((fcf, index) => {
        const year = index + 1;
        pvFCF += fcf / Math.pow(1 + wacc, year);
      });
      
      const terminalFCF = fcfProjections[fcfProjections.length - 1] * (1 + g);
      const terminalValue = terminalFCF / (wacc - g);
      const pvTerminalValue = terminalValue / Math.pow(1 + wacc, horizon);
      
      return pvFCF + pvTerminalValue;
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
    netDebt: financialData.totalDebt[0] - (financialData.currentAssets[0] * 0.3),
    fcfProjections: financialData.freeCashFlow.slice(1, horizon + 1),
    terminalValue: 0 // Calculated in DCF method
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
    // Ensure weights sum to 100%
    const total = newWeights.reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(total - 100) < 0.1) { // Allow small rounding errors
      debouncedUpdateWeights(newWeights);
    }
  }, [debouncedUpdateWeights]);

  const updateGrowthRate = useCallback((newRate: number) => {
    setGrowthRate(newRate);
  }, []);

  const updateHorizon = useCallback((newHorizon: number) => {
    setHorizon(newHorizon);
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