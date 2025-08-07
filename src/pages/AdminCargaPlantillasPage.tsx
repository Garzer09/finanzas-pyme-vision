import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminTopNavigation } from '@/components/AdminTopNavigation';
import { LongFormatUploadWizard } from '@/components/admin/LongFormatUploadWizard';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { toast } from 'sonner';

export const AdminCargaPlantillasPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId');
  
  const handleComplete = (processedCompanyId: string) => {
    toast.success('Datos procesados exitosamente');
    // Navigate to description page to review the uploaded qualitative data
    if (processedCompanyId) {
      navigate(`/app/${processedCompanyId}/balance-situacion`);
    } else {
      navigate('/admin/dashboard');
    }
  };
  
  const handleCancel = () => {
    navigate(-1);
  };

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
                  Carga de Plantillas
                </h1>
                <p className="text-slate-700 text-lg font-medium">
                  Sistema unificado de carga de datos financieros y cualitativos en formato Long
                </p>
              </div>
            </div>
          </div>

          {/* Long Format Upload Wizard */}
          <LongFormatUploadWizard 
            companyId={companyId}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </RoleBasedAccess>
  );
};