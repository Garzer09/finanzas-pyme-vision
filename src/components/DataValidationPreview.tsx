import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Edit3, 
  Save, 
  Eye,
  Calendar,
  FileText,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessedData {
  [key: string]: any;
  document_type_detected?: string;
  file_type?: string;
  periodos_detectados?: string[];
  validation?: {
    isValid: boolean;
    errors: string[];
  };
  processing_warnings?: string[];
  estados_financieros?: any;
  ratios_financieros?: any;
  pool_financiero?: any;
  proyecciones?: any;
}

interface DataPreviewProps {
  fileId: string;
  fileName: string;
  processedData: ProcessedData;
  onConfirm: () => void;
  onReject: () => void;
}

export const DataValidationPreview: React.FC<DataPreviewProps> = ({
  fileId,
  fileName,
  processedData,
  onConfirm,
  onReject
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState(processedData);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const getValidationIcon = () => {
    if (!processedData.validation) return <Eye className="h-5 w-5 text-blue-500" />;
    
    if (processedData.validation.isValid) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getValidationStatus = () => {
    if (!processedData.validation) return 'Sin validar';
    return processedData.validation.isValid ? 'Válido' : 'Errores detectados';
  };

  const saveEditedData = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('excel_files')
        .update({
          processing_result: editedData,
          processing_status: 'completed'
        })
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: "Datos actualizados",
        description: "Los cambios se han guardado correctamente"
      });
      
      setEditMode(false);
      onConfirm();
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const renderEditableField = (key: string, value: any, path: string[] = []) => {
    const fieldPath = [...path, key].join('.');
    
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={fieldPath} className="space-y-2">
          <Label className="font-semibold text-steel-blue-dark capitalize">
            {key.replace('_', ' ')}
          </Label>
          <div className="ml-4 space-y-2">
            {Object.entries(value).map(([subKey, subValue]) => 
              renderEditableField(subKey, subValue, [...path, key])
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={fieldPath} className="space-y-1">
        <Label className="text-sm text-professional capitalize">
          {key.replace('_', ' ')}
        </Label>
        {editMode ? (
          <Input
            value={value?.toString() || ''}
            onChange={(e) => {
              const newData = { ...editedData };
              let current = newData;
              
              // Navigate to the correct nested object
              for (let i = 0; i < path.length; i++) {
                current = current[path[i]];
              }
              
              current[key] = e.target.value;
              setEditedData(newData);
            }}
            className="text-sm"
          />
        ) : (
          <div className="p-2 bg-light-gray-50 rounded text-sm">
            {value?.toString() || 'N/A'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with validation status */}
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getValidationIcon()}
              <div>
                <CardTitle className="text-steel-blue-dark">
                  Vista Previa: {fileName}
                </CardTitle>
                <CardDescription>
                  {processedData.document_type_detected} • {processedData.file_type} • {getValidationStatus()}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={saveEditedData}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setEditMode(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Validation errors */}
      {processedData.validation?.errors && processedData.validation.errors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">Errores de validación detectados:</p>
              <ul className="list-disc list-inside space-y-1">
                {processedData.validation.errors.map((error, idx) => (
                  <li key={idx} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Processing warnings */}
      {processedData.processing_warnings && processedData.processing_warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">Advertencias del procesamiento:</p>
              <ul className="list-disc list-inside space-y-1">
                {processedData.processing_warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm">{warning}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-steel-blue" />
              <div>
                <p className="text-sm text-professional">Tipo Documento</p>
                <p className="font-semibold text-steel-blue-dark capitalize">
                  {processedData.document_type_detected || 'No detectado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-steel-blue" />
              <div>
                <p className="text-sm text-professional">Períodos</p>
                <p className="font-semibold text-steel-blue-dark">
                  {processedData.periodos_detectados?.length || 0} detectados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-steel-blue" />
              <div>
                <p className="text-sm text-professional">Categorías</p>
                <p className="font-semibold text-steel-blue-dark">
                  {Object.keys(processedData).filter(k => 
                    ['estados_financieros', 'ratios_financieros', 'pool_financiero', 'proyecciones'].includes(k)
                  ).length} encontradas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data tabs */}
      <Tabs defaultValue="periods" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="periods">Períodos</TabsTrigger>
          <TabsTrigger value="financial">Estados</TabsTrigger>
          <TabsTrigger value="ratios">Ratios</TabsTrigger>
          <TabsTrigger value="pool">Pool Financiero</TabsTrigger>
          <TabsTrigger value="projections">Proyecciones</TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-steel-blue-dark">Períodos Detectados</CardTitle>
              <CardDescription>Fechas y períodos identificados en el documento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {processedData.periodos_detectados?.map((period, idx) => (
                  <Badge key={idx} variant="outline">{period}</Badge>
                )) || <p className="text-professional">No se detectaron períodos</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-steel-blue-dark">Estados Financieros</CardTitle>
            </CardHeader>
            <CardContent>
              {processedData.estados_financieros ? (
                <div className="space-y-4">
                  {Object.entries(processedData.estados_financieros).map(([key, value]) => 
                    renderEditableField(key, value)
                  )}
                </div>
              ) : (
                <p className="text-professional">No se encontraron estados financieros</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-steel-blue-dark">Ratios Financieros</CardTitle>
            </CardHeader>
            <CardContent>
              {processedData.ratios_financieros ? (
                <div className="space-y-4">
                  {Object.entries(processedData.ratios_financieros).map(([key, value]) => 
                    renderEditableField(key, value)
                  )}
                </div>
              ) : (
                <p className="text-professional">No se encontraron ratios financieros</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pool" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-steel-blue-dark">Pool Financiero</CardTitle>
            </CardHeader>
            <CardContent>
              {processedData.pool_financiero ? (
                <div className="space-y-4">
                  {Object.entries(processedData.pool_financiero).map(([key, value]) => 
                    renderEditableField(key, value)
                  )}
                </div>
              ) : (
                <p className="text-professional">No se encontró información del pool financiero</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-steel-blue-dark">Proyecciones</CardTitle>
            </CardHeader>
            <CardContent>
              {processedData.proyecciones ? (
                <div className="space-y-4">
                  {Object.entries(processedData.proyecciones).map(([key, value]) => 
                    renderEditableField(key, value)
                  )}
                </div>
              ) : (
                <p className="text-professional">No se encontraron proyecciones</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={onReject}>
          Rechazar Datos
        </Button>
        <Button onClick={onConfirm}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Confirmar y Usar Datos
        </Button>
      </div>
    </div>
  );
};