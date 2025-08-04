import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Upload, CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemplateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldCount: number;
  requiredFields: string[];
  optionalFields: string[];
}

interface FinancialTemplate {
  id: string;
  name: string;
  description: string;
  type: 'balance' | 'pyg' | 'cash_flow' | 'ratios' | 'generic';
  version: string;
  lastUpdated: Date;
  fields: {
    required: string[];
    optional: string[];
    calculated: string[];
  };
  validation: TemplateValidation;
  downloadUrl?: string;
  isActive: boolean;
}

const PREDEFINED_TEMPLATES: FinancialTemplate[] = [
  {
    id: 'balance-sheet-template',
    name: 'Balance de Situación',
    description: 'Plantilla optimizada para estados de balance con validación automática',
    type: 'balance',
    version: '2.1',
    lastUpdated: new Date('2024-01-15'),
    fields: {
      required: [
        'Activo no corriente',
        'Activo corriente', 
        'Patrimonio neto',
        'Pasivo no corriente',
        'Pasivo corriente'
      ],
      optional: [
        'Inmovilizado material',
        'Existencias',
        'Deudores comerciales',
        'Efectivo'
      ],
      calculated: [
        'Total Activo',
        'Total Pasivo y Patrimonio',
        'Ratio de liquidez'
      ]
    },
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
      fieldCount: 13,
      requiredFields: ['Activo no corriente', 'Activo corriente', 'Patrimonio neto'],
      optionalFields: ['Inmovilizado material', 'Existencias']
    },
    isActive: true
  },
  {
    id: 'pyg-template', 
    name: 'Cuenta de Pérdidas y Ganancias',
    description: 'Plantilla para P&G con análisis de rentabilidad automático',
    type: 'pyg',
    version: '2.0',
    lastUpdated: new Date('2024-01-10'),
    fields: {
      required: [
        'Ingresos de explotación',
        'Gastos de explotación',
        'Resultado de explotación'
      ],
      optional: [
        'Aprovisionamientos',
        'Gastos de personal',
        'Amortizaciones'
      ],
      calculated: [
        'EBITDA',
        'Margen bruto',
        'Margen neto'
      ]
    },
    validation: {
      isValid: true,
      errors: [],
      warnings: ['Campo "Gastos financieros" recomendado'],
      fieldCount: 11,
      requiredFields: ['Ingresos de explotación', 'Gastos de explotación'],
      optionalFields: ['Aprovisionamientos', 'Gastos de personal']
    },
    isActive: true
  },
  {
    id: 'cash-flow-template',
    name: 'Estado de Flujos de Efectivo',
    description: 'Plantilla para análisis de flujos con proyecciones automáticas',
    type: 'cash_flow',
    version: '1.8',
    lastUpdated: new Date('2024-01-08'),
    fields: {
      required: [
        'Flujos de explotación',
        'Flujos de inversión',
        'Flujos de financiación'
      ],
      optional: [
        'Variación del circulante',
        'Dividendos pagados'
      ],
      calculated: [
        'Flujo neto total',
        'Variación de efectivo'
      ]
    },
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
      fieldCount: 8,
      requiredFields: ['Flujos de explotación', 'Flujos de inversión'],
      optionalFields: ['Variación del circulante']
    },
    isActive: true
  }
];

interface TemplateManagerProps {
  onTemplateSelect?: (template: FinancialTemplate) => void;
  selectedTemplateId?: string;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onTemplateSelect,
  selectedTemplateId
}) => {
  const [templates, setTemplates] = useState<FinancialTemplate[]>(PREDEFINED_TEMPLATES);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const getTypeColor = (type: FinancialTemplate['type']) => {
    switch (type) {
      case 'balance': return 'bg-blue-100 text-blue-700';
      case 'pyg': return 'bg-green-100 text-green-700';
      case 'cash_flow': return 'bg-purple-100 text-purple-700';
      case 'ratios': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getValidationIcon = (validation: TemplateValidation) => {
    if (validation.errors.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (validation.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const handleTemplateSelect = (template: FinancialTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
    
    toast({
      title: "Plantilla seleccionada",
      description: `Usando plantilla: ${template.name}`,
    });
  };

  const handleDownloadTemplate = async (template: FinancialTemplate) => {
    try {
      // Simulate template download
      const templateData = {
        name: template.name,
        version: template.version,
        fields: template.fields,
        instructions: `Plantilla ${template.name} - versión ${template.version}`,
        headers: [...template.fields.required, ...template.fields.optional]
      };

      const blob = new Blob([JSON.stringify(templateData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Plantilla descargada",
        description: `${template.name} descargada correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar la plantilla",
        variant: "destructive"
      });
    }
  };

  const handleCustomTemplateUpload = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Simulate template validation and upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTemplate: FinancialTemplate = {
        id: `custom-${Date.now()}`,
        name: file.name.replace('.json', ''),
        description: 'Plantilla personalizada subida por el usuario',
        type: 'generic',
        version: '1.0',
        lastUpdated: new Date(),
        fields: {
          required: ['Campo personalizado 1', 'Campo personalizado 2'],
          optional: ['Campo opcional 1'],
          calculated: []
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: ['Plantilla personalizada - revisar campos'],
          fieldCount: 3,
          requiredFields: ['Campo personalizado 1'],
          optionalFields: ['Campo opcional 1']
        },
        isActive: true
      };

      setTemplates(prev => [...prev, newTemplate]);
      
      toast({
        title: "Plantilla subida",
        description: `${newTemplate.name} agregada correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error al subir plantilla",
        description: "No se pudo procesar la plantilla personalizada",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Gestión de Plantillas
          </h3>
          <p className="text-sm text-slate-600">
            Selecciona o personaliza plantillas para optimizar el procesamiento
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="relative"
            disabled={isUploading}
          >
            <input
              type="file"
              accept=".json,.xlsx,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCustomTemplateUpload(file);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Subiendo...' : 'Subir personalizada'}
          </Button>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedTemplateId === template.id 
                ? 'ring-2 ring-steel-blue border-steel-blue' 
                : 'hover:border-steel-200'
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-steel-600" />
                  <Badge className={getTypeColor(template.type)}>
                    {template.type}
                  </Badge>
                </div>
                {getValidationIcon(template.validation)}
              </div>
              
              <CardTitle className="text-base">{template.name}</CardTitle>
              <p className="text-sm text-slate-600">{template.description}</p>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Version and Date */}
                <div className="flex justify-between text-xs text-slate-500">
                  <span>v{template.version}</span>
                  <span>{template.lastUpdated.toLocaleDateString()}</span>
                </div>

                {/* Field Counts */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-slate-700">
                      {template.fields.required.length}
                    </div>
                    <div className="text-slate-500">Requeridos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-700">
                      {template.fields.optional.length}
                    </div>
                    <div className="text-slate-500">Opcionales</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-slate-700">
                      {template.fields.calculated.length}
                    </div>
                    <div className="text-slate-500">Calculados</div>
                  </div>
                </div>

                {/* Validation Status */}
                {template.validation.warnings.length > 0 && (
                  <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                    {template.validation.warnings[0]}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadTemplate(template);
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Descargar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Template Info */}
      {selectedTemplateId && (
        <Card className="bg-steel-50 border-steel-200">
          <CardContent className="p-4">
            {(() => {
              const selected = templates.find(t => t.id === selectedTemplateId);
              if (!selected) return null;
              
              return (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-steel-700">
                      Plantilla activa: {selected.name}
                    </div>
                    <div className="text-sm text-steel-600">
                      Los archivos se procesarán usando esta plantilla automáticamente
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};