import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

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
}

export const useValuation = () => {
  // Mock financial data extracted from financial statements (PGC Year 0-5)
  const [financialData] = useState<FinancialData>({
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
  });

  const [methods, setMethods] = useState<ValuationMethod[]>([
    { id: 'dcf', name: 'DCF', value: 0, weight: 60 },
    { id: 'book_value', name: 'Valor Libros Ajustado', value: 0, weight: 30 },
    { id: 'liquidation', name: 'Valor Liquidación', value: 0, weight: 10 }
  ]);

  const [growthRate, setGrowthRate] = useState(2.5);

  // Calculate WACC from internal financial data
  const calculateWACC = useCallback(() => {
    const avgDebt = financialData.totalDebt.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const avgEquity = financialData.equity.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const avgInterest = financialData.interestExpense.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const avgNetIncome = financialData.netIncome.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    
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
  }, [financialData]);

  // Calculate DCF value
  const calculateDCFValue = useCallback(() => {
    const wacc = calculateWACC() / 100;
    const g = growthRate / 100;
    const fcfProjections = financialData.freeCashFlow.slice(1, 6); // Years 1-5
    
    // Present value of FCF
    let pvFCF = 0;
    fcfProjections.forEach((fcf, index) => {
      const year = index + 1;
      pvFCF += fcf / Math.pow(1 + wacc, year);
    });
    
    // Terminal value
    const terminalFCF = fcfProjections[fcfProjections.length - 1] * (1 + g);
    const terminalValue = terminalFCF / (wacc - g);
    const pvTerminalValue = terminalValue / Math.pow(1 + wacc, 5);
    
    // Enterprise value
    const enterpriseValue = pvFCF + pvTerminalValue;
    
    // Equity value = Enterprise value - Net debt
    const currentDebt = financialData.totalDebt[0];
    const currentCash = financialData.currentAssets[0] * 0.3; // Assume 30% of current assets is cash
    const netDebt = currentDebt - currentCash;
    
    return Math.max(0, enterpriseValue - netDebt);
  }, [financialData, growthRate, calculateWACC]);

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
      const fcfProjections = financialData.freeCashFlow.slice(1, 6);
      
      let pvFCF = 0;
      fcfProjections.forEach((fcf, index) => {
        const year = index + 1;
        pvFCF += fcf / Math.pow(1 + wacc, year);
      });
      
      const terminalFCF = fcfProjections[fcfProjections.length - 1] * (1 + g);
      const terminalValue = terminalFCF / (wacc - g);
      const pvTerminalValue = terminalValue / Math.pow(1 + wacc, 5);
      
      return pvFCF + pvTerminalValue;
    });
    
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    return [minValue, maxValue];
  }, [calculateWACC, growthRate, financialData]);

  // DCF Parameters
  const dcfParameters = useMemo<DCFParameters>(() => ({
    wacc: calculateWACC(),
    growthRate,
    horizon: 5,
    netDebt: financialData.totalDebt[0] - (financialData.currentAssets[0] * 0.3),
    fcfProjections: financialData.freeCashFlow.slice(1, 6),
    terminalValue: 0 // Calculated in DCF method
  }), [calculateWACC, growthRate, financialData]);

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

  const valuationData: ValuationData = {
    methods,
    dcfParameters,
    financialData,
    weightedValue,
    valuePerShare,
    valuationRange
  };

  return {
    valuationData,
    updateMethodWeights,
    updateGrowthRate,
    calculateWACC
  };
};