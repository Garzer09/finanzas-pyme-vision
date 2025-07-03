import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

export interface SensitivityData {
  salesDelta: number;
  costsDelta: number;
  ebitdaBase: number;
  ebitdaSimulated: number;
  deltaPercentage: number;
  salesImpactPer1Percent: number;
  costsImpactPer1Percent: number;
}

export const useSensitivity = (baseEbitda: number = 450) => {
  const [salesDelta, setSalesDelta] = useState(0);
  const [costsDelta, setCostsDelta] = useState(0);

  // Impact per 1% change
  const salesImpactPer1Percent = 25; // €25K per 1% sales change
  const costsImpactPer1Percent = 15; // €15K per 1% costs change

  // Debounced setters for smooth UX
  const debouncedSetSales = useMemo(
    () => debounce((value: number) => setSalesDelta(value), 300),
    []
  );

  const debouncedSetCosts = useMemo(
    () => debounce((value: number) => setCostsDelta(value), 300),
    []
  );

  const handleSalesChange = useCallback((value: number[]) => {
    debouncedSetSales(value[0]);
  }, [debouncedSetSales]);

  const handleCostsChange = useCallback((value: number[]) => {
    debouncedSetCosts(value[0]);
  }, [debouncedSetCosts]);

  // Calculate simulated EBITDA
  const ebitdaSimulated = useMemo(() => {
    return baseEbitda + (salesDelta * salesImpactPer1Percent) - (costsDelta * costsImpactPer1Percent);
  }, [baseEbitda, salesDelta, costsDelta, salesImpactPer1Percent, costsImpactPer1Percent]);

  // Calculate percentage change
  const deltaPercentage = useMemo(() => {
    return ((ebitdaSimulated - baseEbitda) / baseEbitda) * 100;
  }, [ebitdaSimulated, baseEbitda]);

  const sensitivityData: SensitivityData = {
    salesDelta,
    costsDelta,
    ebitdaBase: baseEbitda,
    ebitdaSimulated,
    deltaPercentage,
    salesImpactPer1Percent,
    costsImpactPer1Percent
  };

  return {
    sensitivityData,
    handleSalesChange,
    handleCostsChange,
    setSalesDelta,
    setCostsDelta
  };
};