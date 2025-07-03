import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileSpreadsheet, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  Trash2,
  Download,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessedFile {
  id: string;
  file_name: string;
  file_size: number;
  upload_date: string;
  processing_status: string;
  processing_result: any;
}

interface FinancialData {
  id: string;
  data_type: string;
  period_date: string;
  data_content: any;
  excel_file_id: string;
}

export const FileProcessingDashboard: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
    fetchFinancialData();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('excel_files')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los archivos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialData = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFinancialData(data || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('excel_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      
      setFiles(files.filter(f => f.id !== fileId));
      toast({
        title: "Archivo eliminado",
        description: "El archivo ha sido eliminado correctamente"
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    }
    return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Procesando</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDataTypeCounts = () => {
    const counts: { [key: string]: number } = {};
    financialData.forEach(item => {
      counts[item.data_type] = (counts[item.data_type] || 0) + 1;
    });
    return counts;
  };

  if (loading) {
    return (
      <Card className="dashboard-card">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-steel-blue" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-professional">Archivos Subidos</p>
                <p className="text-2xl font-bold text-steel-blue-dark">{files.length}</p>
              </div>
              <FileSpreadsheet className="h-8 w-8 text-steel-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-professional">Completados</p>
                <p className="text-2xl font-bold text-green-600">
                  {files.filter(f => f.processing_status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-professional">Datos Extraídos</p>
                <p className="text-2xl font-bold text-steel-blue-dark">{financialData.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-steel-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-professional">Tasa Éxito</p>
                <p className="text-2xl font-bold text-green-600">
                  {files.length > 0 ? Math.round((files.filter(f => f.processing_status === 'completed').length / files.length) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="files" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="files">Archivos Procesados</TabsTrigger>
          <TabsTrigger value="data">Datos Financieros</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-steel-blue-dark">Archivos Subidos</CardTitle>
              <CardDescription>Gestiona y revisa los archivos procesados</CardDescription>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-8">
                  <FileSpreadsheet className="h-12 w-12 text-steel-blue mx-auto mb-4" />
                  <p className="text-professional">No hay archivos subidos aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {files.map((file) => (
                    <div key={file.id} className="border rounded-lg p-4 hover:bg-light-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.file_name)}
                          <div>
                            <h3 className="font-semibold text-steel-blue-dark">{file.file_name}</h3>
                            <p className="text-sm text-professional">
                              {formatFileSize(file.file_size)} • {new Date(file.upload_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(file.processing_status)}
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedFile(file)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteFile(file.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {file.processing_result?.error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-600">{file.processing_result.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-steel-blue-dark">Datos Financieros Extraídos</CardTitle>
              <CardDescription>Información procesada lista para análisis</CardDescription>
            </CardHeader>
            <CardContent>
              {financialData.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-steel-blue mx-auto mb-4" />
                  <p className="text-professional">No hay datos financieros procesados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Object.entries(getDataTypeCounts()).map(([type, count]) => (
                      <div key={type} className="p-3 bg-light-gray-50 rounded-lg">
                        <p className="text-sm text-professional capitalize">{type.replace('_', ' ')}</p>
                        <p className="text-lg font-bold text-steel-blue-dark">{count}</p>
                      </div>
                    ))}
                  </div>
                  
                  {financialData.map((data) => (
                    <div key={data.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-steel-blue-dark capitalize">
                          {data.data_type.replace('_', ' ')}
                        </h3>
                        <Badge variant="outline">{data.period_date}</Badge>
                      </div>
                      <p className="text-sm text-professional">
                        {Object.keys(data.data_content || {}).length} campos de datos
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Details Modal */}
      {selectedFile && (
        <Card className="dashboard-card mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-steel-blue-dark">Detalles: {selectedFile.file_name}</CardTitle>
              <Button variant="outline" onClick={() => setSelectedFile(null)}>Cerrar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-professional">Tamaño</p>
                  <p className="font-semibold">{formatFileSize(selectedFile.file_size)}</p>
                </div>
                <div>
                  <p className="text-sm text-professional">Estado</p>
                  {getStatusBadge(selectedFile.processing_status)}
                </div>
              </div>
              
              {selectedFile.processing_result && (
                <div>
                  <p className="text-sm text-professional mb-2">Datos Procesados</p>
                  <div className="bg-light-gray-50 p-4 rounded-lg">
                    <pre className="text-xs overflow-auto max-h-60">
                      {JSON.stringify(selectedFile.processing_result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};