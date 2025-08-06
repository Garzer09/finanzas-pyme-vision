import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/DashboardHeader';

interface Company {
  id: string;
  name: string;
  currency_code: string;
  sector?: string;
}

const ViewerDashboardPage = () => {
  const [searchParams] = useSearchParams();
  const { companyId: paramCompanyId } = useParams<{ companyId: string }>();
  // Support both URL parameter and query parameter for backward compatibility
  const companyId = paramCompanyId || searchParams.get('companyId');
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const verifyAccess = async () => {
    if (!user || !companyId) {
      navigate('/app/mis-empresas');
      return;
    }

    try {
      setLoading(true);

      // Verify user has membership to this company
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (membershipError || !membership) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para acceder a esta empresa",
          variant: "destructive"
        });
        navigate('/app/mis-empresas');
        return;
      }

      setHasAccess(true);

      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, currency_code, sector')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      setCompany(companyData);

    } catch (error) {
      console.error('Error verifying access:', error);
      toast({
        title: "Error",
        description: "Error al verificar el acceso a la empresa",
        variant: "destructive"
      });
      navigate('/app/mis-empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyAccess();
  }, [user, companyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!hasAccess || !company) {
    return null; // Redirect already handled
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/mis-empresas')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Empresas
          </Button>
        </div>

        {/* Company Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
          </div>
          <p className="text-muted-foreground">
            Dashboard financiero - {company.currency_code}
            {company.sector && ` • ${company.sector}`}
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Estados Financieros</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Consulta balance, cuenta de PyG y flujos de caja
              </p>
              <Button variant="outline" className="w-full">
                Ver Estados
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">Análisis de Ratios</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Ratios de liquidez, solvencia y rentabilidad
              </p>
              <Button variant="outline" className="w-full">
                Ver Ratios
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PieChart className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Proyecciones</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Escenarios futuros y análisis de sensibilidad
              </p>
              <Button variant="outline" className="w-full">
                Ver Proyecciones
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Dashboard en Desarrollo
                </h3>
                <p className="text-sm text-blue-700">
                  Este dashboard está siendo desarrollado. Pronto tendrás acceso completo 
                  a todos los módulos de análisis financiero para {company.name}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ViewerDashboardPage;