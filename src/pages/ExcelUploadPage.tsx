
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
              <p className="text-muted-foreground mb-4">
                Sube tu archivo Excel con los datos financieros para generar automáticamente todos los análisis y proyecciones.
              </p>
              
              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">📋 Plantilla Estándar Excel</h2>
                <p className="text-muted-foreground mb-4">
                  Para facilitar la carga y reducir errores, descarga nuestra plantilla estándar que incluye todas las hojas necesarias con validaciones automáticas.
                </p>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  <a 
                    href="/templates/balance-situacion-template.csv" 
                    download="Balance-Situacion-Template.csv"
                    className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    📊 Balance de Situación
                  </a>
                  <a 
                    href="/templates/cuenta-pyg-template.csv" 
                    download="Cuenta-PyG-Template.csv"
                    className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    💰 Cuenta de PyG
                  </a>
                  <a 
                    href="/templates/ratios-financieros-template.csv" 
                    download="Ratios-Financieros-Template.csv"
                    className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    📈 Ratios Financieros
                  </a>
                  <a 
                    href="/templates/datos-operativos-template.csv" 
                    download="Datos-Operativos-Template.csv"
                    className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    🏭 Datos Operativos
                  </a>
                  <a 
                    href="/templates/pool-deuda-template.csv" 
                    download="Pool-Deuda-Template.csv"
                    className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    🏦 Pool de Deuda
                  </a>
                </div>
                
                <a 
                  href="/templates/instrucciones-plantilla.md" 
                  download="Instrucciones-Plantilla.md"
                  className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  📖 Descargar Instrucciones Completas
                </a>
              </div>
            </div>

            <ExcelUpload onUploadComplete={handleUploadComplete} />
          </RoleBasedAccess>
        </main>
      </div>
    </div>
  );
};

export default ExcelUploadPage;
