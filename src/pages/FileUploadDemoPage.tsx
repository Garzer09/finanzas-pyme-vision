import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { UploadInterface } from '@/components/FileUpload/UploadInterface';
import { TemplateManager } from '@/components/FileUpload/TemplateManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Shield, Brain, FileSpreadsheet } from 'lucide-react';

export const FileUploadDemoPage = () => {
  const [uploadedFiles, setUploadedFiles] = React.useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('');

  const handleUploadComplete = (fileId: string, processedData: any) => {
    console.log('Upload completed:', { fileId, processedData });
    setUploadedFiles(prev => [...prev, { 
      id: fileId, 
      data: processedData,
      timestamp: new Date()
    }]);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">
                Sistema de Carga de Archivos Optimizado
              </h1>
              <p className="text-slate-600">
                Demostración de las capacidades mejoradas para el procesamiento de archivos financieros
              </p>
              
              {/* Status Badges */}
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  100% Funcional
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  <Zap className="h-3 w-3 mr-1" />
                  50MB/50K filas
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Retry automático
                </Badge>
                <Badge className="bg-steel-100 text-steel-700 border-steel-200">
                  <Brain className="h-3 w-3 mr-1" />
                  IA Claude
                </Badge>
              </div>
            </div>

            {/* Features Overview */}
            <Card className="bg-gradient-to-r from-steel-50 to-blue-50 border-steel-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-steel-700">
                  <FileSpreadsheet className="h-5 w-5" />
                  Capacidades del Sistema Optimizado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border border-steel-100">
                    <div className="text-2xl font-bold text-steel-700">50MB</div>
                    <div className="text-sm text-steel-600">Tamaño máximo</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-steel-100">
                    <div className="text-2xl font-bold text-steel-700">50K</div>
                    <div className="text-sm text-steel-600">Filas máximo</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-steel-100">
                    <div className="text-2xl font-bold text-steel-700">3x</div>
                    <div className="text-sm text-steel-600">Intentos automáticos</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-steel-100">
                    <div className="text-2xl font-bold text-steel-700">100%</div>
                    <div className="text-sm text-steel-600">Fiabilidad</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Interface */}
            <Tabs defaultValue="upload" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Subida de Archivos</TabsTrigger>
                <TabsTrigger value="templates">Gestión de Plantillas</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                {/* Upload Interface */}
                <UploadInterface 
                  onUploadComplete={handleUploadComplete}
                  className="w-full"
                />

                {/* Recent Uploads */}
                {uploadedFiles.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Archivos Procesados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div>
                              <div className="font-medium text-green-800">
                                {file.data.fileName}
                              </div>
                              <div className="text-sm text-green-600">
                                {file.data.sheetsData?.length || 0} hoja(s) detectada(s) • 
                                Procesado en {file.data.processingTime}ms
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-700">
                              Completado
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                <TemplateManager 
                  onTemplateSelect={(template) => setSelectedTemplate(template.id)}
                  selectedTemplateId={selectedTemplate}
                />
              </TabsContent>
            </Tabs>

            {/* Technical Improvements */}
            <Card className="border-steel-200">
              <CardHeader>
                <CardTitle className="text-steel-700">Mejoras Técnicas Implementadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-steel-700">🚀 Optimizaciones de Rendimiento</h4>
                    <ul className="space-y-2 text-sm text-steel-600">
                      <li>• Procesamiento streaming para archivos &gt; 10MB</li>
                      <li>• Detección inteligente de tipos financieros</li>
                      <li>• Validación en tiempo real</li>
                      <li>• Gestión optimizada de memoria</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-steel-700">🛡️ Robustez y Recuperación</h4>
                    <ul className="space-y-2 text-sm text-steel-600">
                      <li>• Retry automático con backoff exponencial</li>
                      <li>• Detección de errores recuperables</li>
                      <li>• Cancelación de uploads en progreso</li>
                      <li>• Interfaces TypeScript mejoradas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};