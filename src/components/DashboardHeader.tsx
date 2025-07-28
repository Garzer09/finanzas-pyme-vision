
import { TrendingUp } from 'lucide-react';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { CompanyLogo } from '@/components/CompanyLogo';

export const DashboardHeader = () => {
  const { logoUrl } = useCompanyLogo();

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
            {logoUrl ? '' : 'Next Consultor-IA'}
          </h1>
          <p className="text-sm text-slate-600 font-medium">Dashboard Financiero Profesional</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-steel-700 bg-gradient-to-r from-steel-50 to-cadet-50 px-4 py-2 rounded-xl border border-steel-200/60 backdrop-blur-sm">
          Análisis Profesional con IA
        </span>
      </div>
    </header>
  );
};
