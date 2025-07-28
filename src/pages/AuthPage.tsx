import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { CompanyLogo } from '@/components/CompanyLogo';
import { supabase } from '@/integrations/supabase/client';
const AuthPage = () => {
  const { user, signIn, signUp, updatePassword } = useAuth();
  const { logoUrl } = useCompanyLogo();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    fullName: '',
    companyName: '',
    sector: '',
    revenue: '',
    employees: '',
    acceptTerms: false,
    rememberMe: false
  });

  useEffect(() => {
    // Check if this is a password reset redirect
    const resetParam = searchParams.get('reset');
    if (resetParam === 'true') {
      setIsPasswordReset(true);
      setIsLogin(false);
      setIsPasswordRecovery(false);
    }
  }, [searchParams]);
  if (user) {
    return <Navigate to="/home" replace />;
  }
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isPasswordReset) {
        if (formData.newPassword !== formData.confirmNewPassword) {
          toast({
            title: "Error",
            description: "Las contraseñas no coinciden",
            variant: "destructive"
          });
          return;
        }
        
        const { error } = await updatePassword(formData.newPassword);
        if (error) {
          toast({
            title: "Error al actualizar contraseña",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Contraseña actualizada",
            description: "Tu contraseña ha sido actualizada correctamente"
          });
          setIsPasswordReset(false);
          setIsLogin(true);
        }
      } else if (isPasswordRecovery) {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth?reset=true`
        });
        if (error) {
          toast({
            title: "Error al enviar email",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Email enviado",
            description: "Revisa tu email para restablecer tu contraseña"
          });
          setIsPasswordRecovery(false);
        }
      } else if (isLogin) {
        const {
          error
        } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Error al iniciar sesión",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente"
          });
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Las contraseñas no coinciden",
            variant: "destructive"
          });
          return;
        }
        if (!formData.acceptTerms) {
          toast({
            title: "Error",
            description: "Debes aceptar los términos y condiciones",
            variant: "destructive"
          });
          return;
        }
        const {
          error
        } = await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          company_name: formData.companyName,
          sector: formData.sector,
          revenue_range: formData.revenue,
          employees_count: formData.employees
        });
        if (error) {
          toast({
            title: "Error al registrarse",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "¡Registro exitoso!",
            description: "Revisa tu email para confirmar tu cuenta"
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-steel flex items-center justify-center" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="mb-8 flex justify-center">
          <CompanyLogo 
            logoUrl={logoUrl}
            size="lg"
            className="h-16 w-auto max-w-48"
            fallback={
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-white" />
                <span className="text-4xl font-bold text-white">FinSight</span>
              </div>
            }
          />
        </div>

        <Card className="w-full">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-2xl">
              {isPasswordReset 
                ? 'Nueva Contraseña' 
                : isPasswordRecovery 
                  ? 'Recuperar Contraseña' 
                  : isLogin 
                    ? 'Iniciar Sesión' 
                    : 'Crear Cuenta'
              }
            </CardTitle>
            <CardDescription>
              {isPasswordReset
                ? 'Establece tu nueva contraseña'
                : isPasswordRecovery 
                  ? 'Introduce tu email para recibir un enlace de recuperación' 
                  : isLogin 
                    ? 'Accede a tu dashboard de análisis financiero' 
                    : 'Únete a FinSight y transforma el análisis financiero de tu PYME'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !isPasswordRecovery && !isPasswordReset && <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input id="fullName" type="text" value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                    <Input id="companyName" type="text" value={formData.companyName} onChange={e => handleInputChange('companyName', e.target.value)} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sector">Sector</Label>
                      <Select value={formData.sector} onValueChange={value => handleInputChange('sector', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tecnologia">Tecnología</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="servicios">Servicios</SelectItem>
                          <SelectItem value="manufactura">Manufactura</SelectItem>
                          <SelectItem value="construccion">Construcción</SelectItem>
                          <SelectItem value="otros">Otros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employees">Empleados</Label>
                      <Select value={formData.employees} onValueChange={value => handleInputChange('employees', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10</SelectItem>
                          <SelectItem value="11-50">11-50</SelectItem>
                          <SelectItem value="51-250">51-250</SelectItem>
                          <SelectItem value="250+">250+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="revenue">Facturación Anual</Label>
                    <Select value={formData.revenue} onValueChange={value => handleInputChange('revenue', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona rango" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<100k">Menos de 100.000 €</SelectItem>
                        <SelectItem value="100k-500k">100.000 € - 500.000 €</SelectItem>
                        <SelectItem value="500k-2M">500.000 € - 2.000.000 €</SelectItem>
                        <SelectItem value="2M-10M">2.000.000 € - 10.000.000 €</SelectItem>
                        <SelectItem value="10M+">Más de 10.000.000 €</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>}

              {isPasswordReset ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      value={formData.newPassword} 
                      onChange={e => handleInputChange('newPassword', e.target.value)} 
                      required 
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
                    <Input 
                      id="confirmNewPassword" 
                      type="password" 
                      value={formData.confirmNewPassword} 
                      onChange={e => handleInputChange('confirmNewPassword', e.target.value)} 
                      required 
                      minLength={6}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required />
                  </div>

                  {!isPasswordRecovery && <>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input id="password" type="password" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} required />
                    </div>
                  </>}

                  {!isLogin && !isPasswordRecovery && <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                      <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={e => handleInputChange('confirmPassword', e.target.value)} required />
                    </div>}
                </>
              )}

              {isLogin && !isPasswordRecovery && <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="rememberMe" checked={formData.rememberMe} onCheckedChange={checked => handleInputChange('rememberMe', checked as boolean)} />
                    <Label htmlFor="rememberMe" className="text-sm">Recordarme</Label>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsPasswordRecovery(true)} 
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>}

              {!isLogin && !isPasswordRecovery && <div className="flex items-center space-x-2">
                  <Checkbox id="acceptTerms" checked={formData.acceptTerms} onCheckedChange={checked => handleInputChange('acceptTerms', checked as boolean)} />
                  <Label htmlFor="acceptTerms" className="text-sm">
                    Acepto los términos y condiciones
                  </Label>
                </div>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isPasswordReset 
                      ? 'Actualizando contraseña...' 
                      : isPasswordRecovery 
                        ? 'Enviando email...' 
                        : isLogin 
                          ? 'Iniciando sesión...' 
                          : 'Creando cuenta...'
                    }
                  </div> : isPasswordReset 
                    ? 'Actualizar Contraseña' 
                    : isPasswordRecovery 
                      ? 'Enviar Email' 
                      : isLogin 
                        ? 'Iniciar Sesión' 
                        : 'Crear Cuenta'
                }
              </Button>

              <Separator className="my-4" />

              <div className="text-center space-y-2">
                {isPasswordReset ? (
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsPasswordReset(false);
                      setIsLogin(true);
                    }} 
                    className="text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    ← Volver al inicio de sesión
                  </button>
                ) : isPasswordRecovery ? (
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsPasswordRecovery(false);
                      setIsLogin(true);
                    }} 
                    className="text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    ← Volver al inicio de sesión
                  </button>
                ) : (
                  <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:text-primary/80 transition-colors text-sm">
                    {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                  </button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AuthPage;