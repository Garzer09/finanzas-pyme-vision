import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, TrendingUp, Scale, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

type FileType = 'pyg' | 'balance' | 'cashflow';

interface TemplateSelectorProps {
  onSelect: (fileType: FileType) => void;
}

const templates = [
  {
    id: 'pyg' as FileType,
    title: 'Pérdidas y Ganancias',
    description: 'Estado de resultados y cuenta de PyG',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-700',
    columns: ['Concepto', 'Periodo', 'Año', 'Importe'],
    optional: ['Moneda', 'Notas'],
    example: 'Ingresos por ventas, 2024-01, 2024, 125000.50'
  },
  {
    id: 'balance' as FileType,
    title: 'Balance de Situación',
    description: 'Activos, pasivos y patrimonio neto',
    icon: Scale,
    color: 'bg-blue-100 text-blue-700',
    columns: ['Seccion', 'Concepto', 'Periodo', 'Año', 'Importe'],
    optional: ['Moneda', 'Notas'],
    example: 'Activo, Efectivo y equivalentes, 2024-01, 2024, 50000.00'
  },
  {
    id: 'cashflow' as FileType,
    title: 'Flujo de Efectivo',
    description: 'Estados de flujos de efectivo',
    icon: DollarSign,
    color: 'bg-purple-100 text-purple-700',
    columns: ['Concepto', 'Periodo', 'Año', 'Importe'],
    optional: ['Moneda', 'Notas'],
    example: 'Cobro de clientes, 2024-01, 2024, 98000.00'
  }
];

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const generateTemplate = (template: typeof templates[0]) => {
    const headers = [...template.columns, ...template.optional];
    
    let sampleRows: string[] = [];
    
    if (template.id === 'pyg') {
      sampleRows = [
        'Ingresos por ventas,2024-01,2024,125000.50,EUR,',
        'Coste de ventas,2024-01,2024,-75000.00,EUR,',
        'Gastos de personal,2024-01,2024,-25000.00,EUR,',
        'Amortizaciones,2024-01,2024,-5000.00,EUR,'
      ];
    } else if (template.id === 'balance') {
      sampleRows = [
        'Activo,Efectivo y equivalentes,2024-01,2024,50000.00,EUR,',
        'Activo,Clientes,2024-01,2024,25000.00,EUR,',
        'Pasivo,Proveedores,2024-01,2024,15000.00,EUR,',
        'Patrimonio Neto,Capital social,2024-01,2024,60000.00,EUR,'
      ];
    } else {
      sampleRows = [
        'Cobro de clientes,2024-01,2024,98000.00,EUR,',
        'Pago a proveedores,2024-01,2024,-70000.00,EUR,',
        'Pago de nóminas,2024-01,2024,-25000.00,EUR,',
        'Inversiones en inmovilizado,2024-01,2024,-10000.00,EUR,'
      ];
    }

    const csvContent = [headers.join(','), ...sampleRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `plantilla-${template.id}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Plantilla ${template.title} descargada`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Seleccionar Tipo de Plantilla
          </CardTitle>
          <CardDescription>
            Elige el tipo de datos financieros que vas a cargar. 
            Puedes descargar la plantilla correspondiente para asegurar el formato correcto.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((template) => {
          const Icon = template.icon;
          
          return (
            <Card key={template.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${template.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generateTemplate(template)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg">{template.title}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Columnas obligatorias:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.columns.map((col) => (
                      <Badge key={col} variant="default" className="text-xs">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Columnas opcionales:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.optional.map((col) => (
                      <Badge key={col} variant="secondary" className="text-xs">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-sm text-muted-foreground mb-2">Ejemplo:</div>
                  <code className="text-xs bg-muted p-2 rounded block">
                    {template.example}
                  </code>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateTemplate(template)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                  <Button
                    onClick={() => onSelect(template.id)}
                    className="flex-1"
                  >
                    Seleccionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h4 className="font-medium">Notas importantes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Formato de período:</strong> Use YYYY-MM (ej: 2024-01) o números de mes (ej: 1, 2, 3)</li>
              <li><strong>Decimales:</strong> Use punto (.) o coma (,) indistintamente para separar decimales</li>
              <li><strong>Secciones de Balance:</strong> "Activo", "Pasivo", "Patrimonio Neto" (acepta variantes como "pn")</li>
              <li><strong>Límites:</strong> Máximo 20MB y 200,000 filas por archivo</li>
              <li><strong>Formatos soportados:</strong> CSV y XLSX (se procesa como CSV internamente)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}