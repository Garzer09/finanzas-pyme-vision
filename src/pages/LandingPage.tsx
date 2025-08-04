import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, TrendingUp, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();

  const handleGetStarted = () => {
    if (user && !roleLoading) {
      // Usuario ya logueado, redirigir según rol
      if (userRole === 'admin') {
        navigate('/admin/empresas');
      } else {
        navigate('/app/mis-empresas');
      }
    } else {
      // Usuario no logueado, ir a auth
      navigate('/auth');
    }
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
            disabled={roleLoading}
          >
            {user ? (roleLoading ? 'Cargando...' : 'Ir al Dashboard') : 'Comenzar'}
          </Button>
          
          {user && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-white/80 text-sm">
                Ya tienes una sesión activa
              </p>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate('/auth')}
                className="text-primary border-white/20 hover:bg-white/10 hover:text-white"
              >
                Cambiar Usuario
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;