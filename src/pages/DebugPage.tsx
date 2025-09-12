import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Check, X, Info, Upload, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabaseLogger } from '@/utils/supabaseLogger';
import { normalizePeriodo } from '@/utils/normalizePeriodo';
import { ChartProbe } from '@/components/ChartProbe';
import { csvValidator } from '@/utils/csvValidator';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface TestResult {
  name: string;
  status: 'ok' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface DebugData {
  userId: string | null;
  envVars: {
    supabaseUrl: string;
    supabaseKey: string;
  };
  sessionHydrated: boolean;
}

export const DebugPage: React.FC = () => {
  const { user, session } = useAuth();
  const [debugData, setDebugData] = useState<DebugData>({
    userId: null,
    envVars: { supabaseUrl: '', supabaseKey: '' },
    sessionHydrated: false
  });
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [testRows, setTestRows] = useState<any[]>([]);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    setDebugData({
      userId: user?.id || null,
      envVars: {
        supabaseUrl: url ? `${url.slice(0, 4)}...${url.slice(-4)}` : 'NO DEFINIDO',
        supabaseKey: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : 'NO DEFINIDO'
      },
      sessionHydrated: !!session
    });
  }, [user, session]);

  const runTest = async (testName: string, testFn: () => Promise<TestResult>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFn();
      setTests(prev => [...prev.filter(t => t.name !== testName), result]);
    } catch (error) {
      setTests(prev => [...prev.filter(t => t.name !== testName), {
        name: testName,
        status: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido'
      }]);
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const testSupabaseConnection = async (): Promise<TestResult> => {
    if (!debugData.sessionHydrated) {
      throw new Error('Esperando hidratación de sesión...');
    }
    
    const { data, error } = await supabase
      .from('fs_pyg_lines')
      .select('id')
      .limit(1);

    return {
      name: 'Conexión Supabase',
      status: error ? 'error' : 'ok',
      message: error ? error.message : 'Conexión exitosa',
      details: { data }
    };
  };

  const testRLSPolicies = async (): Promise<TestResult> => {
    const invalidUuid = '00000000-0000-0000-0000-000000000000';
    const validUuid = user?.id || 'test-uuid';
    
    // Test A: Should return 0 with invalid company_id
    const { data: invalidData, error: invalidError } = await supabase
      .from('fs_pyg_lines')
      .select('id', { count: 'exact' })
      .eq('company_id', invalidUuid);

    // Test B: Should return data with valid access
    const { data: validData, error: validError } = await supabase
      .from('fs_pyg_lines')
      .select('id', { count: 'exact' })
      .limit(1);

    const invalidCount = invalidData?.length || 0;
    const hasValidData = validData && validData.length > 0;

    let status: 'ok' | 'warning' | 'error' = 'ok';
    let message = 'RLS funciona correctamente';

    if (invalidCount > 0) {
      status = 'error';
      message = 'RLS permite acceso con UUID inválido';
    } else if (!hasValidData) {
      status = 'warning';
      message = 'RLS funciona, pero no hay datos o posible problema has_company_access';
    }

    return {
      name: 'Políticas RLS',
      status,
      message,
      details: { invalidCount, hasValidData, invalidError, validError }
    };
  };

  const testDataTypes = async (): Promise<TestResult> => {
    const { data, error } = await supabase
      .from('fs_pyg_lines')
      .select('period_date, concept, amount')
      .order('period_date', { ascending: true })
      .limit(3);

    if (error) throw error;

    setTestRows(data || []);

    const hasInvalidAmounts = data?.some(row => typeof row.amount !== 'number');
    
    return {
      name: 'Tipos de Datos',
      status: hasInvalidAmounts ? 'error' : 'ok',
      message: hasInvalidAmounts ? 'amount es string en algunas filas' : 'Todos los amounts son números',
      details: { rows: data?.length || 0, sampleTypes: data?.map(row => ({ concept: row.concept, amountType: typeof row.amount })) }
    };
  };

  const testStorageOperations = async (): Promise<TestResult> => {
    try {
      const testFileName = `test-${Date.now()}.txt`;
      const testContent = new Blob(['test content'], { type: 'text/plain' });
      
      // Upload test
      const { error: uploadError } = await supabase.storage
        .from('gl-uploads')
        .upload(`test/${testFileName}`, testContent);

      if (uploadError) throw uploadError;

      // Download test
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('gl-uploads')
        .download(`test/${testFileName}`);

      if (downloadError) throw downloadError;

      // Cleanup
      await supabase.storage
        .from('gl-uploads')
        .remove([`test/${testFileName}`]);

      return {
        name: 'Storage y CORS',
        status: 'ok',
        message: 'Upload/Download exitoso',
        details: { fileSize: downloadData?.size }
      };
    } catch (error) {
      return {
        name: 'Storage y CORS',
        status: 'error',
        message: 'Revisar bucket, políticas o CORS',
        details: { error: error instanceof Error ? error.message : 'Error desconocido' }
      };
    }
  };

  const testEdgeFunction = async (): Promise<TestResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-template-processor', {
        body: { path: 'ping' }
      });

      return {
        name: 'Edge Function Ping',
        status: error ? 'error' : 'ok',
        message: error ? `Error: ${error.message}` : 'Función responde correctamente',
        details: { data, error }
      };
    } catch (error) {
      return {
        name: 'Edge Function Ping',
        status: 'error',
        message: error instanceof Error ? error.message : 'Error de conexión',
        details: { error }
      };
    }
  };

  const testIngestion = async (): Promise<TestResult> => {
    try {
      // Generate test CSV
      const csvContent = `concepto,importe,periodo
Ventas,10000,2024-01
Gastos,-5000,2024-02
Resultado,5000,2024-03`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const fileName = `test-ingestion-${Date.now()}.csv`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('gl-uploads')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Process via edge function
      const { data, error } = await supabase.functions.invoke('enhanced-template-processor', {
        body: {
          company_id: user?.id || 'test',
          path: fileName,
          test: true
        }
      });

      // Cleanup
      await supabase.storage
        .from('gl-uploads')
        .remove([fileName]);

      return {
        name: 'Ingestión de Prueba',
        status: error ? 'error' : 'ok',
        message: error ? error.message : `Procesadas ${data?.inserted || 0} filas`,
        details: { data, error }
      };
    } catch (error) {
      return {
        name: 'Ingestión de Prueba',
        status: 'error',
        message: error instanceof Error ? error.message : 'Error en ingestión',
        details: { error }
      };
    }
  };

  const testPeriodNormalization = (): TestResult => {
    const testCases = [
      { input: '2024-01', expected: '2024-01-31' },
      { input: '2024Q1', expected: '2024-03-31' },
      { input: 'enero 2024', expected: '2024-01-31' },
      { input: '2024-01-15', expected: '2024-01-31' }
    ];

    const results = testCases.map(testCase => {
      try {
        const result = normalizePeriodo(testCase.input, 2024);
        return { ...testCase, result, success: result === testCase.expected };
      } catch (error) {
        return { 
          ...testCase, 
          result: error instanceof Error ? error.message : 'Error', 
          success: false 
        };
      }
    });

    const allPassed = results.every(r => r.success);

    return {
      name: 'Normalización de Periodos',
      status: allPassed ? 'ok' : 'error',
      message: allPassed ? 'Todos los casos pasan' : 'Algunos casos fallan',
      details: results
    };
  };

  const testCSVValidation = (): TestResult => {
    const validCSV = `concepto,importe,periodo
Ventas,10000,2024-01
Gastos,5000.50,2024-02`;

    const invalidCSV = `concepto,importe
Ventas,not_a_number`;

    try {
      const validResult = csvValidator.validate(validCSV);
      const invalidResult = csvValidator.validate(invalidCSV);

      return {
        name: 'Validación CSV',
        status: !validResult.isValid || invalidResult.isValid ? 'error' : 'ok',
        message: 'Validación funciona correctamente',
        details: { validResult, invalidResult }
      };
    } catch (error) {
      return {
        name: 'Validación CSV',
        status: 'error',
        message: error instanceof Error ? error.message : 'Error en validación',
        details: { error }
      };
    }
  };

  const checkDuplicates = async (): Promise<TestResult> => {
    const { data, error } = await supabase
      .from('fs_pyg_lines')
      .select('company_id, period_date, concept')
      .limit(1000);

    if (error) throw error;

    const duplicates = data?.reduce((acc: any[], row) => {
      const key = `${row.company_id}-${row.period_date}-${row.concept}`;
      const existing = acc.find(item => item.key === key);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ key, count: 1, ...row });
      }
      return acc;
    }, []).filter(item => item.count > 1);

    return {
      name: 'Detector de Duplicados',
      status: duplicates && duplicates.length > 0 ? 'warning' : 'ok',
      message: duplicates && duplicates.length > 0 ? `${duplicates.length} duplicados encontrados` : 'No se encontraron duplicados',
      details: { duplicates: duplicates?.slice(0, 5) }
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <Check className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <X className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sistema de Debug</h1>
          <Badge variant="secondary">
            {tests.filter(t => t.status === 'ok').length}/{tests.length} tests OK
          </Badge>
        </div>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Sesión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>User ID:</strong> {debugData.userId || "Sin sesión"}</div>
            <div><strong>VITE_SUPABASE_URL:</strong> {debugData.envVars.supabaseUrl}</div>
            <div><strong>VITE_SUPABASE_ANON_KEY:</strong> {debugData.envVars.supabaseKey}</div>
            <div><strong>Sesión hidratada:</strong> 
              <Badge className={`ml-2 ${debugData.sessionHydrated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {debugData.sessionHydrated ? 'Sí' : 'No'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button onClick={() => runTest('connection', testSupabaseConnection)} disabled={loading.connection}>
            {loading.connection ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Probar Conexión'}
          </Button>
          <Button onClick={() => runTest('rls', testRLSPolicies)} disabled={loading.rls}>
            {loading.rls ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Test RLS'}
          </Button>
          <Button onClick={() => runTest('types', testDataTypes)} disabled={loading.types}>
            {loading.types ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Inspeccionar Tipos'}
          </Button>
          <Button onClick={() => runTest('storage', testStorageOperations)} disabled={loading.storage}>
            {loading.storage ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Test Storage'}
          </Button>
          <Button onClick={() => runTest('edge', testEdgeFunction)} disabled={loading.edge}>
            {loading.edge ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Ping Function'}
          </Button>
          <Button onClick={() => runTest('ingestion', testIngestion)} disabled={loading.ingestion}>
            {loading.ingestion ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Test Ingestión'}
          </Button>
          <Button onClick={() => runTest('periods', () => Promise.resolve(testPeriodNormalization()))}>
            Test Periodos
          </Button>
          <Button onClick={() => runTest('csv', () => Promise.resolve(testCSVValidation()))}>
            Test CSV
          </Button>
          <Button onClick={() => runTest('duplicates', checkDuplicates)} disabled={loading.duplicates}>
            {loading.duplicates ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Check Duplicados'}
          </Button>
        </div>

        {/* Test Results */}
        {tests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados de Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tests.map((test, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{test.name}</span>
                      <Badge className={getStatusColor(test.status)}>
                        {test.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{test.message}</p>
                    {test.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-blue-600">Ver detalles</summary>
                        <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Chart Probe */}
        {testRows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Prueba de Gráfico</CardTitle>
              <CardDescription>Validación de renderizado con datos reales</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartProbe rows={testRows} />
            </CardContent>
          </Card>
        )}

        {/* Supabase Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Logs de Supabase (Últimos 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {supabaseLogger.getLogs().slice(0, 10).map((log, index) => (
                <div key={index} className="text-xs font-mono p-2 bg-gray-100 rounded">
                  <div className="flex justify-between items-start">
                    <span className={log.error ? 'text-red-600' : 'text-green-600'}>
                      {log.operation}
                    </span>
                    <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {log.error && <div className="text-red-600 mt-1">{log.error.message} ({log.error.code})</div>}
                  <details className="mt-1">
                    <summary className="cursor-pointer text-blue-600">Ver detalles</summary>
                    <pre className="mt-1 text-xs">{JSON.stringify({ table: log.table, params: log.params }, null, 2)}</pre>
                  </details>
                </div>
              ))}
              {supabaseLogger.getLogs().length === 0 && (
                <p className="text-muted-foreground text-center py-4">No hay logs disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>

        {!debugData.sessionHydrated && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esperando hidratación de sesión. Algunos tests pueden fallar hasta que la sesión esté lista.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default DebugPage;