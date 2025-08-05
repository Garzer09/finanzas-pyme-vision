import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, TrendingUp, Shield, Clock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getPostLoginRedirect } from "@/utils/authHelpers";

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authStatus, role, initialized } = useAuth();

  // Simplified auto-redirection using centralized logic
  useEffect(() => {
    // Debug logging
    console.debug('[LANDING]', { 
      path: location.pathname,
      initialized, 
      authStatus, 
      role,
      fromManualNavigation: location.state?.from === 'manual'
    });
    
    // Only redirect if initialized and not from manual navigation
    if (!initialized || location.state?.from === 'manual') {
      return;
    }

    // Use centralized redirection logic
    const redirectInfo = getPostLoginRedirect(
      authStatus === 'authenticated',
      role || 'none',
      false, // hasJustLoggedIn = false for existing sessions
      location.pathname
    );

    console.debug('[LANDING] Redirect check:', redirectInfo);

    if (redirectInfo.shouldRedirect && redirectInfo.targetPath) {
      console.debug(`[LANDING] ${redirectInfo.reason} → ${redirectInfo.targetPath}`);
      navigate(redirectInfo.targetPath, { replace: true });
    }
  }, [initialized, authStatus, role, location.state, location.pathname, navigate]);

  const handleGetStarted = () => {
    console.debug('[NAVIGATE] CTA clicked', { from: '/', to: '/auth', reason: 'user_action' });
    navigate('/auth', { state: { from: 'manual' } });
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