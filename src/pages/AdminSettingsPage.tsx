import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { CompanyLogoUpload } from '@/components/CompanyLogoUpload';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Image, Users, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50/30">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-xl bg-gradient-to-br from-steel-500 to-cadet-500">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Configuración de Administrador</h1>
                <p className="text-slate-600">Gestiona la configuración global de la aplicación</p>
              </div>
            </div>

            <Tabs defaultValue="branding" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="branding" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuarios
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Seguridad
                </TabsTrigger>
              </TabsList>

              <TabsContent value="branding" className="space-y-6">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 mb-2">Configuración de Marca</h2>
                      <p className="text-slate-600">
                        Personaliza la imagen de tu empresa en toda la aplicación. 
                        El logo reemplazará el branding por defecto en el header, sidebar y página principal.
                      </p>
                    </div>
                    
                    <CompanyLogoUpload />
                    
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h3 className="font-medium text-slate-900 mb-2">Especificaciones del Logo</h3>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Formatos soportados: PNG, JPG, SVG</li>
                        <li>• Tamaño máximo: 2MB</li>
                        <li>• Dimensiones recomendadas: 200x60px (ratio 3:1)</li>
                        <li>• El logo se adapta automáticamente a diferentes tamaños</li>
                        <li>• Si no hay logo, se muestra el branding por defecto</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <Card className="p-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Gestión de Usuarios
                    </h3>
                    <p className="text-muted-foreground">
                      Esta funcionalidad estará disponible próximamente.
                    </p>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card className="p-6">
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Configuración de Seguridad
                    </h3>
                    <p className="text-muted-foreground">
                      Esta funcionalidad estará disponible próximamente.
                    </p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}