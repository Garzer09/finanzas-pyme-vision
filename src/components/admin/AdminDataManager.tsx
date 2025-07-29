import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';
import { ExcelUpload } from '@/components/ExcelUpload';
import { DataValidationPreview } from '@/components/DataValidationPreview';

interface AdminDataManagerProps {
  onBack: () => void;
}

export const AdminDataManager: React.FC<AdminDataManagerProps> = ({ onBack }) => {
  const { impersonatedUserId, impersonatedUserInfo } = useAdminImpersonation();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (impersonatedUserId) {
      fetchUserFiles();
    }
  }, [impersonatedUserId]);

  const fetchUserFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('excel_files')
        .select('*')
        .eq('user_id', impersonatedUserId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching user files:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los archivos del usuario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (fileId: string, processedData: any) => {
    console.log('Upload completed for user:', impersonatedUserId, { fileId, processedData });
    toast({
      title: "Archivo procesado",
      description: `Datos procesados para ${impersonatedUserInfo?.email}`,
    });
    fetchUserFiles();
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('excel_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: "Archivo eliminado",
        description: "El archivo se eliminó correctamente"
      });
      
      fetchUserFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo",
        variant: "destructive"
      });
    }
  };

  const handleViewFile = (file: any) => {
    setSelectedFile(file);
    setShowPreview(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      completed: "default",
      processing: "secondary", 
      error: "destructive",
      pending: "outline"
    };
    
    const labels: { [key: string]: string } = {
      completed: "Completado",
      processing: "Procesando",
      error: "Error",
      pending: "Pendiente"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (showPreview && selectedFile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(false)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Gestión
          </Button>
          <h2 className="text-xl font-semibold">
            Vista Previa: {selectedFile.file_name}
          </h2>
        </div>

        <DataValidationPreview
          fileId={selectedFile.id}
          fileName={selectedFile.file_name}
          processedData={selectedFile.processing_result || {}}
          onConfirm={() => {
            setShowPreview(false);
            fetchUserFiles();
            toast({
              title: "Datos confirmados",
              description: "Los datos han sido guardados en el dashboard del usuario"
            });
          }}
          onReject={() => {
            setShowPreview(false);
            toast({
              title: "Datos rechazados",
              description: "Los datos fueron rechazados"
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
              <div>
                <CardTitle>Gestión de Datos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Usuario: {impersonatedUserInfo?.email} • {impersonatedUserInfo?.company_name}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Data Management Tabs */}
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Subir Nuevos Datos</TabsTrigger>
          <TabsTrigger value="files">Archivos Existentes ({files.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subir Archivo para {impersonatedUserInfo?.email}</CardTitle>
            </CardHeader>
            <CardContent>
              <ExcelUpload onUploadComplete={handleUploadComplete} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Archivos del Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay archivos subidos para este usuario</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(file.processing_status)}
                        <div>
                          <p className="font-medium">{file.file_name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Subido: {new Date(file.upload_date).toLocaleDateString()}</span>
                            <span>Tamaño: {Math.round(file.file_size / 1024)} KB</span>
                            {getStatusBadge(file.processing_status)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.processing_status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewFile(file)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Datos
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};