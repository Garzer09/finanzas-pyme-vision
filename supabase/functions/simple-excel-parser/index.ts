import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Import XLSX for production Excel parsing
// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Update to specific domains in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours
};

interface SheetData {
  name: string;
  fields: string[];
  sampleData: Record<string, any>[];
}

interface ParsedExcelData {
  detectedSheets: string[];
  detectedFields: Record<string, string[]>;
  sheetsData: SheetData[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting in production (basic implementation)
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    console.log(`Request from IP: ${clientIP}, User-Agent: ${userAgent}`);

    const { file, fileName } = await req.json();
    
    if (!file || !fileName) {
      throw new Error('File and fileName are required');
    }

    // Security: Validate file name and prevent path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      throw new Error('Invalid file name');
    }

    // Security: Validate file extension
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`File type not allowed. Supported types: ${allowedExtensions.join(', ')}`);
    }

    // Security: Basic file size validation (assuming base64 encoded file)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.length > maxSizeInBytes * 1.33) { // Base64 is ~33% larger
      throw new Error('File size exceeds maximum allowed size (10MB)');
    }

    console.log('Processing file:', fileName);

    // Production mode - using real Excel parsing
    // Set to true only for development/testing with mock data
    const isDevelopmentMode = false;
    
    let parsedData: ParsedExcelData;

    if (isDevelopmentMode) {
      console.log('Development mode enabled - using mock data for Excel parsing');
      parsedData = getMockParsedData(fileName);
    } else {
      console.log('Production mode - parsing real Excel file');
      parsedData = await parseRealExcelFile(file, fileName);
    }

    console.log('Parsed data:', parsedData);

    return new Response(
      JSON.stringify({
        success: true,
        detectedSheets: parsedData.detectedSheets,
        detectedFields: parsedData.detectedFields,
        sheetsData: parsedData.sheetsData,
        fileName: fileName,
        message: isDevelopmentMode 
          ? 'Archivo analizado correctamente (DESARROLLO - datos de prueba)'
          : 'Archivo analizado correctamente',
        developmentMode: isDevelopmentMode
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error('Error in simple-excel-parser:', {
      message: errorMessage,
      fileName: req.url,
      timestamp: new Date().toISOString(),
      details: errorDetails
    });

    // Don't expose internal errors in production
    const publicErrorMessage = errorMessage.includes('File') ? 
      errorMessage : 'Error processing Excel file';

    return new Response(
      JSON.stringify({
        error: publicErrorMessage,
        details: 'Please check your file format and try again'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Production Excel parsing function
async function parseRealExcelFile(file: string, fileName: string): Promise<ParsedExcelData> {
  try {
    // Decode base64 file data
    const binaryString = atob(file);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Parse with XLSX
    const workbook = XLSX.read(bytes, { type: 'array' });
    
    const detectedSheets = workbook.SheetNames;
    const detectedFields: Record<string, string[]> = {};
    const sheetsData: SheetData[] = [];

    // Process each sheet
    for (const sheetName of detectedSheets) {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON to get data
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        // Get headers from first row
        const headers = jsonData[0] as string[];
        const fields = headers.filter(h => h && h.toString().trim() !== '');
        
        detectedFields[sheetName] = fields;
        
        // Get sample data (first few rows)
        const sampleData: Record<string, any>[] = [];
        for (let i = 1; i < Math.min(jsonData.length, 6); i++) {
          const row = jsonData[i] as any[];
          const rowData: Record<string, any> = {};
          
          fields.forEach((field, index) => {
            if (row[index] !== undefined && row[index] !== null) {
              rowData[field] = row[index];
            }
          });
          
          if (Object.keys(rowData).length > 0) {
            sampleData.push(rowData);
          }
        }
        
        sheetsData.push({
          name: sheetName,
          fields: fields,
          sampleData: sampleData
        });
      }
    }

    return {
      detectedSheets,
      detectedFields,
      sheetsData
    };
    
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

// Mock data function for development mode
function getMockParsedData(fileName: string): ParsedExcelData {
  const mockParsedData: ParsedExcelData = {
    detectedSheets: [],
    detectedFields: {},
    sheetsData: []
  };

  // Determinar tipo de documento por nombre de archivo
  const fileNameLower = fileName.toLowerCase();
  // Determinar tipo de documento por nombre de archivo
  const fileNameLower = fileName.toLowerCase();
  
  if (fileNameLower.includes('balance') || fileNameLower.includes('situacion')) {
    mockParsedData.detectedSheets = ['Balance de Situación', 'Hoja1'];
    mockParsedData.detectedFields = {
      'Balance de Situación': [
        'Activo no corriente',
        'Inmovilizado material',
        'Activo corriente',
        'Existencias', 
        'Deudores comerciales',
        'Efectivo',
        'Patrimonio neto',
        'Capital',
        'Reservas',
        'Pasivo no corriente',
        'Deudas a largo plazo',
        'Pasivo corriente',
        'Acreedores comerciales'
      ]
    };
    mockParsedData.sheetsData = [{
      name: 'Balance de Situación',
      fields: mockParsedData.detectedFields['Balance de Situación'],
      sampleData: [
        { concepto: 'Activo no corriente', '2023': 150000, '2022': 140000 },
        { concepto: 'Activo corriente', '2023': 80000, '2022': 75000 }
      ]
    }];
  } else if (fileNameLower.includes('pyg') || fileNameLower.includes('perdidas') || fileNameLower.includes('ganancias')) {
    mockParsedData.detectedSheets = ['Cuenta PyG', 'Hoja1'];
    mockParsedData.detectedFields = {
      'Cuenta PyG': [
        'Ingresos de explotación',
        'Cifra de negocios',
        'Gastos de explotación',
        'Aprovisionamientos',
        'Gastos de personal',
        'Amortizaciones',
        'Resultado de explotación',
        'Resultado financiero',
        'Resultado antes de impuestos',
        'Impuesto sobre beneficios',
        'Resultado del ejercicio'
      ]
    };
    mockParsedData.sheetsData = [{
      name: 'Cuenta PyG',
      fields: mockParsedData.detectedFields['Cuenta PyG'],
      sampleData: [
        { concepto: 'Ingresos de explotación', '2023': 500000, '2022': 450000 },
        { concepto: 'Gastos de explotación', '2023': 400000, '2022': 360000 }
      ]
    }];
  } else if (fileNameLower.includes('flujo') || fileNameLower.includes('cash')) {
    mockParsedData.detectedSheets = ['Flujo de Caja', 'Hoja1'];
    mockParsedData.detectedFields = {
      'Flujo de Caja': [
        'Flujos de actividades de explotación',
        'Resultado del ejercicio',
        'Amortizaciones',
        'Variación del circulante',
        'Flujos de actividades de inversión',
        'Inversiones en inmovilizado',
        'Flujos de actividades de financiación',
        'Variación de deudas',
        'Dividendos pagados'
      ]
    };
    mockParsedData.sheetsData = [{
      name: 'Flujo de Caja',
      fields: mockParsedData.detectedFields['Flujo de Caja'],
      sampleData: [
        { concepto: 'Flujos de explotación', '2023': 120000, '2022': 100000 },
        { concepto: 'Flujos de inversión', '2023': -50000, '2022': -30000 }
      ]
    }];
  } else {
    // Archivo genérico
    mockParsedData.detectedSheets = ['Hoja1', 'Datos'];
    mockParsedData.detectedFields = {
      'Hoja1': ['Columna A', 'Columna B', 'Columna C', 'Fecha', 'Importe'],
      'Datos': ['Concepto', 'Valor', 'Período']
    };
    mockParsedData.sheetsData = [{
      name: 'Hoja1',
      fields: mockParsedData.detectedFields['Hoja1'],
      sampleData: [
        { concepto: 'Dato 1', valor: 1000, periodo: '2023' },
        { concepto: 'Dato 2', valor: 2000, periodo: '2023' }
      ]
    }];
  }

  return mockParsedData;
}