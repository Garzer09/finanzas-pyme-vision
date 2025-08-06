import { useState, useEffect } from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';

interface FinancialRatio {
  name: string;
  value: number | null;
  unit: string;
  category: string;
  description: string;
  formula: string;
  isCalculated: boolean;
}

interface UseFinancialRatiosResult {
  ratios: FinancialRatio[];
  loading: boolean;
  error: string | null;
  hasData: boolean;
  missingData: string[];
}

export const useFinancialRatios = (): UseFinancialRatiosResult => {
  const [ratios, setRatios] = useState<FinancialRatio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingData, setMissingData] = useState<string[]>([]);

  const { 
    data: financialData, 
    loading: dataLoading, 
    error: dataError,
    hasRealData 
  } = useFinancialData();

  const calculateRatios = () => {
    if (!hasRealData || !financialData.length) {
      setRatios([]);
      setMissingData(['P&G', 'Balance']);
      return;
    }

    const missing: string[] = [];
    const calculatedRatios: FinancialRatio[] = [];

    // Get latest data for each type
    const pygData = financialData.find(d => d.data_type === 'pyg');
    const balanceData = financialData.find(d => d.data_type === 'balance');

    if (!pygData) missing.push('Cuenta de Resultados (P&G)');
    if (!balanceData) missing.push('Balance de Situación');

    // Extract financial values from data
    const getFinancialValue = (data: any, concept: string): number | null => {
      if (!data?.data_content) return null;
      
      const content = data.data_content;
      
      // Search in yearly data structure
      for (const [year, yearData] of Object.entries(content)) {
        if (typeof yearData === 'object' && yearData !== null) {
          const value = (yearData as any)[concept];
          if (typeof value === 'number') return value;
        }
      }
      return null;
    };

    // Financial values extraction
    const resultadoNeto = getFinancialValue(pygData, 'resultado_neto') || 
                         getFinancialValue(pygData, 'beneficio_neto') ||
                         getFinancialValue(pygData, 'resultado_ejercicio');
    
    const activoTotal = getFinancialValue(balanceData, 'activo_total') ||
                       getFinancialValue(balanceData, 'total_activo');
    
    const patrimonioNeto = getFinancialValue(balanceData, 'patrimonio_neto') ||
                          getFinancialValue(balanceData, 'total_patrimonio');
    
    const pasivoTotal = getFinancialValue(balanceData, 'pasivo_total') ||
                       getFinancialValue(balanceData, 'total_pasivo');
    
    const activoCorriente = getFinancialValue(balanceData, 'activo_corriente');
    const pasivoCorriente = getFinancialValue(balanceData, 'pasivo_corriente');
    
    const ebitda = getFinancialValue(pygData, 'ebitda') ||
                  getFinancialValue(pygData, 'resultado_explotacion');
    
    const gastosFinancieros = getFinancialValue(pygData, 'gastos_financieros') ||
                             getFinancialValue(pygData, 'gastos_financ');

    // ROE Calculation
    if (resultadoNeto !== null && patrimonioNeto !== null && patrimonioNeto !== 0) {
      calculatedRatios.push({
        name: 'ROE',
        value: (resultadoNeto / patrimonioNeto) * 100,
        unit: '%',
        category: 'Rentabilidad',
        description: 'Rentabilidad sobre patrimonio neto',
        formula: 'Resultado Neto / Patrimonio Neto × 100',
        isCalculated: true
      });
    } else {
      calculatedRatios.push({
        name: 'ROE',
        value: null,
        unit: '%',
        category: 'Rentabilidad',
        description: 'Rentabilidad sobre patrimonio neto',
        formula: 'Resultado Neto / Patrimonio Neto × 100',
        isCalculated: false
      });
    }

    // ROA Calculation
    if (resultadoNeto !== null && activoTotal !== null && activoTotal !== 0) {
      calculatedRatios.push({
        name: 'ROA',
        value: (resultadoNeto / activoTotal) * 100,
        unit: '%',
        category: 'Rentabilidad',
        description: 'Rentabilidad sobre activos totales',
        formula: 'Resultado Neto / Activo Total × 100',
        isCalculated: true
      });
    } else {
      calculatedRatios.push({
        name: 'ROA',
        value: null,
        unit: '%',
        category: 'Rentabilidad',
        description: 'Rentabilidad sobre activos totales',
        formula: 'Resultado Neto / Activo Total × 100',
        isCalculated: false
      });
    }

    // Debt Ratio
    if (pasivoTotal !== null && activoTotal !== null && activoTotal !== 0) {
      calculatedRatios.push({
        name: 'Ratio Endeudamiento',
        value: (pasivoTotal / activoTotal) * 100,
        unit: '%',
        category: 'Endeudamiento',
        description: 'Proporción de deuda sobre activos totales',
        formula: 'Pasivo Total / Activo Total × 100',
        isCalculated: true
      });
    } else {
      calculatedRatios.push({
        name: 'Ratio Endeudamiento',
        value: null,
        unit: '%',
        category: 'Endeudamiento',
        description: 'Proporción de deuda sobre activos totales',
        formula: 'Pasivo Total / Activo Total × 100',
        isCalculated: false
      });
    }

    // Liquidity Ratio
    if (activoCorriente !== null && pasivoCorriente !== null && pasivoCorriente !== 0) {
      calculatedRatios.push({
        name: 'Liquidez Corriente',
        value: activoCorriente / pasivoCorriente,
        unit: '',
        category: 'Liquidez',
        description: 'Capacidad para cubrir deudas a corto plazo',
        formula: 'Activo Corriente / Pasivo Corriente',
        isCalculated: true
      });
    } else {
      calculatedRatios.push({
        name: 'Liquidez Corriente',
        value: null,
        unit: '',
        category: 'Liquidez',
        description: 'Capacidad para cubrir deudas a corto plazo',
        formula: 'Activo Corriente / Pasivo Corriente',
        isCalculated: false
      });
    }

    // Interest Coverage Ratio
    if (ebitda !== null && gastosFinancieros !== null && gastosFinancieros !== 0) {
      calculatedRatios.push({
        name: 'Cobertura Intereses',
        value: ebitda / gastosFinancieros,
        unit: 'x',
        category: 'Solvencia',
        description: 'Capacidad para cubrir gastos financieros',
        formula: 'EBITDA / Gastos Financieros',
        isCalculated: true
      });
    } else {
      calculatedRatios.push({
        name: 'Cobertura Intereses',
        value: null,
        unit: 'x',
        category: 'Solvencia',
        description: 'Capacidad para cubrir gastos financieros',
        formula: 'EBITDA / Gastos Financieros',
        isCalculated: false
      });
    }

    setRatios(calculatedRatios);
    setMissingData(missing);
  };

  useEffect(() => {
    setLoading(dataLoading);
    setError(dataError);
    
    if (!dataLoading) {
      calculateRatios();
    }
  }, [financialData, dataLoading, dataError, hasRealData]);

  return {
    ratios,
    loading,
    error,
    hasData: hasRealData && ratios.some(r => r.isCalculated),
    missingData
  };
};