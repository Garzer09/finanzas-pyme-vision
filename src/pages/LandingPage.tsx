import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, TrendingUp, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { authStatus, role, initialized } = useAuth();

  console.log('LandingPage state:', { 
    authStatus, 
    role, 
    initialized 
  });

  // Redirección automática cuando el estado esté inicializado
  useEffect(() => {
    if (!initialized) return;

    console.log('🏠 LandingPage redirect logic:', { authStatus, role, initialized, timestamp: new Date().toISOString() });
    
    if (authStatus === 'authenticated') {
      if (role === 'admin') {
        console.log('👑 Redirecting admin to /admin/empresas');
        navigate('/admin/empresas', { replace: true });
      } else if (role === 'viewer') {
        console.log('👤 Redirecting user to /app/mis-empresas');
        navigate('/app/mis-empresas', { replace: true });
      } else {
        console.log('⚠️ Unknown role, staying on landing page');
      }
    }
    // Si no está autenticado, se queda en /
  }, [initialized, authStatus, role]);

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