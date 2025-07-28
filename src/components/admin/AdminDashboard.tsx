import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Building2, 
  FileText, 
  Upload, 
  TrendingUp, 
  Activity,
  Edit,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { ExcelUpload } from '@/components/ExcelUpload';
import { UserCreationWizard } from '@/components/admin/UserCreationWizard';
import { UserEditDialog } from '@/components/admin/UserEditDialog';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface UserProfile {
  id: string;
  user_id: string;
  company_name: string;
  created_at: string;
  role?: 'admin' | 'user';
  email?: string;
}

interface ExcelFile {
  id: string;
  file_name: string;
  user_id: string;
  processing_status: string;
  upload_date: string;
  company_name?: string;
}

export const AdminDashboard = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [files, setFiles] = useState<ExcelFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserWizard, setShowUserWizard] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          return {
            ...profile,
            role: roleData?.role || 'user'
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    }
  };

  const fetchFiles = async () => {
    try {
      const { data: filesData, error: filesError } = await supabase
        .from('excel_files')
        .select('*')
        .order('upload_date', { ascending: false })
        .limit(20);

      if (filesError) throw filesError;

      // Fetch company names separately for each file
      const filesWithCompany = await Promise.all(
        filesData.map(async (file) => {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('company_name')
            .eq('user_id', file.user_id)
            .maybeSingle();

          return {
            ...file,
            company_name: profileData?.company_name || 'N/A'
          };
        })
      );

      setFiles(filesWithCompany);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los archivos",
        variant: "destructive"
      });
    }
  };

  const handleUserCreated = () => {
    setShowUserWizard(false);
    fetchUsers();
  };

  const handleUserUpdated = () => {
    setShowEditDialog(false);
    setSelectedUser(null);
    fetchUsers();
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Rol actualizado",
        description: `El usuario ahora es ${newRole === 'admin' ? 'administrador' : 'usuario normal'}`
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive"
      });
    }
  };

  const handleUploadComplete = (fileId: string, processedData: any) => {
    console.log('Upload completed:', { fileId, processedData });
    toast({
      title: "Archivo procesado",
      description: "Los datos han sido extraídos y están listos para el análisis.",
    });
    fetchFiles();
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchFiles()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empresas Activas</p>
                <p className="text-2xl font-bold">
                  {new Set(users.map(u => u.company_name).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Archivos Procesados</p>
                <p className="text-2xl font-bold">
                  {files.filter(f => f.processing_status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
          <TabsTrigger value="files">Gestión de Archivos</TabsTrigger>
          <TabsTrigger value="upload">Subir Archivos</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Usuarios del Sistema</h2>
            <Dialog open={showUserWizard} onOpenChange={setShowUserWizard}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <UserCreationWizard
                  onComplete={handleUserCreated}
                  onCancel={() => setShowUserWizard(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-6">
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay usuarios registrados.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium">{user.email}</p>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{user.company_name || 'Sin empresa asignada'}</p>
                        <p className="text-sm text-muted-foreground">
                          Registrado: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserRole(user.user_id, user.role === 'admin' ? 'user' : 'admin')}
                        >
                          {user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <h2 className="text-xl font-semibold">Archivos del Sistema</h2>
          
          <Card>
            <CardContent className="p-6">
              {files.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay archivos procesados.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(file.processing_status)}
                          <p className="font-medium">{file.file_name}</p>
                          {getStatusBadge(file.processing_status)}
                        </div>
                        <p className="text-muted-foreground">{file.company_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Subido: {new Date(file.upload_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={file.processing_status !== 'completed'}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Ver Datos
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <h2 className="text-xl font-semibold">Subir Nuevos Archivos</h2>
          <ExcelUpload onUploadComplete={handleUploadComplete} />
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <UserEditDialog
        user={selectedUser}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};