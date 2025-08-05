import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleAccessItem {
  module_id: string;
  enabled: boolean;
}

export const AVAILABLE_MODULES = [
  { id: 'dashboard', name: 'Dashboard General', category: 'Principal' },
  { id: 'balance-actual', name: 'Balance Actual', category: 'Estados Financieros' },
  { id: 'pyg-actual', name: 'P&L Actual', category: 'Estados Financieros' },
  { id: 'ratios-financieros', name: 'Ratios Financieros', category: 'Estados Financieros' },
  { id: 'cash-flow', name: 'Cash Flow', category: 'Estados Financieros' },
  { id: 'pyg-proyectado', name: 'P&L Proyectado', category: 'Proyecciones' },
  { id: 'balance-proyectado', name: 'Balance Proyectado', category: 'Proyecciones' },
  { id: 'sensibilidad', name: 'Análisis de Sensibilidad', category: 'Análisis' },
  { id: 'pool-deuda', name: 'Pool de Deuda', category: 'Deuda' },
  { id: 'servicio-deuda', name: 'Servicio de Deuda', category: 'Deuda' },
  { id: 'valoracion', name: 'Valoración', category: 'Análisis' },
  { id: 'nof-analysis', name: 'Análisis NOF', category: 'Análisis' },
  { id: 'breakeven', name: 'Break Even', category: 'Análisis' },
  { id: 'conclusiones', name: 'Conclusiones', category: 'Análisis' },
];

export const useModuleAccess = (companyId?: string) => {
  const [moduleAccess, setModuleAccess] = useState<ModuleAccessItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadModuleAccess = async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('company_module_access')
        .select('module_id, enabled')
        .eq('company_id', companyId);

      if (error) throw error;

      setModuleAccess(data || []);
    } catch (error) {
      console.error('Error loading module access:', error);
      toast.error('Error al cargar los accesos a módulos');
    } finally {
      setLoading(false);
    }
  };

  const updateModuleAccess = async (moduleId: string, enabled: boolean) => {
    if (!companyId) return false;

    try {
      const { error } = await supabase
        .from('company_module_access')
        .upsert({
          company_id: companyId,
          module_id: moduleId,
          enabled
        });

      if (error) throw error;

      setModuleAccess(prev => 
        prev.some(item => item.module_id === moduleId)
          ? prev.map(item => 
              item.module_id === moduleId 
                ? { ...item, enabled }
                : item
            )
          : [...prev, { module_id: moduleId, enabled }]
      );

      return true;
    } catch (error) {
      console.error('Error updating module access:', error);
      toast.error('Error al actualizar el acceso al módulo');
      return false;
    }
  };

  const hasModuleAccess = (moduleId: string): boolean => {
    const access = moduleAccess.find(item => item.module_id === moduleId);
    return access?.enabled ?? true; // Default to true if not found
  };

  useEffect(() => {
    loadModuleAccess();
  }, [companyId]);

  return {
    moduleAccess,
    loading,
    updateModuleAccess,
    hasModuleAccess,
    reload: loadModuleAccess
  };
};