import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheetData {
  name: string;
  fields: string[];
  sampleData: Record<string, any>[];
  rowCount?: number;
  hasHeaders?: boolean;
}

interface ParsedExcelData {
  detectedSheets: string[];
  detectedFields: Record<string, string[]>;
  sheetsData: SheetData[];
  fileSize?: number;
  processingTime?: number;
}

interface ProcessingMetrics {
  processingTimeMs: number;
  fileSize: number;
  sheetCount: number;
  fieldCount: number;
}

interface FileProcessingOptions {
  maxFileSize: number;
  maxRows: number;
  streamingMode: boolean;
  sampleSize: number;
}

// --------------------------------------------------
// Detección de tipo financiero y campos relevantes
// --------------------------------------------------
function detectFinancialType(fileName: string, sheetNames: string[]): string {
  const text = (fileName + ' ' + sheetNames.join(' ')).toLowerCase();
  if (text.includes('balance') || text.includes('situacion')) return 'balance';
  if (text.includes('pyg') || text.includes('perdidas') || text.includes('ganancias')) return 'pyg';
  if (text.includes('flujo') || text.includes('cash') || text.includes('efectivo')) return 'cash_flow';
  return 'generic';
}

// --------------------------------------------------
// Errores con contexto y sugerencias
// --------------------------------------------------
class ProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public suggestion?: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'ProcessingError';
  }
}

// --------------------------------------------------
// Mock data optimizada según tipo y tamaño
// --------------------------------------------------
function generateOptimizedMockDataByType(fileName: string, fileSize: number): ParsedExcelData {
  const lower = fileName.toLowerCase();
  const maxSample = fileSize > 10 * 1024 * 1024 ? 3 : 5;
  const makeSheet = (name: string, concepts: string[]) => {
    return [{
      name,
      fields: ['concepto', '2023', '2022'],
      sampleData: concepts.slice(0, maxSample).map(concept => ({
        concepto,
        '2023': Math.round(Math.random() * 100000 + 50000),
        '2022': Math.round(Math.random() * 90000 + 45000)
      }))
    }];
  };

  if (lower.includes('balance') || lower.includes('situacion')) {
    return {
      detectedSheets: ['Balance de Situación'],
      detectedFields: {
        'Balance de Situación': [
          'Activo no corriente', 'Activo corriente', 'Existencias',
          'Deudores comerciales', 'Efectivo', 'Patrimonio neto',
          'Pasivo no corriente', 'Pasivo corriente'
        ]
      },
      sheetsData: makeSheet('Balance de Situación', [
        'Activo no corriente', 'Activo corriente', 'Existencias',
        'Deudores comerciales', 'Efectivo', 'Patrimonio neto',
        'Pasivo no corriente', 'Pasivo corriente'
      ])
    };
  }

  if (lower.includes('pyg') || lower.includes('perdidas') || lower.includes('ganancias')) {
    return {
      detectedSheets: ['Cuenta PyG'],
      detectedFields: {
        'Cuenta PyG': [
          'Ingresos de explotación', 'Gastos de explotación', 'Resultado de explotación',
          'Resultado financiero', 'Resultado del ejercicio'
        ]
      },
      sheetsData: makeSheet('Cuenta PyG', [
        'Ingresos de explotación', 'Gastos de explotación', 'Resultado de explotación',
        'Resultado financiero', 'Resultado antes de impuestos'
      ])
    };
  }

  if (lower.includes('flujo') || lower.includes('cash') || lower.includes('efectivo')) {
    return {
      detectedSheets: ['Flujo de Caja'],
      detectedFields: {
        'Flujo de Caja': [
          'Flujos de explotación', 'Flujos de inversión', 'Flujos de financiación',
          'Variación neta de efectivo'
        ]
      },
      sheetsData: makeSheet('Flujo de Caja', [
        'Flujos de explotación', 'Flujos de inversión', 'Flujos de financiación',
        'Variación neta de efectivo'
      ])
    };
  }

  // Genérico
  return {
    detectedSheets: ['Hoja1'],
    detectedFields: {
      'Hoja1': ['concepto', 'valor', 'periodo']
    },
    sheetsData: makeSheet('Hoja1', ['Dato 1', 'Dato 2', 'Dato 3'])
  };
}

// --------------------------------------------------
// Procesamiento eficiente con tracking de métricas
// --------------------------------------------------
function processFileEfficiently(file: string, fileName: string): {
  data: ParsedExcelData;
  metrics: ProcessingMetrics;
} {
  const startTime = performance.now();
  let fileSize = 0;

  try {
    // Cálculo de tamaño en bytes
    fileSize = new TextEncoder().encode(file).length;
    if (fileSize > 50 * 1024 * 1024) {
      throw new ProcessingError(
        'El archivo es demasiado grande para procesar',
        'FILE_TOO_LARGE',
        'Intenta dividir el archivo en partes más pequeñas o comprímelo',
        false
      );
    }
    if (fileSize > 25 * 1024 * 1024) {
      console.warn(`Archivo grande: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    }

    // Generar mock data según tipo
    const parsedData = generateOptimizedMockDataByType(fileName, fileSize);
    const processingTimeMs = performance.now() - startTime;

    const metrics: ProcessingMetrics = {
      processingTimeMs,
      fileSize,
      sheetCount: parsedData.detectedSheets.length,
      fieldCount: Object.values(parsedData.detectedFields).flat().length
    };

    // Forzar limpieza de memoria si es posible
    if (typeof globalThis !== 'undefined' && (globalThis as any).gc) {
      (globalThis as any).gc();
    }

    return { data: parsedData, metrics };
  } catch (err) {
    const processingTimeMs = performance.now() - startTime;
    if (err instanceof ProcessingError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new ProcessingError(
      'Error interno al procesar el archivo',
      'PROCESSING_FAILED',
      `Verifica que el archivo no esté corrupto. Detalles: ${msg}`,
      true
    );
  }
}

// --------------------------------------------------
// Formateo de métricas para el log
// --------------------------------------------------
function formatMetrics(metrics: ProcessingMetrics): string {
  const timeSec = (metrics.processingTimeMs / 1000).toFixed(2);
  const sizeMB = (metrics.fileSize / (1024 * 1024)).toFixed(2);
  return `${timeSec}s, ${sizeMB}MB, ${metrics.sheetCount} hojas, ${metrics.fieldCount} campos`;
}

// --------------------------------------------------
// Servidor HTTP Deno
// --------------------------------------------------
serve(async (req) => {
  const requestStart = performance.now();

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Timeout de 30s
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ProcessingError(
        'Tiempo de procesamiento excedido',
        'REQUEST_TIMEOUT',
        'Intenta con un archivo más pequeño.',
        true
      )), 30000);
    });

    const bodyPromise = req.json().catch(() => {
      throw new ProcessingError(
        'Formato de solicitud inválido',
        'INVALID_REQUEST',
        'Asegúrate de enviar JSON con { file, fileName }',
        true
      );
    });

    const { file, fileName } = await Promise.race([bodyPromise, timeout]);

    if (!file || typeof fileName !== 'string') {
      throw new ProcessingError(
        'Faltan datos requeridos',
        'MISSING_DATA',
        'Envía tanto el archivo como su nombre.',
        true
      );
    }

    console.log('Procesando:', fileName);

    const { data: parsedData, metrics } = await Promise.race([
      Promise.resolve(processFileEfficiently(file, fileName)),
      timeout
    ]);

    const totalTime = (performance.now() - requestStart).toFixed(2);
    console.log(`Listo – ${formatMetrics(metrics)} (total ${totalTime}ms)`);

    const isDev = true;
    return new Response(
      JSON.stringify({
        success: true,
        detectedSheets: parsedData.detectedSheets,
        detectedFields: parsedData.detectedFields,
        sheetsData: parsedData.sheetsData,
        message: isDev
          ? `Archivo analizado en modo DESARROLLO – ${formatMetrics(metrics)}`
          : `Archivo analizado correctamente – ${formatMetrics(metrics)}`,
        developmentMode: isDev,
        performance: {
          processingTimeMs: metrics.processingTimeMs,
          totalRequestTimeMs: parseFloat(totalTime),
          fileSize: metrics.fileSize,
          sheetCount: metrics.sheetCount,
          fieldCount: metrics.fieldCount,
          efficiency: metrics.fileSize > 0
            ? `${(metrics.fileSize / metrics.processingTimeMs).toFixed(2)} bytes/ms`
            : 'N/A'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const elapsed = (performance.now() - requestStart).toFixed(2);
    console.error('Error en el parser:', error);

    if (error instanceof ProcessingError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.code,
          message: error.message,
          suggestion: error.suggestion,
          recoverable: error.recoverable,
          userFriendly: true,
          performance: { failedAfterMs: parseFloat(elapsed), errorType: error.code }
        }),
        {
          status: error.recoverable ? 400 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'UNEXPECTED_ERROR',
        message: 'Error inesperado al procesar el archivo',
        suggestion: 'Intenta de nuevo o contacta con soporte.',
        recoverable: true,
        performance: { failedAfterMs: parseFloat(elapsed), errorType: 'UNEXPECTED' }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
