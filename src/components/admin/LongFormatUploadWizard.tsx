import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, CheckCircle, ArrowRight, Download, X, XCircle, Building, Users } from 'lucide-react';

// Types
interface CompanyInfo {
  name: string;
  currency: string;
  accounting_standard: string;
  sector: string;
}

interface FileData {
  name: string;
  content: any[];
  headers: string[];
  isValid: boolean;
  errors: string[];
  type?: 'financial' | 'qualitative';
  parsedData?: any;
}

interface QualitativeData {
  company: {
    company_name?: string;
    sector?: string;
    industry?: string;
    founded_year?: number;
    employees_range?: string;
    annual_revenue_range?: string;
    hq_city?: string;
    hq_country?: string;
    website?: string;
    business_description?: string;
    currency_code?: string;
    accounting_standard?: string;
    cif?: string;
  };
  shareholders: Array<{
    shareholder_name?: string;
    shareholder_type?: string;
    country?: string;
    ownership_pct?: number;
    notes?: string;
  }>;
}

interface LongFormatUploadWizardProps {
  companyId?: string | null;
  onComplete?: (data: any) => void;
  onCancel?: () => void;
}

export const LongFormatUploadWizard: React.FC<LongFormatUploadWizardProps> = ({
  companyId,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    currency: 'EUR',
    accounting_standard: 'PGC',
    sector: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownloadTemplate = (templateType: string) => {
    const templates = {
      'cuenta-pyg': '/templates/cuenta-pyg-long.csv',
      'balance-situacion': '/templates/balance-situacion-long.csv',
      'estado-flujos': '/templates/estado-flujos-long.csv',
      'empresa-cualitativa': '/templates/empresa_cualitativa.csv',
    };
    
    const templatePath = templates[templateType as keyof typeof templates];
    if (templatePath) {
      const link = document.createElement('a');
      link.href = templatePath;
      link.download = `${templateType}-template.csv`;
      link.click();
    }
  };

  const handleFileUploaded = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        
        // Detect file type
        const fileName = file.name.toLowerCase();
        const isQualitative = fileName.includes('cualitativa') || fileName.includes('qualitative');
        
        let fileData: FileData;
        
        if (isQualitative) {
          // Process qualitative file
          const qualitativeData = parseQualitativeFile(content);
          fileData = {
            name: file.name,
            content: [],
            headers: [],
            isValid: !!qualitativeData.company.company_name,
            errors: qualitativeData.company.company_name ? [] : ['No se encontró información de empresa válida'],
            type: 'qualitative',
            parsedData: qualitativeData
          };
        } else {
          // Process financial file
          const headers = lines[0]?.split(',').map(h => h.trim()) || [];
          
          // Validate required columns based on file type
          const requiredColumns = fileName.includes('pyg') 
            ? ['Concepto', 'Periodo', 'Año', 'Importe']
            : fileName.includes('balance')
            ? ['Concepto', 'Seccion', 'Periodo', 'Año', 'Importe'] 
            : ['Concepto', 'Categoria', 'Periodo', 'Año', 'Importe'];
          
          const errors: string[] = [];
          const missingColumns = requiredColumns.filter(col => 
            !headers.some(h => h.toLowerCase().includes(col.toLowerCase()))
          );
          
          if (missingColumns.length > 0) {
            errors.push(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
          }
          
          fileData = {
            name: file.name,
            content: lines.slice(1).map(line => line.split(',')),
            headers,
            isValid: errors.length === 0,
            errors,
            type: 'financial'
          };
        }
        
        setUploadedFiles(prev => [...prev, fileData]);
        toast.success(`Archivo ${file.name} cargado exitosamente`);
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error('Error al procesar el archivo');
      }
    };
    reader.readAsText(file);
  };

  const parseQualitativeFile = (content: string): QualitativeData => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentSection = '';
    let companyHeaders: string[] = [];
    let shareholderHeaders: string[] = [];
    const companyData: any = {};
    const shareholderData: any[] = [];
    
    for (const line of lines) {
      if (line.startsWith('# SECCION: EMPRESA')) {
        currentSection = 'empresa';
        continue;
      } else if (line.startsWith('# SECCION: ESTRUCTURA_ACCIONARIAL')) {
        currentSection = 'accionarial';
        continue;
      } else if (line.startsWith('#') || !line) {
        continue;
      }
      
      const fields = line.split(',').map(f => f.trim().replace(/^["']|["']$/g, ''));
      
      if (currentSection === 'empresa') {
        if (companyHeaders.length === 0) {
          companyHeaders = fields;
        } else if (fields.length === companyHeaders.length) {
          for (let i = 0; i < companyHeaders.length; i++) {
            if (fields[i]) {
              companyData[companyHeaders[i]] = fields[i];
            }
          }
        }
      } else if (currentSection === 'accionarial') {
        if (shareholderHeaders.length === 0) {
          shareholderHeaders = fields;
        } else if (fields.length === shareholderHeaders.length) {
          const shareholderRow: any = {};
          for (let i = 0; i < shareholderHeaders.length; i++) {
            if (fields[i]) {
              shareholderRow[shareholderHeaders[i]] = fields[i];
            }
          }
          if (shareholderRow.shareholder_name || shareholderRow.accionista) {
            shareholderData.push(shareholderRow);
          }
        }
      }
    }
    
    return {
      company: companyData,
      shareholders: shareholderData
    };
  };

  const handleFileRemoved = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const canProceedToStep2 = () => {
    return companyInfo.name && uploadedFiles.length > 0 && uploadedFiles.every(file => file.isValid);
  };

  const handleProcessData = async () => {
    if (!canProceedToStep2() || !companyInfo.name) return;
    
    setIsProcessing(true);
    
    try {
      // Create company if needed
      let currentCompanyId = companyId;
      
      if (!currentCompanyId) {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyInfo.name,
            sector: companyInfo.sector,
            currency_code: companyInfo.currency,
            accounting_standard: companyInfo.accounting_standard
          })
          .select()
          .single();
        
        if (companyError) throw companyError;
        currentCompanyId = newCompany.id;
      }
      
      // Process qualitative files first
      const qualitativeFiles = uploadedFiles.filter(f => f.type === 'qualitative');
      for (const qualitativeFile of qualitativeFiles) {
        const csvContent = createQualitativeCSV(qualitativeFile.parsedData);
        const formData = new FormData();
        formData.append('file', new Blob([csvContent], { type: 'text/csv' }), qualitativeFile.name);
        formData.append('targetUserId', currentCompanyId);
        
        const { error: qualError } = await supabase.functions.invoke('empresa-cualitativa-processor', {
          body: formData
        });
        
        if (qualError) {
          console.error('Error processing qualitative data:', qualError);
          toast.error(`Error al procesar datos cualitativos: ${qualError.message}`);
        }
      }
      
      // Process financial files
      const financialFiles = uploadedFiles.filter(f => f.type === 'financial');
      if (financialFiles.length > 0) {
        const filesToProcess = financialFiles.map(file => ({
          fileName: file.name,
          canonicalName: file.name,
          data: file.content.map(row => {
            const rowObj: any = {};
            file.headers.forEach((header, index) => {
              rowObj[header] = row[index] || '';
            });
            return rowObj;
          }),
          detectedYears: [2022, 2023, 2024] // Default years, should be detected from data
        }));
        
        // Call processing function
        const { data, error } = await supabase.functions.invoke('admin-pack-upload', {
          body: {
            companyId: currentCompanyId,
            company_name: companyInfo.name,
            currency_code: companyInfo.currency,
            accounting_standard: companyInfo.accounting_standard,
            files: filesToProcess,
            selectedYears: [],
            dryRun: false
          }
        });
        
        if (error) throw error;
      }
      
      toast.success('Datos procesados exitosamente');
      onComplete?.(currentCompanyId);
      
    } catch (error: any) {
      console.error('Error processing data:', error);
      toast.error(`Error al procesar datos: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const createQualitativeCSV = (data: QualitativeData): string => {
    let csv = '# SECCION: EMPRESA\n';
    const companyHeaders = Object.keys(data.company);
    csv += companyHeaders.join(',') + '\n';
    csv += companyHeaders.map(key => data.company[key as keyof typeof data.company] || '').join(',') + '\n\n';
    
    if (data.shareholders.length > 0) {
      csv += '# SECCION: ESTRUCTURA_ACCIONARIAL\n';
      const shareholderHeaders = Object.keys(data.shareholders[0]);
      csv += shareholderHeaders.join(',') + '\n';
      data.shareholders.forEach(shareholder => {
        csv += shareholderHeaders.map(key => shareholder[key as keyof typeof shareholder] || '').join(',') + '\n';
      });
    }
    
    return csv;
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
                <Select value={companyInfo.currency} onValueChange={(value) => setCompanyInfo(prev => ({ ...prev, currency: value }))}>
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
              <h3 className="text-lg font-semibold mb-4">Plantillas Disponibles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-md font-medium text-muted-foreground">Datos Financieros</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadTemplate('cuenta-pyg')}
                      className="flex items-center gap-2 h-auto p-3"
                    >
                      <Download className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Cuenta P&G</div>
                        <div className="text-sm text-muted-foreground">Formato largo</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadTemplate('balance-situacion')}
                      className="flex items-center gap-2 h-auto p-3"
                    >
                      <Download className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Balance Situación</div>
                        <div className="text-sm text-muted-foreground">Formato largo</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadTemplate('estado-flujos')}
                      className="flex items-center gap-2 h-auto p-3"
                    >
                      <Download className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Estado Flujos</div>
                        <div className="text-sm text-muted-foreground">Formato largo</div>
                      </div>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-md font-medium text-muted-foreground">Datos Cualitativos</h4>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadTemplate('empresa-cualitativa')}
                    className="flex items-center gap-2 h-auto p-3 w-full"
                  >
                    <Download className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Empresa Cualitativa</div>
                      <div className="text-sm text-muted-foreground">Información y accionistas</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* File Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Subir Archivos</h3>
              <input
                type="file"
                multiple
                accept=".csv,.xlsx"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => handleFileUploaded(file));
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>

            {/* Uploaded Files Status */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Archivos Cargados</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {file.type === 'qualitative' 
                              ? `Datos cualitativos: ${file.parsedData?.company?.company_name || 'Sin empresa'}`
                              : `${file.headers.length} columnas, ${file.content.length} filas`
                            }
                          </div>
                          {file.type && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {file.type === 'qualitative' ? 'Cualitativo' : 'Financiero'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.isValid ? (
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Válido
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileRemoved(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
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
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Información de la Empresa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nombre</label>
                      <p className="text-sm text-muted-foreground">{companyInfo.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Sector</label>
                      <p className="text-sm text-muted-foreground">{companyInfo.sector}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Moneda</label>
                      <p className="text-sm text-muted-foreground">{companyInfo.currency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Norma Contable</label>
                      <p className="text-sm text-muted-foreground">{companyInfo.accounting_standard}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Archivos Cargados ({uploadedFiles.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {file.type === 'qualitative' ? 'Datos cualitativos' : 'Datos financieros'}
                          </div>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {file.type === 'qualitative' ? 'Cualitativo' : 'Financiero'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Preview sections */}
              <div className="space-y-6">
                {uploadedFiles.map((file, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{file.name} - Vista Previa</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {file.type === 'qualitative' ? (
                        <div className="space-y-4">
                          {/* Company Info Preview */}
                          {file.parsedData?.company && (
                            <div>
                              <h4 className="font-medium mb-2">Información de la Empresa</h4>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                  {Object.entries(file.parsedData.company).map(([key, value]) => (
                                    value && (
                                      <div key={key}>
                                        <span className="text-sm font-medium">{key}:</span>
                                        <span className="text-sm text-muted-foreground ml-2">{String(value)}</span>
                                      </div>
                                    )
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Shareholders Preview */}
                          {file.parsedData?.shareholders && file.parsedData.shareholders.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Estructura Accionarial ({file.parsedData.shareholders.length} accionistas)</h4>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="space-y-2">
                                  {file.parsedData.shareholders.slice(0, 5).map((shareholder: any, i: number) => (
                                    <div key={i} className="border-b border-gray-200 pb-2 last:border-b-0">
                                      <div className="font-medium">{shareholder.shareholder_name || shareholder.accionista}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {shareholder.ownership_pct || shareholder.participacion}% - {shareholder.shareholder_type || shareholder.tipo_accionista || 'N/A'}
                                      </div>
                                    </div>
                                  ))}
                                  {file.parsedData.shareholders.length > 5 && (
                                    <div className="text-sm text-muted-foreground">
                                      ... y {file.parsedData.shareholders.length - 5} más
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                {file.headers.map((header, i) => (
                                  <th key={i} className="border border-gray-200 px-4 py-2 text-left">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {file.content.slice(0, 10).map((row, i) => (
                                <tr key={i}>
                                  {row.map((cell, j) => (
                                    <td key={j} className="border border-gray-200 px-4 py-2">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {file.content.length > 10 && (
                            <div className="text-sm text-muted-foreground mt-2">
                              Mostrando 10 de {file.content.length} filas
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

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