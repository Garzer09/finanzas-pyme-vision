import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { CompanyDescriptionForm } from '@/components/CompanyDescriptionForm';
import { ShareholderSearchDialog } from '@/components/ShareholderSearchDialog';
import { ShareholderStructureCard } from '@/components/ShareholderStructureCard';
import { useShareholderData } from '@/hooks/useShareholderData';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Save } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCompanyContext } from '@/contexts/CompanyContext';

export const CompanyDescriptionModule = () => {
  const { companyId: paramCompanyId } = useParams<{ companyId: string }>();
  const { companyId: contextCompanyId } = useCompanyContext();
  const companyId = paramCompanyId || contextCompanyId;
  const [isEditing, setIsEditing] = useState(false);
  
  // Get company information from database
  const { companyInfo, loading: companyLoading } = useCompanyInfo(companyId || undefined);
  
  // Use company name from database or fallback
  const companyName = companyInfo?.name || 'Empresa Sin Nombre';

  // Debug logging
  console.debug('[CompanyDescriptionModule] companyId:', companyId, 'companyInfo:', companyInfo);

  // Shareholder data management
  const {
    data: shareholderData,
    loading: shareholderLoading,
    saveData: saveShareholderData,
    addItem,
    removeItem,
    updateItem
  } = useShareholderData(companyName);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50/30">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-8 space-y-8 overflow-auto">
          {/* Header Section */}
          <section className="relative">
            <div className="modern-card p-8 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel-50/50 via-cadet-50/30 to-steel-50/20"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-steel-500 to-cadet-500"></div>
              
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-cadet-600 bg-clip-text text-transparent">
                  Descripción de la Empresa
                </h1>
                <p className="text-slate-700 text-lg font-medium">
                  Información cualitativa de la empresa y estructura accionarial
                </p>
              </div>
            </div>
          </section>

          {/* Company Description Form */}
          <section>
            <CompanyDescriptionForm companyId={companyId} />
          </section>

          {/* Shareholder Structure Section */}
          <section>
            <Card className="modern-card">
              <CardHeader className="bg-gradient-to-r from-cadet-50 to-steel-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-cadet-500 to-steel-500">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                      Estructura Accionaria
                    </CardTitle>
                  </div>
                  
                  <RoleBasedAccess allowedRoles={['admin']}>
                    <div className="flex gap-2">
                      <ShareholderSearchDialog 
                        companyName={companyName || 'Empresa'}
                        onSearchComplete={() => {
                          // Data will be automatically refreshed by the hook
                        }}
                      />
                      {isEditing && shareholderData && (
                        <Button 
                          onClick={() => saveShareholderData({})}
                          disabled={shareholderLoading}
                          variant="outline"
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Cambios
                        </Button>
                      )}
                    </div>
                  </RoleBasedAccess>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                {shareholderData ? (
                  <ShareholderStructureCard
                    data={shareholderData}
                    isEditing={isEditing}
                    onAddItem={addItem}
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No hay estructura accionarial disponible
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      La estructura accionarial se carga desde la plantilla cualitativa durante la creación del usuario,
                      o puede ser editada manualmente por los administradores.
                    </p>
                    <RoleBasedAccess allowedRoles={['admin']}>
                      <div className="space-y-2">
                        <ShareholderSearchDialog 
                          companyName={companyName || 'Empresa'}
                          onSearchComplete={() => {
                            // Data will be automatically refreshed by the hook
                          }}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Agregar Accionistas Manualmente
                        </Button>
                      </div>
                    </RoleBasedAccess>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};