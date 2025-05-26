
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    checkAccess();
  }, [moduleId]);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select(`
          subscription_plan_id,
          subscription_plans (
            modules_access
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (profile?.subscription_plans?.modules_access) {
        const allowedModules = profile.subscription_plans.modules_access as string[];
        setHasAccess(allowedModules.includes(moduleId));
      } else {
        // Si no tiene suscripción, solo acceso al resumen ejecutivo
        setHasAccess(moduleId === 'resumen-ejecutivo');
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
        <div className="text-white">Verificando acceso...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      fallback || (
        <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">Acceso Restringido</h3>
          <p className="text-gray-300 mb-6">
            Este módulo no está incluido en tu plan actual. Actualiza tu suscripción para acceder a esta funcionalidad.
          </p>
          <button
            onClick={() => window.location.href = '/suscripcion'}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Ver Planes de Suscripción
          </button>
        </div>
      )
    );
  }

  return <>{children}</>;
};
