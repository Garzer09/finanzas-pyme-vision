import React, { useState, useEffect } from 'react';
import {
  Navigate,
  useSearchParams,
  useNavigate,
  useLocation
} from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getPostLoginRedirect } from '@/utils/authHelpers';
import { isAuthLoading } from '@/types/auth';

const AuthPage: React.FC = () => {
  // Auth hooks & router
  const {
    signIn,
    signUp,
    updatePassword,
    authState,
    authStatus,
    role,
    roleStatus,
    initialized,
    hasJustLoggedIn,
    user,
    retry
  } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // UI state
  const [isLogin, setIsLogin] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
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

  // Handle password reset tokens from URL
  useEffect(() => {
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    console.debug('[AUTH-PAGE] URL params check:', { 
      access_token: !!access_token, 
      refresh_token: !!refresh_token, 
      type 
    });

    if (type === 'recovery' && access_token && refresh_token) {
      console.debug('[AUTH-PAGE] Password recovery token detected');
      setTokenLoading(true);
      setIsPasswordReset(true);
      setIsRecoveryMode(true);
      setIsLogin(false);
      setIsPasswordRecovery(false);
      
      // The session will be restored automatically by Supabase
      setTimeout(() => {
        setTokenLoading(false);
      }, 2000);
    }
  }, [searchParams]);

  // Centralized post-auth redirection using authHelpers
  useEffect(() => {
    if (!initialized) return;

    const redirectInfo = getPostLoginRedirect(
      authStatus === 'authenticated',
      role || 'none',
      hasJustLoggedIn,
      location.pathname,
      location.state?.from?.pathname
    );

    console.debug('[AUTH-PAGE] Redirect check:', redirectInfo);
    
    if (redirectInfo.shouldRedirect && redirectInfo.targetPath) {
      console.debug(`[AUTH-PAGE] ${redirectInfo.reason} → ${redirectInfo.targetPath}`);
      navigate(redirectInfo.targetPath, { replace: !hasJustLoggedIn });
    }
  }, [
    initialized,
    authStatus,
    role,
    hasJustLoggedIn,
    navigate,
    location.pathname,
    location.state?.from?.pathname
  ]);

  // Debug state logger
  useEffect(() => {
    console.debug('[AUTH-PAGE] State debug:', {
      path: '/auth',
      user: Boolean(user),
      authStatus,
      role,
      roleStatus,
      initialized,
      hasJustLoggedIn,
      isRecoveryMode,
      mode: isPasswordReset
        ? 'password-reset'
        : isPasswordRecovery
        ? 'recovery'
        : isSignUp
        ? 'signup'
        : 'login'
    });
    setTokenLoading(false);
  }, [
    user,
    authStatus,
    role,
    roleStatus,
    initialized,
    hasJustLoggedIn,
    isRecoveryMode,
    isPasswordReset,
    isPasswordRecovery,
    isSignUp
  ]);

  const handleInputChange = (
    field: string,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Password RESET flow
      if (isPasswordReset) {
        // Validate password fields
        if (!formData.newPassword || !formData.confirmNewPassword) {
          toast({
            title: 'Error',
            description: 'Por favor completa ambos campos de contraseña',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        if (formData.newPassword.length < 6) {
          toast({
            title: 'Error',
            description: 'La contraseña debe tener al menos 6 caracteres',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        if (formData.newPassword !== formData.confirmNewPassword) {
          toast({
            title: 'Error',
            description: 'Las contraseñas no coinciden',
            variant: 'destructive'
          });
          setLoading(false); // Reset loading state on validation error
          return;
        }
        const { error } = await supabase.auth.updateUser({
          password: formData.newPassword
        });
        if (error) {
          toast({
            title: 'Error al actualizar contraseña',
            description: error.message,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Contraseña actualizada',
            description:
              'Tu contraseña ha sido actualizada. Redirigiendo...'
          });
          setIsRecoveryMode(false);
          setIsPasswordReset(false);
          setIsLogin(true);
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        }

      // Password RECOVERY flow
      } else if (isPasswordRecovery) {
        // Validate email for password recovery
        if (!formData.email.trim()) {
          toast({
            title: 'Error',
            description: 'Por favor ingresa tu email',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(
          formData.email,
          {
            redirectTo: `${window.location.origin}/reset-password`
          }
        );
        if (error) {
          toast({
            title: 'Error al enviar email',
            description: error.message,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Email enviado',
            description:
              'Revisa tu correo para restablecer tu contraseña'
          });
          setIsPasswordRecovery(false);
          setIsLogin(true);
        }

      // SIGN UP flow
      } else if (isSignUp) {
        if (!formData.fullName || !formData.companyName) {
          toast({
            title: 'Error',
            description:
              'Completa todos los campos obligatorios',
            variant: 'destructive'
          });
          setLoading(false); // Reset loading state on validation error
          return;
        }
        const { error } = await signUp(
          formData.email,
          formData.password,
          {
            full_name: formData.fullName,
            company_name: formData.companyName
          }
        );
        if (error) {
          toast({
            title: 'Error al crear cuenta',
            description: error.message,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Cuenta creada',
            description:
              'Revisa tu email para confirmar la cuenta'
          });
          setIsSignUp(false);
          setIsLogin(true);
        }

      // LOGIN flow
      } else {
        // Basic validation for login
        if (!formData.email.trim() || !formData.password) {
          toast({
            title: 'Error',
            description: 'Por favor ingresa tu email y contraseña',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        console.debug(
          '[AUTH-PAGE] Login submit',
          { email: formData.email }
        );
        const { error } = await signIn(
          formData.email,
          formData.password
        );
        if (error) {
          console.debug('[AUTH-PAGE] Login error', error);
          toast({
            title: 'Error al iniciar sesión',
            description: error.message,
            variant: 'destructive'
          });
        } else {
          console.debug('[AUTH-PAGE] Login successful');
          toast({
            title: '¡Bienvenido!',
            description: 'Has iniciado sesión correctamente'
          });
          // redirección gestionada por useEffect
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Show recovery-token loader
  if (tokenLoading) {
    return (
      <div
        className="min-h-screen bg-steel flex items-center justify-center"
        style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
      >
        <Card className="w-full max-w-md">
          <CardContent className="py-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              Procesando enlace de recuperación...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-steel flex items-center justify-center"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="w-full max-w-md">
        {/* Header / Logo */}
        <div className="mb-8 flex justify-center">
          <TrendingUp className="h-8 w-8 text-white" />
          <span className="ml-2 text-4xl font-bold text-white">
            FinSight
          </span>
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
                : 'Iniciar Sesión'}
            </CardTitle>
            <CardDescription>
              {isPasswordReset
                ? 'Establece tu nueva contraseña'
                : isPasswordRecovery
                ? 'Introduce tu email para recibir un enlace'
                : isSignUp
                ? 'Crea tu cuenta para acceder al dashboard'
                : 'Accede a tu dashboard de análisis financiero'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {isPasswordReset ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      Nueva Contraseña
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={e =>
                        handleInputChange(
                          'newPassword',
                          e.target.value
                        )
                      }
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">
                      Confirmar Nueva Contraseña
                    </Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      value={formData.confirmNewPassword}
                      onChange={e =>
                        handleInputChange(
                          'confirmNewPassword',
                          e.target.value
                        )
                      }
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
                        <Label htmlFor="fullName">
                          Nombre Completo *
                        </Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={formData.fullName}
                          onChange={e =>
                            handleInputChange(
                              'fullName',
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyName">
                          Nombre de la Empresa *
                        </Label>
                        <Input
                          id="companyName"
                          type="text"
                          value={formData.companyName}
                          onChange={e =>
                            handleInputChange(
                              'companyName',
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e =>
                        handleInputChange(
                          'email',
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                  {!isPasswordRecovery && (
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Contraseña
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={e =>
                          handleInputChange(
                            'password',
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>
                  )}
                </>
              )}

              {isLogin && !isPasswordRecovery && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={formData.rememberMe}
                      onCheckedChange={checked =>
                        handleInputChange(
                          'rememberMe',
                          checked as boolean
                        )
                      }
                    />
                    <Label htmlFor="rememberMe" className="text-sm">
                      Recordarme
                    </Label>
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading || isAuthLoading(authState)}
              >
                {(loading || isAuthLoading(authState)) ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {authState.status === 'authenticating'
                      ? 'Iniciando sesión...'
                      : authState.status === 'resolving-role'
                      ? 'Cargando perfil...'
                      : isPasswordReset
                      ? 'Actualizando contraseña...'
                      : isPasswordRecovery
                      ? 'Enviando email...'
                      : isSignUp
                      ? 'Creando cuenta...'
                      : 'Iniciando sesión...'}
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

              {authState.status === 'error' && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-destructive">
                    {authState.error}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.debug('[AUTH-PAGE] Manual retry triggered');
                      retry();
                    }}
                  >
                    Reintentar
                  </Button>
                </div>
              )}

              <Separator />

              <div className="text-center space-y-2">
                {isPasswordReset || isPasswordRecovery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordReset(false);
                      setIsPasswordRecovery(false);
                      setIsLogin(true);
                    }}
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    ← Volver al inicio de sesión
                  </button>
                ) : isSignUp ? (
                  <p className="text-sm">
                    ¿Ya tienes una cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setIsLogin(true);
                      }}
                      className="text-primary hover:text-primary/80"
                    >
                      Iniciar sesión
                    </button>
                  </p>
                ) : (
                  <p className="text-sm">
                    ¿No tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(false);
                        setIsSignUp(true);
                      }}
                      className="text-primary hover:text-primary/80"
                    >
                      Crear cuenta
                    </button>
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
