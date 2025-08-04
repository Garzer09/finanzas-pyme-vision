import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, TrendingUp, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-white">
          FinSight Pro
        </h1>
        <Button 
          variant="secondary"
          size="lg" 
          onClick={() => navigate('/auth')}
          className="text-lg px-12 py-6 bg-muted text-muted-foreground hover:bg-muted/80 transition-all duration-300"
        >
          Comenzar
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;