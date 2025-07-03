import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from 'react-use';

interface MonthData {
  mes: string;
  servicio: number;
  flujoDisponible: number;
  dscr: number;
}

interface DscrCalculations {
  servicioDeudaAnual: number;
  flujoDisponibleAnual: number;
  dscrPromedio: number;
  dscrMinimo: number;
  mesesEnRiesgo: number;
  monthlyData: MonthData[];
}

export const useDscr = (initialEbitda: number = 450000, initialOcf: number = 380000) => {
  const [ebitdaAnnual, setEbitdaAnnual] = useState(initialEbitda);
  const [ocfAnnual, setOcfAnnual] = useState(initialOcf);
  const [debouncedEbitda, setDebouncedEbitda] = useState(initialEbitda);
  const [debouncedOcf, setDebouncedOcf] = useState(initialOcf);

  // Debounce para evitar cálculos excesivos
  useDebounce(
    () => {
      setDebouncedEbitda(ebitdaAnnual);
      setDebouncedOcf(ocfAnnual);
    },
    300,
    [ebitdaAnnual, ocfAnnual]
  );

  // Datos base del servicio de deuda (simulados)
  const baseDebtService = useMemo(() => [
    { mes: 'Ene', servicio: 28500, flujoBase: 35000 },
    { mes: 'Feb', servicio: 28500, flujoBase: 32000 },
    { mes: 'Mar', servicio: 28500, flujoBase: 38000 },
    { mes: 'Abr', servicio: 30200, flujoBase: 34000 },
    { mes: 'May', servicio: 30200, flujoBase: 36000 },
    { mes: 'Jun', servicio: 30200, flujoBase: 29000 },
    { mes: 'Jul', servicio: 28500, flujoBase: 41000 },
    { mes: 'Ago', servicio: 28500, flujoBase: 37000 },
    { mes: 'Sep', servicio: 28500, flujoBase: 33000 },
    { mes: 'Oct', servicio: 32000, flujoBase: 39000 },
    { mes: 'Nov', servicio: 32000, flujoBase: 35000 },
    { mes: 'Dic', servicio: 32000, flujoBase: 42000 }
  ], []);

  // Cálculos reactivos basados en los inputs del usuario
  const calculations = useMemo((): DscrCalculations => {
    const monthlyOcf = debouncedOcf / 12;
    
    const monthlyData: MonthData[] = baseDebtService.map(month => {
      // Ajustar flujo disponible basado en el OCF anual del usuario
      const adjustmentFactor = debouncedOcf / 380000; // 380K es el OCF base
      const flujoDisponible = Math.round(month.flujoBase * adjustmentFactor);
      const dscr = flujoDisponible / month.servicio;
      
      return {
        mes: month.mes,
        servicio: month.servicio,
        flujoDisponible,
        dscr: Number(dscr.toFixed(3))
      };
    });

    const servicioDeudaAnual = monthlyData.reduce((sum, item) => sum + item.servicio, 0);
    const flujoDisponibleAnual = monthlyData.reduce((sum, item) => sum + item.flujoDisponible, 0);
    const dscrPromedio = flujoDisponibleAnual / servicioDeudaAnual;
    const dscrMinimo = Math.min(...monthlyData.map(item => item.dscr));
    const mesesEnRiesgo = monthlyData.filter(item => item.dscr < 1.0).length;

    return {
      servicioDeudaAnual,
      flujoDisponibleAnual,
      dscrPromedio: Number(dscrPromedio.toFixed(3)),
      dscrMinimo: Number(dscrMinimo.toFixed(3)),
      mesesEnRiesgo,
      monthlyData
    };
  }, [debouncedEbitda, debouncedOcf, baseDebtService]);

  // Funciones de stress test
  const applyStressTest = (type: 'ebitda_decrease' | 'interest_increase') => {
    if (type === 'ebitda_decrease') {
      const newEbitda = ebitdaAnnual * 0.9; // -10%
      const newOcf = ocfAnnual * 0.9; // Asumimos que OCF también baja
      setEbitdaAnnual(newEbitda);
      setOcfAnnual(newOcf);
    } else if (type === 'interest_increase') {
      // +100 pb en tipo de interés afecta al servicio de deuda
      // Para simplificar, reducimos el flujo disponible
      const newOcf = ocfAnnual * 0.95; // -5% por aumento de costes financieros
      setOcfAnnual(newOcf);
    }
  };

  const resetToBase = () => {
    setEbitdaAnnual(initialEbitda);
    setOcfAnnual(initialOcf);
  };

  return {
    // Inputs
    ebitdaAnnual,
    ocfAnnual,
    setEbitdaAnnual,
    setOcfAnnual,
    
    // Cálculos
    ...calculations,
    
    // Acciones
    applyStressTest,
    resetToBase
  };
};