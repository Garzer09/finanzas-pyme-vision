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
import { EnhancedUserCreationWizard } from './EnhancedUserCreationWizard';
import { UserEditDialog } from '@/components/admin/UserEditDialog';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface AdminUserProfile {
  id: string;
  email: string;
  company_name: string;
  role: 'admin' | 'user';
  created_at: string;
  last_sign_in_at?: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  company_name?: string;
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
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [files, setFiles] = useState<ExcelFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserWizard, setShowUserWizard] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use the admin edge function to get users with emails
      const { data, error } = await supabase.functions.invoke('admin-users');

      if (error) throw error;

      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const handleEditUser = (user: AdminUserProfile) => {
    // Convert AdminUserProfile to UserProfile for UserEditDialog
    const userProfileForEdit: UserProfile = {
      id: user.id,
      user_id: user.id,
      company_name: user.company_name,
      created_at: user.created_at,
      role: user.role,
      email: user.email
    };
    setSelectedUser(userProfileForEdit);
    setShowEditDialog(true);
  };

  const toggleUserRole = async (userId: string, newRole: string) => {
    try {
      const { data, error } = await supabase.rpc('toggle_user_role', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error toggling user role:', error);
        toast({
          title: "Error",
          description: error.message || "No se pudo cambiar el rol del usuario",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Rol actualizado",
        description: `Usuario convertido a ${data === 'admin' ? 'administrador' : 'usuario normal'}`,
      });

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user role:', error);
      toast({
        title: "Error",
        description: "Error al cambiar el rol del usuario",
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
      await fetchUsers();
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
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios registrados en el sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Activas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(users.filter(u => u.company_name !== 'Sin empresa').map(u => u.company_name)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Empresas con usuarios activos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuarios con permisos de administración
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
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
              <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                <EnhancedUserCreationWizard
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
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Registrado: {new Date(user.created_at).toLocaleDateString()}</span>
                          <span>
                            Último acceso: {user.last_sign_in_at 
                              ? new Date(user.last_sign_in_at).toLocaleDateString()
                              : 'Nunca'
                            }
                          </span>
                        </div>
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
                          onClick={() => toggleUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
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