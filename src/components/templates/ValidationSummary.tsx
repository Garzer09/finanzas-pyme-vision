// Validation Summary component for displaying validation results
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, ChevronDown, ChevronRight, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ValidationSummaryProps, ValidationError } from '@/types/templates';

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  validationResults,
  showDetails = true,
  onErrorClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'errors' | 'warnings' | 'stats'>('stats');

  const { is_valid, errors, warnings, statistics } = validationResults;

  const getValidationIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getValidationBadgeVariant = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getOverallStatus = () => {
    if (errors.length === 0 && warnings.length === 0) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        title: 'Validación Exitosa',
        description: 'Todos los datos pasaron la validación correctamente',
        variant: 'success' as const
      };
    } else if (errors.length > 0) {
      return {
        icon: <XCircle className="h-5 w-5 text-destructive" />,
        title: 'Errores de Validación',
        description: `Se encontraron ${errors.length} error(es) que deben corregirse`,
        variant: 'destructive' as const
      };
    } else {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        title: 'Advertencias de Validación',
        description: `Se encontraron ${warnings.length} advertencia(s)`,
        variant: 'default' as const
      };
    }
  };

  const overallStatus = getOverallStatus();
  const validationPercentage = statistics.total_rows > 0 
    ? (statistics.valid_rows / statistics.total_rows) * 100 
    : 0;

  const exportValidationReport = () => {
    const report = {
      summary: {
        is_valid,
        total_rows: statistics.total_rows,
        valid_rows: statistics.valid_rows,
        invalid_rows: statistics.invalid_rows,
        error_count: errors.length,
        warning_count: warnings.length
      },
      errors,
      warnings
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `validation-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {overallStatus.icon}
            Resumen de Validación
          </CardTitle>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportValidationReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            {showDetails && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    {isExpanded ? 'Ocultar' : 'Ver'} Detalles
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Status Alert */}
        <Alert variant={overallStatus.variant}>
          <div className="flex items-center gap-2">
            {overallStatus.icon}
            <div>
              <div className="font-medium">{overallStatus.title}</div>
              <div className="text-sm">{overallStatus.description}</div>
            </div>
          </div>
        </Alert>

        {/* Statistics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-foreground">{statistics.total_rows}</div>
            <div className="text-xs text-muted-foreground">Total Filas</div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{statistics.valid_rows}</div>
            <div className="text-xs text-muted-foreground">Válidas</div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-destructive">{errors.length}</div>
            <div className="text-xs text-muted-foreground">Errores</div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{warnings.length}</div>
            <div className="text-xs text-muted-foreground">Advertencias</div>
          </div>
        </div>

        {/* Validation Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Datos Válidos</span>
            <span>{validationPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={validationPercentage} className="h-2" />
        </div>

        {/* Detailed View */}
        {showDetails && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleContent className="space-y-4">
              <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="stats">Estadísticas</TabsTrigger>
                  <TabsTrigger value="errors" className="relative">
                    Errores
                    {errors.length > 0 && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        {errors.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="warnings" className="relative">
                    Advertencias
                    {warnings.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {warnings.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Resumen de Filas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total procesadas:</span>
                            <span className="font-medium">{statistics.total_rows}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Válidas:</span>
                            <span className="font-medium text-green-600">{statistics.valid_rows}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Con errores:</span>
                            <span className="font-medium text-destructive">{statistics.invalid_rows}</span>
                          </div>
                          {statistics.empty_rows_count !== undefined && (
                            <div className="flex justify-between">
                              <span>Vacías:</span>
                              <span className="font-medium text-muted-foreground">{statistics.empty_rows_count}</span>
                            </div>
                          )}
                          {statistics.duplicates_count !== undefined && (
                            <div className="flex justify-between">
                              <span>Duplicadas:</span>
                              <span className="font-medium text-yellow-600">{statistics.duplicates_count}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Resumen de Issues</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total errores:</span>
                            <span className="font-medium text-destructive">{statistics.errors_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total advertencias:</span>
                            <span className="font-medium text-yellow-600">{statistics.warnings_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tasa de éxito:</span>
                            <span className="font-medium text-green-600">{validationPercentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="errors" className="space-y-3">
                  {errors.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <p>¡Excelente! No se encontraron errores de validación.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {errors.map((error, index) => (
                        <Card 
                          key={index} 
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                            onErrorClick ? 'hover:border-destructive' : ''
                          }`}
                          onClick={() => onErrorClick?.(error)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {getValidationIcon(error.severity)}
                              
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={getValidationBadgeVariant(error.severity)}>
                                    {error.type}
                                  </Badge>
                                  {error.row && (
                                    <Badge variant="outline" className="text-xs">
                                      Fila {error.row}
                                    </Badge>
                                  )}
                                  {error.column && (
                                    <Badge variant="outline" className="text-xs">
                                      {error.column}
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-sm font-medium">{error.message}</p>
                                
                                {error.value !== undefined && (
                                  <p className="text-xs text-muted-foreground">
                                    Valor: <code className="bg-muted px-1 rounded">{String(error.value)}</code>
                                  </p>
                                )}
                              </div>
                              
                              {onErrorClick && (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="warnings" className="space-y-3">
                  {warnings.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <p>No se encontraron advertencias.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {warnings.map((warning, index) => (
                        <Card 
                          key={index} 
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                            onErrorClick ? 'hover:border-yellow-300' : ''
                          }`}
                          onClick={() => onErrorClick?.(warning)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {getValidationIcon(warning.severity)}
                              
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={getValidationBadgeVariant(warning.severity)}>
                                    {warning.type}
                                  </Badge>
                                  {warning.row && (
                                    <Badge variant="outline" className="text-xs">
                                      Fila {warning.row}
                                    </Badge>
                                  )}
                                  {warning.column && (
                                    <Badge variant="outline" className="text-xs">
                                      {warning.column}
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-sm font-medium">{warning.message}</p>
                                
                                {warning.value !== undefined && (
                                  <p className="text-xs text-muted-foreground">
                                    Valor: <code className="bg-muted px-1 rounded">{String(warning.value)}</code>
                                  </p>
                                )}
                              </div>
                              
                              {onErrorClick && (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};