import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UnifiedTemplatePreview } from './UnifiedTemplatePreview';
import { AlertTriangle, Upload, FileText, Database, Users, Building, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LongFormatUploadWizardProps {
  companyId?: string | null;
  onComplete: (processedCompanyId: string) => void;
  onCancel: () => void;
}

export const LongFormatUploadWizard: React.FC<LongFormatUploadWizardProps> = ({
  companyId,
  onComplete,
  onCancel
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const templateOptions = [
    {
      value: 'facts',
      label: 'Datos Financieros Unificados (Facts)',
      description: 'P&L, Balance, Cash Flow, Operacionales y Supuestos en una sola plantilla',
      icon: <Database className="h-5 w-5" />
    },
    {
      value: 'debt_loans',
      label: 'Préstamos y Deuda (Maestro)',
      description: 'Información detallada de préstamos y líneas de crédito',
      icon: <FileText className="h-5 w-5" />
    },
    {
      value: 'debt_balances',
      label: 'Saldos de Deuda por Periodo',
      description: 'Evolución temporal de los saldos de deuda',
      icon: <Database className="h-5 w-5" />
    },
    {
      value: 'company_profile_unified',
      label: 'Perfil de Empresa y Accionistas',
      description: 'Información cualitativa y estructura accionarial unificada',
      icon: <Building className="h-5 w-5" />
    }
  ];

  const downloadTemplate = async (templateType: string) => {
    try {
      const templateFiles = {
        facts: '/templates/facts.csv',
        debt_loans: '/templates/debt_loans.csv', 
        debt_balances: '/templates/debt_balances.csv',
        company_profile_unified: '/templates/company_profile_unified.csv'
      };

      const filePath = templateFiles[templateType as keyof typeof templateFiles];
      if (!filePath) {
        toast.error('Plantilla no encontrada');
        return;
      }

      const link = document.createElement('a');
      link.href = filePath;
      link.download = `${templateType}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Plantilla descargada');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Error al descargar la plantilla');
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    toast.success('Archivo seleccionado correctamente');
  };

  const handleProcessFile = async () => {
    if (!uploadedFile || !selectedTemplate) {
      toast.error('Selecciona una plantilla y carga un archivo');
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('templateType', selectedTemplate);
      formData.append('companyId', companyId || '');
      formData.append('dryRun', 'true');
      
      const { data, error } = await supabase.functions.invoke('unified-template-processor-v2', {
        body: formData
      });
      
      if (error) throw error;
      
      setProcessingResult(data);
      setShowPreview(true);
      
      if (data.success) {
        toast.success('Archivo procesado exitosamente');
      } else {
        toast.error('Error en la validación del archivo');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!uploadedFile || !selectedTemplate) return;

    setIsConfirming(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('templateType', selectedTemplate);
      formData.append('companyId', companyId || '');
      formData.append('dryRun', 'false');
      
      const { data, error } = await supabase.functions.invoke('unified-template-processor-v2', {
        body: formData
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Datos cargados exitosamente: ${data.inserted_count} registros`);
        onComplete(companyId || '');
      } else {
        toast.error('Error al cargar los datos');
      }
    } catch (error) {
      console.error('Error confirming upload:', error);
      toast.error('Error al confirmar la carga');
    } finally {
      setIsConfirming(false);
    }
  };

  const handlePreviewCancel = () => {
    setShowPreview(false);
    setProcessingResult(null);
    setUploadedFile(null);
  };

  if (showPreview && processingResult) {
    return (
      <UnifiedTemplatePreview
        processingResult={processingResult}
        onConfirm={handleConfirmUpload}
        onCancel={handlePreviewCancel}
        isProcessing={isConfirming}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Arquitectura de 4 Plantillas Unificadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Sistema de plantillas optimizado con validación automática, previsualización y verificación de balance.
            </AlertDescription>
          </Alert>

          {/* Template Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Seleccionar Plantilla</h3>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Elige el tipo de plantilla..." />
              </SelectTrigger>
              <SelectContent>
                {templateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      {option.icon}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Template Options */}
            {selectedTemplate && (
              <div className="space-y-3">
                {templateOptions.map((option) => (
                  selectedTemplate === option.value && (
                    <div key={option.value} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex items-center space-x-3">
                        {option.icon}
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTemplate(option.value)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subir Archivo</h3>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {uploadedFile && (
              <p className="text-sm text-muted-foreground">
                Archivo seleccionado: {uploadedFile.name}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleProcessFile}
              disabled={!selectedTemplate || !uploadedFile || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? 'Procesando...' : 'Procesar Archivo'}
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};