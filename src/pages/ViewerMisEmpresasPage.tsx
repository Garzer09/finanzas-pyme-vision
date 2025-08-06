import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, TrendingUp, Users, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/DashboardHeader';

interface Company {
  id: string;
  name: string;
  currency_code: string;
  sector?: string;
  created_at: string;
}

const ViewerMisEmpresasPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUserCompanies = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch companies user is member of
      const { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select('company_id')
        .eq('user_id', user.id);

      if (membershipsError) throw membershipsError;

      if (!memberships || memberships.length === 0) {
        setCompanies([]);
        return;
      }

      // Get company IDs
      const companyIds = memberships.map(m => m.company_id);

      // Fetch company details
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, currency_code, sector, created_at')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      const userCompanies = companiesData || [];

      setCompanies(userCompanies || []);

      // If user has only one company, redirect directly to dashboard
      if (userCompanies?.length === 1) {
        navigate(`/app/dashboard?companyId=${userCompanies[0].id}`);
        return;
      }

    } catch (error) {
      console.error('Error fetching user companies:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las empresas asignadas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (companyId: string) => {
    navigate(`/app/dashboard?companyId=${companyId}`);
  };

  useEffect(() => {
    fetchUserCompanies();
  }, [user]);

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto p-6 space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Mis Empresas</h1>
          <p className="text-muted-foreground">
            Selecciona una empresa para acceder a su dashboard financiero
          </p>
        </div>

        {companies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin empresas asignadas</h3>
              <p className="text-muted-foreground text-center max-w-md">
                No tienes empresas asignadas actualmente. Contacta con tu administrador 
                para obtener acceso a las empresas correspondientes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Card key={company.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{company.name}</CardTitle>
                        {company.sector && (
                          <Badge variant="secondary" className="mt-1">
                            {company.sector}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Moneda:</span>
                    <span className="font-medium">{company.currency_code}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Desde:</span>
                    <span className="font-medium">
                      {new Date(company.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <Button 
                    onClick={() => handleCompanySelect(company.id)}
                    className="w-full mt-4"
                    variant="default"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acceder al Dashboard
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {companies.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Total de empresas: {companies.length}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ViewerMisEmpresasPage;