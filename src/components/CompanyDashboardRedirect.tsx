import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CompanyDashboardRedirectProps {
  companyId: string;
}

export const CompanyDashboardRedirect: React.FC<CompanyDashboardRedirectProps> = ({ 
  companyId 
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (companyId) {
      // Redirigir al dashboard específico de la empresa
      navigate(`/dashboard/company/${companyId}`);
    }
  }, [companyId, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Redirigiendo al dashboard de la empresa...</p>
      </div>
    </div>
  );
};