
import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ExcelUpload } from '@/components/ExcelUpload';
import { ModuleAccessControl } from '@/components/ModuleAccessControl';
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
    <div className="flex min-h-screen bg-navy-800">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Subir Archivo Excel</h1>
            <p className="text-gray-300">
              Sube tu archivo Excel con los datos financieros para generar automáticamente todos los análisis y proyecciones.
            </p>
          </div>

          <ModuleAccessControl moduleId="excel-upload">
            <ExcelUpload onUploadComplete={handleUploadComplete} />
          </ModuleAccessControl>
        </main>
      </div>
    </div>
  );
};

export default ExcelUploadPage;
