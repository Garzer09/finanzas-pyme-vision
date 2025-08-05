import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, CheckCircle, ArrowRight, Download } from 'lucide-react';
import { CSVFileUploader } from './CSVFileUploader';
import { DataPreviewTable } from './DataPreviewTable';

interface CompanyInfo {
  name: string;
  currency_code: string;
  accounting_standard: string;
  sector?: string;
}

interface FileData {
  fileName: string;
  content: any[][];
  headers: string[];
  isValid: boolean;
  errors: string[];
}

interface LongFormatUploadWizardProps {
  companyId?: string;
  onComplete?: (data: any) => void;
  onCancel?: () => void;
}

const TEMPLATE_DOWNLOADS = [
  { key: 'cuenta-pyg-long', name: 'Cuenta P&G (Formato Long)', fileName: 'cuenta-pyg-long.csv' },
  { key: 'balance-situacion-long', name: 'Balance de Situación (Formato Long)', fileName: 'balance-situacion-long.csv' },
  { key: 'estado-flujos-long', name: 'Estado de Flujos (Formato Long)', fileName: 'estado-flujos-long.csv' }
];

export const LongFormatUploadWizard: React.FC<LongFormatUploadWizardProps> = ({
  companyId,
  onComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Company Info + File Upload
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    currency_code: 'EUR',
    accounting_standard: 'PGC',
    sector: ''
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, FileData>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownloadTemplate = useCallback((template: typeof TEMPLATE_DOWNLOADS[0]) => {
    const link = document.createElement('a');
    link.href = `/templates/${template.fileName}`;
    link.download = template.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Plantilla descargada",
      description: `Plantilla ${template.name} descargada correctamente`
    });
  }, [toast]);

  const handleFileUploaded = useCallback((fileName: string, data: any, headers: string[]) => {
    // Validate long format structure
    const requiredColumns = ['Concepto', 'Periodo', 'Año', 'Importe'];
    const hasRequiredColumns = requiredColumns.every(col => 
      headers.some(header => header.toLowerCase().includes(col.toLowerCase()))
    );

    const errors: string[] = [];
    if (!hasRequiredColumns) {
      errors.push(`Faltan columnas requeridas: ${requiredColumns.join(', ')}`);
    }

    const fileData: FileData = {
      fileName,
      content: data,
      headers,
      isValid: errors.length === 0,
      errors
    };

    setUploadedFiles(prev => new Map(prev.set(fileName, fileData)));

    if (fileData.isValid) {
      toast({
        title: "Archivo validado",
        description: `${fileName} cargado correctamente con formato long`
      });
    } else {
      toast({
        title: "Error en archivo",
        description: `${fileName}: ${errors.join(', ')}`,
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleFileRemoved = useCallback((fileName: string) => {
    setUploadedFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileName);
      return newMap;
    });
  }, []);

  const canProceedToStep2 = () => {
    return companyInfo.name && 
           uploadedFiles.size > 0 && 
           Array.from(uploadedFiles.values()).every(file => file.isValid);
  };

  const handleProcessData = async () => {
    if (!canProceedToStep2()) return;

    setIsProcessing(true);
    try {
      // Create company if needed
      let finalCompanyId = companyId;
      if (!finalCompanyId) {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyInfo.name,
            currency_code: companyInfo.currency_code,
            accounting_standard: companyInfo.accounting_standard,
            sector: companyInfo.sector
          })
          .select()
          .single();

        if (companyError) throw companyError;
        finalCompanyId = newCompany.id;
      }

      // Process files with long-format specific logic
      const formData = new FormData();
      formData.append('companyId', finalCompanyId);
      formData.append('format', 'long');
      formData.append('currency_code', companyInfo.currency_code);
      formData.append('accounting_standard', companyInfo.accounting_standard);

      // Add files
      Array.from(uploadedFiles.entries()).forEach(([fileName, fileData]) => {
        const csvContent = [
          fileData.headers.join(','),
          ...fileData.content.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const file = new File([blob], fileName, { type: 'text/csv' });
        formData.append('files', file);
      });

      const { data, error } = await supabase.functions.invoke('admin-pack-upload', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Procesamiento completado",
        description: "Los datos han sido procesados correctamente"
      });

      onComplete?.(data);

    } catch (error: any) {
      console.error('Error processing data:', error);
      toast({
        title: "Error en procesamiento",
        description: error.message || "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Información de Empresa y Carga de Archivos
            </CardTitle>
            <CardDescription>
              Complete la información de la empresa y suba los archivos en formato long (tidy)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nombre de la empresa *</Label>
                <Input
                  id="company-name"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ingrese el nombre de la empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Input
                  id="sector"
                  value={companyInfo.sector}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, sector: e.target.value }))}
                  placeholder="Ej: Tecnología, Retail, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select value={companyInfo.currency_code} onValueChange={(value) => setCompanyInfo(prev => ({ ...prev, currency_code: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="USD">USD - Dólar</SelectItem>
                    <SelectItem value="GBP">GBP - Libra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accounting">Estándar Contable</Label>
                <Select value={companyInfo.accounting_standard} onValueChange={(value) => setCompanyInfo(prev => ({ ...prev, accounting_standard: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PGC">PGC - Plan General Contable</SelectItem>
                    <SelectItem value="IFRS">IFRS - Normas Internacionales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Template Downloads */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Plantillas en Formato Long</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TEMPLATE_DOWNLOADS.map((template) => (
                  <Card key={template.key} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">{template.name}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadTemplate(template)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* File Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Subir Archivos</h3>
              <div className="space-y-4">
                <input
                  type="file"
                  multiple
                  accept=".csv,.xlsx"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        const lines = content.split('\n');
                        const headers = lines[0].split(',');
                        const data = lines.slice(1).map(line => line.split(','));
                        handleFileUploaded(file.name, data, headers);
                      };
                      reader.readAsText(file);
                    });
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </div>

            {/* Uploaded Files Status */}
            {uploadedFiles.size > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Archivos Cargados</h4>
                <div className="space-y-2">
                  {Array.from(uploadedFiles.entries()).map(([fileName, fileData]) => (
                    <div key={fileName} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{fileName}</span>
                        {fileData.isValid ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Válido
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Errores</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {fileData.content.length} filas
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button 
                onClick={() => setCurrentStep(2)} 
                disabled={!canProceedToStep2()}
                className="flex items-center gap-2"
              >
                Continuar a Previsualización
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Previsualización y Confirmación
            </CardTitle>
            <CardDescription>
              Revise los datos antes del procesamiento final
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Información de la Empresa</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Nombre:</strong> {companyInfo.name}</div>
                <div><strong>Sector:</strong> {companyInfo.sector || 'No especificado'}</div>
                <div><strong>Moneda:</strong> {companyInfo.currency_code}</div>
                <div><strong>Estándar:</strong> {companyInfo.accounting_standard}</div>
              </div>
            </div>

            {/* Data Preview */}
            {Array.from(uploadedFiles.entries()).map(([fileName, fileData]) => (
              <div key={fileName}>
                <h3 className="font-medium mb-2">{fileName}</h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          {fileData.headers.map((header, i) => (
                            <th key={i} className="p-2 text-left border-r">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fileData.content.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-t">
                            {row.map((cell, j) => (
                              <td key={j} className="p-2 border-r">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Volver
              </Button>
              <Button 
                onClick={handleProcessData} 
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? 'Procesando...' : 'Procesar Datos'}
                <CheckCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};