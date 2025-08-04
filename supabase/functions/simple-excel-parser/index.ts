import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
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
}

interface ProcessingMetrics {
  processingTimeMs: number;
  fileSize: number;
  sheetCount: number;
  fieldCount: number;
}

// Clase de error con contexto
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

// Genera datos mock optimizados según tipo de archivo
function generateOptimizedMockDataByType(fileName: string, fileSize: number): ParsedExcelData {
  const lower = fileName.toLowerCase();
  const maxSample = fileSize > 10 * 1024 * 1024 ? 3 : 5;
  const makeSheet = (name: string, concepts: string[]) => {
    const sample = concepts.slice(0, maxSample).map(concept => ({
      concepto: concept,
      '2023': Math.round(Math.random() * 100000 + 50000),
      '2022': Math.round(Math.random() * 90000 + 45000),
    }));
    return { name, fields: ['concepto', '2023', '2022'], sampleData: sample };
  };

  if (lower.includes('balance') || lower.includes('situacion')) {
    return {
      detectedSheets: ['Balance de Situación'],
      detectedFields: { 'Balance de Situación': [
        'Activo no corriente', 'Activo corriente', 'Existencias',
        'Deudores comerciales', 'Efectivo', 'Patrimonio neto',
        'Pasivo no corriente', 'Pasivo corriente'
      ]},
      sheetsData: [makeSheet('Balance de Situación', [
        'Activo no corriente','Activo corriente','Existencias',
        'Deudores comerciales','Efectivo','Patrimonio neto',
        'Pasivo no corriente','Pasivo corriente'
      ])]
    };
  }
  if (lower.includes('pyg') || lower.includes('perdidas') || lower.includes('ganancias')) {
    return {
      detectedSheets: ['Cuenta PyG'],
      detectedFields: { 'Cuenta PyG': [
        'Ingresos de explotación','Gastos de explotación','Resultado de explotación',
        'Resultado financiero','Resultado antes de impuestos'
      ]},
      sheetsData: [makeSheet('Cuenta PyG', [
        'Ingresos de explotación','Gastos de explotación','Resultado de explotación',
        'Resultado financiero','Resultado antes de impuestos'
      ])]
    };
  }
  if (lower.includes('flujo') || lower.includes('cash') || lower.includes('efectivo')) {
    return {
      detectedSheets: ['Flujo de Caja'],
      detectedFields: { 'Flujo de Caja': [
        'Flujos de explotación','Flujos de inversión','Flujos de financiación',
        'Variación neta de efectivo'
      ]},
      sheetsData: [makeSheet('Flujo de Caja', [
        'Flujos de explotación','Flujos de inversión','Flujos de financiación',
        'Variación neta de efectivo'
      ])]
    };
  }
  // Genérico
  return {
    detectedSheets: ['Hoja1'],
    detectedFields: { 'Hoja1': ['concepto','valor','periodo'] },
    sheetsData: [makeSheet('Hoja1', ['Dato 1','Dato 2','Dato 3'])]
  };
}

// Formatea métricas para log
function formatMetrics(metrics: ProcessingMetrics): string {
  const timeSec = (metrics.processingTimeMs / 1000).toFixed(2);
  const sizeMB = (metrics.fileSize / (1024 * 1024)).toFixed(2);
  return `${timeSec}s, ${sizeMB}MB, ${metrics.sheetCount} hojas, ${metrics.fieldCount} campos`;
}

// Parseo real de Excel con métricas
async function parseRealExcelWithMetrics(base64: string, fileName: string): Promise<{ data: ParsedExcelData; metrics: ProcessingMetrics }> {
  const start = performance.now();
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const workbook = XLSX.read(bytes, { type: 'array' });
  const detectedSheets = workbook.SheetNames;
  const detectedFields: Record<string, string[]> = {};
  const sheetsData: SheetData[] = [];

  for (const sheetName of detectedSheets) {
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (rows.length === 0) continue;
    const headers = (rows[0] as string[]).filter(h => h?.toString().trim());
    detectedFields[sheetName] = headers;

    const sample: Record<string, any>[] = [];
    for (let i = 1; i < Math.min(rows.length, 6); i++) {
      const row = rows[i] as any[];
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => { if (row[idx] != null) obj[h] = row[idx]; });
      if (Object.keys(obj).length) sample.push(obj);
    }
    sheetsData.push({ name: sheetName, fields: headers, sampleData: sample });
  }

  const elapsed = performance.now() - start;
  const size = new TextEncoder().encode(base64).length;
  const metrics: ProcessingMetrics = {
    processingTimeMs: elapsed,
    fileSize: size,
    sheetCount: detectedSheets.length,
    fieldCount: Object.values(detectedFields).flat().length,
  };

  return { data: { detectedSheets, detectedFields, sheetsData }, metrics };
}

serve(async (req) => {
  const requestStart = performance.now();
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file, fileName } = await req.json().catch(() => {
      throw new ProcessingError('Formato de solicitud inválido', 'INVALID_REQUEST', 'Envía JSON con { file, fileName }');
    });
    if (!file || typeof fileName !== 'string') {
      throw new ProcessingError('Faltan datos requeridos', 'MISSING_DATA', 'Envía tanto el archivo como su nombre.');
    }

    // Validaciones básicas
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      throw new ProcessingError('Nombre de archivo inválido', 'INVALID_FILENAME');
    }
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    if (!['.xls', '.xlsx'].includes(ext)) {
      throw new ProcessingError('Tipo de archivo no permitido', 'UNSUPPORTED_TYPE', 'Solo se aceptan .xls y .xlsx');
    }
    const rawSize = new TextEncoder().encode(file).length;
    if (rawSize > 10 * 1024 * 1024 * 1.33) {
      throw new ProcessingError('El archivo supera 10MB', 'FILE_TOO_LARGE', 'Utiliza un archivo más pequeño.');
    }

    const isDev = Deno.env.get('DENO_ENV') === 'development';
    let parsedData: ParsedExcelData;
    let metrics: ProcessingMetrics;

    if (isDev) {
      // Mock en desarrollo
      parsedData = generateOptimizedMockDataByType(fileName, rawSize);
      metrics = {
        processingTimeMs: performance.now() - requestStart,
        fileSize: rawSize,
        sheetCount: parsedData.detectedSheets.length,
        fieldCount: Object.values(parsedData.detectedFields).flat().length,
      };
      console.log('MODO DESARROLLO – datos mock');
    } else {
      // Procesamiento real
      ({ data: parsedData, metrics } = await parseRealExcelWithMetrics(file, fileName));
      console.log(`PRODUCCIÓN – ${formatMetrics(metrics)}`);
    }

    const totalTime = (performance.now() - requestStart).toFixed(2);
    return new Response(JSON.stringify({
      success: true,
      parsed: parsedData,
      metrics: { ...metrics, totalRequestTimeMs: parseFloat(totalTime) },
      environment: isDev ? 'development' : 'production'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const elapsed = (performance.now() - requestStart).toFixed(2);
    console.error('Error en el servidor:', error);
    if (error instanceof ProcessingError) {
      return new Response(JSON.stringify({
        success: false,
        error: error.code,
        message: error.message,
        suggestion: error.suggestion,
        recoverable: error.recoverable,
        performance: { failedAfterMs: parseFloat(elapsed) }
      }), { status: error.recoverable ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      success: false,
      error: 'UNEXPECTED_ERROR',
      message: 'Error inesperado al procesar el archivo',
      suggestion: 'Intenta de nuevo o contacta con soporte.',
      recoverable: true,
      performance: { failedAfterMs: parseFloat(elapsed) }
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
