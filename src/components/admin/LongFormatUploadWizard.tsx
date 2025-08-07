import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, CheckCircle, ArrowRight, Download, X, XCircle, Building, Users } from 'lucide-react';
import { useDataYearDetection } from '@/hooks/useDataYearDetection';
import { DataManagementPanel } from './DataManagementPanel';
import { ProcessingStatusPanel } from './ProcessingStatusPanel';
import { QualitativePreview } from '../QualitativePreview';
import { EditableQualitativePreview } from './EditableQualitativePreview';
import { EnhancedFileProcessor, ProcessedFileResult } from '@/services/enhancedFileProcessor';

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
  const [detectedYears, setDetectedYears] = useState<number[]>([]);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [editedQualitativeData, setEditedQualitativeData] = useState<QualitativeData | null>(null);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
  const { detectYearsFromFiles } = useDataYearDetection();
const fileProcessor = new EnhancedFileProcessor();

  // Confirmación UI state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [validationStats, setValidationStats] = useState<any | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [pendingCommit, setPendingCommit] = useState<{ companyId: string; filesToProcess: any[] } | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);

  // Update edited qualitative data
  const updateEditedQualitativeData = (field: string, value: any, section: 'company' | 'shareholders', index?: number) => {
    setModifiedFields(prev => new Set([...prev, field]));
    
    setEditedQualitativeData(prev => {
      if (!prev) return null;
      
      if (section === 'company') {
        return {
          ...prev,
          company: {
            ...prev.company,
            [field]: value
          }
        };
      } else if (section === 'shareholders' && typeof index === 'number') {
        const updatedShareholders = [...prev.shareholders];
        updatedShareholders[index] = {
          ...updatedShareholders[index],
          [field]: value
        };
        return {
          ...prev,
          shareholders: updatedShareholders
        };
      }
      
      return prev;
    });
  };

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

  const handleFileUploaded = async (file: File) => {
    try {
      console.log('Starting file upload:', file.name);
      
      // Enhanced file processing with detailed logging
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split('\n').filter(line => line.trim());
          
          console.log(`Processing file: ${file.name}, lines: ${lines.length}`);
          
          // Detect file type
          const fileName = file.name.toLowerCase();
          const isQualitative = fileName.includes('cualitativa') || fileName.includes('qualitative');
          
          let fileData: FileData;
          
          if (isQualitative) {
            console.log('Detected qualitative file, parsing...');
            // Process qualitative file with enhanced validation
            const qualitativeData = parseQualitativeFile(content);
            
            console.log('Qualitative data parsed:', {
              companyName: qualitativeData.company.company_name,
              shareholderCount: qualitativeData.shareholders.length
            });
            
            fileData = {
              name: file.name,
              content: [],
              headers: [],
              isValid: !!qualitativeData.company.company_name,
              errors: qualitativeData.company.company_name ? [] : ['No se encontró información de empresa válida en el archivo'],
              type: 'qualitative',
              parsedData: qualitativeData
            };

            // Additional validation for qualitative files
            if (!content.includes('# SECCION: EMPRESA')) {
              fileData.errors.push('Falta la sección "# SECCION: EMPRESA" en el archivo');
              fileData.isValid = false;
            }
            if (!content.includes('# SECCION: ESTRUCTURA_ACCIONARIAL')) {
              fileData.errors.push('Falta la sección "# SECCION: ESTRUCTURA_ACCIONARIAL" en el archivo');
            }
            
          } else {
            console.log('Processing standard financial file...');
            // Process other files
            const headers = lines[0]?.split(',').map(h => h.trim()) || [];
            const fileType = detectFileType(file.name, headers);
            const errors = validateFileStructure(fileType, headers);
            
            console.log(`File type detected: ${fileType}, headers: ${headers.length}, errors: ${errors.length}`);
            
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
          
          setUploadedFiles(prev => {
            const newFiles = [...prev, fileData];
            
            // Auto-detect years from uploaded files
            try {
              const yearDetection = detectYearsFromFiles(newFiles.map(f => ({
                name: f.name,
                content: f.content,
                headers: f.headers
              })));
              console.log('Year detection result:', yearDetection);
              setDetectedYears(yearDetection.detectedYears);
            } catch (yearError) {
              console.warn('Year detection failed:', yearError);
            }
            
            return newFiles;
          });
          
          const statusMessage = fileData.isValid 
            ? `Archivo ${file.name} cargado exitosamente${fileData.optionalTemplate ? ' (plantilla opcional)' : ''}`
            : `Archivo ${file.name} cargado con errores: ${fileData.errors.join(', ')}`;
            
          if (fileData.isValid) {
            toast.success(statusMessage);
          } else {
            toast.error(statusMessage);
          }
          
        } catch (parseError) {
          console.error('Error parsing file content:', parseError);
          toast.error(`Error al analizar el contenido del archivo ${file.name}: ${parseError}`);
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        toast.error(`Error al leer el archivo ${file.name}`);
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      console.error('Error in handleFileUploaded:', error);
      toast.error(`Error al procesar el archivo ${file.name}: ${error}`);
    }
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
    // Allow proceeding if we have company name and at least one uploaded file (even if invalid)
    return companyInfo.name && uploadedFiles.length > 0;
  };

  const handleProcessData = async () => {
    if (!companyInfo.name) return;
    
    // Check if we have at least one valid file
    const validFiles = uploadedFiles.filter(file => file.isValid);
    if (validFiles.length === 0) {
      toast.error("No hay archivos válidos para procesar");
      return;
    }
    
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
      
      // Process only valid qualitative files
      const qualitativeFiles = uploadedFiles.filter(f => f.type === 'qualitative' && f.isValid);
      for (const qualitativeFile of qualitativeFiles) {
        console.log('Processing qualitative file:', qualitativeFile.name);
        
        try {
          // Use edited data if available, otherwise use original parsed data
          const dataToProcess = editedQualitativeData || qualitativeFile.parsedData;
          const csvContent = createQualitativeCSV(dataToProcess);
          console.log('CSV content created, length:', csvContent.length);
          
          const formData = new FormData();
          formData.append('file', new Blob([csvContent], { type: 'text/csv' }), qualitativeFile.name);
          formData.append('targetUserId', currentCompanyId);
          
          console.log('Calling empresa-cualitativa-processor...');
          const { data: qualResult, error: qualError } = await supabase.functions.invoke('empresa-cualitativa-processor', {
            body: formData
          });
          
          if (qualError) {
            console.error('Edge function error:', qualError);
            toast.error(`Error al procesar datos cualitativos: ${qualError.message}`);
            continue;
          }
          
          if (!qualResult?.success) {
            console.error('Processing failed:', qualResult);
            toast.error(`Error al procesar ${qualitativeFile.name}: ${qualResult?.error || qualResult?.message || 'Error desconocido'}`);
            continue;
          }
          
          console.log('Qualitative file processed successfully:', qualResult);
          toast.success(`Datos cualitativos procesados exitosamente para ${qualitativeFile.name}`);
          
        } catch (qualProcessError) {
          console.error('Error in qualitative processing:', qualProcessError);
          toast.error(`Error inesperado al procesar ${qualitativeFile.name}: ${qualProcessError}`);
        }
      }
      
      // Process only valid financial files
      const financialFiles = uploadedFiles.filter(f => f.type && ['financial', 'pyg', 'balance', 'cashflow'].includes(f.type) && f.isValid);
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
        
        // Primera fase: validación en servidor (dry-run)
        const { data: dryData, error: dryError } = await supabase.functions.invoke('admin-pack-upload', {
          body: {
            companyId: currentCompanyId,
            company_name: companyInfo.name,
            currency_code: companyInfo.currency,
            accounting_standard: companyInfo.accounting_standard,
            files: filesToProcess,
            selectedYears: [],
            dryRun: true
          }
        });
        
        if (dryError) throw dryError;

        // Esperar a que el job de validación termine
        const jobId = dryData?.job_id;
        if (!jobId) {
          toast.error('No se pudo iniciar la validación (dry-run)');
        } else {
          let attempts = 0;
          let validationOk = false;
          let lastMessage = '';
          let lastStats: any = {};
          while (attempts < 30) { // ~60s
            const { data: job } = await supabase
              .from('processing_jobs')
              .select('status, stats_json')
              .eq('id', jobId)
              .single();
            
            const status = job?.status;
            const stats = (job?.stats_json as any) || {};
            lastStats = stats;
            lastMessage = stats?.message || '';
            if (status === 'DONE') { validationOk = true; break; }
            if (status === 'FAILED') { validationOk = false; break; }
            await new Promise(r => setTimeout(r, 2000));
            attempts++;
          }
          
          if (!validationOk) {
            toast.error(`Validación fallida: ${lastMessage || 'Revisa el histórico de cargas'}`);
            return;
          }
          
          // Abrir UI de confirmación con resumen de validación
          setValidationStats(lastStats);
          setValidationMessage(lastMessage || 'Validación correcta');
          setPendingCommit({ companyId: currentCompanyId as string, filesToProcess });
          setConfirmOpen(true);
          toast.success('Validación correcta. Revisa y confirma para iniciar la carga.');
        }
      }

      // La confirmación y procesos finales (plantillas opcionales, navegación, toasts)
      // se ejecutarán tras la confirmación del admin en handleCommitData().
      
    } catch (error: any) {
      console.error('Error processing data:', error);
      toast.error(`Error al procesar datos: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Commit confirmed data after successful validation
  const handleCommitData = async () => {
    if (!pendingCommit) return;
    try {
      setIsCommitting(true);
      const { error: commitError } = await supabase.functions.invoke('admin-pack-upload', {
        body: {
          companyId: pendingCommit.companyId,
          company_name: companyInfo.name,
          currency_code: companyInfo.currency,
          accounting_standard: companyInfo.accounting_standard,
          files: pendingCommit.filesToProcess,
          selectedYears: [],
          dryRun: false
        }
      });
      if (commitError) throw commitError;

      // Process only valid optional template files
      const optionalFiles = uploadedFiles.filter(f => f.optionalTemplate === true && f.isValid);
      for (const optionalFile of optionalFiles) {
        try {
          await processOptionalTemplate(pendingCommit.companyId, optionalFile);
        } catch (error: any) {
          console.error(`Error processing ${optionalFile.name}:`, error);
          toast.error(`Error al procesar ${optionalFile.name}: ${error.message}`);
        }
      }

      toast.success('Carga confirmada. Procesamiento iniciado.');
      setConfirmOpen(false);
      onComplete?.(pendingCommit.companyId);
    } catch (error: any) {
      console.error('Error en confirmación de carga:', error);
      toast.error(`Error al confirmar la carga: ${error.message}`);
    } finally {
      setIsCommitting(false);
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


            {/* Data Management */}
            {companyId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Gestión de Datos</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDataManagement(!showDataManagement)}
                  >
                    {showDataManagement ? 'Ocultar' : 'Ver'} Datos Existentes
                  </Button>
                </div>
                
                {showDataManagement && (
                  <div className="space-y-4">
                    <DataManagementPanel companyId={companyId} />
                    <ProcessingStatusPanel companyId={companyId} />
                  </div>
                )}
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
                      Estado de Archivos ({uploadedFiles.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{file.name}</div>
                            <Badge variant={file.isValid ? "secondary" : "destructive"} className="text-xs">
                              {file.isValid ? "✓ Válido" : "✗ Con errores"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {file.type === 'qualitative' ? 'Datos cualitativos' : 'Datos financieros'}
                          </div>
                          
                          {!file.isValid && file.errors && file.errors.length > 0 && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                              <p className="font-medium text-red-800 mb-1">Errores:</p>
                              <ul className="list-disc list-inside text-red-700">
                                {file.errors.map((error, errorIndex) => (
                                  <li key={errorIndex}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Processing Summary */}
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        {uploadedFiles.filter(file => file.isValid).length > 0 ? (
                          <div className="text-blue-800 text-sm">
                            <p className="font-medium">✓ {uploadedFiles.filter(file => file.isValid).length} archivo(s) listo(s) para procesar</p>
                            {uploadedFiles.filter(file => !file.isValid).length > 0 && (
                              <p className="mt-1">⚠ {uploadedFiles.filter(file => !file.isValid).length} archivo(s) será(n) omitido(s)</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-red-800 text-sm">
                            <p className="font-medium">✗ No hay archivos válidos para procesar</p>
                            <p className="mt-1">Revise los errores y vuelva al paso anterior para corregirlos</p>
                          </div>
                        )}
                      </div>
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
                        <EditableQualitativePreview 
                          data={editedQualitativeData || file.parsedData}
                          onChange={(updatedData) => setEditedQualitativeData(updatedData)}
                          modifiedFields={modifiedFields}
                        />
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
                disabled={isProcessing || uploadedFiles.filter(file => file.isValid).length === 0}
                className="flex items-center gap-2"
              >
                {isProcessing ? 'Validando...' : `Validar y confirmar (${uploadedFiles.filter(file => file.isValid).length})`}
                <CheckCircle className="h-4 w-4" />
              </Button>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar carga definitiva</AlertDialogTitle>
                  <AlertDialogDescription>
                    {validationMessage || 'Se validaron los archivos correctamente. Esta acción impactará los dashboards.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {validationStats && (
                  <div className="rounded-md border p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {'inserted_rows' in validationStats && (
                        <div><span className="font-medium">Insertados:</span> {validationStats.inserted_rows}</div>
                      )}
                      {'updated_rows' in validationStats && (
                        <div><span className="font-medium">Actualizados:</span> {validationStats.updated_rows}</div>
                      )}
                      {'warnings_count' in validationStats && (
                        <div><span className="font-medium">Avisos:</span> {validationStats.warnings_count}</div>
                      )}
                      {'errors_count' in validationStats && (
                        <div><span className="font-medium">Errores:</span> {validationStats.errors_count}</div>
                      )}
                    </div>
                    <pre className="mt-3 max-h-40 overflow-auto bg-muted/50 p-2 rounded">{JSON.stringify(validationStats, null, 2)}</pre>
                  </div>
                )}

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isCommitting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCommitData} disabled={isCommitting}>
                    {isCommitting ? 'Confirmando...' : 'Confirmar y cargar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};