import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminTopNavigation } from '@/components/AdminTopNavigation';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { Button } from '@/components/ui/button';

export const AdminCargaPlantillasPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <RoleBasedAccess allowedRoles={['admin']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50/30">
        <AdminTopNavigation />
        
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="modern-card p-8 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel-50/50 via-cadet-50/30 to-steel-50/20"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-steel-500 to-cadet-500"></div>
              
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-cadet-600 bg-clip-text text-transparent">
                  Carga de Plantillas - DESHABILITADA
                </h1>
                <p className="text-slate-700 text-lg font-medium">
                  El flujo de carga de datos ha sido completamente deshabilitado.
                </p>
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    ⚠️ La funcionalidad de carga de archivos Excel/CSV ha sido eliminada del sistema.
                    Las tablas de Supabase se mantienen intactas para uso futuro.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center py-12">
            <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
              Volver al Dashboard Admin
            </Button>
          </div>
        </div>
      </div>
    </RoleBasedAccess>
  );
};