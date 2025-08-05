import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronDown, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText,
  Bug,
  RefreshCw
} from 'lucide-react';
import { ProcessedFileResult } from '@/services/enhancedFileProcessor';

interface ProcessingDebugPanelProps {
  result: ProcessedFileResult | null;
  isVisible: boolean;
  onRetry?: () => void;
}

export const ProcessingDebugPanel: React.FC<ProcessingDebugPanelProps> = ({
  result,
  isVisible,
  onRetry
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  if (!isVisible || !result) return null;

  const getStatusIcon = () => {
    if (result.success) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusBadge = () => {
    if (result.success) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Exitoso</Badge>;
    } else {
      return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Panel de Depuración
          {getStatusIcon()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Estado:</span>
            {getStatusBadge()}
          </div>
          {onRetry && !result.success && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          )}
        </div>

        {/* Message */}
        <Alert variant={result.success ? "default" : "destructive"}>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>

        {/* Error Details */}
        {!result.success && result.error && (
          <Collapsible open={showErrorDetails} onOpenChange={setShowErrorDetails}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 w-full justify-start">
                {showErrorDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Detalles del Error
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800">Error:</p>
                <p className="text-sm text-red-700">{result.error}</p>
                
                {result.errorDetails && (
                  <details className="mt-2">
                    <summary className="text-sm font-medium text-red-800 cursor-pointer">
                      Información técnica
                    </summary>
                    <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(result.errorDetails, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Processing Logs */}
        {result.processingLogs && result.processingLogs.length > 0 && (
          <Collapsible open={showLogs} onOpenChange={setShowLogs}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 w-full justify-start">
                {showLogs ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Logs de Procesamiento ({result.processingLogs.length})
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-40 w-full border rounded-lg">
                <div className="p-3 space-y-1">
                  {result.processingLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground font-mono text-xs">
                        {String(index + 1).padStart(2, '0')}:
                      </span>
                      <span className="text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Data Preview (if successful) */}
        {result.success && result.data && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 w-full justify-start">
                <ChevronRight className="h-4 w-4" />
                <FileText className="h-4 w-4" />
                Datos Procesados
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                {result.data.company && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-green-800">Empresa:</p>
                    <p className="text-sm text-green-700">
                      {result.data.company.company_name || 'No identificada'}
                    </p>
                  </div>
                )}
                
                {result.data.shareholders && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-green-800">Accionistas:</p>
                    <p className="text-sm text-green-700">
                      {result.data.shareholders.length} encontrados
                    </p>
                  </div>
                )}

                {result.data.stats && (
                  <div>
                    <p className="text-sm font-medium text-green-800">Estadísticas:</p>
                    <ul className="text-xs text-green-600 space-y-1">
                      <li>Headers mapeados: {result.data.stats.mappedHeaders}/{result.data.stats.totalHeaders}</li>
                      <li>Campos de empresa: {result.data.stats.companyFieldsFound}</li>
                      <li>Confianza: {(result.data.confidence * 100).toFixed(1)}%</li>
                    </ul>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Template Detection */}
        {result.templateDetection && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800">Template Detectado:</p>
            <p className="text-sm text-blue-700">
              {result.templateDetection.templateId} 
              (Confianza: {(result.templateDetection.confidence * 100).toFixed(1)}%)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};