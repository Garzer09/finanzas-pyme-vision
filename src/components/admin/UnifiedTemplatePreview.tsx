import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertTriangle, XCircle, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
}

interface ProcessingResult {
  success: boolean;
  dryRun: boolean;
  template_type: string;
  processed_rows: number;
  inserted_count?: number;
  validation: ValidationResult;
  balance_validation?: any[];
  preview_data?: any[];
  error?: string;
}

interface UnifiedTemplatePreviewProps {
  processingResult: ProcessingResult;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const UnifiedTemplatePreview: React.FC<UnifiedTemplatePreviewProps> = ({
  processingResult,
  onConfirm,
  onCancel,
  isProcessing = false
}) => {
  const [activeTab, setActiveTab] = useState('summary');

  const { validation, balance_validation, preview_data, template_type } = processingResult;

  const getSeverityIcon = (severity: 'error' | 'warning') => {
    return severity === 'error' ? (
      <XCircle className="h-4 w-4 text-destructive" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-warning" />
    );
  };

  const getTemplateDisplayName = (type: string) => {
    const names = {
      facts: 'Datos Financieros (Facts)',
      debt_loans: 'Préstamos y Deuda',
      debt_balances: 'Saldos de Deuda',
      company_profile_unified: 'Perfil de Empresa'
    };
    return names[type as keyof typeof names] || type;
  };

  const hasBlockingErrors = validation.errors.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Previsualización de Carga</h3>
          <p className="text-muted-foreground">
            {getTemplateDisplayName(template_type)} - {processingResult.processed_rows} filas procesadas
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={hasBlockingErrors || isProcessing}
            className="bg-primary hover:bg-primary/90"
          >
            {isProcessing ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Carga
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium">Filas Válidas</p>
                <p className="text-2xl font-bold">{validation.summary.validRows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">Errores</p>
                <p className="text-2xl font-bold">{validation.summary.errorRows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium">Advertencias</p>
                <p className="text-2xl font-bold">{validation.summary.warningRows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Filas</p>
                <p className="text-2xl font-bold">{validation.summary.totalRows}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Status */}
      {hasBlockingErrors && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Se encontraron {validation.errors.length} errores que deben corregirse antes de proceder con la carga.
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && !hasBlockingErrors && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Se encontraron {validation.warnings.length} advertencias. La carga puede continuar, pero revise los datos.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for detailed view */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="errors">Errores ({validation.errors.length})</TabsTrigger>
          <TabsTrigger value="warnings">Advertencias ({validation.warnings.length})</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Validación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Estado general:</span>
                  <Badge variant={validation.isValid ? "secondary" : "destructive"}>
                    {validation.isValid ? "Válido" : "Con errores"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Tipo de plantilla:</span>
                  <Badge variant="secondary">{getTemplateDisplayName(template_type)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Filas procesadas:</span>
                  <span className="font-medium">{processingResult.processed_rows}</span>
                </div>
                
                {balance_validation && balance_validation.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Validación de Balance:</h4>
                    <div className="space-y-2">
                      {balance_validation.map((bal, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between">
                            <span>Periodo {bal.period} - {bal.scenario}:</span>
                            <Badge variant={bal.tolerance_ok ? "secondary" : "destructive"}>
                              {bal.tolerance_ok ? "Balanceado" : "Desbalanceado"}
                            </Badge>
                          </div>
                          {!bal.tolerance_ok && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Diferencia: €{Math.abs(bal.difference).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {validation.errors.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <p className="text-lg font-medium">¡Sin errores detectados!</p>
                <p className="text-muted-foreground">Todos los datos han pasado la validación.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span>Errores Detectados</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="p-3 border-l-4 border-destructive bg-destructive/5 rounded">
                      <div className="flex items-start space-x-2">
                        {getSeverityIcon(error.severity)}
                        <div className="flex-1">
                          <p className="font-medium">Fila {error.row} - Campo: {error.field}</p>
                          <p className="text-sm text-muted-foreground">{error.error}</p>
                          <p className="text-xs text-muted-foreground">Valor: {error.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          {validation.warnings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <p className="text-lg font-medium">Sin advertencias</p>
                <p className="text-muted-foreground">Los datos están en perfecto estado.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span>Advertencias</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validation.warnings.map((warning, index) => (
                    <div key={index} className="p-3 border-l-4 border-warning bg-warning/5 rounded">
                      <div className="flex items-start space-x-2">
                        {getSeverityIcon(warning.severity)}
                        <div className="flex-1">
                          <p className="font-medium">Fila {warning.row} - Campo: {warning.field}</p>
                          <p className="text-sm text-muted-foreground">{warning.error}</p>
                          <p className="text-xs text-muted-foreground">Valor: {warning.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa de Datos</CardTitle>
            </CardHeader>
            <CardContent>
              {preview_data && preview_data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border border-border rounded-lg">
                    <thead>
                      <tr className="bg-muted">
                        {Object.keys(preview_data[0]).slice(0, 6).map((key) => (
                          <th key={key} className="p-3 text-left border-b border-border">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview_data.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b border-border">
                          {Object.values(row).slice(0, 6).map((value: any, cellIndex) => (
                            <td key={cellIndex} className="p-3">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview_data.length > 5 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Mostrando 5 de {preview_data.length} filas
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  No hay datos de previsualización disponibles
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};