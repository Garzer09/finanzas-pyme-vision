import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, BarChart3, PieChart, DollarSign, Shield, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AuthPage = () => {
  const { user, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    sector: '',
    revenue: '',
    employees: '',
    acceptTerms: false,
    rememberMe: false
  });

  if (user) {
    return <Navigate to="/home" replace />;
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
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

        const { error } = await signUp(formData.email, formData.password, {
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

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-steel-blue-50 to-light-gray-100">
      {/* Form Section */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="h-8 w-8 text-steel-blue" />
              <span className="text-2xl font-bold text-steel-blue-dark">FinSight</span>
            </div>
            <CardTitle className="text-2xl text-steel-blue-dark">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Accede a tu dashboard de análisis financiero'
                : 'Únete a FinSight y transforma el análisis financiero de tu PYME'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sector">Sector</Label>
                      <Select value={formData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
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
                      <Select value={formData.employees} onValueChange={(value) => handleInputChange('employees', value)}>
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
                    <Select value={formData.revenue} onValueChange={(value) => handleInputChange('revenue', value)}>
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
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                  />
                </div>
              )}

              {isLogin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                  />
                  <Label htmlFor="rememberMe" className="text-sm">Recordarme</Label>
                </div>
              )}

              {!isLogin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                  />
                  <Label htmlFor="acceptTerms" className="text-sm">
                    Acepto los términos y condiciones
                  </Label>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                  </div>
                ) : (
                  isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
                )}
              </Button>

              <Separator className="my-4" />

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-steel-blue hover:text-steel-blue-dark transition-colors text-sm"
                >
                  {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Hero Section */}
      <div className="hidden lg:flex w-3/5 items-center justify-center p-12 bg-gradient-to-br from-steel-blue to-steel-blue-light text-white">
        <div className="max-w-lg text-center space-y-8">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <BarChart3 className="h-8 w-8 mb-2" />
              <span className="text-sm">Análisis</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <PieChart className="h-8 w-8 mb-2" />
              <span className="text-sm">Ratios</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <DollarSign className="h-8 w-8 mb-2" />
              <span className="text-sm">Flujos</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold leading-tight">
            Transforma el Análisis Financiero de tu PYME
          </h1>
          
          <p className="text-xl opacity-90">
            Herramientas profesionales de análisis financiero al alcance de tu empresa. 
            Toma decisiones basadas en datos con FinSight.
          </p>

          <div className="grid grid-cols-1 gap-4 mt-8">
            <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Shield className="h-5 w-5" />
              <span>Análisis automatizado de estados financieros</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Zap className="h-5 w-5" />
              <span>KPIs y alertas inteligentes en tiempo real</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <TrendingUp className="h-5 w-5" />
              <span>Proyecciones y análisis de sensibilidad</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;