// Template Manager component for administering templates
import React, { useState } from 'react';
import { Download, Plus, Edit, Eye, Filter, Search, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTemplates, useTemplateGeneration } from '@/hooks/useTemplates';
import type { TemplateManagerProps, TemplateSchema } from '@/types/templates';

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onTemplateSelect,
  showCustomizations = false,
  companyId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSchema | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const { templates, loading, error, loadTemplates } = useTemplates();
  const { generateAndDownload, isGenerating } = useTemplateGeneration();

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group templates by category
  const templatesByCategory = filteredTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, TemplateSchema[]>);

  const handleTemplateSelect = (template: TemplateSchema) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  };

  const handleDownloadTemplate = async (template: TemplateSchema) => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];
    
    await generateAndDownload({
      template_name: template.name,
      company_id: companyId,
      years,
      format: 'csv'
    });
  };

  const handlePreviewTemplate = (template: TemplateSchema) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'bg-blue-100 text-blue-800';
      case 'operational': return 'bg-green-100 text-green-800';
      case 'qualitative': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'financial': return 'Financiero';
      case 'operational': return 'Operativo';
      case 'qualitative': return 'Cualitativo';
      default: return category;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Cargando plantillas...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-destructive">Error al cargar plantillas: {error}</div>
            <Button onClick={loadTemplates} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Plantillas</h2>
          <p className="text-muted-foreground">Administra y genera plantillas CSV dinámicas</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadTemplates}>
            <FileText className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="financial">Financiero</SelectItem>
            <SelectItem value="operational">Operativo</SelectItem>
            <SelectItem value="qualitative">Cualitativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Display */}
      {Object.keys(templatesByCategory).length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No se encontraron plantillas que coincidan con los filtros
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={Object.keys(templatesByCategory)[0]} className="space-y-4">
          <TabsList>
            {Object.keys(templatesByCategory).map(category => (
              <TabsTrigger key={category} value={category}>
                {getCategoryDisplayName(category)} ({templatesByCategory[category].length})
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTemplates.map(template => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base font-medium">
                            {template.display_name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(template.category)} variant="secondary">
                              {getCategoryDisplayName(template.category)}
                            </Badge>
                            {template.is_required && (
                              <Badge variant="destructive" className="text-xs">
                                Obligatorio
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {template.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Template Info */}
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Columnas: {template.schema_definition.columns.length}</div>
                          <div>Validaciones: {template.validation_rules.length}</div>
                          <div>Versión: {template.version}</div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewTemplate(template);
                            }}
                            className="flex-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadTemplate(template);
                            }}
                            disabled={isGenerating}
                            className="flex-1"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Descargar
                          </Button>

                          {showCustomizations && companyId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle customization - would open customization dialog
                              }}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.display_name} - Vista Previa
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6">
              {/* Template Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Nombre:</strong> {selectedTemplate.name}
                </div>
                <div>
                  <strong>Categoría:</strong> {getCategoryDisplayName(selectedTemplate.category)}
                </div>
                <div>
                  <strong>Versión:</strong> {selectedTemplate.version}
                </div>
                <div>
                  <strong>Estado:</strong> {selectedTemplate.is_active ? 'Activo' : 'Inactivo'}
                </div>
              </div>

              {selectedTemplate.description && (
                <div>
                  <strong>Descripción:</strong>
                  <p className="mt-1 text-muted-foreground">{selectedTemplate.description}</p>
                </div>
              )}

              {/* Schema Definition */}
              <div>
                <h4 className="font-medium mb-3">Columnas del Template</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">Nombre</th>
                        <th className="text-left p-3">Tipo</th>
                        <th className="text-left p-3">Obligatorio</th>
                        <th className="text-left p-3">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTemplate.schema_definition.columns.map((column, index) => (
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

              {/* Validation Rules */}
              {selectedTemplate.validation_rules.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Reglas de Validación</h4>
                  <div className="space-y-2">
                    {selectedTemplate.validation_rules.map((rule, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{rule.type}</Badge>
                          {rule.severity && (
                            <Badge 
                              variant={rule.severity === 'error' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {rule.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{rule.message}</p>
                        {rule.description && (
                          <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => handleDownloadTemplate(selectedTemplate)}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Template
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(false)}
                  className="flex-1"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};