import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, TrendingUp, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: "Análisis Financiero Completo",
      description: "Estados financieros, ratios y proyecciones en tiempo real"
    },
    {
      icon: TrendingUp,
      title: "Proyecciones Inteligentes",
      description: "Modelos predictivos basados en datos históricos y tendencias"
    },
    {
      icon: Shield,
      title: "Seguridad Empresarial",
      description: "Protección de datos financieros con estándares bancarios"
    },
    {
      icon: Clock,
      title: "Reportes Instantáneos",
      description: "Genere informes ejecutivos en segundos, no en horas"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-6">
            FinSight Pro
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            La plataforma de análisis financiero que transforma sus datos en decisiones estratégicas. 
            Potencie su negocio con inteligencia financiera avanzada.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Iniciar Sesión
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300 border-muted">
                <CardHeader className="pb-4">
                  <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <Card className="text-center p-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl mb-4">
              ¿Listo para revolucionar su análisis financiero?
            </CardTitle>
            <CardDescription className="text-lg mb-6">
              Únase a las empresas que ya confían en FinSight Pro para tomar decisiones basadas en datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              size="lg" 
              variant="default"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6 rounded-xl"
            >
              Comenzar Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LandingPage;