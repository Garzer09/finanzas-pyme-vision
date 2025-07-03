import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

export interface ValuationMethod {
  id: string;
  name: string;
  value: number;
  weight: number;
}

export interface DCFAssumptions {
  wacc: number;
  growthRate: number;
  horizon: number;
}

export interface ValuationData {
  methods: ValuationMethod[];
  dcfAssumptions: DCFAssumptions;
  sharesOutstanding: number;
  weightedValue: number;
  valuePerShare: number;
  confidenceInterval: [number, number];
  sectorPremium: number;
}

export const useValuation = () => {
  const [methods, setMethods] = useState<ValuationMethod[]>([
    { id: 'dcf', name: 'DCF', value: 12500000, weight: 40 },
    { id: 'multiples', name: 'Múltiplos', value: 14200000, weight: 30 },
    { id: 'assets', name: 'Activos', value: 11800000, weight: 20 },
    { id: 'liquidation', name: 'Liquidación', value: 9500000, weight: 10 }
  ]);

  const [dcfAssumptions, setDCFAssumptions] = useState<DCFAssumptions>({
    wacc: 8.5,
    growthRate: 2.5,
    horizon: 5
  });

  const [sharesOutstanding, setSharesOutstanding] = useState(1000000);

  // Calculate weighted value
  const weightedValue = useMemo(() => {
    return methods.reduce((total, method) => {
      return total + (method.value * method.weight / 100);
    }, 0);
  }, [methods]);

  // Calculate value per share
  const valuePerShare = useMemo(() => {
    return weightedValue / sharesOutstanding;
  }, [weightedValue, sharesOutstanding]);

  // Calculate confidence interval (80%)
  const confidenceInterval = useMemo<[number, number]>(() => {
    const values = methods.map(m => m.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const margin = range * 0.1; // 10% margin for 80% CI
    return [weightedValue - margin, weightedValue + margin];
  }, [methods, weightedValue]);

  // Calculate sector premium/discount
  const sectorPremium = useMemo(() => {
    const sectorAvg = 13000000; // Mock sector average
    return ((weightedValue - sectorAvg) / sectorAvg) * 100;
  }, [weightedValue]);

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
    if (total !== 100) {
      const normalized = newWeights.map(weight => (weight / total) * 100);
      debouncedUpdateWeights(normalized);
    } else {
      debouncedUpdateWeights(newWeights);
    }
  }, [debouncedUpdateWeights]);

  const updateMethodValue = useCallback((methodId: string, newValue: number) => {
    setMethods(prev =>
      prev.map(method =>
        method.id === methodId ? { ...method, value: newValue } : method
      )
    );
  }, []);

  const updateDCFAssumptions = useCallback((newAssumptions: Partial<DCFAssumptions>) => {
    setDCFAssumptions(prev => ({ ...prev, ...newAssumptions }));
    
    // Recalculate DCF value based on new assumptions
    const newDCFValue = calculateDCFValue(newAssumptions as DCFAssumptions);
    updateMethodValue('dcf', newDCFValue);
  }, [updateMethodValue]);

  // DCF calculation (simplified)
  const calculateDCFValue = (assumptions: DCFAssumptions): number => {
    const { wacc, growthRate, horizon } = assumptions;
    const baseCashFlow = 2000000; // Mock base cash flow
    let terminalValue = 0;
    let discountedCF = 0;

    // Calculate present value of cash flows
    for (let year = 1; year <= horizon; year++) {
      const cf = baseCashFlow * Math.pow(1 + growthRate / 100, year);
      const pv = cf / Math.pow(1 + wacc / 100, year);
      discountedCF += pv;
    }

    // Calculate terminal value
    const terminalCF = baseCashFlow * Math.pow(1 + growthRate / 100, horizon + 1);
    terminalValue = (terminalCF / (wacc / 100 - growthRate / 100)) / Math.pow(1 + wacc / 100, horizon);

    return discountedCF + terminalValue;
  };

  const recalculateDCF = useCallback(() => {
    const newDCFValue = calculateDCFValue(dcfAssumptions);
    updateMethodValue('dcf', newDCFValue);
  }, [dcfAssumptions, updateMethodValue]);

  const valuationData: ValuationData = {
    methods,
    dcfAssumptions,
    sharesOutstanding,
    weightedValue,
    valuePerShare,
    confidenceInterval,
    sectorPremium
  };

  return {
    valuationData,
    updateMethodWeights,
    updateMethodValue,
    updateDCFAssumptions,
    updateSharesOutstanding: setSharesOutstanding,
    recalculateDCF
  };
};