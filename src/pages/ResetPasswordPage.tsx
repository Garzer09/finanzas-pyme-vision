import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CompanyLogo } from '@/components/CompanyLogo';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRecoveryToken = async () => {
      console.log('Checking recovery token on reset password page...');
      setCheckingToken(true);
      
      try {
        // Check URL hash first
        const hash = window.location.hash;
        console.log('Hash:', hash);

        if (hash) {
          const urlParams = new URLSearchParams(hash.substring(1));
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          const type = urlParams.get('type');
          const error = urlParams.get('error');

          console.log('URL params:', { 
            accessToken: !!accessToken, 
            refreshToken: !!refreshToken, 
            type, 
            error 
          });

          if (error) {
            console.error('Error in URL:', error);
            toast({
              title: "Error",
              description: "El enlace de recuperación ha expirado o es inválido",
              variant: "destructive"
            });
            navigate('/auth');
            return;
          }

          if (type === 'recovery' && accessToken && refreshToken) {
            // Set the session with the tokens from the URL
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('Error setting session:', sessionError);
              toast({
                title: "Error",
                description: "El enlace de recuperación ha expirado o es inválido",
                variant: "destructive"
              });
              navigate('/auth');
            } else {
              console.log('Session set successfully:', data);
              setTokenValid(true);
              // Clear the URL hash
              window.history.replaceState({}, document.title, '/reset-password');
            }
            return;
          }
        }

        // If no hash, check if we already have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          toast({
            title: "Error",
            description: "Error al verificar la sesión",
            variant: "destructive"
          });
          navigate('/auth');
        } else if (session) {
          console.log('Valid session found:', session);
          setTokenValid(true);
        } else {
          console.log('No valid session found');
          toast({
            title: "Enlace inválido",
            description: "No se encontró un enlace de recuperación válido",
            variant: "destructive"
          });
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error processing recovery token:', error);
        toast({
          title: "Error",
          description: "Error al procesar el enlace de recuperación",
          variant: "destructive"
        });
        navigate('/auth');
      } finally {
        setCheckingToken(false);
      }
    };

    checkRecoveryToken();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting to update password...');
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Error updating password:', error);
        toast({
          title: "Error",
          description: error.message || "Error al actualizar la contraseña",
          variant: "destructive"
        });
      } else {
        console.log('Password updated successfully');
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido actualizada correctamente"
        });
        
        // Wait a moment then redirect to home
        setTimeout(() => {
          navigate('/home');
        }, 2000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Error inesperado al actualizar la contraseña",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Verificando enlace de recuperación...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <CompanyLogo />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Nueva Contraseña</CardTitle>
            <CardDescription>
              Establece tu nueva contraseña
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Nueva Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar Contraseña
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma tu nueva contraseña"
                required
                minLength={6}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;