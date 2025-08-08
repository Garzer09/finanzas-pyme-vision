import { useMemo } from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useFinancialAssumptionsData } from '@/hooks/useFinancialAssumptionsData';
import { useCompanyContext } from '@/contexts/CompanyContext';

export type ScenarioType = 'base' | 'optimista' | 'pesimista';

export interface PLProjectionItem {
  year: string; // A0..A5
  ingresos: number; // en K€
  costes: number;   // en K€
  ebitda: number;   // en K€
  margenEbitda: number; // %
}

export interface BalanceProjectionItem {
  year: string;
  inmovilizado: number; // K€
  circulante: number;   // K€
  tesoreria: number;    // K€
}

export interface FinancingProjectionItem {
  year: string;
  patrimonio: number; // K€
  deudaLP: number;    // K€
  deudaCP: number;    // K€
}

export interface CashFlowProjectionItem {
  year: string;
  ocf: number;        // K€ Operativo
  icf: number;        // K€ Inversión (negativo)
  fcf: number;        // K€ Libre
  cashOnHand: number; // K€ Caja acumulada
}

export interface RatiosProjectionData {
  rentabilidadData: Array<{ year: string; roe: number; roa: number; roic: number; }>;
  liquidezData: Array<{ year: string; currentRatio: number; quickRatio: number; cashRatio: number; }>;
  solvenciaData: Array<{ year: string; debtToEquity: number; debtToAssets: number; timesInterest: number; }>;
  endeudamientoData: Array<{ year: string; deudaTotal: number; cobertura: number; dscr: number; }>;
}

export const useProjections = (
  scenario: ScenarioType,
  yearRange: [number, number]
) => {
  const { companyId } = useCompanyContext();
  const { data: financialData } = useFinancialData(undefined, companyId);
  const { getLatestAssumption } = useFinancialAssumptionsData(companyId);

  const years = useMemo(() => {
    const total = Math.max(1, yearRange[1] + 1);
    return Array.from({ length: total }, (_, i) => `A${i}`);
  }, [yearRange]);

  const base = useMemo(() => {
    // Extraer últimos valores reales (en unidades nativas), convertir a K€
    const lastOf = (type: string, keyCandidates: string[]) => {
      const item = financialData
        .filter(d => d.data_type === type)
        .sort((a, b) => new Date(b.period_date).getTime() - new Date(a.period_date).getTime())[0];
      if (!item) return 0;
      for (const key of keyCandidates) {
        const v = Number(item.data_content?.[key]);
        if (isFinite(v) && v !== 0) return Math.round(v / 1000); // K€
      }
      return 0;
    };

    const revenueK = lastOf('estado_pyg', ['ingresos_explotacion', 'importe_neto_cifra_negocios', 'ventas']);
    const ebitdaK = lastOf('estado_pyg', ['ebitda', 'resultado_explotacion']);
    const fixedAssetsK = lastOf('balance_situacion', ['activo_no_corriente', 'inmovilizado']);
    const currentAssetsK = lastOf('balance_situacion', ['activo_circulante', 'activo_corriente']);
    const cashK = lastOf('balance_situacion', ['efectivo', 'caja', 'equivalentes_efectivo', 'disponibilidades']);
    const totalDebtK = lastOf('balance_situacion', ['deuda_total', 'deudas_largo_plazo']) + 0; // prefer total si existe
    const equityK = lastOf('balance_situacion', ['patrimonio_neto', 'fondos_propios']);
    const interestK = lastOf('estado_pyg', ['gastos_financieros', 'coste_financiero']);

    const ebitdaMargin = revenueK > 0 ? Math.max(5, Math.min(45, (ebitdaK / revenueK) * 100)) : 20;

    // Supuestos
    const growthRevenue = Number(getLatestAssumption('crecimiento_ingresos')?.assumption_value) || 5; // %
    const capexPctRevenue = Number(getLatestAssumption('capex')?.assumption_value) || 3; // % sobre ventas
    const taxRate = Number(getLatestAssumption('tipo_impositivo')?.assumption_value) || 25; // %

    // Ajuste por escenario (margen)
    const marginAdj = scenario === 'optimista' ? 2 : scenario === 'pesimista' ? -2 : 0; // puntos

    return {
      revenueK,
      ebitdaK,
      ebitdaMargin: Math.max(5, Math.min(45, ebitdaMargin + marginAdj)),
      fixedAssetsK,
      currentAssetsK,
      cashK,
      totalDebtK,
      equityK,
      interestK,
      growthRevenue,
      capexPctRevenue,
      taxRate
    };
  }, [financialData, getLatestAssumption, scenario]);

  const plData: PLProjectionItem[] = useMemo(() => {
    if (base.revenueK <= 0) return years.map(y => ({ year: y, ingresos: 0, costes: 0, ebitda: 0, margenEbitda: 0 }));

    return years.map((y, idx) => {
      const t = idx; // años a futuro
      const ingresos = Math.round(base.revenueK * Math.pow(1 + base.growthRevenue / 100, t));
      const margen = base.ebitdaMargin; // mantener margen ajustado por escenario
      const ebitda = Math.round((ingresos * margen) / 100);
      const costes = Math.max(0, ingresos - ebitda);
      return { year: y, ingresos, costes, ebitda, margenEbitda: margen };
    });
  }, [years, base]);

  const balanceData: { activo: BalanceProjectionItem[]; financiacion: FinancingProjectionItem[] } = useMemo(() => {
    const activo: BalanceProjectionItem[] = [];
    const financiacion: FinancingProjectionItem[] = [];
    if (base.revenueK <= 0) {
      return { activo: years.map(y => ({ year: y, inmovilizado: 0, circulante: 0, tesoreria: 0 })), financiacion: years.map(y => ({ year: y, patrimonio: 0, deudaLP: 0, deudaCP: 0 })) };
    }

    // Mantener ratio D/E inicial
    const totalAssets0 = base.fixedAssetsK + base.currentAssetsK + base.cashK;
    const debtToEquity0 = base.equityK > 0 ? (base.totalDebtK / base.equityK) : 1;

    let fixed = base.fixedAssetsK;
    let current = base.currentAssetsK;
    let cash = base.cashK;

    years.forEach((y, idx) => {
      const ingresos = plData[idx]?.ingresos || base.revenueK;
      const capex = Math.round((base.capexPctRevenue / 100) * ingresos);
      const depreciation = Math.round(fixed * 0.05); // 5% de fijos

      // Evolución simplificada
      fixed = Math.max(0, fixed + capex - depreciation);
      current = Math.round(base.currentAssetsK * Math.pow(1 + base.growthRevenue / 100, idx));

      const totalAssets = fixed + current + cash;
      const equity = Math.round(totalAssets / (1 + debtToEquity0));
      const debt = Math.max(0, totalAssets - equity);
      const deudaLP = Math.round(debt * 0.7);
      const deudaCP = Math.round(debt * 0.3);

      activo.push({ year: y, inmovilizado: fixed, circulante: current, tesoreria: cash });
      financiacion.push({ year: y, patrimonio: equity, deudaLP, deudaCP });
    });

    return { activo, financiacion };
  }, [years, base, plData]);

  const cashFlowData: CashFlowProjectionItem[] = useMemo(() => {
    const result: CashFlowProjectionItem[] = [];
    let cash = base.cashK;
    const interestRate = base.totalDebtK > 0 ? Math.max(0.01, (base.interestK * 1000) / (base.totalDebtK * 1000)) : 0.05; // ~interés efectivo
    plData.forEach((pl, idx) => {
      const taxes = Math.round((base.taxRate / 100) * pl.ebitda * 0.5); // proxy: 50% del EBITDA sujeto
      const ocf = Math.round(pl.ebitda - taxes);
      const icf = -Math.round((base.capexPctRevenue / 100) * pl.ingresos);
      const avgDebtK = Math.round((balanceData.financiacion[idx]?.deudaLP || 0) + (balanceData.financiacion[idx]?.deudaCP || 0));
      const interestK = Math.round(avgDebtK * interestRate);
      const fcf = ocf + icf - interestK;
      cash = Math.max(0, cash + fcf);
      result.push({ year: pl.year, ocf, icf, fcf, cashOnHand: cash });
    });
    return result;
  }, [plData, base, balanceData]);

  const ratiosData: RatiosProjectionData = useMemo(() => {
    const rentabilidadData: RatiosProjectionData['rentabilidadData'] = [];
    const liquidezData: RatiosProjectionData['liquidezData'] = [];
    const solvenciaData: RatiosProjectionData['solvenciaData'] = [];
    const endeudamientoData: RatiosProjectionData['endeudamientoData'] = [];

    plData.forEach((pl, idx) => {
      const balA = balanceData.activo[idx];
      const fin = balanceData.financiacion[idx];
      const totalAssets = balA.inmovilizado + balA.circulante + balA.tesoreria;
      const depreciation = Math.round(balA.inmovilizado * 0.05);
      const ebit = Math.max(0, pl.ebitda - depreciation);
      const interestK = Math.round((fin.deudaLP + fin.deudaCP) * 0.05);
      const tax = Math.round((base.taxRate / 100) * Math.max(0, ebit - interestK));
      const netIncome = Math.max(0, ebit - interestK - tax);

      // Rentabilidad
      const roe = fin.patrimonio > 0 ? (netIncome / fin.patrimonio) * 100 : 0;
      const roa = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0;
      const roic = (fin.deudaLP + fin.deudaCP + fin.patrimonio) > 0 ? (ebit / (fin.deudaLP + fin.deudaCP + fin.patrimonio)) * 100 : 0;
      rentabilidadData.push({ year: pl.year, roe, roa, roic });

      // Liquidez (aprox.): CP como deudaCP
      const currentRatio = fin.deudaCP > 0 ? (balA.circulante / fin.deudaCP) : 0;
      const cashRatio = fin.deudaCP > 0 ? (balA.tesoreria / fin.deudaCP) : 0;
      const quickRatio = currentRatio * 0.7;
      liquidezData.push({ year: pl.year, currentRatio, quickRatio, cashRatio });

      // Solvencia
      const totalDebt = fin.deudaLP + fin.deudaCP;
      const debtToEquity = fin.patrimonio > 0 ? totalDebt / fin.patrimonio : 0;
      const debtToAssets = totalAssets > 0 ? totalDebt / totalAssets : 0;
      const timesInterest = interestK > 0 ? ebit / interestK : 0;
      solvenciaData.push({ year: pl.year, debtToEquity, debtToAssets, timesInterest });

      // Endeudamiento
      const dscr = interestK > 0 ? (cashFlowData[idx]?.ocf || 0) / interestK : 0;
      const cobertura = timesInterest;
      endeudamientoData.push({ year: pl.year, deudaTotal: totalDebt, cobertura, dscr });
    });

    return { rentabilidadData, liquidezData, solvenciaData, endeudamientoData };
  }, [plData, balanceData, base, cashFlowData]);

  return {
    plData,
    balanceData,
    cashFlowData,
    ratiosData
  };
};


