import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Shield, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  company_name: string;
  created_at: string;
  role?: string;
  email?: string;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserCompany, setNewUserCompany] = useState('');
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

  const createUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: "Error",
        description: "Email y contraseña son requeridos",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        user_metadata: {
          company_name: newUserCompany
        }
      });

      if (error) throw error;

      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente"
      });

      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserCompany('');
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
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
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
                <p className="text-muted-foreground">
                  Administra los usuarios y sus roles en el sistema
                </p>
              </div>
            </div>

            {/* Create User Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Crear Nuevo Usuario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Contraseña temporal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa (Opcional)</Label>
                    <Input
                      id="company"
                      value={newUserCompany}
                      onChange={(e) => setNewUserCompany(e.target.value)}
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                </div>
                <Button 
                  onClick={createUser} 
                  disabled={creating}
                  className="w-full md:w-auto"
                >
                  {creating ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>Usuarios del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-muted rounded-full">
                            {user.role === 'admin' ? (
                              <Shield className="h-5 w-5 text-primary" />
                            ) : (
                              <User className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{user.user_id}</div>
                            {user.company_name && (
                              <div className="text-sm text-muted-foreground">{user.company_name}</div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Creado: {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserRole(user.user_id, user.role || 'user')}
                          >
                            Cambiar a {user.role === 'admin' ? 'Usuario' : 'Admin'}
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {users.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay usuarios registrados
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </RoleBasedAccess>
  );
};

export default AdminUsersPage;