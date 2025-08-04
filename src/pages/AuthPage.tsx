import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';
import { shouldNavigateAfterAuth, isAuthLoading } from '@/types/auth';
const AuthPage = () => {
  const { signIn, signUp, updatePassword, authState } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
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

const { authStatus, role, roleStatus, initialized, hasJustLoggedIn } = useAuth();

// 🔄 Lógica unificada de redirección
useEffect(() => {
  // 1️⃣ Esperamos a que se cargue el estado de la autenticación
  if (!initialized || roleStatus !== 'ready') return;

  // 2️⃣ Si no está autenticado o no hay rol válido, salimos
  if (authStatus !== 'authenticated' || !role || role === 'none') return;

  // 3️⃣ Calculamos la ruta según el rol
  const targetPath = role === 'admin'
    ? '/admin/empresas'
    : '/app/mis-empresas';

  // 4️⃣ Navegamos:
  //   - replace = false en login fresco (mantener "atrás")
  //   - replace = true en sesión ya existente (no volver al login)
  console.debug(
    `[AUTH-PAGE] ${
      hasJustLoggedIn ? 'Post-login' : 'Existing session'
    } navigation to:`,
    targetPath
  );
  navigate(targetPath, { replace: !hasJustLoggedIn });
}, [
  initialized,
  authStatus,
  roleStatus,
  role,
  hasJustLoggedIn,
  navigate,
]);

  useEffect(() => {
    const targetPath = shouldNavigateAfterAuth(authState, window.location.pathname);
    if (targetPath) {
      console.debug('[AUTH-PAGE] Navigation triggered:', { 
        authState: authState.status, 
        targetPath,
        role: authState.status === 'authenticated' ? authState.role : 'none'
      });
      navigate(targetPath, { replace: true });
    }
  }, [authState, navigate]);

  useEffect(() => {
    // Debug logging for state changes
    console.debug('[AUTH-PAGE] State debug:', { 
      path: '/auth', 
      authState: authState.status,
      role: authState.status === 'authenticated' ? authState.role : 'none',
      isRecoveryMode,
      state: isPasswordReset ? 'password-reset' : isPasswordRecovery ? 'recovery' : isSignUp ? 'signup' : 'login'
    });
    
    setTokenLoading(false);
  }, [authState, isRecoveryMode, isPasswordReset, isPasswordRecovery, isSignUp]);
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
        
        const { error } = await supabase.auth.updateUser({
          password: formData.newPassword
        });
        if (error) {
          toast({
            title: "Error al actualizar contraseña",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Contraseña actualizada",
            description: "Tu contraseña ha sido actualizada correctamente. Redirigiendo..."
          });
          
          // Exit recovery mode and allow normal navigation
          setIsRecoveryMode(false);
          setIsPasswordReset(false);
          setIsLogin(true);
          
          // Redirect to home after successful password update
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        }
      } else if (isPasswordRecovery) {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/reset-password`,
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
          setIsLogin(true);
        }
      } else if (isSignUp) {
        if (!formData.fullName || !formData.companyName) {
          toast({
            title: "Error",
            description: "Por favor completa todos los campos obligatorios",
            variant: "destructive"
          });
          return;
        }

        const { error } = await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          company_name: formData.companyName
        });
        
        if (error) {
          toast({
            title: "Error al crear cuenta",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Cuenta creada",
            description: "Tu cuenta ha sido creada exitosamente. Revisa tu email para confirmar."
          });
          setIsSignUp(false);
          setIsLogin(true);
        }
      } else if (isLogin) {
        console.debug('[AUTH-PAGE] Login submit started', { email: formData.email });
        
        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          console.debug('[AUTH-PAGE] Login error:', error);
          toast({
            title: "Error al iniciar sesión",
            description: error.message,
            variant: "destructive"
          });
        } else {
          console.debug('[AUTH-PAGE] Login successful');
          toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente"
          });
          // Navigation will be handled automatically by useEffect watching authState
        }
      }
    } finally {
      setLoading(false);
    }
  };
  // Show loading state while processing recovery token
  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-steel flex items-center justify-center" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
        <div className="w-full max-w-md">
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Procesando enlace de recuperación...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-steel flex items-center justify-center" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-white" />
            <span className="text-4xl font-bold text-white">FinSight</span>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-2xl">
              {isPasswordReset 
                ? 'Nueva Contraseña' 
                : isPasswordRecovery 
                  ? 'Recuperar Contraseña'
                  : isSignUp
                    ? 'Crear Cuenta'
                    : 'Iniciar Sesión'
              }
            </CardTitle>
            <CardDescription>
              {isPasswordReset
                ? 'Establece tu nueva contraseña'
                : isPasswordRecovery 
                  ? 'Introduce tu email para recibir un enlace de recuperación'
                  : isSignUp
                    ? 'Crea tu cuenta para acceder al dashboard'
                    : 'Accede a tu dashboard de análisis financiero'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

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
                  {isSignUp && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nombre Completo *</Label>
                        <Input 
                          id="fullName" 
                          type="text" 
                          value={formData.fullName} 
                          onChange={e => handleInputChange('fullName', e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                        <Input 
                          id="companyName" 
                          type="text" 
                          value={formData.companyName} 
                          onChange={e => handleInputChange('companyName', e.target.value)} 
                          required 
                        />
                      </div>
                    </>
                  )}
                  
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
                </>
              )}

              {isLogin && !isPasswordRecovery && (
                <div className="flex items-center justify-between">
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
                </div>
              )}


              <Button type="submit" className="w-full" disabled={loading || isAuthLoading(authState)}>
                {(loading || isAuthLoading(authState)) ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {authState.status === 'authenticating' 
                      ? 'Iniciando sesión...'
                      : isPasswordReset 
                        ? 'Actualizando contraseña...' 
                        : isPasswordRecovery 
                          ? 'Enviando email...'
                          : isSignUp
                            ? 'Creando cuenta...'
                            : 'Iniciando sesión...'
                    }
                  </div>
                ) : (
                  isPasswordReset 
                    ? 'Actualizar Contraseña' 
                    : isPasswordRecovery 
                      ? 'Enviar Email'
                      : isSignUp
                        ? 'Crear Cuenta'
                        : 'Iniciar Sesión'
                )}
              </Button>

              {/* ✅ UI para errores de autenticación */}
              {authState.status === 'error' && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-destructive">{authState.error}</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={authState.retry}
                  >
                    Reintentar
                  </Button>
                </div>
              )}


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
                ) : isSignUp ? (
                  <div>
                    <span className="text-sm text-muted-foreground">¿Ya tienes una cuenta? </span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsSignUp(false);
                        setIsLogin(true);
                      }} 
                      className="text-primary hover:text-primary/80 transition-colors text-sm"
                    >
                      Iniciar sesión
                    </button>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm text-muted-foreground">¿No tienes una cuenta? </span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsLogin(false);
                        setIsSignUp(true);
                      }} 
                      className="text-primary hover:text-primary/80 transition-colors text-sm"
                    >
                      Crear cuenta
                    </button>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AuthPage;