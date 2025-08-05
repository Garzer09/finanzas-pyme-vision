
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom';

interface ModuleAccessControlProps {
  moduleId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ModuleAccessControl: React.FC<ModuleAccessControlProps> = ({
  moduleId,
  children,
  fallback
}) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { companyId } = useParams();

  useEffect(() => {
    checkAccess();
  }, [moduleId, companyId]);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // If no companyId, allow access (admin pages)
      if (!companyId) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Check module access for the specific company
      const { data, error } = await supabase
        .from('company_module_access')
        .select('enabled')
        .eq('company_id', companyId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (error) {
        console.error('Error checking module access:', error);
        setHasAccess(true); // Default to allow access on error
      } else {
        setHasAccess(data?.enabled ?? true); // Default to true if no record found
      }
      
    } catch (error) {
      console.error('Error checking module access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Verificando acceso...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      fallback || (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-red-800 mb-4">Acceso Restringido</h3>
          <p className="text-red-600 mb-6">
            Este módulo no está incluido en tu plan actual. Actualiza tu suscripción para acceder a esta funcionalidad.
          </p>
          <button
            onClick={() => window.location.href = '/suscripcion'}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Ver Planes de Suscripción
          </button>
        </div>
      )
    );
  }

  return <>{children}</>;
};
