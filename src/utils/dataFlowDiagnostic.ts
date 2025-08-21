// Herramienta de diagnóstico del flujo de datos
// Verifica que los datos CSV procesados lleguen correctamente a las visualizaciones

import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

export async function diagnoseDataFlow(companyId: string): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  try {
    // Paso 1: Verificar que existe la empresa
    results.push({
      step: '1. Verificación de empresa',
      status: 'success',
      message: `Verificando empresa ${companyId}...`
    });

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      results.push({
        step: '1. Verificación de empresa',
        status: 'error',
        message: `Error: No se encontró la empresa ${companyId}`
      });
      return results;
    }

    results.push({
      step: '1. Verificación de empresa',
      status: 'success',
      message: `✅ Empresa encontrada: ${company.name}`
    });

    // Paso 2: Verificar datos de P&G
    const { data: pygData, error: pygError } = await supabase
      .from('fs_pyg_lines')
      .select('*')
      .eq('company_id', companyId)
      .order('period_year', { ascending: false });

    if (pygError) {
      results.push({
        step: '2. Datos de P&G',
        status: 'error',
        message: `Error consultando fs_pyg_lines: ${pygError.message}`
      });
    } else if (!pygData || pygData.length === 0) {
      results.push({
        step: '2. Datos de P&G',
        status: 'warning',
        message: '⚠️ No hay datos de P&G en fs_pyg_lines'
      });
    } else {
      results.push({
        step: '2. Datos de P&G',
        status: 'success',
        message: `✅ ${pygData.length} registros de P&G encontrados`,
        data: {
          totalRecords: pygData.length,
          years: [...new Set(pygData.map(d => d.period_year))].sort(),
          concepts: [...new Set(pygData.map(d => d.concept))].slice(0, 5)
        }
      });
    }

    // Paso 3: Verificar datos de Balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('fs_balance_lines')
      .select('*')
      .eq('company_id', companyId)
      .order('period_year', { ascending: false });

    if (balanceError) {
      results.push({
        step: '3. Datos de Balance',
        status: 'error',
        message: `Error consultando fs_balance_lines: ${balanceError.message}`
      });
    } else if (!balanceData || balanceData.length === 0) {
      results.push({
        step: '3. Datos de Balance',
        status: 'warning',
        message: '⚠️ No hay datos de Balance en fs_balance_lines'
      });
    } else {
      results.push({
        step: '3. Datos de Balance',
        status: 'success',
        message: `✅ ${balanceData.length} registros de Balance encontrados`,
        data: {
          totalRecords: balanceData.length,
          years: [...new Set(balanceData.map(d => d.period_year))].sort(),
          sections: [...new Set(balanceData.map(d => d.section))]
        }
      });
    }

    // Paso 4: Verificar datos de Cash Flow
    const { data: cashflowData, error: cashflowError } = await supabase
      .from('fs_cashflow_lines')
      .select('*')
      .eq('company_id', companyId)
      .order('period_year', { ascending: false });

    if (cashflowError) {
      results.push({
        step: '4. Datos de Cash Flow',
        status: 'error',
        message: `Error consultando fs_cashflow_lines: ${cashflowError.message}`
      });
    } else if (!cashflowData || cashflowData.length === 0) {
      results.push({
        step: '4. Datos de Cash Flow',
        status: 'warning',
        message: '⚠️ No hay datos de Cash Flow en fs_cashflow_lines'
      });
    } else {
      results.push({
        step: '4. Datos de Cash Flow',
        status: 'success',
        message: `✅ ${cashflowData.length} registros de Cash Flow encontrados`,
        data: {
          totalRecords: cashflowData.length,
          years: [...new Set(cashflowData.map(d => d.period_year))].sort(),
          categories: [...new Set(cashflowData.map(d => d.category))]
        }
      });
    }

    // Paso 5: Verificar datos operativos
    const { data: operationalData, error: operationalError } = await supabase
      .from('operational_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('period_year', { ascending: false });

    if (operationalError) {
      results.push({
        step: '5. Datos Operativos',
        status: 'error',
        message: `Error consultando operational_metrics: ${operationalError.message}`
      });
    } else if (!operationalData || operationalData.length === 0) {
      results.push({
        step: '5. Datos Operativos',
        status: 'warning',
        message: '⚠️ No hay datos operativos en operational_metrics'
      });
    } else {
      results.push({
        step: '5. Datos Operativos',
        status: 'success',
        message: `✅ ${operationalData.length} registros operativos encontrados`,
        data: {
          totalRecords: operationalData.length,
          years: [...new Set(operationalData.map(d => d.period_year))].sort(),
          metrics: [...new Set(operationalData.map(d => d.metric_name))].slice(0, 5)
        }
      });
    }

    // Resumen final
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;

    results.push({
      step: 'Resumen',
      status: errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success',
      message: `Diagnóstico completado: ${successCount} éxitos, ${warningCount} advertencias, ${errorCount} errores`
    });

  } catch (error) {
    results.push({
      step: 'Error general',
      status: 'error',
      message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
    });
  }

  return results;
}

export function logDiagnosticResults(results: DiagnosticResult[]) {
  console.group('🔍 DIAGNÓSTICO DEL FLUJO DE DATOS');
  
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.step}: ${result.message}`);
    
    if (result.data) {
      console.log('   Detalles:', result.data);
    }
  });
  
  console.groupEnd();
}
