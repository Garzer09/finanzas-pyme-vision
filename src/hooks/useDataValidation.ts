import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DataValidationResult {
  isValid: boolean;
  missingTables: string[];
  availableYears: number[];
  totalRecords: number;
  dataQuality: {
    pyg: number;
    balance: number;
    cashflow: number;
  };
}

export const useDataValidation = () => {
  const [validation, setValidation] = useState<DataValidationResult>({
    isValid: false,
    missingTables: [],
    availableYears: [],
    totalRecords: 0,
    dataQuality: { pyg: 0, balance: 0, cashflow: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validateDataIntegrity = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting data validation...');

      // Check P&G data
      const { data: pygData, error: pygError } = await supabase
        .from('fs_pyg_lines')
        .select('period_year, concept, amount')
        .order('period_year', { ascending: false });

      // Check Balance data
      const { data: balanceData, error: balanceError } = await supabase
        .from('fs_balance_lines')
        .select('period_year, concept, amount')
        .order('period_year', { ascending: false });

      // Check Cash Flow data
      const { data: cashflowData, error: cashflowError } = await supabase
        .from('fs_cashflow_lines')
        .select('period_year, concept, amount')
        .order('period_year', { ascending: false });

      if (pygError || balanceError || cashflowError) {
        throw new Error('Error accessing financial tables');
      }

      const missingTables: string[] = [];
      const availableYears = new Set<number>();
      let totalRecords = 0;

      // Validate P&G data
      if (!pygData || pygData.length === 0) {
        missingTables.push('Cuenta de Resultados (P&G)');
      } else {
        pygData.forEach(item => availableYears.add(item.period_year));
        totalRecords += pygData.length;
      }

      // Validate Balance data
      if (!balanceData || balanceData.length === 0) {
        missingTables.push('Balance de Situación');
      } else {
        balanceData.forEach(item => availableYears.add(item.period_year));
        totalRecords += balanceData.length;
      }

      // Validate Cash Flow data
      if (!cashflowData || cashflowData.length === 0) {
        missingTables.push('Estado de Flujos de Efectivo');
      } else {
        cashflowData.forEach(item => availableYears.add(item.period_year));
        totalRecords += cashflowData.length;
      }

      // Calculate data quality scores
      const dataQuality = {
        pyg: pygData ? Math.min(100, (pygData.length / 15) * 100) : 0, // Expect ~15 P&G concepts
        balance: balanceData ? Math.min(100, (balanceData.length / 20) * 100) : 0, // Expect ~20 Balance concepts
        cashflow: cashflowData ? Math.min(100, (cashflowData.length / 10) * 100) : 0 // Expect ~10 Cash Flow concepts
      };

      const validationResult: DataValidationResult = {
        isValid: missingTables.length === 0 && totalRecords > 0,
        missingTables,
        availableYears: Array.from(availableYears).sort((a, b) => b - a),
        totalRecords,
        dataQuality
      };

      console.log('✅ Data validation completed:', validationResult);
      setValidation(validationResult);

    } catch (err) {
      console.error('❌ Data validation failed:', err);
      setError(err instanceof Error ? err.message : 'Error validating data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateDataIntegrity();
  }, []);

  const getDataHealthStatus = () => {
    if (validation.totalRecords === 0) return 'critical';
    if (validation.missingTables.length > 1) return 'warning';
    if (validation.missingTables.length === 1) return 'partial';
    return 'healthy';
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];
    
    if (validation.missingTables.includes('Cuenta de Resultados (P&G)')) {
      recommendations.push('Cargar archivo CSV "cuenta-pyg.csv" para habilitar análisis de rentabilidad');
    }
    
    if (validation.missingTables.includes('Balance de Situación')) {
      recommendations.push('Cargar archivo CSV "balance-situacion.csv" para análisis patrimonial');
    }
    
    if (validation.missingTables.includes('Estado de Flujos de Efectivo')) {
      recommendations.push('Cargar archivo CSV "estado-flujos.csv" para análisis de liquidez');
    }

    if (validation.dataQuality.pyg < 50) {
      recommendations.push('Datos de P&G incompletos - verificar conceptos en el archivo CSV');
    }

    if (validation.dataQuality.balance < 50) {
      recommendations.push('Datos del Balance incompletos - verificar conceptos en el archivo CSV');
    }

    return recommendations;
  };

  return {
    validation,
    loading,
    error,
    healthStatus: getDataHealthStatus(),
    recommendations: getRecommendations(),
    refetch: validateDataIntegrity
  };
};