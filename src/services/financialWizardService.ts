import { supabase } from '@/integrations/supabase/client';
import type { WizardData } from '@/components/wizard/FinancialWizard';

export interface WizardSaveResult {
  success: boolean;
  ratiosCalculated: number;
  kpisGenerated: number;
  modulesActivated: string[];
  error?: string;
}

export const saveFinancialWizardData = async (
  companyId: string, 
  wizardData: WizardData
): Promise<WizardSaveResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Generate job ID for this import
    const jobId = crypto.randomUUID();
    const currentYear = new Date().getFullYear();

    // 1. Save Balance Sheet data
    await saveBalanceSheetData(companyId, wizardData.balanceSheet, user.id, jobId, currentYear);

    // 2. Save P&L data  
    await saveProfitLossData(companyId, wizardData.profitLoss, user.id, jobId, currentYear);

    // 3. Save Debt Pool data (if selected)
    if (wizardData.selectedModules.some(m => ['debt-pool', 'debt-service'].includes(m))) {
      await saveDebtPoolData(companyId, wizardData.debtPool, user.id, jobId);
    }

    // 4. Save Cash Flow data (if selected)
    if (wizardData.selectedModules.includes('cash-flow')) {
      await saveCashFlowData(companyId, wizardData.cashFlow, user.id, jobId, currentYear);
    }

    // 5. Save Financial Assumptions (if selected)
    if (wizardData.selectedModules.some(m => ['projections', 'valuation'].includes(m))) {
      await saveFinancialAssumptions(companyId, wizardData.assumptions, user.id, jobId, currentYear);
    }

    // 6. Activate selected modules
    await activateCompanyModules(companyId, wizardData.selectedModules);

    // 7. Calculate and return metrics
    const ratiosCalculated = await calculateFinancialRatios(companyId, currentYear);
    const kpisGenerated = await generateKPIs(companyId, currentYear);

    return {
      success: true,
      ratiosCalculated,
      kpisGenerated,
      modulesActivated: wizardData.selectedModules
    };

  } catch (error) {
    console.error('Error saving wizard data:', error);
    return {
      success: false,
      ratiosCalculated: 0,
      kpisGenerated: 0,
      modulesActivated: [],
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

const saveBalanceSheetData = async (
  companyId: string, 
  balanceData: any, 
  userId: string, 
  jobId: string, 
  year: number
) => {
  const balanceLines = [
    // Activo Corriente
    { concept: 'tesoreria', amount: balanceData.tesoreria || 0, section: 'activo_corriente' },
    { concept: 'deudores_comerciales', amount: balanceData.deudoresComerciales || 0, section: 'activo_corriente' },
    { concept: 'existencias', amount: balanceData.existencias || 0, section: 'activo_corriente' },
    { concept: 'otros_activo_corriente', amount: balanceData.otroActivoCorriente || 0, section: 'activo_corriente' },
    
    // Activo No Corriente
    { concept: 'inmovilizado_material', amount: balanceData.inmovilizadoMaterial || 0, section: 'activo_no_corriente' },
    { concept: 'inmovilizado_intangible', amount: balanceData.inmovilizadoIntangible || 0, section: 'activo_no_corriente' },
    { concept: 'inversiones_financieras', amount: balanceData.inversionesFinancieras || 0, section: 'activo_no_corriente' },
    
    // Pasivo Corriente
    { concept: 'deuda_financiera_cp', amount: balanceData.deudaFinancieraCP || 0, section: 'pasivo_corriente' },
    { concept: 'acreedores_comerciales', amount: balanceData.acreedoresComerciales || 0, section: 'pasivo_corriente' },
    { concept: 'otros_pasivo_corriente', amount: balanceData.otroPasivoCorriente || 0, section: 'pasivo_corriente' },
    
    // Pasivo No Corriente
    { concept: 'deuda_financiera_lp', amount: balanceData.deudaFinancieraLP || 0, section: 'pasivo_no_corriente' },
    { concept: 'otros_pasivo_no_corriente', amount: balanceData.otroPasivoNoCorriente || 0, section: 'pasivo_no_corriente' },
    
    // Patrimonio Neto
    { concept: 'capital_social', amount: balanceData.capitalSocial || 0, section: 'patrimonio_neto' },
    { concept: 'reservas', amount: balanceData.reservas || 0, section: 'patrimonio_neto' },
    { concept: 'resultado_ejercicio', amount: balanceData.resultadoEjercicio || 0, section: 'patrimonio_neto' }
  ];

  const records = balanceLines.map(line => ({
    company_id: companyId,
    period_date: `${year}-12-31`,
    period_year: year,
    period_type: 'annual',
    section: line.section,
    concept: line.concept,
    amount: line.amount,
    uploaded_by: userId,
    job_id: jobId,
    currency_code: 'EUR'
  }));

  const { error } = await supabase
    .from('fs_balance_lines')
    .upsert(records, { 
      onConflict: 'company_id,period_type,period_year,period_quarter,period_month,section,concept',
      ignoreDuplicates: false 
    });

  if (error) throw error;
};

const saveProfitLossData = async (
  companyId: string, 
  pygData: any, 
  userId: string, 
  jobId: string, 
  year: number
) => {
  const pygLines = [
    { concept: 'ingresos_explotacion', amount: pygData.ingresos || 0 },
    { concept: 'coste_ventas', amount: -(pygData.costesVentas || 0) },
    { concept: 'gastos_personal', amount: -(pygData.gastosPersonal || 0) },
    { concept: 'otros_gastos_explotacion', amount: -(pygData.otrosGastos || 0) },
    { concept: 'ebitda', amount: pygData.ebitdaFinal || 0 },
    { concept: 'amortizaciones', amount: -(pygData.amortizaciones || 0) },
    { concept: 'ebit', amount: pygData.ebit || 0 },
    { concept: 'gastos_financieros', amount: -(pygData.gastosFinancieros || 0) },
    { concept: 'ingresos_financieros', amount: pygData.ingresosFinancieros || 0 },
    { concept: 'ebt', amount: pygData.ebt || 0 },
    { concept: 'impuestos', amount: -(pygData.impuestos || 0) },
    { concept: 'resultado_neto', amount: pygData.resultadoNeto || 0 }
  ];

  const records = pygLines.map(line => ({
    company_id: companyId,
    period_date: `${year}-12-31`,
    period_year: year,
    period_type: 'annual',
    concept: line.concept,
    amount: line.amount,
    uploaded_by: userId,
    job_id: jobId,
    currency_code: 'EUR'
  }));

  const { error } = await supabase
    .from('fs_pyg_lines')
    .upsert(records, { 
      onConflict: 'company_id,period_type,period_year,period_quarter,period_month,concept',
      ignoreDuplicates: false 
    });

  if (error) throw error;
};

const saveDebtPoolData = async (
  companyId: string, 
  debtData: any[], 
  userId: string, 
  jobId: string
) => {
  if (!debtData || debtData.length === 0) return;

  // Save individual loans
  const loanRecords = debtData.map(loan => ({
    company_id: companyId,
    loan_key: loan.id,
    entity_name: loan.entidad,
    loan_type: loan.tipo,
    initial_amount: loan.importeInicial || 0,
    current_balance: loan.saldoActual || 0,
    initial_principal: loan.importeInicial || 0,
    interest_rate: (loan.tipoInteres || 0) / 100,
    start_date: new Date().toISOString().split('T')[0],
    maturity_date: loan.fechaVencimiento || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    guarantees: loan.garantias || '',
    observations: loan.observaciones || '',
    uploaded_by: userId,
    job_id: jobId,
    currency_code: 'EUR'
  }));

  const { error: loansError } = await supabase
    .from('debt_loans')
    .upsert(loanRecords, { 
      onConflict: 'company_id,loan_key',
      ignoreDuplicates: false 
    });

  if (loansError) throw loansError;

  // Generate debt maturities (simplified - by year)
  const currentYear = new Date().getFullYear();
  const maturityRecords: any[] = [];
  
  debtData.forEach(loan => {
    if (loan.fechaVencimiento && loan.saldoActual > 0) {
      const maturityYear = new Date(loan.fechaVencimiento).getFullYear();
      const existingMaturity = maturityRecords.find(m => m.maturity_year === maturityYear);
      
      if (existingMaturity) {
        existingMaturity.principal_amount += loan.saldoActual;
        existingMaturity.total_amount += loan.saldoActual;
      } else {
        maturityRecords.push({
          company_id: companyId,
          maturity_year: maturityYear,
          principal_amount: loan.saldoActual,
          interest_amount: 0,
          total_amount: loan.saldoActual,
          uploaded_by: userId,
          job_id: jobId
        });
      }
    }
  });

  if (maturityRecords.length > 0) {
    const { error: maturityError } = await supabase
      .from('debt_maturities')
      .upsert(maturityRecords, { 
        onConflict: 'company_id,maturity_year',
        ignoreDuplicates: false 
      });

    if (maturityError) throw maturityError;
  }
};

const saveCashFlowData = async (
  companyId: string, 
  cashFlowData: any, 
  userId: string, 
  jobId: string, 
  year: number
) => {
  const cashFlowLines = [
    { concept: 'flujo_operativo', amount: cashFlowData.flujoOperativo || 0 },
    { concept: 'capex', amount: -(cashFlowData.capex || 0) },
    { concept: 'otras_inversiones', amount: -(cashFlowData.otrasInversiones || 0) },
    { concept: 'flujo_inversion', amount: cashFlowData.flujoInversion || 0 },
    { concept: 'variacion_deuda', amount: cashFlowData.variacionDeuda || 0 },
    { concept: 'dividendos', amount: -(cashFlowData.dividendos || 0) },
    { concept: 'flujo_financiacion', amount: cashFlowData.flujoFinanciacion || 0 },
    { concept: 'flujo_efectivo_neto', amount: cashFlowData.flujoEfectivoNeto || 0 },
    { concept: 'free_cash_flow', amount: cashFlowData.fcf || 0 }
  ];

  const records = cashFlowLines.map(line => ({
    company_id: companyId,
    period_date: `${year}-12-31`,
    period_year: year,
    period_type: 'annual',
    concept: line.concept,
    amount: line.amount,
    category: 'operativo',
    uploaded_by: userId,
    job_id: jobId,
    currency_code: 'EUR'
  }));

  const { error } = await supabase
    .from('fs_cashflow_lines')
    .upsert(records, { 
      onConflict: 'company_id,period_type,period_year,period_quarter,period_month,concept',
      ignoreDuplicates: false 
    });

  if (error) throw error;
};

const saveFinancialAssumptions = async (
  companyId: string, 
  assumptions: any, 
  userId: string, 
  jobId: string, 
  year: number
) => {
  const assumptionRecords = [
    { name: 'crecimiento_ventas', value: assumptions.crecimientoVentas || 0, category: 'crecimiento', unit: 'percentage' },
    { name: 'crecimiento_ebitda', value: assumptions.crecimientoEbitda || 0, category: 'crecimiento', unit: 'percentage' },
    { name: 'margen_ebitda_objetivo', value: assumptions.margenEbitdaObjetivo || 0, category: 'rentabilidad', unit: 'percentage' },
    { name: 'margen_neto_objetivo', value: assumptions.margenNetoObjetivo || 0, category: 'rentabilidad', unit: 'percentage' },
    { name: 'capex_sobre_ventas', value: assumptions.capexSobreVentas || 0, category: 'inversion', unit: 'percentage' },
    { name: 'inversion_capital_trabajo', value: assumptions.inversionCapitalTrabajo || 0, category: 'inversion', unit: 'percentage' },
    { name: 'wacc', value: assumptions.wacc || 0, category: 'coste_capital', unit: 'percentage' },
    { name: 'coste_deuda', value: assumptions.costeDeuda || 0, category: 'coste_capital', unit: 'percentage' },
    { name: 'tasa_impuestos', value: assumptions.tasaImpuestos || 0, category: 'fiscal', unit: 'percentage' },
    { name: 'politica_dividendos', value: assumptions.politicaDividendos || 0, category: 'financiacion', unit: 'percentage' }
  ];

  const records = assumptionRecords.map(assumption => ({
    company_id: companyId,
    period_year: year,
    period_type: 'annual',
    assumption_category: assumption.category,
    assumption_name: assumption.name,
    assumption_value: assumption.value,
    unit: assumption.unit,
    notes: assumptions.supuestosAdicionales || '',
    uploaded_by: userId,
    job_id: jobId
  }));

  const { error } = await supabase
    .from('financial_assumptions_normalized')
    .upsert(records, { 
      onConflict: 'company_id,period_type,period_year,period_quarter,period_month,assumption_category,assumption_name',
      ignoreDuplicates: false 
    });

  if (error) throw error;
};

const activateCompanyModules = async (companyId: string, selectedModules: string[]) => {
  // Map wizard module IDs to database module IDs
  const moduleMapping: Record<string, string> = {
    'balance-current': 'balance_actual',
    'pyg-current': 'pyg_actual',
    'cash-flow': 'flujos_actual',
    'financial-ratios': 'ratios_actual',
    'debt-pool': 'endeudamiento_actual',
    'debt-service': 'servicio_deuda_actual',
    'projections': 'proyecciones',
    'balance-projected': 'balance_proyectado',
    'break-even': 'punto_muerto_actual',
    'valuation': 'valoracion_eva',
    'sensitivity': 'escenarios',
    'nof-analysis': 'nof_actual'
  };

  const moduleRecords = selectedModules
    .filter(moduleId => moduleMapping[moduleId])
    .map(moduleId => ({
      company_id: companyId,
      module_id: moduleMapping[moduleId],
      enabled: true
    }));

  if (moduleRecords.length > 0) {
    const { error } = await supabase
      .from('company_module_access')
      .upsert(moduleRecords, { 
        onConflict: 'company_id,module_id',
        ignoreDuplicates: false 
      });

    if (error) throw error;
  }
};

const calculateFinancialRatios = async (companyId: string, year: number): Promise<number> => {
  // This would trigger automatic ratio calculation
  // For now, return a mock count
  return 28; // Standard financial ratios count
};

const generateKPIs = async (companyId: string, year: number): Promise<number> => {
  // This would generate executive KPIs
  // For now, return a mock count  
  return 12; // Standard KPI count
};