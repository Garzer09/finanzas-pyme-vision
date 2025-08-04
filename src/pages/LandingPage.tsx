import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, TrendingUp, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();

  console.log('LandingPage state:', { 
    hasUser: !!user, 
    userRole, 
    roleLoading,
    userId: user?.id 
  });

  const handleGetStarted = () => {
    console.log('handleGetStarted clicked:', { user: !!user, userRole, roleLoading });
    
    if (user && !roleLoading) {
      // Usuario ya logueado, redirigir según rol
      console.log('User logged in, redirecting based on role:', userRole);
      if (userRole === 'admin') {
        console.log('Redirecting admin to /admin/empresas');
        navigate('/admin/empresas');
      } else {
        console.log('Redirecting user to /app/mis-empresas');
        navigate('/app/mis-empresas');
      }
    } else {
      // Usuario no logueado, ir a auth
      console.log('No user or still loading, going to auth');
      navigate('/auth');
    }
  };

  const handleChangeUser = async () => {
    console.log('handleChangeUser clicked');
    await signOut('/auth'); // Redirect to auth after logout
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
                onClick={handleChangeUser}
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