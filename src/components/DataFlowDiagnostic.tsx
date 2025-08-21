import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { diagnoseDataFlow, logDiagnosticResults, type DiagnosticResult } from '@/utils/dataFlowDiagnostic';

export const DataFlowDiagnostic: React.FC = () => {
  const { companyId } = useCompanyContext();
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const results = await diagnoseDataFlow(companyId);
      setDiagnosticResults(results);
      logDiagnosticResults(results);
    } catch (error) {
      console.error('Error running diagnostic:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      runDiagnostic();
    }
  }, [companyId]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🔍 Diagnóstico del Flujo de Datos
            {companyId && (
              <Badge variant="outline" className="ml-2">
                {companyId.slice(0, 8)}...
              </Badge>
            )}
          </CardTitle>
          <Button 
            onClick={runDiagnostic} 
            disabled={loading || !companyId}
            size="sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Diagnosticando...' : 'Ejecutar Diagnóstico'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!companyId ? (
          <div className="text-center py-8 text-gray-500">
            No hay empresa seleccionada
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Ejecutando diagnóstico...</p>
          </div>
        ) : diagnosticResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Haz clic en "Ejecutar Diagnóstico" para comenzar
          </div>
        ) : (
          <div className="space-y-3">
            {diagnosticResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{result.step}</h4>
                    <p className="text-sm mt-1">{result.message}</p>
                    {result.data && (
                      <div className="mt-2 text-xs">
                        <details className="cursor-pointer">
                          <summary className="font-medium">Ver detalles</summary>
                          <pre className="mt-2 p-2 bg-white/50 rounded text-xs overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
