import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Lock, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SimpleUserCreationFormProps {
  onComplete?: (userId: string) => void;
  onCancel?: () => void;
}

export const SimpleUserCreationForm: React.FC<SimpleUserCreationFormProps> = ({ 
  onComplete, 
  onCancel 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa todos los campos.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error en contraseña",
        description: "Las contraseñas no coinciden.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive"
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, introduce un email válido.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Create user in Supabase Auth
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        setCreatedUserId(authData.user.id);
        setIsCompleted(true);

        toast({
          title: "Usuario creado exitosamente",
          description: `Se ha creado el usuario para ${formData.email}. Se ha enviado un email de confirmación.`,
        });
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error al crear usuario",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    if (createdUserId) {
      onComplete?.(createdUserId);
    }
  };

  if (isCompleted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-900">Usuario creado exitosamente</CardTitle>
          <CardDescription>
            Se ha enviado un email de confirmación a {formData.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-steel-50 p-4 rounded-lg">
            <h4 className="font-medium text-steel-900 mb-2">Próximos pasos:</h4>
            <ul className="text-sm text-steel-700 space-y-1">
              <li>• El usuario debe confirmar su email para activar la cuenta</li>
              <li>• La asignación de empresa se puede hacer posteriormente</li>
              <li>• Los permisos de administrador se gestionan desde el menú de usuario</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleComplete} className="flex-1">
              Continuar
            </Button>
            <Button variant="outline" onClick={() => {
              setIsCompleted(false);
              setFormData({ email: '', password: '', confirmPassword: '' });
            }}>
              Crear Otro Usuario
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Crear Nuevo Usuario
        </CardTitle>
        <CardDescription>
          Introduce los datos básicos para crear una nueva cuenta de usuario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData('confirmPassword', e.target.value)}
              placeholder="Repite la contraseña"
              required
              disabled={isLoading}
            />
            {formData.password !== formData.confirmPassword && formData.confirmPassword && (
              <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
            )}
          </div>


          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};