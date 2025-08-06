import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
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
  const [hasAccess, setHasAccess] = useState(false);
  const accessCacheRef = useRef<Map<string, { hasAccess: boolean; timestamp: number }>>(new Map());

  useEffect(() => {
    const verifyAccess = async () => {
      if (!user || !companyId) {
        setAccessChecked(true);
        setHasAccess(false);
        return;
      }

      try {
        // Check access cache first (valid for 5 minutes)
        const cacheKey = `${user.id}_${companyId}`;
        const cached = accessCacheRef.current.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < 300000) {
          setHasAccess(cached.hasAccess);
          setAccessChecked(true);
          return;
        }

        // Admin users have access to all companies
        if (userRole === 'admin') {
          accessCacheRef.current.set(cacheKey, { hasAccess: true, timestamp: Date.now() });
          setHasAccess(true);
          setAccessChecked(true);
          return;
        }

        // Regular users need membership verification
        const { data: membership, error } = await supabase
          .from('memberships')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .single();

        const hasValidAccess = !error && !!membership;
        
        // Cache the result
        accessCacheRef.current.set(cacheKey, { 
          hasAccess: hasValidAccess, 
          timestamp: Date.now() 
        });

        if (!hasValidAccess) {
          toast({
            title: "Acceso denegado",
            description: "No tienes permisos para acceder a esta empresa",
            variant: "destructive"
          });
          setHasAccess(false);
        } else {
          setHasAccess(true);
        }
      } catch (error) {
        console.error('Error verifying company access:', error);
        setHasAccess(false);
      } finally {
        setAccessChecked(true);
      }
    };

    verifyAccess();
  }, [user, companyId, userRole, toast]);

  // Update company context when companyId changes
  useEffect(() => {
    if (companyId && (!selectedCompany || selectedCompany.id !== companyId)) {
      // The CompanyContext will automatically load the company from the URL
    }
  }, [companyId, selectedCompany]);

  // Show loading while checking access or loading company
  if (!accessChecked || companyLoading) {
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