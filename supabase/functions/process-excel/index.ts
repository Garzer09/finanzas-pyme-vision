
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuración avanzada para Claude Opus
const CLAUDE_CONFIG = {
  model: 'claude-opus-4-20250514',
  max_tokens: 8000,
  temperature: 0.1
}

// Logger avanzado para debugging
function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

// Análisis inteligente del tipo de documento por contenido Y nombre
async function analyzeDocumentType(fileName: string, base64Content: string, anthropicKey: string): Promise<string> {
  log('info', 'Analizando tipo de documento', { fileName })
  
  // Detección inicial por nombre de archivo
  const name = fileName.toLowerCase()
  let initialType = 'general'
  
  if (name.includes('balance') || name.includes('situacion')) initialType = 'balance'
  else if (name.includes('pyg') || name.includes('perdidas') || name.includes('ganancias')) initialType = 'pyg'
  else if (name.includes('flujo') || name.includes('cash') || name.includes('tesoreria')) initialType = 'flujos'
  else if (name.includes('ratio') || name.includes('indicador')) initialType = 'ratios'
  else if (name.includes('pool') || name.includes('deuda') || name.includes('financiacion')) initialType = 'pool_financiero'
  else if (name.includes('auditoria') || name.includes('revision')) initialType = 'auditoria'
  else if (name.includes('proyeccion') || name.includes('forecast') || name.includes('prevision')) initialType = 'proyecciones'
  else if (name.includes('200') || name.includes('303') || name.includes('347')) initialType = 'modelos_fiscales'

  // Análisis de contenido con Claude para confirmar tipo
  try {
    const analysisPrompt = `Analiza este archivo financiero y determina el tipo exacto de documento:

TIPOS POSIBLES:
- balance: Balance de Situación (Activo, Pasivo, Patrimonio)
- pyg: Cuenta de Pérdidas y Ganancias (Ingresos, Gastos, Resultados)
- flujos: Estado de Flujos de Efectivo (Operativos, Inversión, Financiación)
- ratios: Ratios Financieros (Liquidez, Solvencia, Rentabilidad)
- pool_financiero: Pool de Deuda/Financiación (Entidades, Vencimientos, Tipos)
- proyecciones: Proyecciones Financieras
- unidades_fisicas: Datos de Producción/Ventas (kg, litros, unidades)
- general: Múltiples tipos o no clasificable

DETECCIÓN INICIAL POR NOMBRE: ${initialType}

Responde ÚNICAMENTE con el tipo correcto en formato: {"tipo_documento": "balance"}

Archivo: ${base64Content.substring(0, 800)}...`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_CONFIG.model,
        max_tokens: 200,
        temperature: 0,
        messages: [{ role: 'user', content: analysisPrompt }]
      })
    })

    const result = await response.json()
    const content = result.content[0]?.text || ''
    const match = content.match(/\{"tipo_documento":\s*"([^"]+)"\}/)
    
    if (match) {
      const detectedType = match[1]
      log('info', 'Tipo de documento detectado por contenido', { initialType, detectedType })
      return detectedType
    }
  } catch (error) {
    log('warn', 'Error en análisis de tipo de documento, usando detección por nombre', { error: error.message })
  }

  return initialType
}

// Detectar períodos automáticamente del contenido
function detectPeriods(content: string): string[] {
  const yearRegex = /20\d{2}/g
  const dateRegex = /\d{1,2}\/\d{1,2}\/20\d{2}/g
  const monthYearRegex = /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+20\d{2}/gi
  
  const years = content.match(yearRegex) || []
  const dates = content.match(dateRegex) || []
  const monthYears = content.match(monthYearRegex) || []
  
  const allPeriods = [...years, ...dates, ...monthYears]
  return [...new Set(allPeriods)].sort()
}

// Validación exhaustiva de datos financieros con cálculos automáticos
function validateAndCompleteFinancialData(data: any): { isValid: boolean; errors: string[]; warnings: string[]; completed_data: any } {
  const errors: string[] = []
  const warnings: string[] = []
  let completedData = JSON.parse(JSON.stringify(data)) // Deep copy
  
  log('info', 'Iniciando validación exhaustiva de datos')
  
  // Validar estructura básica
  if (!data || typeof data !== 'object') {
    errors.push('Datos no válidos o estructura incorrecta')
    return { isValid: false, errors, warnings, completed_data: data }
  }
  
  // VALIDACIÓN Y COMPLETADO DE P&G
  if (data.estados_financieros?.pyg) {
    const pyg = data.estados_financieros.pyg
    log('info', 'Validando P&G', pyg)
    
    // Validar números
    const ingresos = Number(pyg.ingresos_explotacion) || 0
    const gastos = Number(pyg.gastos_explotacion) || 0
    
    if (!ingresos && !gastos) {
      warnings.push('P&G: No se encontraron ingresos ni gastos principales')
    }
    
    // Calcular resultados automáticamente si faltan
    if (!pyg.resultado_explotacion && ingresos && gastos) {
      completedData.estados_financieros.pyg.resultado_explotacion = ingresos - gastos
      warnings.push('P&G: Resultado de explotación calculado automáticamente')
    }
    
    if (!pyg.margen_bruto && ingresos) {
      const margen = ((ingresos - gastos) / ingresos) * 100
      completedData.estados_financieros.pyg.margen_bruto = margen
      warnings.push('P&G: Margen bruto calculado automáticamente')
    }
  }
  
  // VALIDACIÓN Y COMPLETADO DE BALANCE
  if (data.estados_financieros?.balance) {
    const balance = data.estados_financieros.balance
    log('info', 'Validando Balance', balance)
    
    // Calcular totales automáticamente
    let activoTotal = Number(balance.activo_total) || 0
    let pasivoTotal = Number(balance.pasivo_total) || 0
    let patrimonioNeto = Number(balance.patrimonio_neto) || 0
    
    // Si faltan totales, calcularlos
    if (!activoTotal && balance.activo_corriente && balance.activo_no_corriente) {
      activoTotal = Number(balance.activo_corriente) + Number(balance.activo_no_corriente)
      completedData.estados_financieros.balance.activo_total = activoTotal
      warnings.push('Balance: Activo total calculado automáticamente')
    }
    
    if (!pasivoTotal && balance.pasivo_corriente && balance.pasivo_no_corriente) {
      pasivoTotal = Number(balance.pasivo_corriente) + Number(balance.pasivo_no_corriente)
      completedData.estados_financieros.balance.pasivo_total = pasivoTotal
      warnings.push('Balance: Pasivo total calculado automáticamente')
    }
    
    // Validar equilibrio contable
    const diferencia = Math.abs(activoTotal - (pasivoTotal + patrimonioNeto))
    if (diferencia > 1000) {
      errors.push(`Balance descuadrado: Diferencia de ${diferencia.toLocaleString()}€`)
    } else if (diferencia > 0) {
      warnings.push(`Balance: Pequeña diferencia de ${diferencia.toLocaleString()}€`)
    }
  }
  
  // VALIDACIÓN DE RATIOS CON CÁLCULO AUTOMÁTICO
  if (data.ratios_financieros || data.estados_financieros) {
    log('info', 'Validando y calculando ratios')
    
    if (!completedData.ratios_financieros) {
      completedData.ratios_financieros = {}
    }
    
    // Calcular ratios de liquidez
    const balance = data.estados_financieros?.balance
    if (balance) {
      const activoCorriente = Number(balance.activo_corriente) || 0
      const pasivoCorriente = Number(balance.pasivo_corriente) || 0
      
      if (activoCorriente && pasivoCorriente) {
        if (!completedData.ratios_financieros.liquidez) {
          completedData.ratios_financieros.liquidez = {}
        }
        
        const ratioLiquidez = activoCorriente / pasivoCorriente
        completedData.ratios_financieros.liquidez.ratio_corriente = ratioLiquidez
        
        if (ratioLiquidez < 1) {
          warnings.push(`Ratio de liquidez bajo: ${ratioLiquidez.toFixed(2)}`)
        }
        log('info', 'Ratio de liquidez calculado', { ratioLiquidez })
      }
    }
    
    // Calcular ratios de rentabilidad
    const pyg = data.estados_financieros?.pyg
    if (pyg && balance) {
      const resultadoNeto = Number(pyg.resultado_neto) || 0
      const patrimonio = Number(balance.patrimonio_neto) || 0
      const activoTotal = Number(balance.activo_total) || 0
      
      if (!completedData.ratios_financieros.rentabilidad) {
        completedData.ratios_financieros.rentabilidad = {}
      }
      
      if (resultadoNeto && patrimonio) {
        const roe = (resultadoNeto / patrimonio) * 100
        completedData.ratios_financieros.rentabilidad.roe = roe
        log('info', 'ROE calculado', { roe })
      }
      
      if (resultadoNeto && activoTotal) {
        const roa = (resultadoNeto / activoTotal) * 100
        completedData.ratios_financieros.rentabilidad.roa = roa
        log('info', 'ROA calculado', { roa })
      }
    }
  }
  
  // VALIDACIÓN DE UNIDADES FÍSICAS
  if (data.datos_unidades_fisicas) {
    log('info', 'Validando datos de unidades físicas')
    const fisica = data.datos_unidades_fisicas
    
    if (fisica.has_physical_data) {
      if (!fisica.unidades_vendidas && !fisica.unidades_producidas) {
        warnings.push('Unidades físicas: Marcado como disponible pero sin datos de unidades')
      }
      
      // Validar coherencia precio unitario
      if (fisica.precio_unitario_promedio && data.estados_financieros?.pyg) {
        const ingresos = Number(data.estados_financieros.pyg.ingresos_explotacion) || 0
        const unidades = Number(fisica.unidades_vendidas) || 0
        
        if (ingresos && unidades) {
          const precioCalculado = ingresos / unidades
          const diferencia = Math.abs(precioCalculado - fisica.precio_unitario_promedio)
          
          if (diferencia > precioCalculado * 0.1) { // 10% de diferencia
            warnings.push('Unidades físicas: Precio unitario no coherente con ingresos/unidades')
          }
        }
      }
    }
  }
  
  return { 
    isValid: errors.length === 0, 
    errors, 
    warnings,
    completed_data: completedData 
  }
}

// Prompts ALTAMENTE ESPECIALIZADOS para Claude Opus 4
function createAdvancedPrompt(documentType: string, isPDF: boolean, base64Content: string): string {
  const baseInstruction = `Eres un experto analista financiero con capacidades de procesamiento exhaustivo de documentos. Tu misión es extraer TODO el contenido financiero de manera estructurada y realizar cálculos automáticos para completar información faltante.

ARCHIVO TIPO: ${isPDF ? 'PDF' : 'Excel'}
DOCUMENTO DETECTADO: ${documentType}

INSTRUCCIONES CRÍTICAS:
1. EXTRAE TODOS los números, categorías, períodos y conceptos financieros
2. CALCULA automáticamente ratios y totales faltantes
3. IDENTIFICA períodos temporales (años, trimestres, meses)
4. DETECTA unidades físicas (kg, litros, piezas, toneladas)
5. VALIDA coherencia matemática de los datos
6. MARCA información faltante claramente

`

  const prompts = {
    'balance': `${baseInstruction}

🔍 ANÁLISIS BALANCE DE SITUACIÓN - EXTRACCIÓN EXHAUSTIVA:

ACTIVO NO CORRIENTE:
- Inmovilizado intangible (patentes, marcas, software, I+D)
- Inmovilizado material (terrenos, construcciones, maquinaria, equipos)
- Inversiones inmobiliarias
- Inversiones financieras a largo plazo
- Activos por impuesto diferido

ACTIVO CORRIENTE:
- Existencias (materias primas, productos en curso, productos terminados)
- Deudores comerciales y otras cuentas a cobrar
- Inversiones financieras a corto plazo
- Periodificaciones a corto plazo
- Efectivo y otros activos líquidos equivalentes

PATRIMONIO NETO:
- Fondos propios (Capital, prima emisión, reservas)
- Resultado del ejercicio
- Dividendos a cuenta
- Otros instrumentos de patrimonio neto
- Ajustes por cambios de valor

PASIVO NO CORRIENTE:
- Provisiones a largo plazo
- Deudas a largo plazo (obligaciones, préstamos bancarios)
- Deudas con empresas del grupo a largo plazo
- Pasivos por impuesto diferido
- Periodificaciones a largo plazo

PASIVO CORRIENTE:
- Provisiones a corto plazo
- Deudas a corto plazo
- Deudas con empresas del grupo a corto plazo
- Acreedores comerciales y otras cuentas a pagar
- Periodificaciones a corto plazo

CÁLCULOS AUTOMÁTICOS REQUERIDOS:
- Activo Total = Activo No Corriente + Activo Corriente
- Pasivo Total = Pasivo No Corriente + Pasivo Corriente
- Verificar: Activo Total = Patrimonio Neto + Pasivo Total
- Fondo de maniobra = Activo Corriente - Pasivo Corriente
- Ratio liquidez = Activo Corriente / Pasivo Corriente
- Ratio solvencia = Patrimonio Neto / Pasivo Total

JSON ESTRUCTURA OBLIGATORIA:
{
  "tipo_documento": "balance",
  "periodos_detectados": ["2023", "2022", "2021"],
  "moneda_detectada": "EUR",
  "estados_financieros": {
    "balance": {
      "2023": {
        "activo_no_corriente": {
          "inmovilizado_intangible": valor,
          "inmovilizado_material": valor,
          "inversiones_inmobiliarias": valor,
          "inversiones_financieras_lp": valor,
          "total": valor_calculado
        },
        "activo_corriente": {
          "existencias": valor,
          "deudores": valor,
          "inversiones_financieras_cp": valor,
          "efectivo": valor,
          "total": valor_calculado
        },
        "activo_total": valor_calculado,
        "patrimonio_neto": {
          "capital": valor,
          "reservas": valor,
          "resultado_ejercicio": valor,
          "total": valor_calculado
        },
        "pasivo_no_corriente": {
          "deudas_largo_plazo": valor,
          "provisiones_lp": valor,
          "total": valor_calculado
        },
        "pasivo_corriente": {
          "deudas_corto_plazo": valor,
          "acreedores": valor,
          "total": valor_calculado
        },
        "pasivo_total": valor_calculado
      }
    }
  },
  "ratios_calculados": {
    "liquidez": valor,
    "solvencia": valor,
    "fondo_maniobra": valor
  },
  "validacion": {
    "equilibrio_contable": true/false,
    "diferencia_cuadre": valor_numerico
  },
  "informacion_faltante": ["lista", "de", "conceptos", "no", "encontrados"]
}`,

    'pyg': `${baseInstruction}

🔍 ANÁLISIS CUENTA PÉRDIDAS Y GANANCIAS - EXTRACCIÓN EXHAUSTIVA:

INGRESOS DE EXPLOTACIÓN:
- Importe neto de la cifra de negocios
- Variación de existencias de productos terminados
- Trabajos realizados por la empresa para su activo
- Otros ingresos de explotación
- Subvenciones de explotación

GASTOS DE EXPLOTACIÓN:
- Aprovisionamientos (consumo materias primas)
- Gastos de personal (sueldos, seguridad social)
- Dotaciones para amortizaciones de inmovilizado
- Variación de provisiones de tráfico
- Otros gastos de explotación

RESULTADO FINANCIERO:
- Ingresos financieros
- Gastos financieros
- Variación valor razonable instrumentos financieros
- Diferencias de cambio

OTROS RESULTADOS:
- Resultado por enajenaciones
- Deterioro y resultado por enajenaciones de instrumentos financieros

IMPUESTOS Y RESULTADO:
- Impuesto sobre beneficios
- Resultado del ejercicio

CÁLCULOS AUTOMÁTICOS REQUERIDOS:
- EBITDA = Resultado Explotación + Amortizaciones
- EBIT = Resultado Explotación
- Resultado antes de impuestos = EBIT + Resultado Financiero
- Margen Bruto = (Ingresos - Aprovisionamientos) / Ingresos * 100
- Margen EBITDA = EBITDA / Ingresos * 100
- Margen Neto = Resultado Neto / Ingresos * 100

JSON ESTRUCTURA OBLIGATORIA:
{
  "tipo_documento": "pyg",
  "periodos_detectados": ["2023", "2022", "2021"],
  "estados_financieros": {
    "pyg": {
      "2023": {
        "ingresos_explotacion": {
          "cifra_negocios": valor,
          "otros_ingresos": valor,
          "total": valor_calculado
        },
        "gastos_explotacion": {
          "aprovisionamientos": valor,
          "gastos_personal": valor,
          "amortizaciones": valor,
          "otros_gastos": valor,
          "total": valor_calculado
        },
        "resultado_explotacion": valor_calculado,
        "resultado_financiero": {
          "ingresos_financieros": valor,
          "gastos_financieros": valor,
          "resultado_neto": valor_calculado
        },
        "resultado_antes_impuestos": valor_calculado,
        "impuesto_sociedades": valor,
        "resultado_neto": valor_calculado,
        "ebitda": valor_calculado,
        "margenes": {
          "margen_bruto": valor_calculado,
          "margen_ebitda": valor_calculado,
          "margen_neto": valor_calculado
        }
      }
    }
  },
  "analisis_tendencias": {
    "crecimiento_ingresos": "% respecto año anterior",
    "evolucion_margenes": "análisis comparativo"
  },
  "informacion_faltante": []
}`,

    'ratios': `${baseInstruction}

🔍 ANÁLISIS RATIOS FINANCIEROS - EXTRACCIÓN Y CÁLCULO EXHAUSTIVO:

RATIOS DE LIQUIDEZ:
- Ratio corriente = Activo Corriente / Pasivo Corriente
- Acid test = (Activo Corriente - Existencias) / Pasivo Corriente
- Ratio tesorería = (Efectivo + Inversiones CP) / Pasivo Corriente
- Período medio cobro = (Deudores / Ventas) * 365
- Período medio pago = (Acreedores / Compras) * 365

RATIOS DE SOLVENCIA:
- Ratio endeudamiento = Pasivo Total / Activo Total
- Ratio autonomía = Patrimonio Neto / Activo Total
- Ratio garantía = Activo Total / Pasivo Total
- Cobertura gastos financieros = EBIT / Gastos Financieros

RATIOS DE RENTABILIDAD:
- ROE = Resultado Neto / Patrimonio Neto * 100
- ROA = Resultado Neto / Activo Total * 100
- ROI = EBIT / Activo Total * 100
- Margen neto = Resultado Neto / Ventas * 100
- Margen bruto = Margen Bruto / Ventas * 100

RATIOS DE EFICIENCIA:
- Rotación activos = Ventas / Activo Total
- Rotación existencias = Coste Ventas / Existencias
- Rotación cobros = Ventas / Deudores
- Rotación pagos = Compras / Acreedores

JSON ESTRUCTURA OBLIGATORIA:
{
  "tipo_documento": "ratios",
  "ratios_financieros": {
    "liquidez": {
      "ratio_corriente": valor,
      "acid_test": valor,
      "ratio_tesoreria": valor,
      "periodo_medio_cobro": valor,
      "periodo_medio_pago": valor,
      "interpretacion": "Excelente/Buena/Regular/Mala"
    },
    "solvencia": {
      "ratio_endeudamiento": valor,
      "ratio_autonomia": valor,
      "ratio_garantia": valor,
      "cobertura_gastos_financieros": valor,
      "interpretacion": "descripción"
    },
    "rentabilidad": {
      "roe": valor,
      "roa": valor,
      "roi": valor,
      "margen_neto": valor,
      "margen_bruto": valor,
      "interpretacion": "descripción"
    },
    "eficiencia": {
      "rotacion_activos": valor,
      "rotacion_existencias": valor,
      "rotacion_cobros": valor,
      "rotacion_pagos": valor,
      "interpretacion": "descripción"
    }
  },
  "alertas": ["ratios fuera de rango normal"],
  "recomendaciones": ["acciones sugeridas"],
  "benchmark_sector": "comparación con sector si disponible"
}`,

    'pool_financiero': `${baseInstruction}

🔍 ANÁLISIS POOL DE FINANCIACIÓN - EXTRACCIÓN DETALLADA:

INFORMACIÓN A EXTRAER:
- Entidades financieras (bancos, cajas, financieras)
- Tipos de financiación (préstamos, créditos, líneas)
- Importes dispuestos y disponibles
- Tipos de interés fijos/variables
- Vencimientos y calendarios de amortización
- Garantías (hipotecarias, personales, avales)
- Condiciones especiales y clausulado

JSON ESTRUCTURA OBLIGATORIA:
{
  "tipo_documento": "pool_financiero",
  "pool_deuda": {
    "resumen": {
      "deuda_total": valor,
      "disponible_total": valor,
      "tipo_medio_ponderado": valor,
      "vencimiento_medio": "años"
    },
    "entidades": [
      {
        "nombre": "Banco XXX",
        "tipo": "préstamo/crédito/línea",
        "importe_concedido": valor,
        "importe_dispuesto": valor,
        "tipo_interes": valor,
        "vencimiento": "fecha",
        "garantias": "descripción",
        "observaciones": "texto"
      }
    ]
  }
}`,

    'unidades_fisicas': `${baseInstruction}

🔍 ANÁLISIS UNIDADES FÍSICAS - EXTRACCIÓN DETALLADA:

DATOS DE PRODUCCIÓN Y VENTAS:
- Unidades producidas por período
- Unidades vendidas por período
- Tipos de unidades (kg, litros, piezas, toneladas)
- Precios unitarios promedio
- Costes unitarios de producción
- Inventarios en unidades físicas
- Métricas de calidad y rendimiento

CÁLCULOS AUTOMÁTICOS:
- Precio unitario = Ingresos / Unidades Vendidas
- Coste unitario = Coste Producción / Unidades Producidas
- Margen unitario = Precio - Coste
- Rotación inventario = Ventas / Stock Medio

JSON ESTRUCTURA OBLIGATORIA:
{
  "tipo_documento": "unidades_fisicas",
  "datos_unidades_fisicas": {
    "has_physical_data": true,
    "tipo_unidad": "kg",
    "periodos": {
      "2023": {
        "unidades_producidas": valor,
        "unidades_vendidas": valor,
        "precio_unitario": valor,
        "coste_unitario": valor,
        "inventario_final": valor
      }
    },
    "metricas_operativas": {
      "capacidad_instalada": valor,
      "utilizacion_capacidad": "porcentaje",
      "tasa_rendimiento": valor,
      "porcentaje_desperdicio": valor
    }
  }
}`,

    'general': `${baseInstruction}

🔍 ANÁLISIS MULTIDOCUMENTO COMPLETO - DETECCIÓN Y EXTRACCIÓN EXHAUSTIVA:

DETECCIÓN AUTOMÁTICA DE CONTENIDO:
1. Estados Financieros (Balance, P&G, Flujos)
2. Ratios y KPIs financieros
3. Pool de financiación y deuda
4. Datos de unidades físicas y operativos
5. Proyecciones y presupuestos
6. Información de auditoría
7. Datos sectoriales y comparativos

EXTRACCIÓN INTELIGENTE:
- Análisis de cabeceras y estructura
- Detección de períodos temporales
- Identificación de monedas y unidades
- Cálculo automático de ratios faltantes
- Validación cruzada de datos
- Detección de inconsistencias

JSON ESTRUCTURA OBLIGATORIA:
{
  "tipo_documento": "multidocumento",
  "contenido_detectado": ["balance", "pyg", "ratios", "unidades_fisicas"],
  "periodos_detectados": ["2023", "2022", "2021"],
  "moneda": "EUR",
  "estados_financieros": {
    "balance": { datos_completos },
    "pyg": { datos_completos },
    "flujos": { datos_si_disponibles }
  },
  "ratios_financieros": { todos_los_ratios_calculados },
  "datos_unidades_fisicas": {
    "has_physical_data": true/false,
    "datos_detallados": {}
  },
  "pool_financiero": { si_disponible },
  "validacion_cruzada": {
    "coherencia_estados": true/false,
    "ratios_calculados_correctos": true/false,
    "alertas": ["lista de alertas"],
    "calidad_datos": "Alta/Media/Baja"
  },
  "informacion_faltante": ["conceptos no encontrados"],
  "recomendaciones": ["sugerencias para completar análisis"]
}`
  }

  // Seleccionar prompt según tipo
  const selectedPrompt = prompts[documentType] || prompts['general']
  
  return selectedPrompt + `

ARCHIVO A ANALIZAR (Base64):
${base64Content.substring(0, 2000)}...

RESPONDE ÚNICAMENTE CON EL JSON ESTRUCTURADO SOLICITADO. NO incluyas explicaciones adicionales fuera del JSON.`
}

// Función mejorada para parsing JSON robusto
function parseClaudeResponse(content: string): any {
  // Estrategias múltiples de parsing
  const strategies = [
    // Estrategia 1: JSON completo con ```json
    () => {
      const jsonCodeMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
      return jsonCodeMatch ? JSON.parse(jsonCodeMatch[1]) : null
    },
    // Estrategia 2: JSON directo entre llaves
    () => {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null
    },
    // Estrategia 3: JSON con comillas extrañas
    () => {
      const cleanContent = content.replace(/[""]/g, '"').replace(/'/g, '"')
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null
    },
    // Estrategia 4: JSON multi-línea
    () => {
      const lines = content.split('\n')
      let jsonStart = -1, jsonEnd = -1
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('{') && jsonStart === -1) jsonStart = i
        if (lines[i].includes('}')) jsonEnd = i
      }
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonText = lines.slice(jsonStart, jsonEnd + 1).join('\n')
        return JSON.parse(jsonText)
      }
      return null
    }
  ]

  for (const strategy of strategies) {
    try {
      const result = strategy()
      if (result) return result
    } catch (e) {
      continue
    }
  }

  throw new Error('No se pudo parsear la respuesta JSON de Claude')
}

// Generar mapeo automático a módulos del dashboard
function generateModuleMapping(processedData: any, documentType: string): any {
  const availableModules = []
  
  if (processedData.estados_financieros?.balance) availableModules.push('balance_sheet')
  if (processedData.estados_financieros?.pyg) availableModules.push('profit_loss')
  if (processedData.ratios_financieros) availableModules.push('financial_ratios')
  if (processedData.pool_financiero) availableModules.push('debt_pool')
  if (processedData.datos_unidades_fisicas?.has_physical_data) availableModules.push('physical_units')
  
  return {
    available_modules: availableModules,
    recommended_dashboards: ['financial_analysis', 'performance_tracking'],
    auto_kpis: generateAutoKPIs(processedData)
  }
}

function generateAutoKPIs(data: any): any[] {
  const kpis = []
  
  if (data.ratios_financieros?.liquidez?.ratio_corriente) {
    kpis.push({
      name: 'Ratio de Liquidez',
      value: data.ratios_financieros.liquidez.ratio_corriente,
      type: 'ratio'
    })
  }
  
  if (data.estados_financieros?.pyg?.margenes?.margen_neto) {
    kpis.push({
      name: 'Margen Neto',
      value: data.estados_financieros.pyg.margenes.margen_neto,
      type: 'percentage'
    })
  }
  
  return kpis
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  log('info', '🚀 Iniciando procesamiento de archivo con Claude Opus')

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const tempUserId = crypto.randomUUID()
    const formData = await req.formData()
    const file = formData.get('file') as File
    const targetUserId = formData.get('target_user_id') as string

    if (!file) {
      log('error', 'No se proporcionó archivo')
      return new Response('No file provided', { status: 400, headers: corsHeaders })
    }

    log('info', 'Archivo recibido', { 
      fileName: file.name, 
      fileSize: file.size,
      fileType: file.type 
    })

    // PASO 1: Preparar archivo para análisis
    const fileBuffer = await file.arrayBuffer()
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)))
    
    const isPDF = file.name.toLowerCase().endsWith('.pdf')
    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
    
    if (!isPDF && !isExcel) {
      log('error', 'Tipo de archivo no soportado', { fileName: file.name })
      return new Response('Tipo de archivo no soportado', { status: 400, headers: corsHeaders })
    }

    // PASO 2: Verificar API key de Anthropic
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      log('error', 'API key de Anthropic no configurada')
      return new Response('Anthropic API key not configured', { status: 500, headers: corsHeaders })
    }

    // PASO 3: Análisis inteligente de tipo de documento
    log('info', 'Analizando tipo de documento')
    const documentType = await analyzeDocumentType(file.name, base64Content, anthropicKey)
    log('info', 'Tipo de documento detectado', { documentType })

    // PASO 4: Procesamiento con Claude Opus usando prompts especializados
    log('info', 'Iniciando procesamiento con Claude Opus 4', { 
      model: CLAUDE_CONFIG.model,
      documentType 
    })

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_CONFIG.model,
        max_tokens: CLAUDE_CONFIG.max_tokens,
        temperature: CLAUDE_CONFIG.temperature,
        messages: [{
          role: 'user',
          content: createAdvancedPrompt(documentType, isPDF, base64Content)
        }]
      })
    })

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.text()
      log('error', 'Error en respuesta de Claude', { status: anthropicResponse.status, error: errorData })
      throw new Error(`Claude API error: ${anthropicResponse.status} - ${errorData}`)
    }

    const anthropicResult = await anthropicResponse.json()
    log('info', 'Respuesta de Claude recibida', { 
      contentLength: anthropicResult.content[0]?.text?.length 
    })

    // PASO 5: Parsing robusto de la respuesta
    let processedData = {}
    let parseError = null
    
    try {
      const content = anthropicResult.content[0]?.text || ''
      if (!content) {
        throw new Error('Respuesta vacía de Claude')
      }

      log('info', 'Parseando respuesta JSON de Claude')
      processedData = parseClaudeResponse(content)
      
      // Validar estructura mínima
      if (!processedData.tipo_documento) {
        log('warn', 'Estructura de respuesta incompleta, usando respuesta parcial')
        processedData.tipo_documento = documentType
      }

    } catch (e) {
      parseError = e.message
      log('error', 'Error parsing respuesta de Claude', { error: e.message })
      
      // Fallback: Crear estructura básica
      processedData = { 
        error: 'Error en procesamiento automático: ' + e.message,
        tipo_documento: documentType,
        raw_response_preview: anthropicResult.content[0]?.text?.substring(0, 1000),
        fallback_mode: true
      }
    }

    // PASO 6: Validación y completado automático de datos
    let validationResult = { isValid: true, errors: [], warnings: [], completed_data: processedData }
    
    if (!parseError && processedData && !processedData.error) {
      log('info', 'Iniciando validación y completado de datos')
      validationResult = validateAndCompleteFinancialData(processedData)
      processedData = validationResult.completed_data
      
      log('info', 'Validación completada', {
        isValid: validationResult.isValid,
        errorsCount: validationResult.errors.length,
        warningsCount: validationResult.warnings.length
      })
    }

    // PASO 7: Agregar metadatos de procesamiento
    processedData.processing_metadata = {
      document_type_detected: documentType,
      file_type: isPDF ? 'PDF' : 'Excel',
      processing_timestamp: new Date().toISOString(),
      claude_model: CLAUDE_CONFIG.model,
      processing_time_ms: Date.now() - startTime,
      validation_status: validationResult.isValid ? 'passed' : 'failed',
      has_errors: validationResult.errors.length > 0,
      has_warnings: validationResult.warnings.length > 0,
      parse_error: parseError
    }

    if (validationResult.errors.length > 0) {
      processedData.validation_errors = validationResult.errors
    }
    
    if (validationResult.warnings.length > 0) {
      processedData.validation_warnings = validationResult.warnings
    }

    // PASO 8: Detección automática de períodos si no los detectó Claude
    if (!processedData.periodos_detectados || processedData.periodos_detectados.length === 0) {
      log('info', 'Detectando períodos automáticamente')
      processedData.periodos_detectados = detectPeriods(anthropicResult.content[0]?.text || '')
      log('info', 'Períodos detectados', { periodos: processedData.periodos_detectados })
    }

    // PASO 9: Generar automáticamente mapeo a módulos del dashboard
    const moduleMapping = generateModuleMapping(processedData, documentType)
    processedData.dashboard_mapping = moduleMapping
    
    log('info', 'Procesamiento completo finalizado', {
      documentType,
      hasFinancialData: !!processedData.estados_financieros,
      hasPhysicalData: !!processedData.datos_unidades_fisicas?.has_physical_data,
      modulesAvailable: moduleMapping.available_modules.length,
      totalProcessingTime: Date.now() - startTime
    })

    // Use target user ID if provided (for admin impersonation), otherwise use temp user
    const effectiveUserId = targetUserId || tempUserId;

    // Guardar el archivo en la base de datos
    const { data: fileRecord, error: fileError } = await supabaseClient
      .from('excel_files')
      .insert({
        user_id: effectiveUserId,
        file_name: file.name,
        file_path: `uploads/${effectiveUserId}/${Date.now()}_${file.name}`,
        file_size: file.size,
        processing_status: 'completed',
        processing_result: processedData
      })
      .select()
      .single()

    if (fileError) {
      throw fileError
    }

      // Guardar los datos financieros procesados de forma estructurada
      if (processedData && !processedData.error) {
        const financialDataInserts = []
        
        // Estados financieros
        if (processedData.estados_financieros) {
          Object.entries(processedData.estados_financieros).forEach(([type, data]) => {
            financialDataInserts.push({
              user_id: effectiveUserId,
              excel_file_id: fileRecord.id,
              data_type: `estado_${type}`,
              period_type: 'annual',
              period_date: new Date().getFullYear() + '-12-31',
              data_content: data,
              physical_units_data: processedData.datos_unidades_fisicas || {}
            })
          })
        }
      
      // Pool financiero
      if (processedData.pool_financiero) {
        financialDataInserts.push({
          user_id: effectiveUserId,
          excel_file_id: fileRecord.id,
          data_type: 'pool_financiero',
          period_type: 'annual',
          period_date: new Date().getFullYear() + '-12-31',
          data_content: processedData.pool_financiero
        })
      }
      
      // Ratios financieros
      if (processedData.ratios_financieros) {
        financialDataInserts.push({
          user_id: effectiveUserId,
          excel_file_id: fileRecord.id,
          data_type: 'ratios_financieros',
          period_type: 'annual',
          period_date: new Date().getFullYear() + '-12-31',
          data_content: processedData.ratios_financieros
        })
      }
      
      // Proyecciones
      if (processedData.proyecciones) {
        financialDataInserts.push({
          user_id: effectiveUserId,
          excel_file_id: fileRecord.id,
          data_type: 'proyecciones',
          period_type: 'projection',
          period_date: (new Date().getFullYear() + 3) + '-12-31',
          data_content: processedData.proyecciones
        })
      }
      
      if (financialDataInserts.length > 0) {
        await supabaseClient
          .from('financial_data')
          .insert(financialDataInserts)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        file_id: fileRecord.id,
        processed_data: processedData,
        message: 'Archivo procesado exitosamente con análisis financiero completo'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in process-excel function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Error procesando archivo Excel con Claude'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
