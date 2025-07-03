import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from 'react-use';

interface BreakevenInputs {
  fixedCost: number;
  variableCostPct: number;
  pricePerUnit: number;
  unitsSold: number;
}

interface BreakevenResults {
  breakevenUnits: number;
  breakevenValue: number;
  marginOfSafety: number;
  contributionMargin: number;
  chartData: Array<{
    units: number;
    revenue: number;
    totalCosts: number;
    fixedCosts: number;
    profit: number;
  }>;
}

export const useBreakeven = (initialInputs: BreakevenInputs) => {
  const [inputs, setInputs] = useState<BreakevenInputs>(initialInputs);
  const [debouncedInputs, setDebouncedInputs] = useState<BreakevenInputs>(initialInputs);

  // Debounce inputs for 300ms
  useDebounce(
    () => {
      setDebouncedInputs(inputs);
    },
    300,
    [inputs]
  );

  const results = useMemo((): BreakevenResults => {
    const { fixedCost, variableCostPct, pricePerUnit, unitsSold } = debouncedInputs;
    
    // Calculate key metrics
    const contributionMargin = 100 - variableCostPct;
    const contributionPerUnit = pricePerUnit * (contributionMargin / 100);
    const breakevenUnits = Math.round(fixedCost / contributionPerUnit);
    const breakevenValue = breakevenUnits * pricePerUnit;
    
    const currentRevenue = unitsSold * pricePerUnit;
    const marginOfSafety = ((currentRevenue - breakevenValue) / currentRevenue) * 100;

    // Generate chart data
    const maxUnits = Math.max(breakevenUnits * 1.5, unitsSold * 1.2);
    const step = maxUnits / 25;
    const chartData = [];

    for (let units = 0; units <= maxUnits; units += step) {
      const revenue = units * pricePerUnit;
      const variableCosts = revenue * (variableCostPct / 100);
      const totalCosts = fixedCost + variableCosts;
      
      chartData.push({
        units: Math.round(units),
        revenue,
        totalCosts,
        fixedCosts: fixedCost,
        profit: revenue - totalCosts
      });
    }

    return {
      breakevenUnits,
      breakevenValue,
      marginOfSafety,
      contributionMargin,
      chartData
    };
  }, [debouncedInputs]);

  const updateInput = (key: keyof BreakevenInputs, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return {
    inputs,
    results,
    updateInput
  };
};