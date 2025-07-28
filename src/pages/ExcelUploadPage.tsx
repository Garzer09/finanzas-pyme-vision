
import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ExcelUpload } from '@/components/ExcelUpload';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { useToast } from '@/hooks/use-toast';

const ExcelUploadPage = () => {
  const { toast } = useToast();

  const handleUploadComplete = (fileId: string, processedData: any) => {
    console.log('Upload completed:', { fileId, processedData });
    toast({
      title: "Archivo procesado",
      description: "Los datos han sido extraídos y están listos para el análisis. Navega a los diferentes módulos para ver los resultados.",
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <RoleBasedAccess 
            allowedRoles={['admin']}
            fallback={
              <div className="bg-muted border border-border rounded-lg p-8 text-center">
                <h3 className="text-xl font-semibold text-foreground mb-4">Acceso Restringido</h3>
                <p className="text-muted-foreground mb-6">
                  Solo los administradores pueden subir y procesar archivos Excel. 
                  Contacta a tu administrador si necesitas cargar nuevos datos.
                </p>
              </div>
            }
          >
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">Subir Archivo Excel</h1>
              <p className="text-muted-foreground">
                Sube tu archivo Excel con los datos financieros para generar automáticamente todos los análisis y proyecciones.
              </p>
            </div>

            <ExcelUpload onUploadComplete={handleUploadComplete} />
          </RoleBasedAccess>
        </main>
      </div>
    </div>
  );
};

export default ExcelUploadPage;
