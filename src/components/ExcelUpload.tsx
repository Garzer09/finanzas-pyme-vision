
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DataValidationPreview } from './DataValidationPreview';
import { saveDataToModules, createModuleNotifications } from '@/utils/moduleMapping';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';
import { supabase } from '@/integrations/supabase/client';
import { UploadInterface } from './FileUpload/UploadInterface';
import { TemplateManager } from './FileUpload/TemplateManager';

// Provide default implementation for when context is not available
const useAdminImpersonationSafe = () => {
  try {
    return useAdminImpersonation();
  } catch {
    return {
      isImpersonating: false,
      impersonatedUserId: null
    };
  }
};

interface ExcelUploadProps {
  onUploadComplete?: (fileId: string, processedData: any) => void;
  targetUserId?: string;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({ onUploadComplete, targetUserId }) => {
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [processedFile, setProcessedFile] = useState<{id: string, name: string, data: any} | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isImpersonating, impersonatedUserId } = useAdminImpersonationSafe();

  const handleFileUploadComplete = async (fileId: string, processedData: any) => {
    try {
      setUploading(true);
      
      // Determinar el userId correcto
      const finalTargetUserId = targetUserId || (isImpersonating ? impersonatedUserId : user?.id);
      
      if (!finalTargetUserId) {
        throw new Error('No se pudo identificar el usuario para guardar los datos');
      }

      // Set processed file data for preview
      setProcessedFile({
        id: fileId,
        name: processedData.fileName || 'archivo-procesado',
        data: processedData
      });
      setShowPreview(true);
      
      toast({
        title: "Archivo procesado",
        description: isImpersonating 
          ? "Revisa los datos extraídos para el usuario seleccionado"
          : "Revisa los datos extraídos antes de confirmar",
      });
    } catch (error) {
      console.error('Error handling upload completion:', error);
      toast({
        title: "Error al procesar archivo",
        description: error.message || "Hubo un problema procesando tu archivo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };



  const handleConfirmData = async () => {
    if (!processedFile) return;

    try {
      setUploading(true);
      
      // Determinar el userId correcto
      const finalTargetUserId = targetUserId || (isImpersonating ? impersonatedUserId : user?.id);
      
      if (!finalTargetUserId) {
        throw new Error('No se pudo identificar el usuario para guardar los datos');
      }

      // Guardar datos automáticamente en módulos
      const result = await saveDataToModules(processedFile.id, processedFile.data, finalTargetUserId);
      
      // Crear notificaciones de módulos disponibles
      const notifications = createModuleNotifications(processedFile.data);
      
      toast({
        title: "✅ " + notifications.title,
        description: `${notifications.message}. ${result.kpisCreated} KPIs creados automáticamente.`,
      });

      // Completar el proceso
      if (onUploadComplete) {
        onUploadComplete(processedFile.id, processedFile.data);
      }

      // Resetear estados
      setShowPreview(false);
      setProcessedFile(null);

      // Redirigir al dashboard si no estamos en modo admin
      if (!isImpersonating && !targetUserId) {
        setTimeout(() => {
          window.location.href = '/home';
        }, 1500);
      }

    } catch (error) {
      console.error('Error confirming data:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la información automáticamente",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRejectData = async () => {
    if (!processedFile) return;

    try {
      // Marcar archivo como rechazado pero mantenerlo para revisión manual
      await supabase
        .from('excel_files')
        .update({ processing_status: 'rejected' })
        .eq('id', processedFile.id);

      toast({
        title: "Datos rechazados",
        description: "El archivo se mantuvo para revisión manual",
      });

      // Resetear estados
      setShowPreview(false);
      setProcessedFile(null);

    } catch (error) {
      console.error('Error rejecting data:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar el archivo",
        variant: "destructive"
      });
    }
  };

  // Show template manager if requested
  if (showTemplateManager) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Gestión de Plantillas</h3>
          <Button
            variant="outline"
            onClick={() => setShowTemplateManager(false)}
          >
            Volver a subida
          </Button>
        </div>
        <TemplateManager
          onTemplateSelect={(template) => {
            setSelectedTemplate(template);
            setShowTemplateManager(false);
          }}
          selectedTemplateId={selectedTemplate?.id}
        />
      </div>
    );
  }

  // Si está mostrando preview, mostrar el componente de validación
  if (showPreview && processedFile) {
    return (
      <DataValidationPreview
        fileId={processedFile.id}
        fileName={processedFile.name}
        processedData={processedFile.data}
        onConfirm={handleConfirmData}
        onReject={handleRejectData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Selection Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-steel-blue-dark">
            Subida de Archivos Optimizada
          </h3>
          <p className="text-sm text-steel-blue">
            Sistema mejorado para archivos hasta 50MB con procesamiento IA avanzado
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowTemplateManager(true)}
          className="border-steel-200 text-steel-700 hover:bg-steel-50"
        >
          Gestionar plantillas
        </Button>
      </div>

      {/* Selected Template Info */}
      {selectedTemplate && (
        <Card className="bg-steel-50 border-steel-200">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-steel-700">
                Plantilla activa: {selectedTemplate.name}
              </span>
              <span className="text-sm text-steel-600">
                v{selectedTemplate.version}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTemplate(null)}
              className="text-steel-600 hover:text-steel-800"
            >
              Desactivar
            </Button>
          </div>
        </Card>
      )}

      {/* Enhanced Upload Interface */}
      <UploadInterface
        onUploadComplete={handleFileUploadComplete}
        targetUserId={targetUserId}
      />
    </div>
  );
};
