import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { MappingReviewProps, FieldMappingResult } from "@/types/mapping";

const AVAILABLE_FIELDS = [
  { value: 'company_name', label: 'Nombre de Empresa', required: true },
  { value: 'sector', label: 'Sector', required: true },
  { value: 'industry', label: 'Industria', required: false },
  { value: 'founded_year', label: 'Año de Fundación', required: false },
  { value: 'employees_range', label: 'Rango de Empleados', required: false },
  { value: 'annual_revenue_range', label: 'Rango de Facturación', required: false },
  { value: 'hq_city', label: 'Ciudad', required: false },
  { value: 'hq_country', label: 'País', required: false },
  { value: 'website', label: 'Sitio Web', required: false },
  { value: 'business_description', label: 'Descripción del Negocio', required: false },
  { value: 'currency_code', label: 'Código de Moneda', required: false },
  { value: 'accounting_standard', label: 'Normativa Contable', required: false },
  { value: 'consolidation', label: 'Consolidación', required: false },
  { value: 'cif', label: 'CIF', required: false },
];

const getConfidenceColor = (score: number) => {
  if (score >= 0.9) return "text-green-600";
  if (score >= 0.7) return "text-yellow-600";
  return "text-red-600";
};

const getConfidenceIcon = (score: number) => {
  if (score >= 0.9) return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (score >= 0.7) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  return <XCircle className="h-4 w-4 text-red-600" />;
};

export function MappingReviewModal({ isOpen, onClose, mappingResult, onConfirm }: MappingReviewProps) {
  const [adjustedMapping, setAdjustedMapping] = useState<Record<string, string>>({});
  const [saveAsProfile, setSaveAsProfile] = useState(false);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (mappingResult?.mapped_fields) {
      const initialMapping: Record<string, string> = {};
      Object.entries(mappingResult.mapped_fields).forEach(([detectedField, mapping]) => {
        initialMapping[detectedField] = mapping.canonical;
      });
      setAdjustedMapping(initialMapping);
    }
  }, [mappingResult]);

  const handleFieldChange = (detectedField: string, newCanonical: string) => {
    setAdjustedMapping(prev => ({
      ...prev,
      [detectedField]: newCanonical
    }));
  };

  const handleUnmap = (detectedField: string) => {
    setAdjustedMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[detectedField];
      return newMapping;
    });
  };

  const handleConfirm = () => {
    const profileNameToSave = saveAsProfile && profileName.trim() ? profileName.trim() : undefined;
    onConfirm(adjustedMapping, profileNameToSave);
  };

  const isValid = () => {
    const requiredFields = AVAILABLE_FIELDS.filter(f => f.required);
    return requiredFields.every(field =>
      Object.values(adjustedMapping).includes(field.value)
    );
  };

  if (!mappingResult) return null;

  const mappedFields = Object.entries(mappingResult.mapped_fields || {});
  const unmappedColumns = mappingResult.unmapped_columns || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar Mapeo de Campos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Análisis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold">{mappingResult.stats.total_columns}</div>
                  <div className="text-sm text-muted-foreground">Columnas totales</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{mappingResult.stats.mapped_columns}</div>
                  <div className="text-sm text-muted-foreground">Mapeadas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{mappingResult.stats.required_mapped}</div>
                  <div className="text-sm text-muted-foreground">Requeridas</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getConfidenceColor(mappingResult.confidence_score)}`}>
                    {Math.round(mappingResult.confidence_score * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confianza</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mapped Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campos Mapeados</CardTitle>
              <CardDescription>
                Revisa y ajusta los mapeos detectados automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mappedFields.map(([detectedField, mapping]) => (
                  <div key={detectedField} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{detectedField}</div>
                      <div className="text-sm text-muted-foreground">
                        Campo detectado en CSV
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getConfidenceIcon(mapping.confidence_score)}
                      <Badge variant="outline" className={getConfidenceColor(mapping.confidence_score)}>
                        {Math.round(mapping.confidence_score * 100)}%
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <Select
                        value={adjustedMapping[detectedField] || mapping.canonical}
                        onValueChange={(value) => handleFieldChange(detectedField, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_FIELDS.map(field => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnmap(detectedField)}
                    >
                      No mapear
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Unmapped Columns */}
          {unmappedColumns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Columnas Sin Mapear</CardTitle>
                <CardDescription>
                  Estas columnas no pudieron ser mapeadas automáticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {unmappedColumns.map(column => (
                    <Badge key={column} variant="secondary">
                      {column}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Preview */}
          {mappingResult.company_data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vista Previa de Datos</CardTitle>
                <CardDescription>
                  Así se verán los datos con el mapeo actual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Empresa:</strong> {mappingResult.company_data.company_name}
                  </div>
                  <div>
                    <strong>Sector:</strong> {mappingResult.company_data.sector}
                  </div>
                  {mappingResult.company_data.industry && (
                    <div>
                      <strong>Industria:</strong> {mappingResult.company_data.industry}
                    </div>
                  )}
                  {mappingResult.company_data.founded_year && (
                    <div>
                      <strong>Fundada:</strong> {mappingResult.company_data.founded_year}
                    </div>
                  )}
                </div>
                
                {mappingResult.shareholder_data && mappingResult.shareholder_data.length > 0 && (
                  <div className="mt-4">
                    <strong>Accionistas:</strong>
                    <ul className="mt-2 space-y-1">
                      {mappingResult.shareholder_data.slice(0, 3).map((shareholder, idx) => (
                        <li key={idx} className="text-sm">
                          {shareholder.shareholder_name} 
                          {shareholder.ownership_pct && ` (${shareholder.ownership_pct}%)`}
                        </li>
                      ))}
                      {mappingResult.shareholder_data.length > 3 && (
                        <li className="text-sm text-muted-foreground">
                          ... y {mappingResult.shareholder_data.length - 3} más
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Save Profile Option */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guardar Perfil de Mapeo</CardTitle>
              <CardDescription>
                Guarda este mapeo para reutilizarlo en futuras importaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="save-profile"
                  checked={saveAsProfile}
                  onCheckedChange={(checked) => setSaveAsProfile(checked === true)}
                />
                <Label htmlFor="save-profile">
                  Guardar como perfil organizacional
                </Label>
              </div>
              
              {saveAsProfile && (
                <div>
                  <Label htmlFor="profile-name">Nombre del perfil</Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="ej. Empresas tecnológicas, Startups, etc."
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          
          <div className="flex gap-2">
            {!isValid() && (
              <div className="flex items-center gap-2 text-red-600 text-sm mr-4">
                <XCircle className="h-4 w-4" />
                Faltan campos requeridos
              </div>
            )}
            
            <Button 
              onClick={handleConfirm}
              disabled={!isValid()}
            >
              Aplicar Mapeo y Continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}