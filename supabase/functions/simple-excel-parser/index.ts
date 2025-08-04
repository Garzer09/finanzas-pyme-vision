import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { file, fileName } = await req.json();
    
    if (!file || !fileName) {
      throw new Error('File and fileName are required');
    }

    console.log('Processing file:', fileName);

    // Development mode - check environment variable for production deployments
    // TODO: Replace with actual Excel parsing library (like xlsx) for production
    const isDevelopmentMode = Deno.env.get('DENO_ENV') === 'development';
    
    console.log('Development mode enabled - using mock data for Excel parsing');

    const mockParsedData: ParsedExcelData = {
      detectedSheets: [],
      detectedFields: {},
      sheetsData: []
    };

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

    console.log('Parsed data:', mockParsedData);

    return new Response(
      JSON.stringify({
        success: true,
        detectedSheets: mockParsedData.detectedSheets,
        detectedFields: mockParsedData.detectedFields,
        sheetsData: mockParsedData.sheetsData,
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
    console.error('Error in simple-excel-parser:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Error parsing Excel file for testing'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});