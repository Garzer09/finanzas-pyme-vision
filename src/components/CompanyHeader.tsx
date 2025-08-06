import React from 'react';
import { Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCompanyContext } from '@/contexts/CompanyContext';

interface CompanyHeaderProps {
  showBackButton?: boolean;
  backPath?: string;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ 
  showBackButton = false, 
  backPath = '/app/mis-empresas' 
}) => {
  const navigate = useNavigate();
  const { currentCompany } = useCompanyContext();

  if (!currentCompany) return null;

  return (
    <div className="mb-8">
      {showBackButton && (
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backPath)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Empresas
          </Button>
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">{currentCompany.name}</h1>
      </div>
      <p className="text-muted-foreground">
        {currentCompany.currency_code}
        {currentCompany.sector && ` • ${currentCompany.sector}`}
      </p>
    </div>
  );
};