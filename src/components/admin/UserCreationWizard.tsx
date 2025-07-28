import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User, Settings, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserCreationWizardProps {
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

export const UserCreationWizard: React.FC<UserCreationWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.email && formData.password && formData.confirmPassword && 
                 formData.password === formData.confirmPassword && 
                 formData.password.length >= 6);
      case 2:
        return !!(formData.companyName && formData.industrySector);
      case 3:
        return true; // Optional configurations
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
    if (!validateStep(currentStep)) return;

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

        toast({
          title: "Usuario creado exitosamente",
          description: `Se ha creado el usuario para ${formData.companyName}`,
        });

        onComplete?.();
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
                onChange={(e) => updateFormData('companyName', e.target.value)}
                placeholder="Empresa S.L."
                required
              />
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
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Resumen del usuario:</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Empresa:</strong> {formData.companyName}</p>
                <p><strong>Sector:</strong> {formData.industrySector}</p>
                <p><strong>Rol:</strong> {formData.role === 'admin' ? 'Administrador' : 'Usuario estándar'}</p>
                <p><strong>Moneda:</strong> {formData.defaultCurrency}</p>
                {formData.defaultPhysicalUnit && (
                  <p><strong>Unidad física:</strong> {formData.defaultPhysicalUnit}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Al crear el usuario, se enviará un email de confirmación a la dirección proporcionada.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: "Datos del Usuario", icon: User },
      { number: 2, title: "Información Empresa", icon: Building2 },
      { number: 3, title: "Configuración", icon: Settings },
      { number: 4, title: "Confirmación", icon: CheckCircle }
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground text-muted-foreground'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Crear Nuevo Usuario</CardTitle>
        <CardDescription>
          Completa la información para crear un nuevo usuario en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStepIndicator()}
        
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            disabled={isLoading}
          >
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </Button>
          
          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={!validateStep(currentStep) || isLoading}>
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear Usuario'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};