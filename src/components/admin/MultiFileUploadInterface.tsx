import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, Download, Archive, CheckCircle, AlertTriangle } from 'lucide-react';
import { useUnifiedTemplates } from '@/hooks/useUnifiedTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  file: File;
  templateType?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: any;
  error?: string;
}

interface MultiFileUploadInterfaceProps {
  companyId?: string | null;
  onComplete: (results: any[]) => void;
  onCancel: () => void;
}

export const MultiFileUploadInterface: React.FC<MultiFileUploadInterfaceProps> = ({
  companyId,
  onComplete,
  onCancel
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { processFile } = useUnifiedTemplates();

  const templateTypes = [
    { value: 'financial_series', label: 'Datos Financieros' },
    { value: 'company_profile', label: 'Perfil de Empresa' },
    { value: 'debt_loans', label: 'Préstamos' },
    { value: 'debt_balances', label: 'Saldos de Deuda' }
  ];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.name.endsWith('.csv') || file.name.endsWith('.xlsx')
    );

    const newFiles: UploadedFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      templateType: detectTemplateType(file.name)
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    if (files.length > 0) {
      toast.success(`${files.length} archivo(s) añadido(s) para procesamiento`);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => 
      file.name.endsWith('.csv') || file.name.endsWith('.xlsx')
    );

    const newFiles: UploadedFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      templateType: detectTemplateType(file.name)
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    if (files.length > 0) {
      toast.success(`${files.length} archivo(s) añadido(s) para procesamiento`);
    }
  }, []);

  const detectTemplateType = (fileName: string): string => {
    const name = fileName.toLowerCase();
    
    if (name.includes('financial') || name.includes('facts')) return 'financial_series';
    if (name.includes('company') || name.includes('profile')) return 'company_profile';
    if (name.includes('loan') && !name.includes('balance')) return 'debt_loans';
    if (name.includes('debt') && name.includes('balance')) return 'debt_balances';
    
    return 'financial_series'; // Default
  };

  const updateFileTemplateType = (fileId: string, templateType: string) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, templateType } : file
    ));
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const downloadAllTemplates = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('dynamic-template-generator-v3', {
        body: {
          company_id: companyId,
          external_id: 'COMPANY_ID',
          years: [2022, 2023, 2024],
          include_sample_data: true
        }
      });

      if (error) throw error;

      // Handle template bundle download
      const bundle = data;
      if (bundle.templates) {
        // Create and download individual CSV files from the bundle
        bundle.templates.forEach((template: any) => {
          const blob = new Blob([template.content], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = template.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        });

        toast.success(`${bundle.templates.length} plantillas descargadas exitosamente`);
      }
    } catch (error) {
      console.error('Error downloading templates:', error);
      toast.error('Error al descargar las plantillas');
    }
  };

  const processAllFiles = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('No hay archivos para procesar');
      return;
    }

    const filesWithoutTemplate = uploadedFiles.filter(f => !f.templateType);
    if (filesWithoutTemplate.length > 0) {
      toast.error('Todos los archivos deben tener un tipo de plantilla asignado');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    const results = [];
    const totalFiles = uploadedFiles.length;

    for (let i = 0; i < totalFiles; i++) {
      const uploadedFile = uploadedFiles[i];
      
      try {
        // Update file status
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { ...f, status: 'processing' } : f
        ));

        const result = await processFile({
          file: uploadedFile.file,
          company_id: companyId || undefined,
          template_type: uploadedFile.templateType,
          dry_run: true // Validation preview only
        });

        // Update file with result
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: result.success ? 'completed' : 'error', result, error: result.errors?.[0] }
            : f
        ));

        results.push({
          fileName: uploadedFile.file.name,
          templateType: uploadedFile.templateType,
          result
        });

      } catch (error) {
        console.error(`Error processing file ${uploadedFile.file.name}:`, error);
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Error desconocido' }
            : f
        ));

        results.push({
          fileName: uploadedFile.file.name,
          templateType: uploadedFile.templateType,
          result: { success: false, errors: [error instanceof Error ? error.message : 'Error desconocido'] }
        });
      }

      // Update progress
      setProcessingProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    setIsProcessing(false);
    
    const successfulFiles = results.filter(r => r.result.success);
    const failedFiles = results.filter(r => !r.result.success);

    if (successfulFiles.length > 0) {
      toast.success(`${successfulFiles.length} archivos procesados exitosamente`);
    }
    
    if (failedFiles.length > 0) {
      toast.error(`${failedFiles.length} archivos con errores`);
    }

    // Call completion handler with results
    onComplete(results);
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Download Templates Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Carga Múltiple de Archivos
            </div>
            <Button onClick={downloadAllTemplates} variant="outline" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Descargar Todas las Plantillas
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Sistema de carga múltiple con validación cruzada. Arrastra varios archivos o selecciónalos individualmente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Drag & Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-primary/50'
            }`}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Archivos CSV o Excel. Se detectará automáticamente el tipo de plantilla.
            </p>
            <input
              type="file"
              multiple
              accept=".csv,.xlsx"
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-input" className="cursor-pointer">
                Seleccionar Archivos
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archivos para Procesar ({uploadedFiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile) => (
                <div key={uploadedFile.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(uploadedFile.status)}
                    <div>
                      <p className="font-medium">{uploadedFile.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Template Type Selector */}
                    <select
                      value={uploadedFile.templateType || ''}
                      onChange={(e) => updateFileTemplateType(uploadedFile.id, e.target.value)}
                      disabled={uploadedFile.status === 'processing'}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="">Seleccionar tipo...</option>
                      {templateTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>

                    {/* Status Badge */}
                    <Badge variant={
                      uploadedFile.status === 'completed' ? 'secondary' :
                      uploadedFile.status === 'error' ? 'destructive' :
                      uploadedFile.status === 'processing' ? 'default' : 'outline'
                    }>
                      {uploadedFile.status === 'pending' && 'Pendiente'}
                      {uploadedFile.status === 'processing' && 'Procesando'}
                      {uploadedFile.status === 'completed' && 'Completado'}
                      {uploadedFile.status === 'error' && 'Error'}
                    </Badge>

                    {/* Remove Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(uploadedFile.id)}
                      disabled={uploadedFile.status === 'processing'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Processing Progress */}
            {isProcessing && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Procesando archivos...</span>
                  <span className="text-sm text-muted-foreground">{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancelar
        </Button>
        <Button 
          onClick={processAllFiles}
          disabled={uploadedFiles.length === 0 || isProcessing}
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Procesar Todos los Archivos
            </>
          )}
        </Button>
      </div>
    </div>
  );
};