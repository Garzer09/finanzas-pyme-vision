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
  const [tokenLoading, setTokenLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false); // New state to track recovery mode
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
    // Check for password recovery tokens in URL fragments
    const handlePasswordRecovery = async () => {
      setTokenLoading(true);
      
      try {
        const hash = window.location.hash;
        console.log('URL hash:', hash);
        
        if (!hash) {
          return;
        }
        
        const urlParams = new URLSearchParams(hash.substring(1)); // Remove the '#' and parse
        
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        console.log('Recovery tokens found:', { 
          accessToken: accessToken ? 'presente' : 'ausente',
          refreshToken: refreshToken ? 'presente' : 'ausente', 
          type,
          error,
          errorDescription
        });
        
        // Handle error cases first
        if (error) {
          console.error('Error in URL:', error, errorDescription);
          toast({
            title: "Error en el enlace de recuperación",
            description: errorDescription || "El enlace de recuperación es inválido o ha expirado",
            variant: "destructive"
          });
          // Clean the URL
          window.history.replaceState({}, document.title, '/auth');
          return;
        }
        
        if (accessToken && refreshToken && type === 'recovery') {
          console.log('Tokens de recovery encontrados, activando modo recuperación...');
          
          // Set recovery mode flag to prevent automatic redirect
          setIsRecoveryMode(true);
          
          // Set the session with the recovery tokens
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          console.log('Resultado de setSession:', { error: setSessionError });
          
          if (setSessionError) {
            console.error('Error setting session:', setSessionError);
            setIsRecoveryMode(false);
            toast({
              title: "Error en el enlace de recuperación",
              description: setSessionError.message || "El enlace de recuperación es inválido o ha expirado",
              variant: "destructive"
            });
          } else {
            // Successfully authenticated with recovery token - show password reset form
            setIsPasswordReset(true);
            setIsLogin(false);
            setIsPasswordRecovery(false);
            
            // Clean the URL
            window.history.replaceState({}, document.title, '/auth');
            
            toast({
              title: "Enlace verificado",
              description: "Ahora puedes establecer tu nueva contraseña"
            });
          }
        }
      } catch (err) {
        console.error('Error processing recovery token:', err);
        toast({
          title: "Error",
          description: "Ocurrió un error al procesar el enlace de recuperación",
          variant: "destructive"
        });
        // Clean the URL
        window.history.replaceState({}, document.title, '/auth');
      } finally {
        setTokenLoading(false);
      }
    };

    handlePasswordRecovery();
  }, []);
  // Only redirect to home if user is logged in AND not in recovery mode
  if (user && !isRecoveryMode) {
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
            window.location.href = '/home';
          }, 1500);
        }
      } else if (isPasswordRecovery) {
        console.log('Current origin:', window.location.origin);
        const redirectUrl = `${window.location.origin}/auth`;
        console.log('Using redirect URL:', redirectUrl);
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: redirectUrl
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
                  : 'Iniciar Sesión'
              }
            </CardTitle>
            <CardDescription>
              {isPasswordReset
                ? 'Establece tu nueva contraseña'
                : isPasswordRecovery 
                  ? 'Introduce tu email para recibir un enlace de recuperación' 
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


              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isPasswordReset 
                      ? 'Actualizando contraseña...' 
                      : isPasswordRecovery 
                        ? 'Enviando email...' 
                        : 'Iniciando sesión...'
                    }
                  </div> : isPasswordReset 
                    ? 'Actualizar Contraseña' 
                    : isPasswordRecovery 
                      ? 'Enviar Email' 
                      : 'Iniciar Sesión'
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
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AuthPage;