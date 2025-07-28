import React, { useState, useEffect } from 'react';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { UserCreationWizard } from '@/components/admin/UserCreationWizard';
import { UserEditDialog } from '@/components/admin/UserEditDialog';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Users, Building2 } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  company_name: string;
  created_at: string;
  role?: 'admin' | 'user';
  email?: string;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserWizard, setShowUserWizard] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch roles for each user
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
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <RoleBasedAccess allowedRoles={['admin']}>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <main className="flex-1 p-6 space-y-6 overflow-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                <p className="text-muted-foreground">Administra usuarios y configuraciones del sistema</p>
              </div>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Empresas Activas</p>
                    <p className="text-2xl font-bold">
                      {new Set(users.map(u => u.company_name).filter(Boolean)).size}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.role === 'admin').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de usuarios */}
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-6">Usuarios del Sistema</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : users.length === 0 ? (
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
            </div>
          </main>

          {/* Edit User Dialog */}
          <UserEditDialog
            user={selectedUser}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onUserUpdated={handleUserUpdated}
          />
        </div>
      </div>
    </RoleBasedAccess>
  );
};

export default AdminUsersPage;