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
import { Upload, FileText, CheckCircle, ArrowRight, Download, X, XCircle, Building, Users, Edit3 } from 'lucide-react';
import { DataPreviewEditor } from './DataPreviewEditor';
import { realTemplateService, DataPreview, DataPreviewRow } from '@/services/realTemplateService';

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
  type?: 'financial' | 'qualitative' | 'pyg' | 'balance' | 'cashflow' | 'debt_pool' | 'debt_maturities' | 'operational' | 'financial_assumptions';
  parsedData?: any;
  optionalTemplate?: boolean;
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
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [isCompanyPreloaded, setIsCompanyPreloaded] = useState(false);
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(companyId);

  // Auto-load company data if companyId is provided
  React.useEffect(() => {
    const loadCompanyData = async () => {
      if (!companyId) return;

      setIsLoadingCompany(true);
      try {
        const { data: company, error } = await supabase
          .from('companies')
          .select('name, currency_code, accounting_standard, sector')
          .eq('id', companyId)
          .single();

        if (error) {
          console.error('Error loading company:', error);
          toast.error('Error cargando datos de la empresa');
          return;
        }

        if (company) {
          setCompanyInfo({
            name: company.name || '',
            currency: company.currency_code || 'EUR',
            accounting_standard: company.accounting_standard || 'PGC',
            sector: company.sector || ''
          });
          setIsCompanyPreloaded(true);
          toast.success(`Datos cargados para: ${company.name}`);
        }
      } catch (error) {
        console.error('Error loading company data:', error);
        toast.error('Error cargando datos de la empresa');
      } finally {
        setIsLoadingCompany(false);
      }
    };

    loadCompanyData();
  }, [companyId]);

  const handleDownloadAllTemplates = async () => {
    setLoading(true);
    try {
      const years = [2022, 2023, 2024];
      const templateTypes = ['pyg', 'balance', 'cashflow'];
      const allFiles: { filename: string; content: string }[] = [];

      // Generate long format templates dynamically
      for (const templateType of templateTypes) {
        const { data, error } = await supabase.functions.invoke('long-template-generator', {
          body: {
            templateType,
            years,
            companyId,
            periods: years.map(year => ({
              year,
              period: `${year}-12-31`,
              periodType: 'annual'
            }))
          }
        });

        if (!error && data) {
          allFiles.push({
            filename: data.filename,
            content: data.content
          });
        }
      }

      // Add qualitative template (static)
      try {
        const qualitativeResponse = await fetch('/templates/empresa_cualitativa.csv');
        if (qualitativeResponse.ok) {
          const qualitativeContent = await qualitativeResponse.text();
          allFiles.push({
            filename: 'empresa_cualitativa.csv',
            content: qualitativeContent
          });
        }
      } catch (error) {
        console.warn('Could not load qualitative template:', error);
      }

      // Add other available templates
      const otherTemplates = [
        'pool-deuda.csv',
        'pool-deuda-vencimientos.csv', 
        'datos-operativos.csv',
        'supuestos-financieros.csv'
      ];

      for (const template of otherTemplates) {
        try {
          const response = await fetch(`/templates/${template}`);
          if (response.ok) {
            const content = await response.text();
            allFiles.push({
              filename: template,
              content: content
            });
          }
        } catch (error) {
          console.warn(`Could not load template ${template}:`, error);
        }
      }

      // Create and download ZIP
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      allFiles.forEach(file => {
        zip.file(file.filename, file.content);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `plantillas-completas-${companyInfo.name || 'empresa'}-${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();

      toast.success(`Descargadas ${allFiles.length} plantillas en ZIP`);
    } catch (error) {
      console.error('Error downloading templates:', error);
      toast.error('Error al descargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const detectFileType = (fileName: string, headers: string[]) => {
    const lowerFileName = fileName.toLowerCase();
    
    // Qualitative files
    if (lowerFileName.includes('cualitativa') || lowerFileName.includes('qualitative')) {
      return 'qualitative';
    }
    
    // Financial statement files
    if (lowerFileName.includes('pyg') || lowerFileName.includes('cuenta')) {
      return 'pyg';
    }
    if (lowerFileName.includes('balance') || lowerFileName.includes('situacion')) {
      return 'balance';
    }
    if (lowerFileName.includes('cashflow') || lowerFileName.includes('flujos')) {
      return 'cashflow';
    }
    
    // Optional template files
    if (lowerFileName.includes('pool') && lowerFileName.includes('deuda') && !lowerFileName.includes('vencimiento')) {
      return 'debt_pool';
    }
    if (lowerFileName.includes('vencimiento') || (lowerFileName.includes('pool') && lowerFileName.includes('deuda'))) {
      return 'debt_maturities';
    }
    if (lowerFileName.includes('operativ') || lowerFileName.includes('datos')) {
      return 'operational';
    }
    if (lowerFileName.includes('supuesto') || lowerFileName.includes('financiero')) {
      return 'financial_assumptions';
    }
    
    // Fallback to content-based detection
    const headerText = headers.join(',').toLowerCase();
    if (headerText.includes('entidad') && headerText.includes('principal')) {
      return 'debt_pool';
    }
    if (headerText.includes('concepto') && headerText.includes('valor')) {
      return 'financial_assumptions';
    }
    if (headerText.includes('metrica') || headerText.includes('unidades')) {
      return 'operational';
    }
    
    return 'financial';
  };

  const validateFileStructure = (fileType: string, headers: string[]) => {
    const requiredColumns: Record<string, string[]> = {
      pyg: ['Concepto', 'Periodo', 'Año', 'Importe'],
      balance: ['Concepto', 'Seccion', 'Periodo', 'Año', 'Importe'],
      cashflow: ['Concepto', 'Categoria', 'Periodo', 'Año', 'Importe'],
      debt_pool: ['Entidad', 'Tipo_Financiacion', 'Principal_Inicial'],
      debt_maturities: ['Loan_Key', 'Year', 'Due_Principal'],
      operational: ['Metrica', 'Valor', 'Unidad'],
      financial_assumptions: ['Concepto', 'Valor', 'Unidad']
    };

    const required = requiredColumns[fileType] || [];
    const errors: string[] = [];
    
    const missingColumns = required.filter(col => 
      !headers.some(h => h.toLowerCase().includes(col.toLowerCase().replace('_', '')))
    );
    
    if (missingColumns.length > 0) {
      errors.push(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
    }
    
    return errors;
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
          // Process other files
          const headers = lines[0]?.split(',').map(h => h.trim()) || [];
          const fileType = detectFileType(file.name, headers);
          const errors = validateFileStructure(fileType, headers);
          
          fileData = {
            name: file.name,
            content: lines.slice(1).map(line => line.split(',')),
            headers,
            isValid: errors.length === 0,
            errors,
            type: fileType,
            optionalTemplate: ['debt_pool', 'debt_maturities', 'operational', 'financial_assumptions'].includes(fileType)
          };
        }
        
        setUploadedFiles(prev => [...prev, fileData]);
        toast.success(`Archivo ${file.name} cargado exitosamente${fileData.optionalTemplate ? ' (plantilla opcional)' : ''}`);
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

  const handlePreviewData = async () => {
    if (!canProceedToStep2()) return;
    
    setCurrentStep(2);
    setLoading(true);
    
    try {
      // Create company if needed
      let workingCompanyId = currentCompanyId;
      
      if (!workingCompanyId) {
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
        workingCompanyId = newCompany.id;
        setCurrentCompanyId(workingCompanyId);
      }

      // Generate preview for the first financial file
      const financialFile = uploadedFiles.find(f => f.type && ['financial', 'pyg', 'balance', 'cashflow'].includes(f.type));
      
      if (financialFile) {
        const fileData = financialFile.content.map(row => {
          const rowObj: any = {};
          financialFile.headers.forEach((header, index) => {
            rowObj[header] = row[index] || '';
          });
          return rowObj;
        });

        const preview = await realTemplateService.validateAndPreviewData(fileData, financialFile.name);
        setDataPreview(preview);
      }
      
    } catch (error: any) {
      console.error('Error preparing preview:', error);
      toast.error(`Error al preparar vista previa: ${error.message}`);
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreviewData = async (modifiedRows: DataPreviewRow[]) => {
    if (!currentCompanyId || !dataPreview) return;
    
    setIsProcessing(true);
    
    try {
      // Save the preview data
      await realTemplateService.saveValidatedData(currentCompanyId, dataPreview, modifiedRows);
      
      // Process remaining files (qualitative, optional templates)
      await processRemainingFiles(currentCompanyId);
      
      toast.success('Datos procesados exitosamente');
      setCurrentStep(3);
      
    } catch (error: any) {
      console.error('Error saving data:', error);
      toast.error(`Error al guardar datos: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processRemainingFiles = async (workingCompanyId: string) => {
    // Process qualitative files
    const qualitativeFiles = uploadedFiles.filter(f => f.type === 'qualitative');
    for (const qualitativeFile of qualitativeFiles) {
      const csvContent = createQualitativeCSV(qualitativeFile.parsedData);
      const formData = new FormData();
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), qualitativeFile.name);
      formData.append('targetUserId', workingCompanyId);
      
      const { error: qualError } = await supabase.functions.invoke('empresa-cualitativa-processor', {
        body: formData
      });
      
      if (qualError) {
        console.error('Error processing qualitative data:', qualError);
        toast.error(`Error al procesar datos cualitativos: ${qualError.message}`);
      }
    }

    // Process optional template files
    const optionalFiles = uploadedFiles.filter(f => f.optionalTemplate === true);
    for (const optionalFile of optionalFiles) {
      try {
        await processOptionalTemplate(workingCompanyId, optionalFile);
      } catch (error: any) {
        console.error(`Error processing ${optionalFile.name}:`, error);
        toast.error(`Error al procesar ${optionalFile.name}: ${error.message}`);
      }
    }
  };

  const handleFinalComplete = () => {
    if (isCompanyPreloaded && currentCompanyId) {
      // Navigate to company dashboard
      window.location.href = `/dashboard/company/${currentCompanyId}`;
    } else {
      // Call completion callback for new companies
      onComplete?.(currentCompanyId);
    }
  };

  const handleCancelPreview = () => {
    setDataPreview(null);
    setCurrentStep(1);
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
      
      // Process financial files (standard financial statements)
      const financialFiles = uploadedFiles.filter(f => f.type && ['financial', 'pyg', 'balance', 'cashflow'].includes(f.type));
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

      // Process optional template files
      const optionalFiles = uploadedFiles.filter(f => f.optionalTemplate === true);
      for (const optionalFile of optionalFiles) {
        try {
          await processOptionalTemplate(currentCompanyId, optionalFile);
        } catch (error: any) {
          console.error(`Error processing ${optionalFile.name}:`, error);
          toast.error(`Error al procesar ${optionalFile.name}: ${error.message}`);
        }
      }
      
      toast.success('Datos procesados exitosamente');
      
      // Smart navigation based on context
      if (isCompanyPreloaded && currentCompanyId) {
        // Navigate to company description if we came from an existing company
        window.location.href = `/descripcion-empresa?companyId=${currentCompanyId}`;
      } else {
        // Call completion callback for new companies
        onComplete?.(currentCompanyId);
      }
      
    } catch (error: any) {
      console.error('Error processing data:', error);
      toast.error(`Error al procesar datos: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processOptionalTemplate = async (companyId: string, file: FileData) => {
    const processedData = file.content.map(row => {
      const rowObj: any = {};
      file.headers.forEach((header, index) => {
        rowObj[header] = row[index] || '';
      });
      return rowObj;
    });

    switch (file.type) {
      case 'debt_pool':
        await processDebtPoolTemplate(companyId, processedData);
        break;
      case 'debt_maturities':
        await processDebtMaturitiesTemplate(companyId, processedData);
        break;
      case 'operational':
        await processOperationalTemplate(companyId, processedData);
        break;
      case 'financial_assumptions':
        await processFinancialAssumptionsTemplate(companyId, processedData);
        break;
      default:
        throw new Error(`Tipo de plantilla no reconocido: ${file.type}`);
    }
  };

  const processDebtPoolTemplate = async (companyId: string, data: any[]) => {
    const debtLoans = data.map(row => ({
      company_id: companyId,
      loan_key: `${row['Entidad'] || row['entidad']}_${Date.now()}`,
      entity_name: row['Entidad'] || row['entidad'],
      loan_type: row['Tipo_Financiacion'] || row['tipo_financiacion'],
      initial_amount: parseFloat(row['Principal_Inicial'] || row['principal_inicial']) || 0,
      interest_rate: parseFloat(row['Tipo_Interes'] || row['tipo_interes']) || 0,
      maturity_date: row['Vencimiento'] || row['vencimiento'] || '2030-12-31',
      guarantees: row['Garantias'] || row['garantias'],
      observations: row['Observaciones'] || row['observaciones'],
      currency_code: row['Moneda'] || row['moneda'] || 'EUR'
    }));

    const { error } = await supabase.from('debt_loans').insert(debtLoans);
    if (error) throw error;
  };

  const processDebtMaturitiesTemplate = async (companyId: string, data: any[]) => {
    const maturities = data.map(row => ({
      company_id: companyId,
      maturity_year: parseInt(row['Year'] || row['year']) || new Date().getFullYear(),
      principal_amount: parseFloat(row['Due_Principal'] || row['principal']) || 0,
      interest_amount: parseFloat(row['Due_Interest'] || row['interest']) || 0,
      total_amount: (parseFloat(row['Due_Principal'] || row['principal']) || 0) + 
                    (parseFloat(row['Due_Interest'] || row['interest']) || 0)
    }));

    const { error } = await supabase.from('debt_maturities').insert(maturities);
    if (error) throw error;
  };

  const processOperationalTemplate = async (companyId: string, data: any[]) => {
    const metrics = data.map(row => ({
      company_id: companyId,
      metric_name: row['Metrica'] || row['metrica'] || row['Concepto'],
      value: parseFloat(row['Valor'] || row['valor']) || 0,
      unit: row['Unidad'] || row['unidad'] || 'units',
      period_date: row['Fecha'] || row['fecha'] || new Date().toISOString().split('T')[0],
      period_year: parseInt(row['Año'] || row['year']) || new Date().getFullYear(),
      period_type: row['Periodo'] || row['periodo'] || 'annual',
      segment: row['Segmento'] || row['segmento']
    }));

    const { error } = await supabase.from('operational_metrics').insert(metrics);
    if (error) throw error;
  };

  const processFinancialAssumptionsTemplate = async (companyId: string, data: any[]) => {
    const assumptions = data.map(row => ({
      company_id: companyId,
      assumption_category: 'general',
      assumption_name: (row['Concepto'] || row['concepto'] || '').toLowerCase().replace(/\s+/g, '_'),
      assumption_value: parseFloat(row['Valor'] || row['valor']) || 0,
      unit: row['Unidad'] || row['unidad'] || 'percentage',
      period_year: parseInt(row['Aplica_desde'] || row['year']) || new Date().getFullYear(),
      period_type: 'annual',
      notes: row['Notas'] || row['notas']
    }));

    const { error } = await supabase.from('financial_assumptions_normalized').insert(assumptions);
    if (error) throw error;
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
                <div className="relative">
                  <Input
                    id="company-name"
                    value={companyInfo.name}
                    onChange={(e) => !isCompanyPreloaded && setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ingrese el nombre de la empresa"
                    disabled={isCompanyPreloaded || isLoadingCompany}
                    className={isCompanyPreloaded ? "bg-blue-50 border-blue-200" : ""}
                  />
                  {isCompanyPreloaded && (
                    <Badge variant="secondary" className="absolute right-2 top-2 bg-blue-100 text-blue-700">
                      Pre-cargado
                    </Badge>
                  )}
                </div>
                {isLoadingCompany && (
                  <p className="text-sm text-muted-foreground">Cargando datos de empresa...</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Input
                  id="sector"
                  value={companyInfo.sector}
                  onChange={(e) => !isCompanyPreloaded && setCompanyInfo(prev => ({ ...prev, sector: e.target.value }))}
                  placeholder="Ej: Tecnología, Retail, etc."
                  disabled={isCompanyPreloaded || isLoadingCompany}
                  className={isCompanyPreloaded ? "bg-blue-50 border-blue-200" : ""}
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

            {/* Unified Template Download */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Plantillas Disponibles</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Paquete Completo de Plantillas</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Incluye todas las plantillas disponibles: P&G, Balance, Flujos, Pool Deuda, Supuestos, Datos Operativos y Empresa Cualitativa
                      {isCompanyPreloaded && ` - Pre-configurado para ${companyInfo.name}`}
                    </p>
                  </div>
                  <Button
                    onClick={handleDownloadAllTemplates}
                    disabled={loading || isLoadingCompany}
                    className="ml-4 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {loading ? 'Generando...' : 'Descargar Todas'}
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
                onClick={handlePreviewData} 
                disabled={!canProceedToStep2() || loading}
                className="flex items-center gap-2"
              >
                {loading ? 'Preparando...' : 'Continuar a Previsualización'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 2) {
    if (dataPreview) {
      return (
        <div className="space-y-6">
          <DataPreviewEditor
            preview={dataPreview}
            onSave={handleSavePreviewData}
            onCancel={handleCancelPreview}
            isLoading={isProcessing}
          />
        </div>
      );
    }

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

  if (currentStep === 3) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Procesamiento Completado
            </CardTitle>
            <CardDescription>
              Los datos han sido procesados exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">¡Datos procesados exitosamente!</h3>
              <p className="text-muted-foreground mb-6">
                Los datos financieros han sido guardados en la base de datos y están listos para su análisis.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={handleFinalComplete} className="bg-steel-600 hover:bg-steel-700">
                  Ir al Dashboard
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Procesar Más Datos
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Resumen de Procesamiento</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-700">Empresa</div>
                  <div className="text-lg font-bold text-green-900">{companyInfo.name}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-700">Archivos Procesados</div>
                  <div className="text-lg font-bold text-blue-900">{uploadedFiles.length}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-purple-700">Estado</div>
                  <div className="text-lg font-bold text-purple-900">Completado</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};