import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserCreationWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const UserCreationWizard: React.FC<UserCreationWizardProps> = ({ onComplete, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    return !!(formData.email && formData.password && formData.confirmPassword && 
             formData.password === formData.confirmPassword && 
             formData.password.length >= 6);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Información incompleta",
        description: "Por favor, completa todos los campos requeridos.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create user in Supabase Auth (no company_name in metadata)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      if (authData.user) {
        toast({
          title: "Usuario creado exitosamente",
          description: `Se ha creado el usuario ${formData.email}. Ahora puedes asignarle empresas y permisos.`,
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

  const renderFormContent = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email del usuario *</Label>
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
        <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
          <p>
            Una vez creado el usuario, podrás asignarle empresas y promoverlo a administrador desde la gestión de usuarios.
          </p>
        </div>
      </div>
    );
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground">
          <User className="h-6 w-6" />
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Crear Nuevo Usuario</CardTitle>
        <CardDescription>
          Introduce solo los datos básicos del usuario
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderHeader()}
        
        <div>
          {renderFormContent()}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          <Button onClick={handleSubmit} disabled={!validateForm() || isLoading}>
            {isLoading ? 'Creando...' : 'Crear Usuario'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};