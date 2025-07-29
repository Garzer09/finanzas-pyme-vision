import { supabase } from '@/integrations/supabase/client';

// Mapeo automático de datos procesados a módulos del dashboard
export const mapDataToModules = (processedData: any) => {
  const moduleMapping = {
    // Estados financieros -> Módulos específicos
    'estados_financieros': {
      'pyg': ['/cuenta-pyg', '/pyg-actual', '/pyg-analitico-actual'],
      'balance': ['/balance-situacion', '/balance-actual'],
      'flujos_efectivo': ['/flujos-caja', '/flujos-actual'],
      'patrimonio_neto': ['/balance-situacion']
    },
    
    // Ratios -> Módulos de análisis
    'ratios_financieros': {
      'liquidez': ['/ratios-financieros', '/ratios-actual'],
      'solvencia': ['/ratios-financieros', '/ratios-actual'],
      'rentabilidad': ['/ratios-financieros', '/punto-muerto-actual'],
      'endeudamiento': ['/endeudamiento', '/endeudamiento-actual']
    },
    
    // Pool financiero -> Módulos de deuda
    'pool_financiero': ['/endeudamiento', '/servicio-deuda', '/servicio-deuda-actual'],
    
    // Proyecciones -> Módulos de pronóstico
    'proyecciones': ['/pyg-proyectado', '/balance-proyectado', '/flujos-proyectado'],
    
    // Auditoría -> Módulos de análisis actual
    'auditoria_modelos': ['/situacion-actual']
  };

  const availableModules: string[] = [];
  const dataCategories: string[] = [];

  // Analizar qué módulos pueden ser poblados
  Object.keys(processedData).forEach(category => {
    if (category in moduleMapping) {
      dataCategories.push(category);
      
      if (typeof moduleMapping[category] === 'object' && !Array.isArray(moduleMapping[category])) {
        // Categoría con subcategorías
        Object.keys(processedData[category] || {}).forEach(subCategory => {
          if (subCategory in moduleMapping[category]) {
            availableModules.push(...moduleMapping[category][subCategory]);
          }
        });
      } else if (Array.isArray(moduleMapping[category])) {
        // Categoría directa
        availableModules.push(...moduleMapping[category]);
      }
    }
  });

  return {
    availableModules: [...new Set(availableModules)],
    dataCategories,
    mapping: moduleMapping
  };
};

// Generar KPIs automáticamente desde datos procesados
export const generateAutomaticKPIs = (processedData: any) => {
  const kpis: any[] = [];

  // KPIs desde ratios financieros
  if (processedData.ratios_financieros) {
    const ratios = processedData.ratios_financieros;
    
    if (ratios.liquidez?.ratio_corriente) {
      kpis.push({
        name: 'Ratio de Liquidez',
        value: ratios.liquidez.ratio_corriente,
        type: 'ratio',
        category: 'liquidez',
        status: ratios.liquidez.ratio_corriente > 1.5 ? 'good' : 'warning'
      });
    }
    
    if (ratios.rentabilidad?.roe) {
      kpis.push({
        name: 'ROE',
        value: ratios.rentabilidad.roe,
        type: 'percentage',
        category: 'rentabilidad',
        status: ratios.rentabilidad.roe > 0.15 ? 'excellent' : ratios.rentabilidad.roe > 0.1 ? 'good' : 'warning'
      });
    }
    
    if (ratios.endeudamiento?.ratio_endeudamiento) {
      kpis.push({
        name: 'Endeudamiento',
        value: ratios.endeudamiento.ratio_endeudamiento,
        type: 'percentage',
        category: 'solvencia',
        status: ratios.endeudamiento.ratio_endeudamiento < 0.4 ? 'good' : ratios.endeudamiento.ratio_endeudamiento < 0.6 ? 'warning' : 'critical'
      });
    }
  }

  // KPIs desde estados financieros
  if (processedData.estados_financieros?.pyg) {
    const pyg = processedData.estados_financieros.pyg;
    
    if (pyg.resultado_neto && pyg.ingresos_explotacion) {
      const margenNeto = (pyg.resultado_neto / pyg.ingresos_explotacion) * 100;
      kpis.push({
        name: 'Margen Neto',
        value: margenNeto,
        type: 'percentage',
        category: 'rentabilidad',
        status: margenNeto > 10 ? 'excellent' : margenNeto > 5 ? 'good' : 'warning'
      });
    }
  }

  return kpis;
};

// Guardar datos automáticamente en módulos correspondientes
export const saveDataToModules = async (fileId: string, processedData: any, userId: string) => {
  // Validar userId
  if (!userId || userId === 'temp-user') {
    throw new Error('Usuario no válido para guardar datos');
  }

  try {
    console.log('Guardando datos para usuario:', userId);
    console.log('Datos procesados recibidos:', JSON.stringify(processedData, null, 2));
    
    // Transformar datos de Claude a estructura de Supabase
    const dataRecords = transformToSupabaseStructure(processedData, fileId);
    let savedRecords = 0;
    
    // Guardar cada registro en financial_data según estructura de Supabase
    for (const record of dataRecords) {
      const { error: dataError } = await supabase.from('financial_data').insert({
        user_id: userId,
        excel_file_id: fileId,
        data_type: record.data_type,
        period_date: record.period_date,
        period_year: record.period_year,
        period_month: record.period_month,
        period_quarter: record.period_quarter,
        period_type: record.period_type || 'annual',
        data_content: record.data_content,
        physical_units_data: record.physical_units_data || {}
      });
      
      if (dataError) {
        console.error('Error insertando registro financiero:', dataError);
        throw new Error(`Error guardando datos financieros: ${dataError.message}`);
      }
      savedRecords++;
    }
    
    console.log(`${savedRecords} registros financieros guardados exitosamente`);
    
    const moduleMapping = mapDataToModules(processedData);
    const automaticKPIs = generateAutomaticKPIs(processedData);

    // Guardar KPIs automáticos
    if (automaticKPIs.length > 0) {
      const kpiInserts = automaticKPIs.map((kpi, index) => ({
        user_id: userId,
        kpi_name: kpi.name,
        kpi_formula: `Calculado automáticamente desde archivo: ${fileId}`,
        display_order: index + 1,
        threshold_min: kpi.type === 'percentage' ? 0 : null,
        threshold_max: kpi.type === 'percentage' ? 100 : null,
        is_active: true
      }));

      const { error: kpiError } = await supabase.from('user_kpis').insert(kpiInserts);
      if (kpiError) {
        console.error('Error insertando KPIs:', kpiError);
        throw new Error(`Error guardando KPIs: ${kpiError.message}`);
      }
      console.log(`${automaticKPIs.length} KPIs guardados exitosamente`);
    }

    // Guardar supuestos financieros si hay proyecciones
    if (processedData.proyecciones) {
      const { error: assumptionError } = await supabase.from('financial_assumptions').insert({
        user_id: userId,
        assumption_type: 'proyecciones_automaticas',
        assumption_data: processedData.proyecciones,
        scenario_name: 'base_archivo'
      });
      if (assumptionError) {
        console.error('Error guardando supuestos financieros:', assumptionError);
        throw new Error(`Error guardando supuestos: ${assumptionError.message}`);
      }
      console.log('Supuestos financieros guardados exitosamente');
    }

    return {
      success: true,
      kpisCreated: automaticKPIs.length,
      modulesAvailable: moduleMapping.availableModules.length,
      categoriesProcessed: moduleMapping.dataCategories.length
    };

  } catch (error) {
    console.error('Error saving data to modules:', error);
    throw error;
  }
};

// Crear notificaciones de módulos disponibles
export const createModuleNotifications = (processedData: any) => {
  const mapping = mapDataToModules(processedData);
  
  return {
    title: `${mapping.availableModules.length} módulos listos para usar`,
    message: `Se han detectado datos para: ${mapping.dataCategories.join(', ')}`,
    modules: mapping.availableModules,
    actions: [
      {
        label: 'Ver Dashboard Completo',
        route: '/home'
      },
      {
        label: 'Ir a Ratios',
        route: '/ratios-financieros'
      },
      {
        label: 'Ver Balance',
        route: '/balance-situacion'
      }
    ]
  };
};

// Transformar datos de Claude a estructura de Supabase
const transformToSupabaseStructure = (claudeData: any, fileId: string) => {
  const records = [];
  
  // Si Claude ya envía data_records, usarlos directamente
  if (claudeData.data_records && Array.isArray(claudeData.data_records)) {
    return claudeData.data_records;
  }
  
  // Transformar estructura antigua de Claude a nueva estructura de Supabase
  const detectPeriod = (data: any): { date: string, year: number, month?: number, quarter?: number } => {
    const currentYear = new Date().getFullYear();
    let year = currentYear;
    
    // Intentar detectar el año de los datos
    if (claudeData.periodos_detectados && claudeData.periodos_detectados.length > 0) {
      const latestPeriod = claudeData.periodos_detectados.sort().reverse()[0];
      year = parseInt(latestPeriod) || currentYear;
    }
    
    return {
      date: `${year}-12-31`,
      year: year,
      month: 12,
      quarter: 4
    };
  };
  
  const period = detectPeriod(claudeData);
  
  // Transformar P&G
  if (claudeData.estados_financieros?.pyg) {
    const pygData = claudeData.estados_financieros.pyg;
    const latestYearKey = Object.keys(pygData).find(key => !isNaN(Number(key))) || Object.keys(pygData)[0];
    const latestData = pygData[latestYearKey] || pygData;
    
    records.push({
      data_type: 'cuenta_pyg',
      period_date: period.date,
      period_year: period.year,
      period_month: period.month,
      period_quarter: period.quarter,
      period_type: 'annual',
      data_content: {
        // Valores directos para acceso rápido
        ingresos_explotacion: latestData.ingresos_explotacion?.total || latestData.ingresos_explotacion,
        gastos_explotacion: latestData.gastos_explotacion?.total || latestData.gastos_explotacion,
        resultado_explotacion: latestData.resultado_explotacion,
        resultado_neto: latestData.resultado_neto,
        ebitda: latestData.ebitda,
        margen_ebitda: latestData.margenes?.margen_ebitda,
        margen_neto: latestData.margenes?.margen_neto,
        // Estructura histórica para múltiples años
        historical_data: pygData
      },
      physical_units_data: claudeData.datos_unidades_fisicas || { has_physical_data: false, datos_detallados: {} }
    });
  }
  
  // Transformar Balance
  if (claudeData.estados_financieros?.balance) {
    const balanceData = claudeData.estados_financieros.balance;
    const latestYearKey = Object.keys(balanceData).find(key => !isNaN(Number(key))) || Object.keys(balanceData)[0];
    const latestData = balanceData[latestYearKey] || balanceData;
    
    records.push({
      data_type: 'balance_situacion',
      period_date: period.date,
      period_year: period.year,
      period_month: period.month,
      period_quarter: period.quarter,
      period_type: 'annual',
      data_content: {
        // Valores directos para acceso rápido
        activo_corriente: latestData.activo_corriente,
        activo_no_corriente: latestData.activo_no_corriente,
        pasivo_corriente: latestData.pasivo_corriente,
        pasivo_no_corriente: latestData.pasivo_no_corriente,
        patrimonio_neto: latestData.patrimonio_neto,
        // Estructura histórica
        historical_data: balanceData
      },
      physical_units_data: {}
    });
  }
  
  // Transformar Ratios
  if (claudeData.ratios_financieros) {
    const ratiosData = claudeData.ratios_financieros;
    
    records.push({
      data_type: 'ratios_financieros',
      period_date: period.date,
      period_year: period.year,
      period_month: period.month,
      period_quarter: period.quarter,
      period_type: 'annual',
      data_content: {
        // Valores directos para acceso rápido
        ratio_corriente: ratiosData.liquidez?.ratio_corriente,
        ratio_endeudamiento: ratiosData.solvencia?.ratio_endeudamiento,
        roe: ratiosData.rentabilidad?.roe,
        roa: ratiosData.rentabilidad?.roa,
        margen_ebitda: ratiosData.rentabilidad?.margen_ebitda,
        margen_neto: ratiosData.rentabilidad?.margen_neto,
        // Estructura detallada por categorías
        liquidez: ratiosData.liquidez || {},
        rentabilidad: ratiosData.rentabilidad || {},
        solvencia: ratiosData.solvencia || {},
        endeudamiento: ratiosData.solvencia || {},
        eficiencia: ratiosData.eficiencia || {}
      },
      physical_units_data: {}
    });
  }
  
  return records;
};