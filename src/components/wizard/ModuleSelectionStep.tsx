import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ModuleSelectionStepProps {
  mode: 'new' | 'update';
  selectedModules: string[];
  onModeChange: (mode: 'new' | 'update') => void;
  onModulesChange: (modules: string[]) => void;
}

const MODULE_CATEGORIES = [
  {
    id: 'financial-statements',
    name: 'Estados Financieros',
    description: 'Análisis de la situación financiera actual',
    modules: [
      { id: 'balance-current', name: 'Balance Actual', required: true },
      { id: 'pyg-current', name: 'P&G Actual', required: true },
      { id: 'cash-flow', name: 'Cash Flow', required: false },
      { id: 'financial-ratios', name: 'Ratios Financieros', auto: true }
    ]
  },
  {
    id: 'debt-analysis',
    name: 'Análisis de Deuda',
    description: 'Gestión y análisis del endeudamiento',
    modules: [
      { id: 'debt-pool', name: 'Pool de Deuda', required: false },
      { id: 'debt-service', name: 'Servicio de Deuda', auto: true }
    ]
  },
  {
    id: 'projections',
    name: 'Proyecciones',
    description: 'Análisis prospectivo y planificación',
    modules: [
      { id: 'projections', name: 'P&G Proyectado', required: false },
      { id: 'balance-projected', name: 'Balance Proyectado', auto: true },
      { id: 'break-even', name: 'Break Even', auto: true }
    ]
  },
  {
    id: 'advanced',
    name: 'Análisis Avanzado',
    description: 'Valoración y análisis de sensibilidad',
    modules: [
      { id: 'valuation', name: 'Valoración EVA', required: false },
      { id: 'sensitivity', name: 'Análisis Sensibilidad', required: false },
      { id: 'nof-analysis', name: 'Análisis NOF', auto: true }
    ]
  }
];

export const ModuleSelectionStep: React.FC<ModuleSelectionStepProps> = ({
  mode,
  selectedModules,
  onModeChange,
  onModulesChange
}) => {
  const handleModuleToggle = (moduleId: string, isChecked: boolean) => {
    if (isChecked) {
      onModulesChange([...selectedModules, moduleId]);
    } else {
      onModulesChange(selectedModules.filter(id => id !== moduleId));
    }
  };

  const getRequiredFields = () => {
    const fields = ['Balance Sheet básico', 'Cuenta P&G básica'];
    
    if (selectedModules.some(id => ['debt-pool', 'debt-service'].includes(id))) {
      fields.push('Datos de deuda');
    }
    if (selectedModules.includes('cash-flow')) {
      fields.push('Información de cash flow');
    }
    if (selectedModules.some(id => ['projections', 'valuation'].includes(id))) {
      fields.push('Supuestos financieros');
    }
    
    return fields;
  };

  const getAutoCalculated = () => {
    const auto = ['28 ratios financieros', 'KPIs ejecutivos', 'Validaciones contables'];
    
    if (selectedModules.includes('debt-pool')) {
      auto.push('DSCR y métricas de deuda');
    }
    if (selectedModules.includes('projections')) {
      auto.push('Estados financieros pro-forma');
    }
    
    return auto;
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Operación</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={mode}
            onValueChange={(value: 'new' | 'update') => onModeChange(value)}
            className="flex gap-8"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="font-medium">
                Datos Nuevos
                <span className="block text-sm text-muted-foreground">
                  Crear registros financieros desde cero
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="update" id="update" />
              <Label htmlFor="update" className="font-medium">
                Actualizar Existentes
                <span className="block text-sm text-muted-foreground">
                  Modificar datos financieros actuales
                </span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Module Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selección de Módulos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Elija qué módulos del dashboard desea activar para esta empresa
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {MODULE_CATEGORIES.map(category => (
            <div key={category.id} className="space-y-3">
              <div>
                <h4 className="font-medium">{category.name}</h4>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 ml-4">
                {category.modules.map(module => (
                  <div key={module.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={module.id}
                      checked={selectedModules.includes(module.id) || module.required || module.auto}
                      onCheckedChange={(checked) => !module.required && !module.auto && handleModuleToggle(module.id, checked as boolean)}
                      disabled={module.required || module.auto}
                    />
                    <Label 
                      htmlFor={module.id} 
                      className="text-sm flex items-center gap-2"
                    >
                      {module.name}
                      {module.required && <Badge variant="secondary" className="text-xs">Obligatorio</Badge>}
                      {module.auto && <Badge variant="outline" className="text-xs">Auto</Badge>}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preview */}
      {selectedModules.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div>
                <strong>Campos requeridos:</strong> {getRequiredFields().join(', ')}
              </div>
              <div>
                <strong>Se calcularán automáticamente:</strong> {getAutoCalculated().join(', ')}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};