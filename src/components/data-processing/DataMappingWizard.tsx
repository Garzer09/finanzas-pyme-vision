import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DataMappingWizardProps {
  excelData: Record<string, any>;
  onMappingComplete: (mappedData: any) => void;
  onCancel: () => void;
}

interface MappingResult {
  mappedData: Record<string, any>;
  confidence: number;
  suggestions: string[];
  unmappedFields: string[];
}

interface ValidationResult {
  isValid: boolean;
  cleanedData: Record<string, any>;
  issues: any[];
  suggestions: any[];
  confidence: number;
  normalizedUnits: string;
}

export function DataMappingWizard({ excelData, onMappingComplete, onCancel }: DataMappingWizardProps) {
  const [currentStep, setCurrentStep] = useState<'mapping' | 'validation' | 'assignment'>('mapping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mappingResult, setMappingResult] = useState<MappingResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [clientName, setClientName] = useState('');
  const [industrySector, setIndustrySector] = useState('');
  const [manualMappings, setManualMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    // Iniciar mapeo automático al cargar
    if (excelData && Object.keys(excelData).length > 0) {
      performIntelligentMapping();
    }
  }, [excelData]);

  const performIntelligentMapping = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const response = await supabase.functions.invoke('intelligent-data-mapper', {
        body: {
          data: excelData,
          clientConfig: {
            clientName: clientName || 'default',
            industrySector
          },
          userId: user.id
        }
      });

      if (response.error) throw response.error;

      setMappingResult(response.data.result);
      toast.success('Mapeo inteligente completado');
    } catch (error) {
      console.error('Error en mapeo:', error);
      toast.error('Error en el mapeo de datos');
    } finally {
      setIsProcessing(false);
    }
  };

  const performValidation = async () => {
    if (!mappingResult) return;
    
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Combinar datos mapeados automáticamente con mapeos manuales
      const finalMappedData = { ...mappingResult.mappedData };
      Object.entries(manualMappings).forEach(([source, target]) => {
        if (target && excelData[source] !== undefined) {
          finalMappedData[target] = excelData[source];
        }
      });

      const response = await supabase.functions.invoke('data-validator', {
        body: {
          mappedData: finalMappedData,
          userId: user.id,
          fileId: null // TODO: Pasar el ID del archivo si existe
        }
      });

      if (response.error) throw response.error;

      setValidationResult(response.data.result);
      setCurrentStep('validation');
      toast.success('Validación completada');
    } catch (error) {
      console.error('Error en validación:', error);
      toast.error('Error en la validación de datos');
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeProcessing = async () => {
    if (!validationResult) return;

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Guardar configuración del cliente para futuras referencias
      if (clientName) {
        await supabase.from('client_configurations').upsert({
          user_id: user.id,
          client_name: clientName,
          industry_sector: industrySector,
          field_mappings: { ...mappingResult?.mappedData, ...manualMappings },
          validation_rules: {},
          data_patterns: {}
        });
      }

      // Asignar datos a gráficos
      const response = await supabase.functions.invoke('chart-data-assigner', {
        body: {
          validatedData: validationResult.cleanedData,
          userId: user.id,
          requestedCharts: ['profit_loss', 'balance_sheet', 'cash_flow', 'financial_ratios']
        }
      });

      if (response.error) throw response.error;

      onMappingComplete({
        originalData: excelData,
        mappedData: validationResult.cleanedData,
        chartAssignments: response.data.result,
        clientConfig: {
          name: clientName,
          sector: industrySector
        }
      });

      toast.success('Procesamiento completado exitosamente');
    } catch (error) {
      console.error('Error en procesamiento final:', error);
      toast.error('Error en el procesamiento final');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateManualMapping = (sourceField: string, targetField: string) => {
    setManualMappings(prev => ({
      ...prev,
      [sourceField]: targetField
    }));
  };

  const financialFields = [
    'ventas', 'ingresos', 'facturacion',
    'coste_ventas', 'gastos_personal', 'otros_gastos',
    'ebitda', 'resultado_neto',
    'activo_total', 'activo_corriente', 'patrimonio_neto',
    'pasivo_total', 'pasivo_corriente', 'deuda_financiera',
    'tesoreria', 'bancos', 'caja'
  ];

  if (isProcessing && !mappingResult) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Procesando datos...</CardTitle>
          <CardDescription>
            Aplicando mapeo inteligente a sus datos financieros
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Analizando estructura de datos...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Asistente de Mapeo de Datos</CardTitle>
        <CardDescription>
          Configure el mapeo de sus datos financieros para generar el dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentStep} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mapping">1. Mapeo de Campos</TabsTrigger>
            <TabsTrigger value="validation" disabled={!mappingResult}>2. Validación</TabsTrigger>
            <TabsTrigger value="assignment" disabled={!validationResult}>3. Asignación</TabsTrigger>
          </TabsList>

          <TabsContent value="mapping" className="space-y-6">
            {/* Configuración del cliente */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Nombre del Cliente</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Empresa ABC S.L."
                />
              </div>
              <div>
                <Label htmlFor="sector">Sector Industrial</Label>
                <Select value={industrySector} onValueChange={setIndustrySector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufactura</SelectItem>
                    <SelectItem value="services">Servicios</SelectItem>
                    <SelectItem value="technology">Tecnología</SelectItem>
                    <SelectItem value="healthcare">Salud</SelectItem>
                    <SelectItem value="finance">Financiero</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resultados del mapeo automático */}
            {mappingResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold">Mapeo Automático Completado</h3>
                  <Badge variant="outline">
                    Confianza: {Math.round(mappingResult.confidence * 100)}%
                  </Badge>
                </div>

                {/* Campos mapeados automáticamente */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Campos Mapeados ({Object.keys(mappingResult.mappedData).length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(mappingResult.mappedData).map(([field, value]) => (
                        <div key={field} className="flex justify-between text-sm">
                          <span className="font-medium">{field}</span>
                          <span className="text-muted-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Campos No Mapeados ({mappingResult.unmappedFields.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {mappingResult.unmappedFields.map(field => (
                        <div key={field} className="space-y-2">
                          <Label className="text-sm">{field}</Label>
                          <Select 
                            value={manualMappings[field] || ''} 
                            onValueChange={(value) => updateManualMapping(field, value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Mapear a..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No mapear</SelectItem>
                              {financialFields.map(targetField => (
                                <SelectItem key={targetField} value={targetField}>
                                  {targetField}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Sugerencias */}
                {mappingResult.suggestions.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sugerencias:</strong>
                      <ul className="mt-2 space-y-1">
                        {mappingResult.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm">• {suggestion}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button 
                onClick={performValidation}
                disabled={!mappingResult || isProcessing}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Continuar a Validación
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-6">
            {validationResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <h3 className="text-lg font-semibold">Validación de Datos</h3>
                  <Badge variant={validationResult.isValid ? "default" : "secondary"}>
                    {validationResult.isValid ? 'Válido' : 'Con advertencias'}
                  </Badge>
                  <Badge variant="outline">
                    Confianza: {Math.round(validationResult.confidence * 100)}%
                  </Badge>
                </div>

                {/* Problemas encontrados */}
                {validationResult.issues.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Problemas Detectados:</h4>
                    {validationResult.issues.map((issue, index) => (
                      <Alert key={index} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                        <AlertDescription>
                          <strong>{issue.field}:</strong> {issue.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {/* Datos limpios resultantes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Datos Procesados</CardTitle>
                    <CardDescription>
                      Unidades normalizadas a: {validationResult.normalizedUnits}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(validationResult.cleanedData).map(([field, value]) => (
                        <div key={field} className="text-sm">
                          <span className="font-medium">{field}:</span>
                          <span className="ml-2">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('mapping')}>
                Volver
              </Button>
              <Button 
                onClick={() => setCurrentStep('assignment')}
                disabled={!validationResult}
              >
                Continuar a Asignación
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="assignment" className="space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Finalizando Procesamiento</h3>
              <p className="text-muted-foreground">
                Los datos han sido validados y están listos para asignarse a los gráficos del dashboard.
              </p>
              
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setCurrentStep('validation')}>
                  Volver
                </Button>
                <Button onClick={finalizeProcessing} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Generar Dashboard
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}