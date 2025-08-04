import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, TrendingUp, Shield, Clock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authStatus, role, initialized } = useAuth();

  // Redirección automática cuando el estado esté inicializado
  useEffect(() => {
    // Fase 1: Instrumentación
    console.debug('[AUTH]', { 
      path: location.pathname,
      initialized, 
      authStatus, 
      role,
      fromManualNavigation: location.state?.from === 'manual'
    });
    
    // Solo redirigir si ya está inicializado
    if (!initialized) {
      console.log('Auth not initialized yet, waiting...');
      return;
    }
    
    // Fase 5: No redirigir si llegó manualmente (ej: click en Comenzar)
    if (location.state?.from === 'manual') {
      console.log('Manual navigation detected, not auto-redirecting');
      return;
    }
    
    console.log('LandingPage auth check:', { authStatus, role, initialized });
    
    if (authStatus === 'authenticated') {
      console.log('User is authenticated, checking role...');
      if (role === 'admin') {
        console.log('Admin role detected, redirecting to /admin/empresas');
        navigate('/admin/empresas', { replace: true });
      } else {
        console.log('Viewer role detected, redirecting to /app/mis-empresas');
        navigate('/app/mis-empresas', { replace: true });
      }
    }
    // Si no está autenticado, se queda en /
  }, [initialized, authStatus, role, location.pathname, location.state]);

  const handleGetStarted = () => {
    console.log('🔘 CTA clicked - navigating to /auth');
    navigate('/auth');
  };


  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-white">
          FinSight Pro
        </h1>
        <div className="space-y-4">
          <Button 
            variant="secondary"
            size="lg" 
            onClick={handleGetStarted}
            className="text-lg px-12 py-6 bg-muted text-muted-foreground hover:bg-muted/80 transition-all duration-300"
          >
            Comenzar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;