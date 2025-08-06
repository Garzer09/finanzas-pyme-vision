import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useMembershipCheck } from '@/hooks/useOptimizedQueries';
import { useToast } from '@/hooks/use-toast';
import { DashboardSidebar } from '@/components/DashboardSidebar';

interface CompanyContextualizedRouteProps {
  children: React.ReactNode;
}

export const CompanyContextualizedRoute: React.FC<CompanyContextualizedRouteProps> = ({ children }) => {
  const { companyId } = useParams<{ companyId: string }>();
  const { selectedCompany, setSelectedCompany, loading: companyLoading } = useCompany();
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { toast } = useToast();
  const [accessChecked, setAccessChecked] = useState(false);
  
  // Use optimized membership check
  const { data: membership, isLoading: membershipLoading, error: membershipError } = useMembershipCheck(companyId || '');

  // Determine access based on optimized queries
  const hasAccess = React.useMemo(() => {
    if (!user || !companyId) return false;
    if (userRole === 'admin') return true;
    return !!membership && !membershipError;
  }, [user, companyId, userRole, membership, membershipError]);

  useEffect(() => {
    if (!membershipLoading) {
      if (!hasAccess && user && companyId) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para acceder a esta empresa",
          variant: "destructive"
        });
      }
      setAccessChecked(true);
    }
  }, [membershipLoading, hasAccess, user, companyId, toast]);

  // Update company context when companyId changes
  useEffect(() => {
    if (companyId && (!selectedCompany || selectedCompany.id !== companyId)) {
      // The CompanyContext will automatically load the company from the URL
    }
  }, [companyId, selectedCompany]);

  // Show loading while checking access or loading company
  if (!accessChecked || companyLoading || membershipLoading) {
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

  // Redirect if no access
  if (!hasAccess) {
    return <Navigate to="/app/mis-empresas" replace />;
  }

  // Redirect if company not found
  if (!selectedCompany) {
    return <Navigate to="/app/mis-empresas" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="w-80">
        <DashboardSidebar />
      </div>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};