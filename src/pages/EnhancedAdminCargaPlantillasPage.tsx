// Enhanced Admin Template Upload Page with new dynamic template system
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  Eye, 
  Building2, 
  Folder,
  Settings,
  FileText,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminTopNavigation } from '@/components/AdminTopNavigation';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Import new template components
import { TemplateManager } from '@/components/templates/TemplateManager';
import { EnhancedUpload } from '@/components/templates/EnhancedUpload';
import { ValidationSummary } from '@/components/templates/ValidationSummary';
import { TemplateCustomizer } from '@/components/templates/TemplateCustomizer';

// Import hooks
import { useTemplates, useCompanyTemplateCustomizations } from '@/hooks/useTemplates';
import { useFileValidation } from '@/hooks/useFileValidation';

// Import types
import type { 
  TemplateSchema, 
  CompanyTemplateCustomization,
  ValidationResults,
  ProcessFileResponse
} from '@/types/templates';

// Legacy interfaces for backward compatibility
interface Company {
  id: string;
  name: string;
  currency_code: string;
  accounting_standard: string;
}

interface CompanyInfo {
  companyId: string;
  company_name: string;
  currency_code: string;
  accounting_standard: string;
  meta: {
    sector?: string;
    industry?: string;
    employees?: string;
    founded_year?: string;
    headquarters?: string;
    website?: string;
    description?: string;
    from_template?: boolean;
  };
}

export const EnhancedAdminCargaPlantillasPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // State management
  const [useNewSystem, setUseNewSystem] = useState(true);
  const [currentStep, setCurrentStep] = useState<'qualitative' | 'financial' | 'templates'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSchema | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Legacy state for backward compatibility
  const [companies, setCompanies] = useState<Company[]>([]);

  // Hooks
  const { templates, getRequiredTemplates } = useTemplates();
  const { customizations, getCustomization } = useCompanyTemplateCustomizations(
    selectedCompany?.id || ''
  );

  useEffect(() => {
    loadCompanies();
    
    // Check if we should start with legacy mode based on URL params
    const forceLegacy = searchParams.get('legacy') === 'true';
    if (forceLegacy) {
      setUseNewSystem(false);
    }
  }, [searchParams]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, currency_code, accounting_standard')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: "Error",
        description: "Error al cargar empresas",
        variant: "destructive"
      });
    }
  };

  const handleTemplateSelect = (template: TemplateSchema) => {
    setSelectedTemplate(template);
    if (template.category === 'qualitative') {
      setCurrentStep('qualitative');
    } else {
      setCurrentStep('financial');
    }
  };

  const handleValidationUpdate = (results: ValidationResults) => {
    setValidationResults(results);
  };

  const handleUploadComplete = (response: ProcessFileResponse) => {
    setProcessingComplete(true);
    
    if (response.success) {
      toast({
        title: "Carga Completada",
        description: "Los datos se han procesado exitosamente",
        variant: "default"
      });
      
      // Navigate to dashboard if we have company info
      if (companyInfo && selectedTemplate) {
        const currentYear = new Date().getFullYear();
        navigate(`/admin/dashboard?companyId=${companyInfo.companyId}&period=${currentYear}`);
      }
    }
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setCompanyInfo({
      companyId: company.id,
      company_name: company.name,
      currency_code: company.currency_code,
      accounting_standard: company.accounting_standard,
      meta: { from_template: false }
    });
  };

  const renderTemplateSystemToggle = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              useNewSystem ? "bg-primary/10 text-primary" : "bg-muted"
            )}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Sistema de Plantillas Dinámicas</h3>
              <p className="text-sm text-muted-foreground">
                {useNewSystem 
                  ? "Usando el nuevo sistema con validaciones avanzadas y personalización" 
                  : "Usando el sistema heredado de plantillas estáticas"
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={useNewSystem}
              onCheckedChange={setUseNewSystem}
              id="new-system"
            />
            <label htmlFor="new-system" className="text-sm font-medium">
              Nuevo Sistema
            </label>
          </div>
        </div>
        
        {useNewSystem && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Sistema Mejorado:</strong> Plantillas dinámicas, validaciones configurables, 
              personalización por empresa y detección automática de formato.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderNewSystemInterface = () => (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="flex items-center gap-4 mb-6">
        <div className={cn(
          "flex items-center gap-2",
          currentStep === 'templates' ? "text-primary" : "text-muted-foreground"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            currentStep === 'templates' ? "bg-primary text-primary-foreground" : 
            selectedTemplate ? "bg-green-500 text-white" : "bg-muted"
          )}>
            {selectedTemplate ? <CheckCircle className="h-4 w-4" /> : "1"}
          </div>
          <span className="font-medium">Seleccionar Template</span>
        </div>
        
        <div className="flex-1 h-0.5 bg-border" />
        
        <div className={cn(
          "flex items-center gap-2",
          currentStep === 'qualitative' ? "text-primary" : "text-muted-foreground"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            currentStep === 'qualitative' ? "bg-primary text-primary-foreground" :
            companyInfo ? "bg-green-500 text-white" : "bg-muted"
          )}>
            {companyInfo ? <CheckCircle className="h-4 w-4" /> : "2"}
          </div>
          <span className="font-medium">Datos Empresa</span>
        </div>
        
        <div className="flex-1 h-0.5 bg-border" />
        
        <div className={cn(
          "flex items-center gap-2",
          currentStep === 'financial' ? "text-primary" : "text-muted-foreground"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            currentStep === 'financial' ? "bg-primary text-primary-foreground" :
            processingComplete ? "bg-green-500 text-white" : "bg-muted"
          )}>
            {processingComplete ? <CheckCircle className="h-4 w-4" /> : "3"}
          </div>
          <span className="font-medium">Carga Financiera</span>
        </div>
      </div>

      {/* Template Selection Step */}
      {currentStep === 'templates' && (
        <div className="space-y-6">
          <TemplateManager
            onTemplateSelect={handleTemplateSelect}
            showCustomizations={true}
            companyId={selectedCompany?.id}
          />
          
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Template Seleccionado</CardTitle>
                  {selectedCompany && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomizer(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Personalizar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{selectedTemplate.display_name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{selectedTemplate.category}</Badge>
                      {selectedTemplate.is_required && (
                        <Badge variant="destructive">Obligatorio</Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button onClick={() => setCurrentStep('qualitative')}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Company Selection Step */}
      {currentStep === 'qualitative' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Seleccionar Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map(company => (
                  <Card 
                    key={company.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg",
                      selectedCompany?.id === company.id ? "ring-2 ring-primary" : ""
                    )}
                    onClick={() => handleCompanySelect(company)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">{company.name}</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>Moneda: {company.currency_code}</div>
                          <div>Estándar: {company.accounting_standard}</div>
                        </div>
                        
                        {/* Show if there are customizations */}
                        {getCustomization(selectedTemplate?.id || '') && (
                          <Badge variant="secondary" className="text-xs">
                            Personalizado
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {selectedCompany && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setCurrentStep('templates')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>
                  <Button onClick={() => setCurrentStep('financial')} className="flex-1">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Continuar con carga financiera
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* File Upload Step */}
      {currentStep === 'financial' && selectedTemplate && companyInfo && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Carga de Datos</h2>
              <p className="text-muted-foreground">
                Empresa: {companyInfo.company_name} • Template: {selectedTemplate.display_name}
              </p>
            </div>
            <Button variant="outline" onClick={() => setCurrentStep('qualitative')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cambiar empresa
            </Button>
          </div>

          <EnhancedUpload
            templateSchema={selectedTemplate}
            companyId={companyInfo.companyId}
            onValidationUpdate={handleValidationUpdate}
            onUploadComplete={handleUploadComplete}
            allowTemplateSelection={false}
          />

          {validationResults && (
            <ValidationSummary
              validationResults={validationResults}
              showDetails={true}
            />
          )}
        </div>
      )}

      {/* Template Customizer Dialog */}
      {showCustomizer && selectedTemplate && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-6xl max-h-[90vh] overflow-y-auto w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Personalizar Template</h2>
                <Button variant="outline" onClick={() => setShowCustomizer(false)}>
                  Cerrar
                </Button>
              </div>
              
              <TemplateCustomizer
                templateSchema={selectedTemplate}
                companyId={selectedCompany.id}
                onSave={() => {
                  setShowCustomizer(false);
                  toast({
                    title: "Personalización guardada",
                    description: "Los cambios se han guardado correctamente"
                  });
                }}
                existingCustomization={getCustomization(selectedTemplate.id)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLegacySystemInterface = () => (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Modo Compatibilidad:</strong> Usando el sistema de plantillas heredado. 
          Activa el nuevo sistema para acceder a funcionalidades avanzadas.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-medium">Sistema Heredado</h3>
              <p className="text-sm text-muted-foreground">
                El sistema heredado sigue disponible para garantizar compatibilidad
              </p>
            </div>
            <Button onClick={() => navigate('/admin/carga-plantillas-legacy')}>
              Ir al sistema heredado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <RoleBasedAccess allowedRoles={['admin']}>
      <div className="min-h-screen bg-background">
        <AdminTopNavigation />
        <main className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Gestión de Plantillas</h1>
                <p className="text-muted-foreground">
                  Sistema avanzado de carga y validación de datos financieros
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/empresas')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Empresas
                </Button>
              </div>
            </div>

            {/* System Toggle */}
            {renderTemplateSystemToggle()}

            {/* Main Content */}
            {useNewSystem ? renderNewSystemInterface() : renderLegacySystemInterface()}
          </div>
        </main>
      </div>
    </RoleBasedAccess>
  );
};