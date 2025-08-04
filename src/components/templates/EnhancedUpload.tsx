// Enhanced Upload component with real-time validation and preview
import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Eye, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useFileValidation } from '@/hooks/useFileValidation';
import { useTemplates, useTemplateDetection } from '@/hooks/useTemplates';
import { ValidationSummary } from './ValidationSummary';
import type { 
  EnhancedUploadProps, 
  FilePreview, 
  TemplateSchema, 
  ValidationResults,
  TemplateMatch 
} from '@/types/templates';

export const EnhancedUpload: React.FC<EnhancedUploadProps> = ({
  templateSchema,
  companyId,
  onUploadComplete,
  onValidationUpdate,
  allowTemplateSelection = true
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSchema | undefined>(templateSchema);
  const [detectedTemplates, setDetectedTemplates] = useState<TemplateMatch[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [dryRun, setDryRun] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { analyzeFile, processFile, isAnalyzing, isProcessing, analysisError } = useFileValidation();
  const { templates } = useTemplates();
  const { detectTemplate, isDetecting } = useTemplateDetection();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setFilePreview(null);
    setValidationResults(null);
    setDetectedTemplates([]);
    
    // Analyze the file
    const preview = await analyzeFile(file);
    if (preview) {
      setFilePreview(preview);
      setSelectedYears(preview.detected_years || []);
      
      // Detect templates if not provided
      if (allowTemplateSelection && !selectedTemplate) {
        const matches = await detectTemplate(preview.headers, preview.sample_rows);
        setDetectedTemplates(matches);
        
        // Auto-select best match if confidence is high
        if (matches.length > 0 && matches[0].confidence > 0.8) {
          const bestMatch = templates.find(t => t.name === matches[0].template_name);
          if (bestMatch) {
            setSelectedTemplate(bestMatch);
          }
        }
      }
    }
  }, [analyzeFile, detectTemplate, templates, allowTemplateSelection, selectedTemplate]);

  const handleValidate = useCallback(async () => {
    if (!selectedFile || !selectedTemplate) return;
    
    const response = await processFile({
      file: selectedFile,
      template_name: selectedTemplate.name,
      company_id: companyId,
      selected_years: selectedYears,
      dry_run: dryRun
    });
    
    if (response && response.validation_results) {
      setValidationResults(response.validation_results);
      onValidationUpdate?.(response.validation_results);
      
      if (!dryRun && response.success) {
        onUploadComplete?.(response);
      }
    }
  }, [selectedFile, selectedTemplate, companyId, selectedYears, dryRun, processFile, onValidationUpdate, onUploadComplete]);

  const handleTemplateSelect = useCallback((templateName: string) => {
    const template = templates.find(t => t.name === templateName);
    setSelectedTemplate(template);
    setValidationResults(null);
  }, [templates]);

  const handleYearToggle = useCallback((year: number) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year].sort()
    );
  }, []);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    setValidationResults(null);
    setDetectedTemplates([]);
    setSelectedYears([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-8 w-8" />;
    return <FileText className="h-8 w-8 text-blue-600" />;
  };

  const getValidationStatusIcon = () => {
    if (!validationResults) return null;
    
    if (validationResults.errors.length > 0) {
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    } else if (validationResults.warnings.length > 0) {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carga de Archivo
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              dragActive ? "border-primary bg-primary/5" : "border-border hover:border-border/80",
              selectedFile ? "border-green-300 bg-green-50" : ""
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <div className="space-y-4">
              {getFileIcon()}
              
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-medium text-green-700">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium">Arrastra tu archivo CSV aquí</p>
                  <p className="text-sm text-muted-foreground">
                    o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos soportados: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analizando archivo...</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          )}

          {/* Analysis Error */}
          {analysisError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{analysisError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* File Preview and Configuration */}
      {filePreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Configuración y Vista Previa</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Datos
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Tabs defaultValue="template" className="space-y-4">
              <TabsList>
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="years">Años</TabsTrigger>
                <TabsTrigger value="options">Opciones</TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="space-y-4">
                {/* Template Selection */}
                {allowTemplateSelection && (
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select 
                      value={selectedTemplate?.name || ''} 
                      onValueChange={handleTemplateSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.name}>
                            <div className="flex items-center gap-2">
                              <span>{template.display_name}</span>
                              {template.is_required && (
                                <Badge variant="destructive" className="text-xs">
                                  Obligatorio
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Detected Templates */}
                {detectedTemplates.length > 0 && (
                  <div className="space-y-2">
                    <Label>Templates Detectados</Label>
                    <div className="space-y-2">
                      {detectedTemplates.slice(0, 3).map((match, index) => (
                        <div 
                          key={index}
                          className={cn(
                            "p-3 border rounded-lg cursor-pointer transition-colors",
                            selectedTemplate?.name === match.template_name 
                              ? "border-primary bg-primary/5" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => handleTemplateSelect(match.template_name)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{match.template_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {match.matched_columns.length} columnas coinciden
                              </div>
                            </div>
                            <Badge 
                              variant={match.confidence > 0.8 ? "default" : "secondary"}
                              className="ml-2"
                            >
                              {(match.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          
                          {match.missing_columns.length > 0 && (
                            <div className="mt-2 text-xs text-yellow-600">
                              Faltan: {match.missing_columns.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Template Info */}
                {selectedTemplate && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="font-medium">{selectedTemplate.display_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedTemplate.description}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {selectedTemplate.schema_definition.columns.length} columnas
                          </Badge>
                          <Badge variant="outline">
                            {selectedTemplate.validation_rules.length} validaciones
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="years" className="space-y-4">
                {/* Year Selection */}
                {filePreview.detected_years && filePreview.detected_years.length > 0 && (
                  <div className="space-y-2">
                    <Label>Años Detectados</Label>
                    <div className="flex flex-wrap gap-2">
                      {filePreview.detected_years.map(year => (
                        <button
                          key={year}
                          onClick={() => handleYearToggle(year)}
                          className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                            selectedYears.includes(year)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selecciona los años que quieres procesar
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                {/* Processing Options */}
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="dry-run" 
                    checked={dryRun} 
                    onCheckedChange={setDryRun} 
                  />
                  <Label htmlFor="dry-run">
                    Solo validar (no cargar datos)
                  </Label>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleValidate}
                disabled={!selectedFile || !selectedTemplate || isProcessing || selectedYears.length === 0}
                className="flex-1"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  getValidationStatusIcon()
                )}
                {dryRun ? 'Validar Archivo' : 'Procesar y Cargar'}
              </Button>
              
              <Button variant="outline" onClick={clearFile} className="flex-1">
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validationResults && (
        <ValidationSummary 
          validationResults={validationResults}
          showDetails={true}
        />
      )}

      {/* File Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa del Archivo</DialogTitle>
          </DialogHeader>
          
          {filePreview && (
            <div className="space-y-4">
              {/* File Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>Filas:</strong> {filePreview.file_metadata.row_count}
                </div>
                <div>
                  <strong>Columnas:</strong> {filePreview.file_metadata.column_count}
                </div>
                <div>
                  <strong>Delimitador:</strong> "{filePreview.file_metadata.delimiter}"
                </div>
                <div>
                  <strong>Tamaño:</strong> {(filePreview.file_metadata.file_size / 1024).toFixed(1)} KB
                </div>
              </div>

              {/* Data Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {filePreview.headers.map((header, index) => (
                          <th key={index} className="text-left p-2 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filePreview.sample_rows.slice(0, 10).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="p-2">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {filePreview.sample_rows.length >= 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  Mostrando las primeras 10 filas de {filePreview.file_metadata.row_count} total
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};