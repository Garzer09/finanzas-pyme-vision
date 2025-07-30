import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, User, Settings, CheckCircle, Upload, Search, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePerplexityCompanySearch } from '@/hooks/usePerplexityCompanySearch';
import { CompanyLogoUpload } from '@/components/CompanyLogoUpload';
import { ExcelUpload } from '@/components/ExcelUpload';

interface EnhancedUserCreationWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const INDUSTRY_SECTORS = [
  'Tecnología',
  'Manufactura',
  'Servicios',
  'Retail',
  'Construcción',
  'Agricultura',
  'Energía',
  'Telecomunicaciones',
  'Financiero',
  'Inmobiliario',
  'Turismo',
  'Transporte',
  'Educación',
  'Salud',
  'Otros'
];

export const EnhancedUserCreationWizard: React.FC<EnhancedUserCreationWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [perplexitySearched, setPerplexitySearched] = useState(false);
  const { toast } = useToast();
  const { searchCompany, isSearching, searchResult, dataFound } = usePerplexityCompanySearch();

  const [formData, setFormData] = useState({
    // Step 1: Datos básicos del usuario
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2: Información de la empresa
    companyName: '',
    industrySector: '',
    companySize: '',
    country: 'España',
    // Step 3: Configuraciones iniciales
    role: 'user' as 'admin' | 'user',
    defaultCurrency: 'EUR',
    defaultPhysicalUnit: '',
    enableAdvancedFeatures: false
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-search with Perplexity when company name changes
  useEffect(() => {
    if (formData.companyName && formData.companyName.length > 2 && !perplexitySearched) {
      const searchTimer = setTimeout(() => {
        searchCompany(formData.companyName);
        setPerplexitySearched(true);
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(searchTimer);
    }
  }, [formData.companyName, perplexitySearched]);

  // Auto-fill form when Perplexity returns data
  useEffect(() => {
    if (searchResult?.companyInfo && dataFound) {
      const info = searchResult.companyInfo;
      
      setFormData(prev => ({
        ...prev,
        industrySector: info.sector || prev.industrySector,
        // Update any other fields that match
      }));

      toast({
        title: "Información encontrada",
        description: `Se encontró información sobre ${info.name}. Los campos se han completado automáticamente.`,
      });
    }
  }, [searchResult, dataFound]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.email && formData.password && formData.confirmPassword && 
                 formData.password === formData.confirmPassword && 
                 formData.password.length >= 6);
      case 2:
        return !!(formData.companyName && formData.industrySector);
      case 3:
      case 4:
      case 5:
        return true; // Optional steps
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast({
        title: "Información incompleta",
        description: "Por favor, completa todos los campos requeridos.",
        variant: "destructive"
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return;

    setIsLoading(true);
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            company_name: formData.companyName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        setCreatedUserId(authData.user.id);

        // Update user role if not default 'user'
        if (formData.role === 'admin') {
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: 'admin' })
            .eq('user_id', authData.user.id);

          if (roleError) throw roleError;
        }

        // Create client configuration
        const { error: configError } = await supabase
          .from('client_configurations')
          .insert({
            user_id: authData.user.id,
            client_name: formData.companyName,
            industry_sector: formData.industrySector,
            default_units: formData.defaultCurrency.toLowerCase(),
            default_physical_unit: formData.defaultPhysicalUnit || null,
            field_mappings: {},
            validation_rules: {
              company_size: formData.companySize,
              country: formData.country,
              advanced_features: formData.enableAdvancedFeatures
            }
          });

        if (configError) throw configError;

        // Save company description from Perplexity if available
        if (searchResult?.companyInfo && dataFound) {
          const info = searchResult.companyInfo;
          
          const { error: companyError } = await supabase
            .from('company_descriptions')
            .insert({
              user_id: authData.user.id,
              company_name: formData.companyName,
              description: info.description,
              sector: info.sector,
              industry: info.industry,
              founded_year: info.foundedYear,
              employees: info.employees,
              revenue: info.revenue,
              headquarters: info.headquarters,
              website: info.website,
              products: info.products || [],
              competitors: info.competitors || [],
              key_facts: info.keyFacts || [],
              market_position: info.marketPosition,
              business_model: info.businessModel,
              raw_search_result: searchResult.rawSearchResult,
              search_query: searchResult.searchQuery,
              data_source: 'perplexity'
            });

          if (companyError) {
            console.warn('Could not save company description:', companyError);
            // Don't throw - this is optional data
          }
        }

        toast({
          title: "Usuario creado exitosamente",
          description: `Se ha creado el usuario para ${formData.companyName}`,
        });

        // Move to step 4 for logo upload
        setCurrentStep(4);
      }
    } catch (error: any) {
      toast({
        title: "Error al crear usuario",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploadComplete = () => {
    setCurrentStep(5); // Move to final confirmation
  };

  const handleFinalComplete = () => {
    onComplete?.();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email corporativo *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="usuario@empresa.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                placeholder="Repite la contraseña"
                required
              />
              {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                <p className="text-sm text-destructive mt-1">Las contraseñas no coinciden</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Nombre de la empresa *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => {
                  updateFormData('companyName', e.target.value);
                  setPerplexitySearched(false); // Reset search flag when name changes
                }}
                placeholder="Empresa S.L."
                required
              />
              {isSearching && (
                <Alert className="mt-2">
                  <Search className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Buscando información de la empresa con IA...
                  </AlertDescription>
                </Alert>
              )}
              {searchResult && dataFound && (
                <Alert className="mt-2">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ¡Información encontrada! Se han completado algunos campos automáticamente.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div>
              <Label htmlFor="industrySector">Sector de actividad *</Label>
              <Select value={formData.industrySector} onValueChange={(value) => updateFormData('industrySector', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un sector" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="companySize">Tamaño de empresa</Label>
              <Select value={formData.companySize} onValueChange={(value) => updateFormData('companySize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tamaño" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="micro">Microempresa (1-10 empleados)</SelectItem>
                  <SelectItem value="small">Pequeña (11-50 empleados)</SelectItem>
                  <SelectItem value="medium">Mediana (51-250 empleados)</SelectItem>
                  <SelectItem value="large">Grande (+250 empleados)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Rol del usuario</Label>
              <Select value={formData.role} onValueChange={(value) => updateFormData('role', value as 'admin' | 'user')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario estándar</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="defaultCurrency">Moneda por defecto</Label>
              <Select value={formData.defaultCurrency} onValueChange={(value) => updateFormData('defaultCurrency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="USD">Dólar US ($)</SelectItem>
                  <SelectItem value="GBP">Libra (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="defaultPhysicalUnit">Unidad física principal (opcional)</Label>
              <Input
                id="defaultPhysicalUnit"
                value={formData.defaultPhysicalUnit}
                onChange={(e) => updateFormData('defaultPhysicalUnit', e.target.value)}
                placeholder="kg, litros, piezas..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Subir logo de la empresa</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sube el logo de {formData.companyName} para personalizar la interfaz.
              </p>
              <CompanyLogoUpload 
                targetUserId={createdUserId || undefined}
                onLogoUploaded={() => {}}
                showContinueButton={true}
                onContinue={handleNext}
              />
            </div>
            <div className="text-center pt-4">
              <Button variant="outline" onClick={handleNext}>
                Continuar sin logo
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Subir archivos financieros iniciales</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sube los archivos Excel o PDF con los datos financieros de {formData.companyName}.
                Claude analizará automáticamente los datos y generará todos los módulos del dashboard.
              </p>
              <ExcelUpload 
                targetUserId={createdUserId || undefined}
                onUploadComplete={(fileId, processedData) => {
                  toast({
                    title: "Análisis completado",
                    description: "Claude ha procesado los datos financieros correctamente",
                  });
                  setCurrentStep(6); // Move to confirmation
                }}
              />
            </div>
            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(6)}>
                Finalizar sin archivos
              </Button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="bg-muted/50 p-6 rounded-lg text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-3">¡Usuario configurado exitosamente!</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Empresa:</strong> {formData.companyName}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Sector:</strong> {formData.industrySector}</p>
                <p><strong>Rol:</strong> {formData.role === 'admin' ? 'Administrador' : 'Usuario estándar'}</p>
              </div>
            </div>
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                El usuario ya puede acceder al sistema con las credenciales proporcionadas.
              </p>
              <Button onClick={handleFinalComplete} className="w-full">
                Completar
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: "Usuario", icon: User },
      { number: 2, title: "Empresa", icon: Building2 },
      { number: 3, title: "Configuración", icon: Settings },
      { number: 4, title: "Logo", icon: Upload },
      { number: 5, title: "Archivos", icon: Upload },
      { number: 6, title: "Finalizado", icon: CheckCircle }
    ];

    return (
      <div className="flex items-center justify-between mb-8 overflow-x-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex items-center flex-shrink-0">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground text-muted-foreground'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="ml-2 hidden sm:block">
                <p className="text-xs font-medium">{step.title}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Configuración Completa de Usuario</CardTitle>
        <CardDescription>
          Crea un nuevo usuario con configuración completa de logo y archivos financieros
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStepIndicator()}
        
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {currentStep <= 3 && (
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onCancel : handlePrevious}
              disabled={isLoading}
            >
              {currentStep === 1 ? 'Cancelar' : 'Anterior'}
            </Button>
            
            {currentStep < 3 ? (
              <Button onClick={handleNext} disabled={!validateStep(currentStep) || isLoading}>
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear Usuario'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};