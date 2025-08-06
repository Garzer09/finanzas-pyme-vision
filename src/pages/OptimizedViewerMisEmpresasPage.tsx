import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useUserCompanies, useBatchedCompanyData } from '@/hooks/useOptimizedQueries';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from '@/components/DashboardSidebar';

const CompanyCard = memo(({ company, summary }: { 
  company: any; 
  summary: { hasPygData: boolean; hasBalanceData: boolean; lastProcessing: any } | undefined;
}) => {
  const navigate = useNavigate();

  const getStatusInfo = () => {
    if (!summary) return { icon: Clock, text: 'Cargando...', variant: 'secondary' as const };
    
    if (summary.lastProcessing?.status === 'FAILED') {
      return { icon: AlertCircle, text: 'Error en procesamiento', variant: 'destructive' as const };
    }
    
    if (summary.hasPygData && summary.hasBalanceData) {
      return { icon: CheckCircle, text: 'Datos completos', variant: 'default' as const };
    }
    
    if (summary.hasPygData || summary.hasBalanceData) {
      return { icon: FileText, text: 'Datos parciales', variant: 'secondary' as const };
    }
    
    return { icon: AlertCircle, text: 'Sin datos', variant: 'outline' as const };
  };

  const handleCompanyClick = () => {
    // Navigate to the first available module with data
    if (summary?.hasPygData) {
      navigate(`/dashboard/company/${company.id}/cuenta-pyg`);
    } else if (summary?.hasBalanceData) {
      navigate(`/dashboard/company/${company.id}/balance-situacion`);
    } else {
      // Navigate to admin page for data upload
      navigate(`/admin/empresas?companyId=${company.id}`);
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer" 
      onClick={handleCompanyClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{company.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {company.sector || 'Sector no especificado'}
              </p>
            </div>
          </div>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusInfo.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Moneda: {company.currency_code || 'EUR'}</span>
          <span>Estándar: {company.accounting_standard || 'PGC'}</span>
        </div>
        {summary?.lastProcessing && (
          <div className="mt-2 text-xs text-muted-foreground">
            Último procesamiento: {new Date(summary.lastProcessing.created_at).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CompanyCard.displayName = 'CompanyCard';

const OptimizedViewerMisEmpresasPage: React.FC = () => {
  const { user } = useAuth();
  const { data: companies = [], isLoading: companiesLoading, error: companiesError } = useUserCompanies();
  const companyIds = companies.map((c: any) => c?.id).filter(Boolean);
  const summaryQueries = useBatchedCompanyData(companyIds);

  if (companiesLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-80">
          <DashboardSidebar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (companiesError) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-80">
          <DashboardSidebar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al cargar empresas</h3>
            <p className="text-muted-foreground">{companiesError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="w-80">
        <DashboardSidebar />
      </div>
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Mis Empresas</h1>
            <p className="text-muted-foreground">
              Gestiona el análisis financiero de tus empresas
            </p>
          </div>

          {companies.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes empresas asignadas</h3>
                <p className="text-muted-foreground">
                  Contacta con un administrador para que te asigne acceso a empresas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.filter((company: any) => company?.id).map((company: any, index: number) => {
                const summary = summaryQueries[index]?.data;
                return (
                  <CompanyCard 
                    key={company.id} 
                    company={company} 
                    summary={summary}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default memo(OptimizedViewerMisEmpresasPage);