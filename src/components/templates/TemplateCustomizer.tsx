// Template Customizer for company-specific template modifications
import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit, Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTemplates } from '@/hooks/useTemplates';
import type { 
  TemplateCustomizerProps, 
  TemplateColumn, 
  ValidationRule, 
  CompanyTemplateCustomization 
} from '@/types/templates';

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  templateSchema,
  companyId,
  onSave,
  existingCustomization
}) => {
  const [customDisplayName, setCustomDisplayName] = useState(
    existingCustomization?.custom_display_name || templateSchema.display_name
  );
  const [customColumns, setCustomColumns] = useState<TemplateColumn[]>(
    existingCustomization?.custom_schema?.columns || [...templateSchema.schema_definition.columns]
  );
  const [customValidations, setCustomValidations] = useState<ValidationRule[]>(
    existingCustomization?.custom_validations || []
  );
  const [notes, setNotes] = useState(existingCustomization?.notes || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showAddValidation, setShowAddValidation] = useState(false);

  const { saveCustomization } = useTemplates();

  useEffect(() => {
    setHasChanges(
      customDisplayName !== templateSchema.display_name ||
      JSON.stringify(customColumns) !== JSON.stringify(templateSchema.schema_definition.columns) ||
      customValidations.length > 0 ||
      notes !== ''
    );
  }, [customDisplayName, customColumns, customValidations, notes, templateSchema]);

  const handleSave = async () => {
    const customization: Omit<CompanyTemplateCustomization, 'id' | 'created_at' | 'updated_at'> = {
      company_id: companyId,
      template_schema_id: templateSchema.id,
      custom_display_name: customDisplayName !== templateSchema.display_name ? customDisplayName : undefined,
      custom_schema: JSON.stringify(customColumns) !== JSON.stringify(templateSchema.schema_definition.columns) 
        ? { columns: customColumns } 
        : undefined,
      custom_validations: customValidations.length > 0 ? customValidations : undefined,
      notes: notes || undefined,
      is_active: true,
      created_by: undefined // Will be set by the service
    };

    try {
      await saveCustomization(customization);
      onSave?.(customization as CompanyTemplateCustomization);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save customization:', error);
    }
  };

  const handleReset = () => {
    setCustomDisplayName(templateSchema.display_name);
    setCustomColumns([...templateSchema.schema_definition.columns]);
    setCustomValidations([]);
    setNotes('');
    setHasChanges(false);
  };

  const handleAddColumn = (column: TemplateColumn) => {
    setCustomColumns([...customColumns, column]);
    setShowAddColumn(false);
  };

  const handleUpdateColumn = (index: number, updatedColumn: TemplateColumn) => {
    const newColumns = [...customColumns];
    newColumns[index] = updatedColumn;
    setCustomColumns(newColumns);
  };

  const handleRemoveColumn = (index: number) => {
    const newColumns = customColumns.filter((_, i) => i !== index);
    setCustomColumns(newColumns);
  };

  const handleAddValidation = (validation: ValidationRule) => {
    setCustomValidations([...customValidations, validation]);
    setShowAddValidation(false);
  };

  const handleUpdateValidation = (index: number, updatedValidation: ValidationRule) => {
    const newValidations = [...customValidations];
    newValidations[index] = updatedValidation;
    setCustomValidations(newValidations);
  };

  const handleRemoveValidation = (index: number) => {
    const newValidations = customValidations.filter((_, i) => i !== index);
    setCustomValidations(newValidations);
  };

  const getColumnTypeOptions = () => [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Fecha' },
    { value: 'boolean', label: 'Booleano' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' }
  ];

  const getValidationTypeOptions = () => [
    { value: 'required_fields', label: 'Campos Obligatorios' },
    { value: 'format', label: 'Formato' },
    { value: 'range', label: 'Rango' },
    { value: 'calculation', label: 'Cálculo' },
    { value: 'custom', label: 'Personalizado' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Personalizar Template</h3>
          <p className="text-sm text-muted-foreground">
            Modifica el template "{templateSchema.display_name}" para tu empresa
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restablecer
          </Button>
          
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Personalización
          </Button>
        </div>
      </div>

      {/* Changes Indicator */}
      {hasChanges && (
        <Alert>
          <AlertDescription>
            Tienes cambios sin guardar en esta personalización.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Información Básica</TabsTrigger>
          <TabsTrigger value="columns">Columnas</TabsTrigger>
          <TabsTrigger value="validations">Validaciones</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Nombre Personalizado</Label>
                <Input
                  id="display-name"
                  value={customDisplayName}
                  onChange={(e) => setCustomDisplayName(e.target.value)}
                  placeholder={templateSchema.display_name}
                />
                <p className="text-xs text-muted-foreground">
                  Deja vacío para usar el nombre original: "{templateSchema.display_name}"
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas sobre esta personalización..."
                  rows={3}
                />
              </div>

              {/* Template Info */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Template Original</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Nombre:</strong> {templateSchema.name}</div>
                  <div><strong>Categoría:</strong> {templateSchema.category}</div>
                  <div><strong>Versión:</strong> {templateSchema.version}</div>
                  <div><strong>Columnas:</strong> {templateSchema.schema_definition.columns.length}</div>
                  <div><strong>Validaciones:</strong> {templateSchema.validation_rules.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="columns" className="space-y-4">
          {/* Column Customization */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Personalizar Columnas</CardTitle>
                <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Columna
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Nueva Columna</DialogTitle>
                    </DialogHeader>
                    <ColumnEditor onSave={handleAddColumn} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customColumns.map((column, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{column.name}</span>
                        <Badge variant="outline">{column.type}</Badge>
                        {column.required && (
                          <Badge variant="destructive" className="text-xs">Obligatorio</Badge>
                        )}
                      </div>
                      {column.description && (
                        <p className="text-sm text-muted-foreground">{column.description}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Columna</DialogTitle>
                          </DialogHeader>
                          <ColumnEditor 
                            column={column} 
                            onSave={(updatedColumn) => handleUpdateColumn(index, updatedColumn)} 
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRemoveColumn(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validations" className="space-y-4">
          {/* Validation Customization */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Validaciones Personalizadas</CardTitle>
                <Dialog open={showAddValidation} onOpenChange={setShowAddValidation}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Validación
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Nueva Validación</DialogTitle>
                    </DialogHeader>
                    <ValidationEditor onSave={handleAddValidation} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Original Validations */}
              {templateSchema.validation_rules.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Validaciones del Template Original</h4>
                  <div className="space-y-2">
                    {templateSchema.validation_rules.map((rule, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{rule.type}</Badge>
                          {rule.severity && (
                            <Badge variant={rule.severity === 'error' ? 'destructive' : 'secondary'}>
                              {rule.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{rule.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Validations */}
              <div>
                <h4 className="font-medium mb-3">Validaciones Personalizadas</h4>
                {customValidations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay validaciones personalizadas. Las validaciones del template original se aplicarán.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {customValidations.map((validation, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="default">{validation.type}</Badge>
                            {validation.severity && (
                              <Badge variant={validation.severity === 'error' ? 'destructive' : 'secondary'}>
                                {validation.severity}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{validation.message}</p>
                          {validation.description && (
                            <p className="text-xs text-muted-foreground">{validation.description}</p>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Validación</DialogTitle>
                              </DialogHeader>
                              <ValidationEditor 
                                validation={validation} 
                                onSave={(updatedValidation) => handleUpdateValidation(index, updatedValidation)} 
                              />
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleRemoveValidation(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa de la Personalización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Template Info */}
                <div>
                  <h4 className="font-medium mb-2">Información del Template</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Nombre Original:</strong> {templateSchema.display_name}</div>
                    <div><strong>Nombre Personalizado:</strong> {customDisplayName}</div>
                    <div><strong>Columnas Originales:</strong> {templateSchema.schema_definition.columns.length}</div>
                    <div><strong>Columnas Personalizadas:</strong> {customColumns.length}</div>
                    <div><strong>Validaciones Originales:</strong> {templateSchema.validation_rules.length}</div>
                    <div><strong>Validaciones Personalizadas:</strong> {customValidations.length}</div>
                  </div>
                </div>

                {/* Column Structure Preview */}
                <div>
                  <h4 className="font-medium mb-3">Estructura de Columnas</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">Columna</th>
                          <th className="text-left p-3">Tipo</th>
                          <th className="text-left p-3">Obligatorio</th>
                          <th className="text-left p-3">Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customColumns.map((column, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3 font-mono text-xs">{column.name}</td>
                            <td className="p-3">
                              <Badge variant="outline">{column.type}</Badge>
                            </td>
                            <td className="p-3">
                              {column.required ? (
                                <Badge variant="destructive" className="text-xs">Sí</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">No</Badge>
                              )}
                            </td>
                            <td className="p-3 text-muted-foreground">{column.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Column Editor Component
const ColumnEditor: React.FC<{
  column?: TemplateColumn;
  onSave: (column: TemplateColumn) => void;
}> = ({ column, onSave }) => {
  const [name, setName] = useState(column?.name || '');
  const [type, setType] = useState(column?.type || 'text');
  const [required, setRequired] = useState(column?.required || false);
  const [description, setDescription] = useState(column?.description || '');

  const handleSave = () => {
    onSave({
      name,
      type: type as TemplateColumn['type'],
      required,
      description: description || undefined
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="column-name">Nombre de la Columna</Label>
        <Input
          id="column-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la columna"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="column-type">Tipo</Label>
        <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Texto</SelectItem>
            <SelectItem value="number">Número</SelectItem>
            <SelectItem value="date">Fecha</SelectItem>
            <SelectItem value="boolean">Booleano</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="url">URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="column-required"
          checked={required}
          onCheckedChange={setRequired}
        />
        <Label htmlFor="column-required">Campo obligatorio</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="column-description">Descripción</Label>
        <Textarea
          id="column-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción de la columna (opcional)"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={handleSave} disabled={!name}>
          Guardar Columna
        </Button>
      </div>
    </div>
  );
};

// Validation Editor Component
const ValidationEditor: React.FC<{
  validation?: ValidationRule;
  onSave: (validation: ValidationRule) => void;
}> = ({ validation, onSave }) => {
  const [type, setType] = useState(validation?.type || 'required_fields');
  const [message, setMessage] = useState(validation?.message || '');
  const [severity, setSeverity] = useState(validation?.severity || 'error');
  const [description, setDescription] = useState(validation?.description || '');

  const handleSave = () => {
    onSave({
      type: type as ValidationRule['type'],
      message,
      severity: severity as ValidationRule['severity'],
      description: description || undefined
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="validation-type">Tipo de Validación</Label>
        <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="required_fields">Campos Obligatorios</SelectItem>
            <SelectItem value="format">Formato</SelectItem>
            <SelectItem value="range">Rango</SelectItem>
            <SelectItem value="calculation">Cálculo</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="validation-severity">Severidad</Label>
        <Select value={severity} onValueChange={(value) => setSeverity(value as typeof severity)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Advertencia</SelectItem>
            <SelectItem value="info">Información</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="validation-message">Mensaje</Label>
        <Input
          id="validation-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mensaje de la validación"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="validation-description">Descripción</Label>
        <Textarea
          id="validation-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción de la validación (opcional)"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={handleSave} disabled={!message}>
          Guardar Validación
        </Button>
      </div>
    </div>
  );
};