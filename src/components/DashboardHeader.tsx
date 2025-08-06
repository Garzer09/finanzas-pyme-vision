
import { TrendingUp, LogOut, Building2 } from 'lucide-react';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { CompanyLogo } from '@/components/CompanyLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface CompanyInfo {
  id: string;
  name: string;
  sector: string | null;
  currency_code: string;
  logo_url: string | null;
}

interface DashboardHeaderProps {
  companyInfo?: CompanyInfo | null;
  loading?: boolean;
}

export const DashboardHeader = ({ companyInfo, loading }: DashboardHeaderProps) => {
  const { logoUrl } = useCompanyLogo();
  const { signOut } = useAuth();

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200/60 px-10 py-4 bg-white/98 backdrop-blur-xl shadow-professional">
      <div className="flex items-center gap-4">
        <CompanyLogo 
          logoUrl={logoUrl}
          size="md"
          fallback={
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-professional bg-gradient-to-br from-steel-500 to-cadet-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          }
        />
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">
            {companyInfo?.name || (logoUrl ? '' : 'Next Consultor-IA')}
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-600 font-medium">
              {companyInfo ? 'Dashboard Empresarial' : 'Dashboard Financiero Profesional'}
            </p>
            {companyInfo && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>{companyInfo.sector || 'Sin sector'}</span>
                </div>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-medium text-steel-600 bg-steel-50 px-2 py-0.5 rounded">
                  {companyInfo.currency_code}
                </span>
              </>
            )}
            {loading && (
              <span className="text-xs text-muted-foreground animate-pulse">Cargando empresa...</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-steel-700 bg-gradient-to-r from-steel-50 to-cadet-50 px-4 py-2 rounded-xl border border-steel-200/60 backdrop-blur-sm">
          Análisis Profesional con IA
        </span>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 w-9 p-0 border-steel-200/60 hover:bg-steel-50/80"
            >
              <LogOut className="h-4 w-4 text-steel-600" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cerrar Sesión</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres cerrar tu sesión? Serás redirigido a la página principal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => signOut('/')}>
                Cerrar Sesión
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
};
